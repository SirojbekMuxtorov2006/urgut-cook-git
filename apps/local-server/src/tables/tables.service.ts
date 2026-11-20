import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TableStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Zallar va ularga tegishli barcha stollarni ochiq buyurtmalari bilan olish
   */
  async getHallsWithTables(branchId: string) {
    return this.prisma.hall.findMany({
      where: {
        branchId,
        deletedAt: null,
      },
      include: {
        tables: {
          where: { deletedAt: null },
          include: {
            orders: {
              where: {
                status: {
                  in: ['OPEN', 'SENT'],
                },
                deletedAt: null,
              },
              select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                guestCount: true,
                createdAt: true,
                waiter: {
                  select: { id: true, fullName: true },
                },
                _count: {
                  select: { items: true },
                },
              },
              take: 1,
            },
          },
          orderBy: { number: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        hall: true,
        orders: {
          where: {
            status: { in: ['OPEN', 'SENT'] },
            deletedAt: null,
          },
          include: {
            items: {
              where: { deletedAt: null },
              include: { menuItem: true },
            },
          },
        },
      },
    });

    if (!table || table.deletedAt) {
      throw new NotFoundException('Stol topilmadi');
    }

    return table;
  }

  async updateStatus(id: string, status: TableStatus) {
    await this.findOne(id);

    const updated = await this.prisma.table.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
      },
      include: { hall: true },
    });

    // Real-time barcha kassalarga xabar berish
    this.eventsGateway.emitTableStatus(updated);

    return updated;
  }

  async updatePosition(id: string, posX: number, posY: number) {
    return this.prisma.table.update({
      where: { id },
      data: {
        posX,
        posY,
        version: { increment: 1 },
      },
    });
  }
}
