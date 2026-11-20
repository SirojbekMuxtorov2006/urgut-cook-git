import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Categories - Menyu Kategoriyalari')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha kategoriyalar ro\'yxati' })
  @ApiResponse({ status: 200, description: 'Kategoriyalar ro\'yxati taomlar soni bilan' })
  async findAll(@CurrentUser('branchId') branchId?: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.categoriesService.findAll(targetBranchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kategoriya tafsilotlari (taomlari bilan birga)' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi kategoriya yaratish (Faqat Admin)' })
  async create(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.categoriesService.create(targetBranchId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kategoriyani tahrirlash (Faqat Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kategoriyani o\'chirish (Soft delete, Faqat Admin)' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kategoriyalar ketma-ketligini o\'zgartirish (Faqat Admin)' })
  async reorder(@Body() body: { items: { id: string; sortOrder: number }[] }) {
    return this.categoriesService.reorder(body.items);
  }
}
