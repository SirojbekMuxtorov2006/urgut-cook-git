import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { generateUUIDv7 } from '@oshxona/shared';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kassa (POS) ekrani uchun tezkor, to'liq va keshlanuvchi katalog
   */
  async getPosCatalog(branchId: string) {
    return this.prisma.category.findMany({
      where: {
        branchId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        menuItems: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            variants: {
              where: { deletedAt: null },
            },
            modifierGroups: {
              where: { deletedAt: null },
              include: {
                modifiers: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: { nameUz: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Admin va boshqaruv uchun qidiruv va filtrlash
   */
  async findAll(branchId: string, search?: string, categoryId?: string, isAvailable?: boolean) {
    const where: any = {
      branchId,
      deletedAt: null,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (search) {
      where.OR = [
        { nameUz: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, nameUz: true, nameRu: true, color: true },
        },
        variants: {
          where: { deletedAt: null },
        },
        _count: {
          select: { modifierGroups: true },
        },
      },
      orderBy: { nameUz: 'asc' },
    });

    // Foyda va ustama foizini hisoblab qaytarish
    return items.map((item) => {
      const profit = item.price - item.costPrice;
      const marginPercent = item.costPrice > 0 ? Math.round((profit / item.costPrice) * 100) : 0;
      return {
        ...item,
        profit,
        marginPercent,
      };
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          where: { deletedAt: null },
        },
        modifierGroups: {
          where: { deletedAt: null },
          include: {
            modifiers: {
              where: { deletedAt: null },
            },
          },
        },
        recipe: {
          include: {
            items: {
              include: {
                ingredient: true,
              },
            },
          },
        },
        priceHistories: {
          include: {
            changedByUser: {
              select: { id: true, fullName: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!item || item.deletedAt) {
      throw new NotFoundException('Taom topilmadi');
    }

    const profit = item.price - item.costPrice;
    const marginPercent = item.costPrice > 0 ? Math.round((profit / item.costPrice) * 100) : 0;

    return {
      ...item,
      profit,
      marginPercent,
    };
  }

  async create(branchId: string, dto: CreateMenuItemDto) {
    const id = generateUUIDv7();
    return this.prisma.menuItem.create({
      data: {
        id,
        branchId,
        categoryId: dto.categoryId,
        nameUz: dto.nameUz,
        nameRu: dto.nameRu,
        imageUrl: dto.imageUrl,
        price: dto.price,
        costPrice: dto.costPrice || 0,
        unit: dto.unit || 'PORTION',
        kitchenStationId: dto.kitchenStationId || 'MAIN',
        isAvailable: dto.isAvailable ?? true,
        isActive: true,
        version: 1,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id);

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Narxni o'zgartirish va tarixga saqlash (Faqat Admin)
   */
  async updatePrice(id: string, dto: UpdatePriceDto, userId: string) {
    const item = await this.findOne(id);

    if (item.price === dto.newPrice) {
      return item;
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Narx tarixini saqlash
      await tx.priceHistory.create({
        data: {
          id: generateUUIDv7(),
          menuItemId: id,
          oldPrice: item.price,
          newPrice: dto.newPrice,
          changedByUserId: userId,
          reason: dto.reason || 'Admin tomonidan narx yangilandi',
          version: 1,
        },
      });

      // 2. Taomning asosiy narxini yangilash
      return tx.menuItem.update({
        where: { id },
        data: {
          price: dto.newPrice,
          version: { increment: 1 },
        },
      });
    });
  }

  /**
   * "Tugadi" / "Bor" holatini o'zgartirish (Kassir va Admin)
   */
  async toggleAvailability(id: string) {
    const item = await this.findOne(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: {
        isAvailable: !item.isAvailable,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Taom variantini qo'shish (0.5 porsiya, 1 kg...)
   */
  async addVariant(menuItemId: string, dto: CreateVariantDto) {
    await this.findOne(menuItemId);

    return this.prisma.menuItemVariant.create({
      data: {
        id: generateUUIDv7(),
        menuItemId,
        nameUz: dto.nameUz,
        nameRu: dto.nameRu,
        price: dto.price,
        version: 1,
      },
    });
  }

  async removeVariant(variantId: string) {
    return this.prisma.menuItemVariant.update({
      where: { id: variantId },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  /**
   * Modifier guruhi qo'shish (+ Qo'shimchalar)
   */
  async addModifierGroup(menuItemId: string, dto: CreateModifierGroupDto) {
    await this.findOne(menuItemId);

    return this.prisma.modifierGroup.create({
      data: {
        id: generateUUIDv7(),
        menuItemId,
        nameUz: dto.nameUz,
        nameRu: dto.nameRu,
        minSelect: dto.minSelect ?? 0,
        maxSelect: dto.maxSelect ?? 3,
        version: 1,
      },
    });
  }

  /**
   * Modifier qo'shish (+ Qazi, + Tuxum)
   */
  async addModifier(modifierGroupId: string, dto: CreateModifierDto) {
    const group = await this.prisma.modifierGroup.findUnique({
      where: { id: modifierGroupId },
    });

    if (!group) {
      throw new NotFoundException('Modifier guruhi topilmadi');
    }

    return this.prisma.modifier.create({
      data: {
        id: generateUUIDv7(),
        modifierGroupId,
        nameUz: dto.nameUz,
        nameRu: dto.nameRu,
        price: dto.price,
        version: 1,
      },
    });
  }

  async removeModifier(modifierId: string) {
    return this.prisma.modifier.update({
      where: { id: modifierId },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  /**
   * Taomni o'chirish (Soft delete)
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Narx o'zgarishlar tarixi
   */
  async getPriceHistory(menuItemId: string) {
    return this.prisma.priceHistory.findMany({
      where: { menuItemId },
      include: {
        changedByUser: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
