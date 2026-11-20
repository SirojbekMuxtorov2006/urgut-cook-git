import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users - Xodimlar va Kassirlar')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha xodimlar ro\'yxati (faqat Admin)' })
  @ApiResponse({ status: 200, description: 'Xodimlar ro\'yxati' })
  async getAllUsers(@CurrentUser('branchId') branchId: string) {
    return this.usersService.findAll(branchId);
  }

  @Get('cashiers')
  @ApiOperation({ summary: 'Kassa ekrani uchun faol kassirlar ro\'yxati (PIN bilan tanlash uchun)' })
  @ApiResponse({ status: 200, description: 'Kassirlar ro\'yxati' })
  async getCashiers(@CurrentUser('branchId') branchId: string) {
    // Agar auth bo'lmasa default birinchi branch bo'yicha oladi
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.usersService.findCashiers(targetBranchId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xodim tafsilotlari' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
