import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUIDv7 } from '@oshxona/shared';
import { generateCustomerReceiptText, generateCustomerReceiptEscPos } from '@oshxona/printer';

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReceipt(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              where: { deletedAt: null },
              include: { menuItem: true, variant: true },
            },
            payments: true,
            table: true,
            branch: true,
            cashier: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Chek topilmadi');
    }

    return receipt;
  }

  /**
   * Chekni qayta chiqarish (NUSXA belgisi bilan, audit logga yoziladi)
   */
  async reprintReceipt(receiptId: string, userId: string, paperWidth: 58 | 80 = 80) {
    const receipt = await this.getReceipt(receiptId);
    const order = receipt.order;

    const newPrintCount = receipt.printCount + 1;

    // 1. Chek printCount ini oshirish
    await this.prisma.receipt.update({
      where: { id: receiptId },
      data: {
        printCount: newPrintCount,
        version: { increment: 1 },
      },
    });

    // 2. Audit log yozish (Qayta chiqarish firibgarlikning oldini olish uchun logga yoziladi)
    await this.prisma.auditLog.create({
      data: {
        id: generateUUIDv7(),
        branchId: order.branchId,
        userId,
        action: 'RECEIPT_REPRINT',
        entity: 'RECEIPT',
        entityId: receiptId,
        details: {
          orderNumber: order.orderNumber,
          printCount: newPrintCount,
          reprintedAt: new Date().toISOString(),
        },
        version: 1,
      },
    });

    // 3. Restoran sozlamalarini olish
    const settings = await this.prisma.setting.findMany({
      where: { branchId: order.branchId },
    });
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const payment = order.payments[0];

    const receiptData = {
      restaurantName: settingsMap.get('RESTAURANT_NAME') || order.branch.name,
      address: settingsMap.get('ADDRESS') || order.branch.address || undefined,
      phone: settingsMap.get('PHONE') || order.branch.phone || undefined,
      receiptNumber: order.orderNumber,
      orderNumber: order.orderNumber,
      date: receipt.printedAt,
      cashierName: order.cashier?.fullName || 'Kassir',
      tableName: order.table?.name,
      orderType: order.type,
      isCopy: true,
      copyNumber: newPrintCount,
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
      paymentMethod: payment ? payment.method : 'CASH',
      paidAmount: payment ? payment.amount : order.total,
      change: payment ? payment.change : 0,
      headerNote: settingsMap.get('RECEIPT_HEADER_NOTE'),
      footerNote: settingsMap.get('RECEIPT_FOOTER_NOTE'),
    };

    const plainText = generateCustomerReceiptText(receiptData, paperWidth);
    const escPosCommands = generateCustomerReceiptEscPos(receiptData, paperWidth);

    return {
      success: true,
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      printCount: newPrintCount,
      isCopy: true,
      plainTextReceipt: plainText,
      escPosCommands,
    };
  }
}
