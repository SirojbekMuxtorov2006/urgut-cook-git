import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Menu & Prices - Menyu, Taomlar va Narxlar')
@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('menu/pos-catalog')
  @ApiOperation({ summary: 'Kassa (POS) ekrani uchun optimallashtirilgan to\'liq menyu katalogi' })
  @ApiResponse({ status: 200, description: 'Kategoriyalar, taomlar, variantlar va modifierlar' })
  async getPosCatalog(@CurrentUser('branchId') branchId?: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.menuService.getPosCatalog(targetBranchId);
  }

  @Get('menu-items')
  @ApiOperation({ summary: 'Taomlar ro\'yxati (qidiruv va toifa bo\'yicha filtrlash bilan)' })
  @ApiQuery({ name: 'search', required: false, description: 'Taom nomi bo\'yicha qidirish' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Toifa bo\'yicha filtrlash' })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean, description: 'Faqat mavjud taomlar' })
  async findAll(
    @CurrentUser('branchId') branchId: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isAvailable') isAvailable?: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    const available = isAvailable !== undefined ? isAvailable === 'true' : undefined;
    return this.menuService.findAll(targetBranchId, search, categoryId, available);
  }

  @Get('menu-items/:id')
  @ApiOperation({ summary: 'Taomning to\'liq tafsilotlari (variantlar, modifierlar va narx tarixi bilan)' })
  async findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Post('menu-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi taom qo\'shish (Faqat Admin)' })
  async create(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.menuService.create(targetBranchId, dto);
  }

  @Patch('menu-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Taom ma\'lumotlarini tahrirlash (Faqat Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.update(id, dto);
  }

  @Patch('menu-items/:id/price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Taom narxini o\'zgartirish (Faqat Admin, narx tarixi yoziladi)' })
  async updatePrice(
    @Param('id') id: string,
    @Body() dto: UpdatePriceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.menuService.updatePrice(id, dto, userId);
  }

  @Patch('menu-items/:id/toggle-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '"Tugadi" / "Bor" holatini almashtirish (Kassir va Admin)' })
  async toggleAvailability(@Param('id') id: string) {
    return this.menuService.toggleAvailability(id);
  }

  @Post('menu-items/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Taomga variant qo\'shish (0.5 porsiya, 1 kg...) (Faqat Admin)' })
  async addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.menuService.addVariant(id, dto);
  }

  @Delete('menu-items/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Taom variantini o\'chirish (Faqat Admin)' })
  async removeVariant(@Param('variantId') variantId: string) {
    return this.menuService.removeVariant(variantId);
  }

  @Post('menu-items/:id/modifier-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier guruhi qo\'shish (+ Qo\'shimchalar) (Faqat Admin)' })
  async addModifierGroup(
    @Param('id') id: string,
    @Body() dto: CreateModifierGroupDto,
  ) {
    return this.menuService.addModifierGroup(id, dto);
  }

  @Post('menu-items/modifier-groups/:groupId/modifiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Guruhga modifier qo\'shish (+ Qazi, + Tuxum) (Faqat Admin)' })
  async addModifier(
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierDto,
  ) {
    return this.menuService.addModifier(groupId, dto);
  }

  @Delete('menu-items/modifiers/:modifierId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifierni o\'chirish (Faqat Admin)' })
  async removeModifier(@Param('modifierId') modifierId: string) {
    return this.menuService.removeModifier(modifierId);
  }

  @Get('menu-items/:id/price-history')
  @ApiOperation({ summary: 'Taom narx o\'zgarishlari tarixi' })
  async getPriceHistory(@Param('id') id: string) {
    return this.menuService.getPriceHistory(id);
  }

  @Delete('menu-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Taomni o\'chirish (Soft delete, Faqat Admin)' })
  async remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
