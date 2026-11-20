import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { SplitOrderDto } from './dto/split-order.dto';
import { MoveOrderDto } from './dto/move-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import {
  generateUUIDv7,
  calculateServiceFee,
  calculateDiscount,
} from '@oshxona/shared';
import { OrderStatus, OrderItemStatus, TableStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Unikal chek/buyurtma raqamini generatsiya qilish: K1-MMDD-XXXX
   */
  private async generateOrderNumber(branchId: string): Promise<string> {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    // Bugungi buyurtmalar soni
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const count = await this.prisma.order.count({
      where: {
        branchId,
        createdAt: { gte: startOfDay },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    return `K1-${mm}${dd}-${seq}`;
  }

  /**
   * Buyurtma summasini (subtotal, serviceFee, total) qayta hisoblash
   */
  private async recalculateOrderTotals(orderId: string, tx?: any) {
    const client = tx || this.prisma;

    const order = await client.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: {
            deletedAt: null,
            status: { not: OrderItemStatus.CANCELLED },
          },
        },
      },
    });

    if (!order) return null;

    // 1. Taomlar jami summasi
    const subtotal = order.items.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0,
    );

    // 2. Xizmat haqini hisoblash (Zal buyurtmalari uchun)
    let serviceFee = 0;
    if (order.type === 'DINE_IN') {
      const setting = await client.setting.findUnique({
        where: {
          branchId_key: {
            branchId: order.branchId,
            key: 'SERVICE_FEE_PERCENT',
          },
        },
      });
      const percent = setting ? parseInt(setting.value, 10) : 10;
      serviceFee = calculateServiceFee(subtotal, percent);
    }

    // 3. Chegirma va Yakuniy summa
    const discount = Math.min(order.discount, subtotal + serviceFee);
    const total = Math.max(0, subtotal + serviceFee - discount);

    return client.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        serviceFee,
        discount,
        total,
        version: { increment: 1 },
      },
      include: {
        items: {
          where: { deletedAt: null },
          include: { menuItem: true, variant: true },
        },
        table: true,
        cashier: { select: { id: true, fullName: true } },
        waiter: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Barcha faol ochiq buyurtmalar
   */
  async getActiveOrders(branchId: string) {
    return this.prisma.order.findMany({
      where: {
        branchId,
        status: { in: [OrderStatus.OPEN, OrderStatus.SENT] },
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
          include: { menuItem: true, variant: true },
        },
        table: true,
        waiter: { select: { id: true, fullName: true } },
        cashier: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          include: { menuItem: true, variant: true },
          orderBy: { createdAt: 'asc' },
        },
        table: {
          include: { hall: true },
        },
        cashier: { select: { id: true, fullName: true, role: true } },
        waiter: { select: { id: true, fullName: true } },
        payments: true,
      },
    });

    if (!order || order.deletedAt) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    return order;
  }

  /**
   * Yangi buyurtma ochish
   */
  async create(branchId: string, cashierId: string, dto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber(branchId);
    const id = generateUUIDv7();

    const order = await this.prisma.$transaction(async (tx) => {
      // Stol holatini yangilash (agar stol tanlangan bo'lsa)
      if (dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId },
          data: {
            status: TableStatus.OCCUPIED,
            version: { increment: 1 },
          },
        });
      }

      return tx.order.create({
        data: {
          id,
          branchId,
          orderNumber,
          type: dto.type,
          status: OrderStatus.OPEN,
          tableId: dto.tableId,
          cashierId,
          waiterId: dto.waiterId,
          guestCount: dto.guestCount || 1,
          subtotal: 0,
          serviceFee: 0,
          discount: 0,
          total: 0,
          notes: dto.notes,
          version: 1,
        },
        include: {
          table: true,
          cashier: { select: { id: true, fullName: true } },
          waiter: { select: { id: true, fullName: true } },
        },
      });
    });

    // Real-time bildirishnoma
    this.eventsGateway.emitOrderCreated(order);
    if (dto.tableId) {
      this.eventsGateway.emitTableStatus({
        id: dto.tableId,
        status: TableStatus.OCCUPIED,
      });
    }

    return order;
  }

  /**
   * Buyurtmaga taom qo'shish (Sotuv paytidagi narx muzlatiladi!)
   */
  async addItem(orderId: string, dto: AddOrderItemDto) {
    const order = await this.findOne(orderId);

    if (order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Ushbu buyurtmaga taom qo\'shib bo\'lmaydi (yopilgan)');
    }

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: dto.menuItemId },
    });

    if (!menuItem || !menuItem.isActive || menuItem.deletedAt) {
      throw new NotFoundException('Taom topilmadi yoki menyuda faol emas');
    }

    if (!menuItem.isAvailable) {
      throw new BadRequestException(`"${menuItem.nameUz}" taomi ayni damda tugagan`);
    }

    // Narxni aniqlash (Variant tanlangan bo'lsa variant narxi, aks holda asosiy narx)
    let unitPrice = menuItem.price;
    if (dto.variantId) {
      const variant = await this.prisma.menuItemVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (variant) {
        unitPrice = variant.price;
      }
    }

    // Qo'shimchalar (modifierlar) narxini hisoblash
    const qty = dto.quantity || 1;
    let modifiersCost = 0;
    if (dto.selectedModifiers && dto.selectedModifiers.length > 0) {
      modifiersCost = dto.selectedModifiers.reduce(
        (sum, m) => sum + (m.price || 0),
        0,
      );
    }

    const totalPrice = Math.round((unitPrice + modifiersCost) * qty);

    await this.prisma.orderItem.create({
      data: {
        id: generateUUIDv7(),
        orderId,
        menuItemId: dto.menuItemId,
        variantId: dto.variantId,
        quantity: qty,
        unitPrice, // MUZLATILGAN SOTUV NARXI!
        totalPrice,
        selectedModifiers: dto.selectedModifiers ? (dto.selectedModifiers as any) : null,
        status: OrderItemStatus.PENDING,
        notes: dto.notes,
        version: 1,
      },
    });

    const updatedOrder = await this.recalculateOrderTotals(orderId);
    this.eventsGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }

  /**
   * Buyurtmadan taomni olib tashlash
   */
  async removeItem(orderId: string, orderItemId: string) {
    const order = await this.findOne(orderId);

    if (order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Yopilgan buyurtmadan taom o\'chirib bo\'lmaydi');
    }

    await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        deletedAt: new Date(),
        status: OrderItemStatus.CANCELLED,
        version: { increment: 1 },
      },
    });

    const updatedOrder = await this.recalculateOrderTotals(orderId);
    this.eventsGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }

  /**
   * "Oshxonaga yuborish" -> Oshxona ekrani va printerlariga chipta shakllanadi
   */
  async sendToKitchen(orderId: string) {
    const order = await this.findOne(orderId);

    // Kutilayotgan (PENDING) taomlarni topish
    const pendingItems = order.items.filter(
      (item) => item.status === OrderItemStatus.PENDING,
    );

    if (pendingItems.length === 0) {
      throw new BadRequestException('Oshxonaga yuborish uchun yangi taomlar mavjud emas');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Taomlar holatini COOKING ga o'tkazish
      await tx.orderItem.updateMany({
        where: {
          orderId,
          status: OrderItemStatus.PENDING,
          deletedAt: null,
        },
        data: {
          status: OrderItemStatus.COOKING,
          version: { increment: 1 },
        },
      });

      // 2. Buyurtma holatini SENT ga o'tkazish
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SENT,
          version: { increment: 1 },
        },
      });
    });

    // Oshxona chiptasi (Kitchen Ticket) obyekti
    const kitchenTicket = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableName: order.table ? order.table.name : 'Olib ketish',
      waiterName: order.waiter?.fullName,
      sentAt: new Date().toISOString(),
      items: pendingItems.map((item) => ({
        id: item.id,
        name: item.menuItem.nameUz,
        variant: item.variant?.nameUz,
        quantity: item.quantity,
        modifiers: item.selectedModifiers,
        notes: item.notes,
        kitchenStation: item.menuItem.kitchenStationId || 'MAIN',
      })),
    };

    // Oshxona ekraniga (KDS) va barcha kassalarga tarqatish
    this.eventsGateway.emitKitchenNewTicket(kitchenTicket);

    const updatedOrder = await this.findOne(orderId);
    this.eventsGateway.emitOrderUpdated(updatedOrder);

    return {
      message: 'Buyurtma oshxonaga muvaffaqiyatli yuborildi',
      kitchenTicket,
    };
  }

  /**
   * Chegirma berish (Kassir limiti tekshiriladi)
   */
  async applyDiscount(orderId: string, dto: ApplyDiscountDto, user: any) {
    const order = await this.findOne(orderId);

    let discountAmount = 0;

    if (dto.percent) {
      // Kassir limiti tekshiruvi: Agar kassir limiti 10% bo'lsa, 11% berolmaydi!
      if (user.role !== UserRole.ADMIN && dto.percent > user.discountLimit) {
        throw new BadRequestException(
          `Sizning chegirma limitingiz maksimum ${user.discountLimit}%. Siz ${dto.percent}% bera olmaysiz. Admin tasdig'i talab qilinadi.`,
        );
      }
      discountAmount = calculateDiscount(order.subtotal, { percent: dto.percent });
    } else if (dto.amount) {
      const maxAllowed = Math.round((order.subtotal * user.discountLimit) / 100);
      if (user.role !== UserRole.ADMIN && dto.amount > maxAllowed) {
        throw new BadRequestException(
          `Sizning chegirma limitingiz maksimum ${maxAllowed} so'm (${user.discountLimit}%). Admin tasdig'i kerak.`,
        );
      }
      discountAmount = dto.amount;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        discount: discountAmount,
        version: { increment: 1 },
      },
    });

    const updatedOrder = await this.recalculateOrderTotals(orderId);
    this.eventsGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }

  /**
   * Buyurtmani bo'lish (Split Bill)
   */
  async splitOrder(orderId: string, dto: SplitOrderDto, cashierId: string) {
    const originalOrder = await this.findOne(orderId);

    const newOrderId = generateUUIDv7();
    const newOrderNumber = await this.generateOrderNumber(originalOrder.branchId);

    await this.prisma.$transaction(async (tx) => {
      // 1. Yangi ajratilgan buyurtma yaratish
      const newOrder = await tx.order.create({
        data: {
          id: newOrderId,
          branchId: originalOrder.branchId,
          orderNumber: newOrderNumber,
          type: originalOrder.type,
          status: originalOrder.status,
          tableId: dto.targetTableId || originalOrder.tableId,
          cashierId,
          waiterId: originalOrder.waiterId,
          guestCount: 1,
          subtotal: 0,
          serviceFee: 0,
          discount: 0,
          total: 0,
          notes: `Buyurtma #${originalOrder.orderNumber} dan ajratildi`,
          version: 1,
        },
      });

      // 2. Tanlangan taomlarni ko'chirish
      for (const itemDto of dto.items) {
        const item = originalOrder.items.find((i) => i.id === itemDto.orderItemId);
        if (!item) continue;

        if (item.quantity <= itemDto.quantity) {
          // Barchasini yangi buyurtmaga o'tkazish
          await tx.orderItem.update({
            where: { id: item.id },
            data: { orderId: newOrder.id },
          });
        } else {
          // Bir qismini ajratish
          const remainingQty = item.quantity - itemDto.quantity;
          const remainingPrice = Math.round(
            (item.totalPrice / item.quantity) * remainingQty,
          );
          const splitPrice = item.totalPrice - remainingPrice;

          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              quantity: remainingQty,
              totalPrice: remainingPrice,
            },
          });

          await tx.orderItem.create({
            data: {
              id: generateUUIDv7(),
              orderId: newOrder.id,
              menuItemId: item.menuItemId,
              variantId: item.variantId,
              quantity: itemDto.quantity,
              unitPrice: item.unitPrice,
              totalPrice: splitPrice,
              selectedModifiers: item.selectedModifiers as any,
              status: item.status,
              notes: item.notes,
              version: 1,
            },
          });
        }
      }
    });

    const updatedOriginal = await this.recalculateOrderTotals(originalOrder.id);
    const updatedNew = await this.recalculateOrderTotals(newOrderId);

    this.eventsGateway.emitOrderUpdated(updatedOriginal);
    this.eventsGateway.emitOrderCreated(updatedNew);

    return {
      originalOrder: updatedOriginal,
      newOrder: updatedNew,
    };
  }

  /**
   * Buyurtmalarni birlashtirish (Merge)
   */
  async mergeOrders(sourceOrderId: string, targetOrderId: string) {
    const source = await this.findOne(sourceOrderId);
    const target = await this.findOne(targetOrderId);

    await this.prisma.$transaction(async (tx) => {
      // Manbadagi barcha faol taomlarni nishon buyurtmaga o'tkazish
      await tx.orderItem.updateMany({
        where: { orderId: source.id, deletedAt: null },
        data: { orderId: target.id },
      });

      // Manba buyurtmani yopish/bekor qilish
      await tx.order.update({
        where: { id: source.id },
        data: {
          status: OrderStatus.CANCELLED,
          notes: `Buyurtma #${target.orderNumber} ga birlashtirildi`,
          deletedAt: new Date(),
        },
      });

      // Agar manba stolda boshqa ochiq buyurtma qolmasa, stolni bo'shatish
      if (source.tableId && source.tableId !== target.tableId) {
        await tx.table.update({
          where: { id: source.tableId },
          data: { status: TableStatus.VACANT },
        });
      }
    });

    const updatedTarget = await this.recalculateOrderTotals(target.id);
    this.eventsGateway.emitOrderUpdated(updatedTarget);

    return updatedTarget;
  }

  /**
   * Buyurtmani boshqa stolga ko'chirish (Move Table)
   */
  async moveTable(orderId: string, dto: MoveOrderDto) {
    const order = await this.findOne(orderId);
    const oldTableId = order.tableId;

    await this.prisma.$transaction(async (tx) => {
      // 1. Yangi stolni band qilish
      await tx.table.update({
        where: { id: dto.targetTableId },
        data: { status: TableStatus.OCCUPIED },
      });

      // 2. Buyurtmani yangi stolga biriktirish
      await tx.order.update({
        where: { id: orderId },
        data: { tableId: dto.targetTableId },
      });

      // 3. Eski stolni bo'shatish
      if (oldTableId) {
        await tx.table.update({
          where: { id: oldTableId },
          data: { status: TableStatus.VACANT },
        });
      }
    });

    const updatedOrder = await this.findOne(orderId);
    this.eventsGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }

  /**
   * Buyurtmani bekor qilish (Faqat Admin PIN tasdig'i bilan!)
   */
  async cancelOrder(orderId: string, dto: CancelOrderDto, currentUserId: string) {
    const order = await this.findOne(orderId);

    // Admin PIN kodini tekshirish
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
    });

    let isPinValid = false;
    let approvedByAdmin = null;
    for (const admin of admins) {
      if (await bcrypt.compare(dto.adminPin, admin.pinHash)) {
        isPinValid = true;
        approvedByAdmin = admin;
        break;
      }
    }

    if (!isPinValid) {
      throw new UnauthorizedException('Admin PIN-kodi noto\'g\'ri! Buyurtmani bekor qilib bo\'lmaydi.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Buyurtmani bekor qilish
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          notes: `BEKOR QILINDI: ${dto.reason} (Tasdiqladi: ${approvedByAdmin?.fullName})`,
          version: { increment: 1 },
        },
      });

      // Stolni bo'shatish
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: TableStatus.VACANT },
        });
      }

      // Audit log yozish
      await tx.auditLog.create({
        data: {
          id: generateUUIDv7(),
          branchId: order.branchId,
          userId: currentUserId,
          action: 'ORDER_CANCELLED',
          entity: 'ORDER',
          entityId: order.id,
          details: {
            orderNumber: order.orderNumber,
            reason: dto.reason,
            approvedBy: approvedByAdmin?.fullName,
            totalAmount: order.total,
          },
          version: 1,
        },
      });
    });

    this.eventsGateway.emitOrderUpdated({ id: orderId, status: OrderStatus.CANCELLED });
    if (order.tableId) {
      this.eventsGateway.emitTableStatus({ id: order.tableId, status: TableStatus.VACANT });
    }

    return { message: 'Buyurtma muvaffaqiyatli bekor qilindi' };
  }
}
