import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { StockService } from '../stock/stock.service';
import { PayOrderDto } from './dto/pay-order.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import {
  generateUUIDv7,
  calculateChange,
} from '@oshxona/shared';
import {
  generateCustomerReceiptText,
  generateCustomerReceiptEscPos,
} from '@oshxona/printer';
import {
  OrderStatus,
  TableStatus,
  UserRole,
  PaymentMethod,
  ReceiptType,
} from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly stockService: StockService,
  ) {}

  /**
   * Buyurtma uchun to'lov qabul qilish va chek chiqarish
   * + Ombor xomashyolaridan retsept bo'yicha avtomatik chiqim qilish!
   */
  async processPayment(orderId: string, dto: PayOrderDto, currentUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { deletedAt: null },
          include: { menuItem: true, variant: true },
        },
        table: true,
        branch: true,
      },
    });

    if (!order || order.deletedAt) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Bu buyurtma uchun allaqachon to\'lov qilingan');
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('Bekor qilingan buyurtmaga to\'lov qabul qilib bo\'lmaydi');
    }

    if (order.items.length === 0) {
      throw new BadRequestException('Bo\'sh buyurtma uchun to\'lov qilib bo\'lmaydi');
    }

    if (dto.method === PaymentMethod.DEBT && !dto.customerId) {
      throw new BadRequestException('Nasiya (qarz) to\'lovi uchun mijoz tanlanishi shart');
    }

    if (dto.method === PaymentMethod.CASH) {
      if (dto.amount < order.total) {
        throw new BadRequestException(
          `To'langan summa yetarli emas. To'lov: ${order.total} so'm, berildi: ${dto.amount} so'm`,
        );
      }
    } else if (dto.method !== PaymentMethod.DEBT) {
      if (dto.amount < order.total) {
        throw new BadRequestException(`To'lov summasi kamida ${order.total} so'm bo'lishi kerak`);
      }
    }

    const change = dto.method === PaymentMethod.CASH
      ? calculateChange(dto.amount, order.total)
      : 0;

    const paymentId = generateUUIDv7();
    const receiptId = generateUUIDv7();

    const activeShift = await this.prisma.shift.findFirst({
      where: {
        branchId: order.branchId,
        cashierId: currentUserId,
        closedAt: null,
      },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. To'lov yozuvi
      const payment = await tx.payment.create({
        data: {
          id: paymentId,
          branchId: order.branchId,
          orderId: order.id,
          shiftId: activeShift?.id || null,
          customerId: dto.customerId || null,
          method: dto.method,
          amount: dto.amount,
          change,
          version: 1,
        },
      });

      // 2. Nasiya bo'lsa: Mijoz qarz balansini oshirish
      if (dto.method === PaymentMethod.DEBT && dto.customerId) {
        await tx.customer.update({
          where: { id: dto.customerId },
          data: {
            debtBalance: { increment: order.total },
          },
        });

        await tx.debtTransaction.create({
          data: {
            id: generateUUIDv7(),
            branchId: order.branchId,
            customerId: dto.customerId,
            paymentId: payment.id,
            type: 'INCREASE',
            amount: order.total,
            note: `Buyurtma #${order.orderNumber} uchun nasiya`,
            version: 1,
          },
        });
      }

      // 3. Buyurtma holatini PAID qilish
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          version: { increment: 1 },
        },
      });

      // 4. Stolni bo'shatish (VACANT)
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: {
            status: TableStatus.VACANT,
            version: { increment: 1 },
          },
        });
      }

      // 5. OMBORDAN RETSEPT BO'YICHA AVTOMATIK CHIQIM (OUT_SALE)
      await this.stockService.deductStockForOrder(order.id, tx);

      // 6. Restoran sozlamalarini olish
      const settings = await tx.setting.findMany({
        where: { branchId: order.branchId },
      });
      const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

      // 7. Kassir ma'lumotlari
      const cashier = await tx.user.findUnique({
        where: { id: currentUserId },
      });

      // 8. Chek matnini shakllantirish
      const width = dto.paperWidth || 80;
      const receiptData = {
        restaurantName: settingsMap.get('RESTAURANT_NAME') || order.branch.name,
        address: settingsMap.get('ADDRESS') || order.branch.address || undefined,
        phone: settingsMap.get('PHONE') || order.branch.phone || undefined,
        receiptNumber: order.orderNumber,
        orderNumber: order.orderNumber,
        date: new Date(),
        cashierName: cashier?.fullName || 'Kassir',
        tableName: order.table?.name,
        orderType: order.type,
        items: order.items.map((i) => ({
          name: i.menuItem.nameUz,
          variantName: i.variant?.nameUz,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          modifiers: i.selectedModifiers as any,
        })),
        subtotal: order.subtotal,
        serviceFeePercent: parseInt(settingsMap.get('SERVICE_FEE_PERCENT') || '10', 10),
        serviceFee: order.serviceFee,
        discount: order.discount,
        total: order.total,
        paymentMethod: dto.method,
        paidAmount: dto.amount,
        change,
        headerNote: settingsMap.get('RECEIPT_HEADER_NOTE'),
        footerNote: settingsMap.get('RECEIPT_FOOTER_NOTE'),
      };

      const plainText = generateCustomerReceiptText(receiptData, width);
      const escPosCommands = generateCustomerReceiptEscPos(receiptData, width);

      const receipt = await tx.receipt.create({
        data: {
          id: receiptId,
          orderId: order.id,
          receiptNumber: order.orderNumber,
          type: ReceiptType.SALE,
          printCount: 1,
          rawPayload: escPosCommands,
          printedAt: new Date(),
          version: 1,
        },
      });

      return {
        payment,
        receipt,
        plainText,
        escPosCommands,
        change,
      };
    });

    // Real-time bildirishnomalar
    this.eventsGateway.emitOrderUpdated({ id: order.id, status: OrderStatus.PAID });
    if (order.tableId) {
      this.eventsGateway.emitTableStatus({ id: order.tableId, status: TableStatus.VACANT });
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      paidAmount: dto.amount,
      change: result.change,
      receiptNumber: result.receipt.receiptNumber,
      receiptId: result.receipt.id,
      plainTextReceipt: result.plainText,
    };
  }

  /**
   * To'lovni qaytarish (Refund - Faqat Admin PIN bilan)
   */
  async refundPayment(orderId: string, dto: RefundPaymentDto, currentUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Faqat to\'langan buyurtmalar to\'lovi qaytarilishi mumkin');
    }

    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
    });

    let approvedAdmin = null;
    for (const a of admins) {
      if (await bcrypt.compare(dto.adminPin, a.pinHash)) {
        approvedAdmin = a;
        break;
      }
    }

    if (!approvedAdmin) {
      throw new UnauthorizedException('Admin PIN-kodi noto\'g\'ri! Qaytarish rad etildi.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.REFUNDED,
          notes: `QAYTARILDI: ${dto.reason} (Tasdiqladi Admin: ${approvedAdmin.fullName})`,
          version: { increment: 1 },
        },
      });

      const debtPayment = order.payments.find((p) => p.method === PaymentMethod.DEBT);
      if (debtPayment && debtPayment.customerId) {
        await tx.customer.update({
          where: { id: debtPayment.customerId },
          data: {
            debtBalance: { decrement: order.total },
          },
        });

        await tx.debtTransaction.create({
          data: {
            id: generateUUIDv7(),
            branchId: order.branchId,
            customerId: debtPayment.customerId,
            type: 'DECREASE',
            amount: order.total,
            note: `Qaytarish (Refund) #${order.orderNumber}`,
            version: 1,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          id: generateUUIDv7(),
          branchId: order.branchId,
          userId: currentUserId,
          action: 'PAYMENT_REFUNDED',
          entity: 'ORDER',
          entityId: order.id,
          details: {
            orderNumber: order.orderNumber,
            total: order.total,
            reason: dto.reason,
            approvedBy: approvedAdmin.fullName,
          },
          version: 1,
        },
      });
    });

    this.eventsGateway.emitOrderUpdated({ id: orderId, status: OrderStatus.REFUNDED });

    return {
      success: true,
      message: `Buyurtma #${order.orderNumber} to'lovi muvaffaqiyatli qaytarildi (Refund)`,
    };
  }
}
