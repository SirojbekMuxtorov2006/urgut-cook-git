import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { SyncStatus, SyncOperation } from '@oshxona/shared';

@Injectable()
export class SyncWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('SyncWorkerService');
  private intervalRef: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private isOnline = false;
  private lastHeartbeat: Date = new Date();
  private lastSuccessfulSyncAt: Date | null = null;
  private lastError: string | null = null;
  private lastPulledAt: string = new Date(0).toISOString();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  onModuleInit() {
    const intervalMs = parseInt(process.env.SYNC_INTERVAL_MS || '15000', 10);
    this.logger.log(`🔄 SyncWorker ishga tushdi (Har ${intervalMs / 1000} soniyada tekshiriladi)`);

    // Dastlabki tekshiruv va davriy interval
    this.checkAndSync();
    this.intervalRef = setInterval(() => {
      this.checkAndSync();
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  /**
   * Joriy sinxronizatsiya holati indikatori uchun ma'lumotlar
   * (🟢 Online / 🟡 Sinxronlanmoqda / 🔴 Offline)
   */
  async getStatus() {
    const pendingCount = await this.prisma.syncQueue.count({
      where: { status: SyncStatus.PENDING },
    });

    const failedCount = await this.prisma.syncQueue.count({
      where: { status: SyncStatus.FAILED },
    });

    let indicator: 'ONLINE' | 'SYNCING' | 'OFFLINE' = 'OFFLINE';
    if (this.isOnline) {
      indicator = this.isSyncing || pendingCount > 0 ? 'SYNCING' : 'ONLINE';
    }

    return {
      indicator,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount,
      failedCount,
      lastHeartbeat: this.lastHeartbeat.toISOString(),
      lastSuccessfulSyncAt: this.lastSuccessfulSyncAt?.toISOString() || null,
      lastError: this.lastError,
    };
  }

  /**
   * Internet mavjudligini tekshirish va sinxronizatsiya jarayonini boshlash
   */
  async checkAndSync() {
    if (this.isSyncing) return;

    const cloudUrl = process.env.CLOUD_API_URL || 'http://localhost:5000/api';
    const apiKey = process.env.CLOUD_API_KEY || 'oshxona-pos-cloud-api-sync-key';
    const branchId = process.env.BRANCH_ID || '019349c2-5500-7000-8000-000000000001';
    const deviceId = process.env.DEVICE_ID || 'DEV-MAIN-POS-01';

    try {
      // 1. Bulut serveri bilan aloqani (heartbeat) tekshirish
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const healthRes = await fetch(`${cloudUrl}/sync/status`, {
        signal: controller.signal,
        headers: { 'x-api-key': apiKey },
      });
      clearTimeout(timeoutId);

      if (!healthRes.ok) {
        throw new Error(`Bulut javob bermadi: HTTP ${healthRes.status}`);
      }

      this.isOnline = true;
      this.lastHeartbeat = new Date();
      this.lastError = null;

      // 2. Navbatdagi yozuvlarni jo'natish (Push)
      await this.pushPendingQueue(cloudUrl, apiKey, branchId, deviceId);

      // 3. Bulutdagi o'zgarishlarni tortib olish (Pull)
      await this.pullCloudChanges(cloudUrl, apiKey, branchId);

      this.lastSuccessfulSyncAt = new Date();
    } catch (err: any) {
      this.isOnline = false;
      this.lastError = err.message || 'Bulutga ulanib bo\'lmadi';
    } finally {
      this.isSyncing = false;
      // Kassalarga status indikatorini tarqatish
      const status = await this.getStatus();
      this.eventsGateway.emitSyncStatus(status);
    }
  }

  /**
   * Navbatdagi 50 ta yozuvni paketlab bulutga yuborish (Push)
   */
  private async pushPendingQueue(
    cloudUrl: string,
    apiKey: string,
    branchId: string,
    deviceId: string,
  ) {
    const pendingItems = await this.prisma.syncQueue.findMany({
      where: {
        status: { in: [SyncStatus.PENDING, SyncStatus.FAILED] },
        attempts: { lt: 5 }, // 5 martadan ko'p urinilmagan bo'lsa
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (pendingItems.length === 0) return;

    this.isSyncing = true;
    this.logger.log(`📤 ${pendingItems.length} ta yozuv bulutga sinxronlanmoqda...`);

    const batch = {
      deviceId,
      branchId,
      items: pendingItems.map((item) => ({
        id: item.id,
        entity: item.entity,
        entityId: item.entityId,
        operation: item.operation,
        payload: item.payload as any,
        version: item.version,
        updatedAt: item.updatedAt.toISOString(),
      })),
    };

    const pushRes = await fetch(`${cloudUrl}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(batch),
    });

    if (!pushRes.ok) {
      throw new Error(`Push rad etildi: HTTP ${pushRes.status}`);
    }

    const result = await pushRes.json();

    // Muvaffaqiyatli yozuvlarni COMPLETED qilish
    if (result.processedIds && result.processedIds.length > 0) {
      await this.prisma.syncQueue.updateMany({
        where: { id: { in: result.processedIds } },
        data: {
          status: SyncStatus.COMPLETED,
          syncedAt: new Date(),
        },
      });
    }

    // Xato bo'lganlarni FAILED qilish va attempts ni oshirish
    if (result.failedIds && result.failedIds.length > 0) {
      for (const f of result.failedIds) {
        await this.prisma.syncQueue.update({
          where: { id: f.id },
          data: {
            status: SyncStatus.FAILED,
            attempts: { increment: 1 },
            lastError: f.error,
          },
        });
      }
    }
  }

  /**
   * Bulutdagi so'nggi o'zgarishlarni yuklab olib lokal bazaga tadbiq qilish (Pull)
   */
  private async pullCloudChanges(cloudUrl: string, apiKey: string, branchId: string) {
    const url = `${cloudUrl}/sync/pull?branchId=${branchId}&since=${encodeURIComponent(this.lastPulledAt)}`;
    const pullRes = await fetch(url, {
      headers: { 'x-api-key': apiKey },
    });

    if (!pullRes.ok) return;

    const data = await pullRes.json();
    if (data.changes && data.changes.length > 0) {
      this.logger.log(`📥 Bulutdan ${data.changes.length} ta yangilanish qabul qilindi`);

      for (const change of data.changes) {
        await this.applyIncomingChange(change);
      }
    }

    if (data.lastPulledAt) {
      this.lastPulledAt = data.lastPulledAt;
    }
  }

  private async applyIncomingChange(change: any) {
    const modelName = change.entity.charAt(0).toLowerCase() + change.entity.slice(1);
    const model = (this.prisma as any)[modelName];
    if (!model) return;

    const payload = change.payload;
    try {
      await model.upsert({
        where: { id: change.entityId },
        update: {
          ...payload,
          syncedAt: new Date(),
        },
        create: {
          ...payload,
          syncedAt: new Date(),
        },
      });
    } catch (err: any) {
      this.logger.warn(`Lokalga tadbiq qilishda ogohlantirish [${change.entity}]: ${err.message}`);
    }
  }
}
