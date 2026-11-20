import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, DebtPaymentDto } from './dto/customer.dto';
import { generateUUIDv7 } from '@oshxona/shared';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(branchId: string, search?: string) {
    const where: any = {
      branchId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        debts: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    return customer;
  }

  async create(branchId: string, dto: CreateCustomerDto) {
    // Agar telefon kiritilgan bo'lsa, takrorlanmasligini tekshirish
    if (dto.phone) {
      const existing = await this.prisma.customer.findFirst({
        where: { branchId, phone: dto.phone, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException('Ushbu telefon raqamli mijoz allaqachon mavjud');
      }
    }

    return this.prisma.customer.create({
      data: {
        id: generateUUIDv7(),
        branchId,
        name: dto.name,
        phone: dto.phone,
        debtBalance: 0,
        version: 1,
      },
    });
  }

  /**
   * Qarzni to'lash (Nasiyani qaytarish)
   */
  async payDebt(id: string, dto: DebtPaymentDto, userId: string) {
    const customer = await this.findOne(id);

    if (customer.debtBalance <= 0) {
      throw new BadRequestException('Ushbu mijozda qarzdorlik mavjud emas');
    }

    if (dto.amount > customer.debtBalance) {
      throw new BadRequestException(
        `Kiritilgan summa joriy qarzdan (${customer.debtBalance} so'm) ko'p bo'lishi mumkin emas`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Qarz balansini kamaytirish
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          debtBalance: { decrement: dto.amount },
          version: { increment: 1 },
        },
      });

      // 2. Qarz to'lovi tranzaksiyasini yozish
      await tx.debtTransaction.create({
        data: {
          id: generateUUIDv7(),
          branchId: customer.branchId,
          customerId: id,
          type: 'DECREASE',
          amount: dto.amount,
          note: dto.note || 'Qarz to\'lovi qabul qilindi',
          version: 1,
        },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          id: generateUUIDv7(),
          branchId: customer.branchId,
          userId,
          action: 'DEBT_PAYMENT',
          entity: 'CUSTOMER',
          entityId: id,
          details: {
            customerName: customer.name,
            paidAmount: dto.amount,
            remainingDebt: updatedCustomer.debtBalance,
          },
          version: 1,
        },
      });

      return updatedCustomer;
    });
  }
}
