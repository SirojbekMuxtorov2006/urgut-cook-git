import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StockService } from './stock.service';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Stock & Recipes - Ombor, Xomashyo va Retseptlar (Kalkulyatsiya)')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('ingredients')
  @ApiOperation({ summary: 'Barcha xomashyolar ro\'yxati va qoldiqlari' })
  @ApiQuery({ name: 'search', required: false })
  async getIngredients(
    @CurrentUser('branchId') branchId: string,
    @Query('search') search?: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.getIngredients(targetBranchId, search);
  }

  @Get('ingredients/low-stock')
  @ApiOperation({ summary: 'Kam qolgan xomashyolar ro\'yxati (ogohlantirish)' })
  async getLowStock(@CurrentUser('branchId') branchId: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.getLowStockIngredients(targetBranchId);
  }

  @Post('ingredients')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Yangi xomashyo qo\'shish (Faqat Admin)' })
  async createIngredient(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateIngredientDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.createIngredient(targetBranchId, dto);
  }

  @Patch('ingredients/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xomashyoni tahrirlash (Faqat Admin)' })
  async updateIngredient(
    @Param('id') id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.stockService.updateIngredient(id, dto);
  }

  @Post('stock/in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xomashyo xaridini qabul qilish (Kirim) — Tannarx o\'rtacha narx bo\'yicha yangilanadi' })
  async stockIn(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: StockInDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.stockIn(targetBranchId, dto);
  }

  @Post('stock/waste')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Isrof / yaroqsiz chiqim kiritish (sababi bilan)' })
  async stockWaste(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: StockWasteDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.stockWaste(targetBranchId, dto);
  }

  @Post('stock/inventory')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Inventarizatsiya — Amalda sanalgan qoldiqlar asosida omborni sozlash' })
  async stockInventory(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: StockInventoryDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.stockInventory(targetBranchId, dto);
  }

  @Get('stock/movements')
  @ApiOperation({ summary: 'Ombor harakatlari tarixi (Kirim, Chiqim, Isrof, Inventarizatsiya)' })
  @ApiQuery({ name: 'ingredientId', required: false })
  async getMovements(
    @CurrentUser('branchId') branchId: string,
    @Query('ingredientId') ingredientId?: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.getMovements(targetBranchId, ingredientId);
  }

  @Post('recipes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retsept (Texnologik karta) kiritish — Taom tannarxi avtomatik hisoblanadi' })
  async createRecipe(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateRecipeDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.createOrUpdateRecipe(targetBranchId, dto);
  }

  @Get('recipes/:menuItemId')
  @ApiOperation({ summary: 'Taomning retsepti va moddalar sarfi' })
  async getRecipe(@Param('menuItemId') menuItemId: string) {
    return this.stockService.getRecipe(menuItemId);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Yetkazib beruvchilar ro\'yxati' })
  async getSuppliers(@CurrentUser('branchId') branchId: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.getSuppliers(targetBranchId);
  }

  @Post('suppliers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Yangi yetkazib beruvchi qo\'shish' })
  async createSupplier(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.stockService.createSupplier(targetBranchId, dto);
  }
}
