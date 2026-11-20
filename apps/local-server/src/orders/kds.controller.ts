import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderItemStatus, OrderStatus } from '@prisma/client';

@ApiTags('KDS - Oshxona Ekrani (Kitchen Display System)')
@Controller('kds')
export class KdsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Oshxonadagi faol buyurtmalar chiptalari (KDS plansheti uchun)' })
  @ApiQuery({ name: 'station', required: false, description: 'Sex bo\'yicha filtrlash (KITCHEN_HOT, KITCHEN_COLD, BAR)' })
  async getKitchenTickets(@Query('station') station?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.SENT, OrderStatus.OPEN] },
        deletedAt: null,
      },
      include: {
        table: true,
        waiter: { select: { fullName: true } },
        items: {
          where: {
            deletedAt: null,
            status: { in: [OrderItemStatus.PENDING, OrderItemStatus.COOKING, OrderItemStatus.READY] },
          },
          include: {
            menuItem: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agar sex bo'yicha filtrlangan bo'lsa
    return orders
      .map((order) => {
        let filteredItems = order.items;
        if (station) {
          filteredItems = order.items.filter(
            (i) => (i.menuItem.kitchenStationId || 'MAIN') === station,
          );
        }

        const elapsedMinutes = Math.floor(
          (Date.now() - new Date(order.createdAt).getTime()) / 60000,
        );

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableName: order.table?.name || (order.type === 'TAKEAWAY' ? 'Olib ketish' : 'Yetkazib berish'),
          waiterName: order.waiter?.fullName || 'Kassa',
          createdAt: order.createdAt,
          elapsedMinutes,
          isDelayed: elapsedMinutes >= 15, // 15 daqiqadan oshsa kechikkan (qizil)
          items: filteredItems.map((i) => ({
            id: i.id,
            name: i.menuItem.nameUz,
            variantName: i.variant?.nameUz,
            quantity: i.quantity,
            selectedModifiers: i.selectedModifiers,
            notes: i.notes,
            status: i.status,
            station: i.menuItem.kitchenStationId || 'MAIN',
          })),
        };
      })
      .filter((o) => o.items.length > 0);
  }

  @Patch('items/:itemId/status')
  @ApiOperation({ summary: 'Taom holatini o\'zgartirish (COOKING -> READY -> SERVED)' })
  async updateItemStatus(
    @Param('itemId') itemId: string,
    @Body() body: { status: OrderItemStatus },
  ) {
    const item = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: body.status,
        version: { increment: 1 },
      },
      include: { order: true },
    });

    this.eventsGateway.emitOrderUpdated({
      orderId: item.orderId,
      itemId: item.id,
      itemStatus: item.status,
    });

    return item;
  }

  @Patch('orders/:orderId/ready')
  @ApiOperation({ summary: 'Barcha taomlarni TAYYOR (READY) deb belgilash' })
  async markOrderReady(@Param('orderId') orderId: string) {
    await this.prisma.orderItem.updateMany({
      where: {
        orderId,
        status: { in: [OrderItemStatus.PENDING, OrderItemStatus.COOKING] },
        deletedAt: null,
      },
      data: {
        status: OrderItemStatus.READY,
        version: { increment: 1 },
      },
    });

    this.eventsGateway.emitOrderUpdated({
      orderId,
      status: 'ALL_ITEMS_READY',
    });

    return { message: 'Buyurtma to\'liq tayyor deb belgilandi' };
  }
}
