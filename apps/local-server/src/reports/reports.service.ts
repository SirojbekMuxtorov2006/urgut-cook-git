import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentMethod, CashMovementType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kunlik / Haftalik / Oylik umumiy savdo statistikasi
   */
  async getSalesSummary(branchId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: OrderStatus.PAID,
        createdAt: { gte: start, lte: end },
        deletedAt: null,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
        payments: true,
      },
    });

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalSubtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalServiceFee = orders.reduce((sum, o) => sum + o.serviceFee, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
    const averageBill = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    // Tannarx (cost price)
    let totalCostPrice = 0;
    for (const order of orders) {
      for (const item of order.items) {
        totalCostPrice += (item.menuItem.costPrice || 0) * item.quantity;
      }
    }

    // Xarajatlar
    const cashExpenses = await this.prisma.cashMovement.aggregate({
      where: {
        branchId,
        type: CashMovementType.EXPENSE,
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });
    const totalExpenses = cashExpenses._sum.amount || 0;

    // Sof Foyda = Tushum - Tannarx - Kassa Xarajatlari
    const grossProfit = totalSales - totalCostPrice;
    const netProfit = grossProfit - totalExpenses;

    return {
      period: { start, end },
      totalOrders,
      totalSales,
      totalSubtotal,
      totalServiceFee,
      totalDiscount,
      averageBill,
      totalCostPrice,
      totalExpenses,
      grossProfit,
      netProfit,
    };
  }

  /**
   * Eng ko'p sotilgan taomlar (TOP-10)
   */
  async getTopSellingItems(branchId: string, limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          branchId,
          status: OrderStatus.PAID,
        },
        deletedAt: null,
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: limit,
    });

    const results = [];
    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { category: true },
      });

      if (menuItem) {
        results.push({
          id: menuItem.id,
          name: menuItem.nameUz,
          categoryName: menuItem.category.nameUz,
          soldQuantity: item._sum.quantity || 0,
          totalRevenue: item._sum.totalPrice || 0,
        });
      }
    }

    return results;
  }

  /**
   * To'lov turlari bo'yicha taqsimot (Naqd, Karta, Click, Payme, Nasiya)
   */
  async getPaymentMethodDistribution(branchId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date();

    const payments = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        branchId,
        order: { status: OrderStatus.PAID },
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const total = payments.reduce((sum, p) => sum + (p._sum.amount || 0), 0);

    return payments.map((p) => {
      const amount = p._sum.amount || 0;
      const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
      return {
        method: p.method,
        count: p._count.id,
        amount,
        percentage: percent,
      };
    });
  }

  /**
   * Kassirlar va xodimlar bo'yicha savdo natijalari
   */
  async getCashierSales(branchId: string) {
    const cashiers = await this.prisma.user.findMany({
      where: { branchId, deletedAt: null },
      select: { id: true, fullName: true, role: true },
    });

    const results = [];
    for (const c of cashiers) {
      const stats = await this.prisma.order.aggregate({
        where: {
          branchId,
          cashierId: c.id,
          status: OrderStatus.PAID,
        },
        _count: { id: true },
        _sum: { total: true },
      });

      results.push({
        cashierId: c.id,
        fullName: c.fullName,
        role: c.role,
        orderCount: stats._count.id || 0,
        totalSales: stats._sum.total || 0,
      });
    }

    return results.sort((a, b) => b.totalSales - a.totalSales);
  }

  /**
   * Soatlik yuklama grafigi (Mijozlar qaysi soatlarda eng ko'p keladi)
   */
  async getHourlyTraffic(branchId: string) {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: todayStart },
      },
      select: { createdAt: true, total: true },
    });

    const hourlyMap: Record<number, { hour: string; count: number; total: number }> = {};
    for (let h = 8; h <= 23; h++) {
      hourlyMap[h] = {
        hour: `${String(h).padStart(2, '0')}:00`,
        count: 0,
        total: 0,
      };
    }

    for (const o of orders) {
      const hour = o.createdAt.getHours();
      if (hourlyMap[hour]) {
        hourlyMap[hour].count += 1;
        hourlyMap[hour].total += o.total;
      }
    }

    return Object.values(hourlyMap);
  }

  /**
   * Nasiyalar (Qarzdorlar) ro'yxati
   */
  async getDebtorsReport(branchId: string) {
    return this.prisma.customer.findMany({
      where: {
        branchId,
        debtBalance: { gt: 0 },
        deletedAt: null,
      },
      orderBy: { debtBalance: 'desc' },
    });
  }

  /**
   * Hisobotni CSV / Excel / Matn ko'rinishida eksport qilish
   */
  async exportReport(branchId: string, type: string) {
    if (type === 'sales') {
      const summary = await this.getSalesSummary(branchId);
      return [
        ['Ko\'rsatkich', 'Qiymat'],
        ['Jami Buyurtmalar', `${summary.totalOrders} ta`],
        ['Jami Tushum', `${summary.totalSales} so'm`],
        ['O\'rtacha Chek', `${summary.averageBill} so'm`],
        ['Jami Xizmat Haqi', `${summary.totalServiceFee} so'm`],
        ['Jami Chegirmalar', `${summary.totalDiscount} so'm`],
        ['Jami Tannarx', `${summary.totalCostPrice} so'm`],
        ['Kassa Xarajatlari', `${summary.totalExpenses} so'm`],
        ['Sof Foyda', `${summary.netProfit} so'm`],
      ];
    }

    if (type === 'top-items') {
      const items = await this.getTopSellingItems(branchId, 20);
      return [
        ['Taom Nomi', 'Toifa', 'Sotilgan Miqdor', 'Jami Tushum'],
        ...items.map((i) => [i.name, i.categoryName, `${i.soldQuantity}`, `${i.totalRevenue} so'm`]),
      ];
    }

    if (type === 'debts') {
      const debts = await this.getDebtorsReport(branchId);
      return [
        ['Mijoz Ismi', 'Telefon', 'Qarz Balansi'],
        ...debts.map((d) => [d.name, d.phone || '-', `${d.debtBalance} so'm`]),
      ];
    }

    return [];
  }
}
