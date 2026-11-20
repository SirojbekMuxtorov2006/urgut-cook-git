import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { generateUUIDv7 } from '@oshxona/shared';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(branchId: string) {
    return this.prisma.category.findMany({
      where: {
        branchId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            menuItems: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: { deletedAt: null },
          orderBy: { nameUz: 'asc' },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    return category;
  }

  async create(branchId: string, dto: CreateCategoryDto) {
    const id = generateUUIDv7();
    return this.prisma.category.create({
      data: {
        id,
        branchId,
        nameUz: dto.nameUz,
        nameRu: dto.nameRu,
        icon: dto.icon || 'utensils',
        color: dto.color || '#f97316',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        version: 1,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    const activeItemsCount = await this.prisma.menuItem.count({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });

    if (activeItemsCount > 0) {
      throw new BadRequestException(
        `Kategoriyani o'chirib bo'lmaydi: unda ${activeItemsCount} ta faol taom mavjud. Avval taomlarni boshqa kategoriyaga ko'chiring yoki o'chiring.`,
      );
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        version: { increment: 1 },
      },
    });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            version: { increment: 1 },
          },
        }),
      ),
    );
  }
}
