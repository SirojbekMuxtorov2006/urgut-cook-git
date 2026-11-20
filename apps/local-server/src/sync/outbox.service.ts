import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUIDv7, SyncOperation, SyncStatus } from '@oshxona/shared';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger('OutboxService');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Operatsiyani Outbox (SyncQueue) navbatiga qo'shish
   */
  async addToQueue(
    branchId: string,
    entity: string,
    entityId: string,
    operation: SyncOperation,
    payload: Record<string, unknown>,
    tx?: any,
  ) {
    const client = tx || this.prisma;
    const deviceId = process.env.DEVICE_ID || 'DEV-MAIN-POS-01';

    try {
      await client.syncQueue.create({
        data: {
          id: generateUUIDv7(),
          branchId,
          entity,
          entityId,
          operation,
          payload: payload as any,
          status: SyncStatus.PENDING,
          attempts: 0,
          deviceId,
          version: 1,
        },
      });
    } catch (e: any) {
      this.logger.error(`Outbox navbatiga yozishda xato: ${e.message}`);
    }
  }
}
