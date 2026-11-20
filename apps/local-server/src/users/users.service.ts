import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(branchId: string) {
    return this.prisma.user.findMany({
      where: {
        branchId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        discountLimit: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findCashiers(branchId: string) {
    return this.prisma.user.findMany({
      where: {
        branchId,
        role: UserRole.CASHIER,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        discountLimit: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        discountLimit: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return user;
  }
}
