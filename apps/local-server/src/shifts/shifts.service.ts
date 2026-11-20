import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { OpenShiftDto, CloseShiftDto, CreateCashMovementDto } from './dto/shift.dto';
import { generateUUIDv7 } from '@oshxona/shared';
import {
  generateShiftReportText,
  generateShiftReportEscPos,
} from '@oshxona/printer';
import { PaymentMethod, CashMovementType, OrderStatus } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Yangi smena ochish
   */
  async openShift(branchId: string, cashierId: string, dto: OpenShiftDto) {
    // Kassirda allaqachon ochiq smena bor-yo'qligini tekshirish
    const existing = await this.prisma.shift.findFirst({
      where: {
        branchId,
        cashierId,
        closedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Sizda allaqachon ochiq smena mavjud. Avval uni yoping.');
    }

    const shiftId = generateUUIDv7();

    const shift = await this.prisma.shift.create({
      data: {
        id: shiftId,
        branchId,
        cashierId,
        startCash: dto.startCash,
        endCashExpected: dto.startCash,
        notes: dto.notes,
        version: 1,
      },
      include: {
        cashier: { select: { id: true, fullName: true, username: true } },
      },
    });

    return shift;
  }

  /**
   * Kassirning joriy ochiq smenasini olish
   */
  async getCurrentShift(branchId: string, cashierId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        branchId,
        cashierId,
        closedAt: null,
      },
      include: {
        cashier: { select: { id: true, fullName: true } },
        cashMovements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shift) {
      return null;
    }

    // Joriy oraliq statistika
    const stats = await this.calculateShiftTotals(shift.id);

    return {
      shift,
      currentStats: stats,
    };
  }

  /**
   * Kassa harakati qo'shish (inkassatsiya, xarajat, kirim)
   */
  async createCashMovement(branchId: string, dto: CreateCashMovementDto) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shiftId },
    });

    if (!shift || shift.closedAt) {
      throw new BadRequestException('Smena topilmadi yoki allaqachon yopilgan');
    }

    return this.prisma.cashMovement.create({
      data: {
        id: generateUUIDv7(),
        branchId,
        shiftId: dto.shiftId,
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
        version: 1,
      },
    });
  }

  /**
   * Smena bo'yicha to'liq hisob-kitoblar (X va Z hisobotlar uchun)
   */
  private async calculateShiftTotals(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        cashier: true,
        branch: true,
        payments: {
          where: {
            order: {
              status: { in: [OrderStatus.PAID, OrderStatus.REFUNDED] },
            },
          },
          include: { order: true },
        },
        cashMovements: true,
      },
    });

    if (!shift) {
      throw new NotFoundException('Smena topilmadi');
    }

    // 1. To'lov turlari bo'yicha hisoblash
    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    let clickSales = 0;
    let paymeSales = 0;
    let debtSales = 0;
    let salesCount = 0;

    let refundCount = 0;
    let refundTotal = 0;

    for (const p of shift.payments) {
      if (p.order.status === OrderStatus.REFUNDED) {
        refundCount++;
        refundTotal += p.amount;
        continue;
      }

      salesCount++;
      totalSales += p.amount;

      switch (p.method) {
        case PaymentMethod.CASH:
          cashSales += p.amount - p.change;
          break;
        case PaymentMethod.CARD:
          cardSales += p.amount;
          break;
        case PaymentMethod.CLICK:
          clickSales += p.amount;
          break;
        case PaymentMethod.PAYME:
          paymeSales += p.amount;
          break;
        case PaymentMethod.DEBT:
          debtSales += p.amount;
          break;
        case PaymentMethod.MIXED:
          cashSales += p.amount; // Aralashda qismi
          break;
      }
    }

    // 2. Kassa harakatlari (kirim, chiqim, xarajat)
    let cashInflow = 0;
    let cashOutflow = 0;
    let expenses = 0;

    for (const cm of shift.cashMovements) {
      if (cm.type === CashMovementType.INFLOW) cashInflow += cm.amount;
      if (cm.type === CashMovementType.OUTFLOW || cm.type === CashMovementType.COLLECTION) {
        cashOutflow += cm.amount;
      }
      if (cm.type === CashMovementType.EXPENSE) expenses += cm.amount;
    }

    // 3. Kutilayotgan naqd pul balansi:
    // Boshlang'ich + Naqd savdo + Kirim - Chiqim - Xarajat
    const expectedCash = shift.startCash + cashSales + cashInflow - cashOutflow - expenses;

    return {
      shift,
      salesCount,
      totalSales,
      cashSales,
      cardSales,
      clickSales,
      paymeSales,
      debtSales,
      cashInflow,
      cashOutflow,
      expenses,
      refundCount,
      refundTotal,
      expectedCash,
    };
  }

  /**
   * X-Hisobot (Oraliq ko'rish — smena yopilmasdan turib)
   */
  async getXReport(shiftId: string, paperWidth: 58 | 80 = 80) {
    const data = await this.calculateShiftTotals(shiftId);

    const reportData = {
      reportType: 'X_REPORT' as const,
      reportNumber: `X-${data.shift.id.slice(-6).toUpperCase()}`,
      restaurantName: 'Oshxona Milliy Taomlar',
      branchName: data.shift.branch.name,
      cashierName: data.shift.cashier.fullName,
      openedAt: data.shift.openedAt,
      startCash: data.shift.startCash,
      salesCount: data.salesCount,
      totalSales: data.totalSales,
      cashSales: data.cashSales,
      cardSales: data.cardSales,
      clickSales: data.clickSales,
      paymeSales: data.paymeSales,
      debtSales: data.debtSales,
      cashInflow: data.cashInflow,
      cashOutflow: data.cashOutflow,
      expenses: data.expenses,
      refundCount: data.refundCount,
      refundTotal: data.refundTotal,
      expectedCash: data.expectedCash,
    };

    const plainText = generateShiftReportText(reportData, paperWidth);
    const escPosCommands = generateShiftReportEscPos(reportData, paperWidth);

    return {
      reportType: 'X_REPORT',
      data: reportData,
      plainText,
      escPosCommands,
    };
  }

  /**
   * Smena yopish va Z-Hisobot chiqarish
   */
  async closeShift(shiftId: string, dto: CloseShiftDto, paperWidth: 58 | 80 = 80) {
    const totals = await this.calculateShiftTotals(shiftId);

    if (totals.shift.closedAt) {
      throw new BadRequestException('Ushbu smena allaqachon yopilgan');
    }

    // Farqni hisoblash: Haqiqiy naqd - Kutilgan naqd
    const cashDifference = dto.endCashActual - totals.expectedCash;

    const closedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        closedAt: new Date(),
        endCashExpected: totals.expectedCash,
        endCashActual: dto.endCashActual,
        cashDifference,
        notes: dto.notes,
        version: { increment: 1 },
      },
      include: { cashier: true, branch: true },
    });

    const reportData = {
      reportType: 'Z_REPORT' as const,
      reportNumber: `Z-${closedShift.id.slice(-6).toUpperCase()}`,
      restaurantName: 'Oshxona Milliy Taomlar',
      branchName: closedShift.branch.name,
      cashierName: closedShift.cashier.fullName,
      openedAt: closedShift.openedAt,
      closedAt: closedShift.closedAt,
      startCash: closedShift.startCash,
      salesCount: totals.salesCount,
      totalSales: totals.totalSales,
      cashSales: totals.cashSales,
      cardSales: totals.cardSales,
      clickSales: totals.clickSales,
      paymeSales: totals.paymeSales,
      debtSales: totals.debtSales,
      cashInflow: totals.cashInflow,
      cashOutflow: totals.cashOutflow,
      expenses: totals.expenses,
      refundCount: totals.refundCount,
      refundTotal: totals.refundTotal,
      expectedCash: totals.expectedCash,
      actualCash: dto.endCashActual,
      cashDifference,
    };

    const plainText = generateShiftReportText(reportData, paperWidth);
    const escPosCommands = generateShiftReportEscPos(reportData, paperWidth);

    return {
      success: true,
      shift: closedShift,
      reportData,
      plainTextZReport: plainText,
      escPosCommands,
    };
  }

  /**
   * O'tgan smenaning Z-Hisobotini qayta olish
   */
  async getZReport(shiftId: string, paperWidth: 58 | 80 = 80) {
    const totals = await this.calculateShiftTotals(shiftId);

    if (!totals.shift.closedAt) {
      throw new BadRequestException('Ushbu smena hali yopilmagan (X-hisobot orqali ko\'ring)');
    }

    const reportData = {
      reportType: 'Z_REPORT' as const,
      reportNumber: `Z-${totals.shift.id.slice(-6).toUpperCase()}`,
      restaurantName: 'Oshxona Milliy Taomlar',
      branchName: totals.shift.branch.name,
      cashierName: totals.shift.cashier.fullName,
      openedAt: totals.shift.openedAt,
      closedAt: totals.shift.closedAt,
      startCash: totals.shift.startCash,
      salesCount: totals.salesCount,
      totalSales: totals.totalSales,
      cashSales: totals.cashSales,
      cardSales: totals.cardSales,
      clickSales: totals.clickSales,
      paymeSales: totals.paymeSales,
      debtSales: totals.debtSales,
      cashInflow: totals.cashInflow,
      cashOutflow: totals.cashOutflow,
      expenses: totals.expenses,
      refundCount: totals.refundCount,
      refundTotal: totals.refundTotal,
      expectedCash: totals.shift.endCashExpected,
      actualCash: totals.shift.endCashActual,
      cashDifference: totals.shift.cashDifference,
    };

    const plainText = generateShiftReportText(reportData, paperWidth);
    const escPosCommands = generateShiftReportEscPos(reportData, paperWidth);

    return {
      reportType: 'Z_REPORT',
      data: reportData,
      plainText,
      escPosCommands,
    };
  }

  async findAllShifts(branchId: string) {
    return this.prisma.shift.findMany({
      where: { branchId },
      include: {
        cashier: { select: { id: true, fullName: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 30,
    });
  }
}
