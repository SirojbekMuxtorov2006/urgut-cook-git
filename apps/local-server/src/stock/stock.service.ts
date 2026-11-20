import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
} from './dto/ingredient.dto';
import {
  StockInDto,
  StockWasteDto,
  StockInventoryDto,
  CreateSupplierDto,
  CreateRecipeDto,
} from './dto/stock-operations.dto';
import { generateUUIDv7 } from '@oshxona/shared';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Barcha xomashyolar ro'yxati
   */
  async getIngredients(branchId: string, search?: string) {
    const where: any = {
      branchId,
      deletedAt: null,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const items = await this.prisma.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      isLowStock: item.currentQty <= item.minQty,
      totalInventoryValue: Math.round(item.currentQty * item.avgCost),
    }));
  }

  /**
   * Kam qolgan xomashyolar (ogohlantirish paneli uchun)
   */
  async getLowStockIngredients(branchId: string) {
    const items = await this.prisma.ingredient.findMany({
      where: {
        branchId,
        deletedAt: null,
      },
    });

    return items
      .filter((i) => i.currentQty <= i.minQty)
      .map((i) => ({
        ...i,
        deficit: Math.max(0, i.minQty - i.currentQty),
      }));
  }

  async createIngredient(branchId: string, dto: CreateIngredientDto) {
    return this.prisma.ingredient.create({
      data: {
        id: generateUUIDv7(),
        branchId,
        name: dto.name,
        unit: dto.unit,
        minQty: dto.minQty || 0,
        currentQty: dto.currentQty || 0,
        avgCost: dto.avgCost || 0,
        version: 1,
      },
    });
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto) {
    return this.prisma.ingredient.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Kirim (xarid qabul qilish) — O'rtacha og'irlikdagi narx (weighted average) avtomatik yangilanadi
   */
  async stockIn(branchId: string, dto: StockInDto) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException('Xomashyo topilmadi');
    }

    const totalPrice = Math.round(dto.quantity * dto.unitPrice);

    return this.prisma.$transaction(async (tx) => {
      // 1. O'rtacha og'irlikdagi narxni (Weighted Average Cost) hisoblash:
      // Yangi Narx = ((Eski Qoldiq * Eski Narx) + (Kirim Miqdor * Kirim Narx)) / Jami Miqdor
      const currentQty = Math.max(0, ingredient.currentQty);
      const totalQty = currentQty + dto.quantity;

      let newAvgCost = dto.unitPrice;
      if (totalQty > 0) {
        newAvgCost = Math.round(
          (currentQty * ingredient.avgCost + dto.quantity * dto.unitPrice) / totalQty,
        );
      }

      // 2. Qoldiqni va o'rtacha xarid narxini yangilash
      const updatedIngredient = await tx.ingredient.update({
        where: { id: dto.ingredientId },
        data: {
          currentQty: { increment: dto.quantity },
          avgCost: newAvgCost,
          version: { increment: 1 },
        },
      });

      // 3. Ombor harakati yozuvi
      await tx.stockMovement.create({
        data: {
          id: generateUUIDv7(),
          branchId,
          ingredientId: dto.ingredientId,
          type: StockMovementType.IN,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          totalPrice,
          reason: dto.reason || 'Omborga kirim qabul qilindi',
          version: 1,
        },
      });

      return updatedIngredient;
    });
  }

  /**
   * Isrof / Chiqim (buzilgan, to'kilgan xomashyo)
   */
  async stockWaste(branchId: string, dto: StockWasteDto) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException('Xomashyo topilmadi');
    }

    const totalPrice = Math.round(dto.quantity * ingredient.avgCost);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ingredient.update({
        where: { id: dto.ingredientId },
        data: {
          currentQty: { decrement: dto.quantity },
          version: { increment: 1 },
        },
      });

      await tx.stockMovement.create({
        data: {
          id: generateUUIDv7(),
          branchId,
          ingredientId: dto.ingredientId,
          type: StockMovementType.WASTE,
          quantity: dto.quantity,
          unitPrice: ingredient.avgCost,
          totalPrice,
          reason: dto.reason,
          version: 1,
        },
      });

      return updated;
    });

    if (result.currentQty <= result.minQty) {
      this.eventsGateway.emitStockLow(result);
    }

    return result;
  }

  /**
   * Inventarizatsiya (Sanalgan haqiqiy miqdorni tizim bilan solishtirish va sozlash)
   */
  async stockInventory(branchId: string, dto: StockInventoryDto) {
    const results = [];

    for (const item of dto.items) {
      const ingredient = await this.prisma.ingredient.findUnique({
        where: { id: item.ingredientId },
      });

      if (!ingredient) continue;

      const diff = item.actualQty - ingredient.currentQty;
      if (diff === 0) continue; // Hech qanday tafovut yo'q

      const totalPrice = Math.round(Math.abs(diff) * ingredient.avgCost);

      await this.prisma.$transaction(async (tx) => {
        // Qoldiqni to'g'irlash
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: {
            currentQty: item.actualQty,
            version: { increment: 1 },
          },
        });

        // Harakat yozish
        await tx.stockMovement.create({
          data: {
            id: generateUUIDv7(),
            branchId,
            ingredientId: item.ingredientId,
            type: StockMovementType.ADJUST,
            quantity: diff, // musbat yoki manfiy
            unitPrice: ingredient.avgCost,
            totalPrice,
            reason: item.reason || `Inventarizatsiya tafovuti: ${diff > 0 ? '+' : ''}${diff}`,
            version: 1,
          },
        });
      });

      results.push({
        ingredientId: item.ingredientId,
        name: ingredient.name,
        oldQty: ingredient.currentQty,
        newQty: item.actualQty,
        difference: diff,
      });
    }

    return {
      message: 'Inventarizatsiya muvaffaqiyatli saqlandi va ombor qoldiqlari sozlandi',
      adjustments: results,
    };
  }

  /**
   * Retsept (Texnologik karta) yaratish / yangilash
   * + Taomning tannarxini (costPrice) xomashyolarning o'rtacha narxidan avtomatik hisoblash!
   */
  async createOrUpdateRecipe(branchId: string, dto: CreateRecipeDto) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: dto.menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Taom topilmadi');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mavjud retseptni topish yoki yangisini yaratish
      let recipe = await tx.recipe.findUnique({
        where: { menuItemId: dto.menuItemId },
      });

      if (recipe) {
        // Eski moddalarni tozalash
        await tx.recipeItem.deleteMany({
          where: { recipeId: recipe.id },
        });

        recipe = await tx.recipe.update({
          where: { id: recipe.id },
          data: {
            description: dto.description,
            version: { increment: 1 },
          },
        });
      } else {
        recipe = await tx.recipe.create({
          data: {
            id: generateUUIDv7(),
            menuItemId: dto.menuItemId,
            description: dto.description,
            version: 1,
          },
        });
      }

      // 2. Yangi moddalarni kiritish va taom tannarxini hisoblash
      let calculatedCostPrice = 0;

      for (const item of dto.items) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
        });

        if (ingredient) {
          calculatedCostPrice += Math.round(item.quantity * ingredient.avgCost);
        }

        await tx.recipeItem.create({
          data: {
            id: generateUUIDv7(),
            recipeId: recipe.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            version: 1,
          },
        });
      }

      // 3. Taomning tannarxini yangilash
      await tx.menuItem.update({
        where: { id: dto.menuItemId },
        data: {
          costPrice: calculatedCostPrice,
          version: { increment: 1 },
        },
      });

      return tx.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          items: {
            include: { ingredient: true },
          },
          menuItem: true,
        },
      });
    });
  }

  async getRecipe(menuItemId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { menuItemId },
      include: {
        items: {
          include: { ingredient: true },
        },
        menuItem: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Ushbu taom uchun retsept (texnologik karta) topilmadi');
    }

    return recipe;
  }

  /**
   * Taom sotilganda ombordan avtomatik chiqim qilish (OUT_SALE)
   * To'lov qabul qilinganda chaqiriladi!
   */
  async deductStockForOrder(orderId: string, tx?: any) {
    const client = tx || this.prisma;

    const order = await client.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { deletedAt: null },
          include: {
            menuItem: {
              include: {
                recipe: {
                  include: { items: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) return;

    for (const orderItem of order.items) {
      const recipe = orderItem.menuItem.recipe;

      if (recipe && recipe.items.length > 0) {
        // Retsept bo'yicha har bir xomashyodan chiqim
        for (const rItem of recipe.items) {
          const usedQty = rItem.quantity * orderItem.quantity;

          const updated = await client.ingredient.update({
            where: { id: rItem.ingredientId },
            data: {
              currentQty: { decrement: usedQty },
              version: { increment: 1 },
            },
          });

          await client.stockMovement.create({
            data: {
              id: generateUUIDv7(),
              branchId: order.branchId,
              ingredientId: rItem.ingredientId,
              type: StockMovementType.OUT_SALE,
              quantity: usedQty,
              unitPrice: updated.avgCost,
              totalPrice: Math.round(usedQty * updated.avgCost),
              reason: `Buyurtma #${order.orderNumber} (Taom: ${orderItem.menuItem.nameUz}) sotuv chiqimi`,
              version: 1,
            },
          });

          if (updated.currentQty <= updated.minQty) {
            this.eventsGateway.emitStockLow(updated);
          }
        }
      }
    }
  }

  /**
   * Yetkazib beruvchilar (Suppliers)
   */
  async getSuppliers(branchId: string) {
    return this.prisma.supplier.findMany({
      where: { branchId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(branchId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        id: generateUUIDv7(),
        branchId,
        name: dto.name,
        phone: dto.phone,
        company: dto.company,
        version: 1,
      },
    });
  }

  /**
   * Ombor harakatlari tarixi
   */
  async getMovements(branchId: string, ingredientId?: string) {
    const where: any = { branchId };
    if (ingredientId) where.ingredientId = ingredientId;

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
