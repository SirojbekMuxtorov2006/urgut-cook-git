import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncPushBatch, SyncPushResult, SyncPullResult, ConflictResolver } from '@oshxona/sync';

@Injectable()
export class CloudSyncService {
  private readonly logger = new Logger('CloudSyncService');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lokal serverdan kelgan paketlarni idempotent qabul qilish
   */
  async handlePush(batch: SyncPushBatch): Promise<SyncPushResult> {
    const processedIds: string[] = [];
    const failedIds: { id: string; error: string }[] = [];

    // Qurilmaning oxirgi faolligini yangilash
    await this.prisma.device.updateMany({
      where: { id: batch.deviceId },
      data: { lastActiveAt: new Date() },
    });

    for (const item of batch.items) {
      try {
        await this.processItem(item);
        processedIds.push(item.id);
      } catch (err: any) {
        this.logger.error(`Elementni sinxronlashda xatolik [${item.entity}#${item.entityId}]: ${err.message}`);
        failedIds.push({ id: item.id, error: err.message });
      }
    }

    return { processedIds, failedIds };
  }

  private async processItem(item: any) {
    const entityName = item.entity;
    const model = (this.prisma as any)[entityName.charAt(0).toLowerCase() + entityName.slice(1)];

    if (!model) {
      this.logger.warn(`Prisma model topilmadi: ${entityName}`);
      return;
    }

    const payload = { ...item.payload };
    const entityId = item.entityId || payload.id;

    // Mavjud yozuvni tekshirish
    const existing = await model.findUnique({
      where: { id: entityId },
    });

    if (!existing) {
      // Yangi yaratish
      await model.create({
        data: {
          ...payload,
          syncedAt: new Date(),
        },
      });
    } else {
      // Konflikt siyosati bo'yicha tekshirish
      const shouldUpdate = ConflictResolver.shouldOverwrite(
        entityName,
        existing,
        item,
      );

      if (shouldUpdate) {
        await model.update({
          where: { id: entityId },
          data: {
            ...payload,
            syncedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Bulutdagi o'zgarishlarni lokal serverga yuklash (Pull)
   */
  async handlePull(branchId: string, since?: string): Promise<SyncPullResult> {
    const sinceDate = since ? new Date(since) : new Date(0);

    // Bulutda Admin o'zgartirgan asosiy modellar (Menyu, Toifalar, Narxlar, Sozlamalar)
    const [categories, menuItems, settings] = await Promise.all([
      this.prisma.category.findMany({
        where: { branchId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.menuItem.findMany({
        where: { branchId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.setting.findMany({
        where: { branchId, updatedAt: { gt: sinceDate } },
      }),
    ]);

    const changes = [
      ...categories.map((c) => ({
        entity: 'Category',
        entityId: c.id,
        operation: 'UPDATE' as const,
        payload: c as any,
        updatedAt: c.updatedAt.toISOString(),
        version: c.version,
      })),
      ...menuItems.map((m) => ({
        entity: 'MenuItem',
        entityId: m.id,
        operation: 'UPDATE' as const,
        payload: m as any,
        updatedAt: m.updatedAt.toISOString(),
        version: m.version,
      })),
      ...settings.map((s) => ({
        entity: 'Setting',
        entityId: s.id,
        operation: 'UPDATE' as const,
        payload: s as any,
        updatedAt: s.updatedAt.toISOString(),
        version: s.version,
      })),
    ];

    return {
      lastPulledAt: new Date().toISOString(),
      changes,
    };
  }
}
