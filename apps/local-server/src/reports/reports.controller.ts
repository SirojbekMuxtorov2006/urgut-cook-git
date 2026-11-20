import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports - Hisobotlar va Tahlil (Admin)')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Savdo va Sof Foyda umumiy hisoboti' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSales(
    @CurrentUser('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.reportsService.getSalesSummary(targetBranchId, startDate, endDate);
  }

  @Get('top-items')
  @ApiOperation({ summary: 'Eng ko\'p sotilgan taomlar (TOP-10)' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopItems(
    @CurrentUser('branchId') branchId: string,
    @Query('limit') limit?: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.reportsService.getTopSellingItems(targetBranchId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('payments')
  @ApiOperation({ summary: 'To\'lov usullari taqsimoti (Naqd, Karta, Click, Payme, Nasiya)' })
  async getPayments(
    @CurrentUser('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.reportsService.getPaymentMethodDistribution(targetBranchId, startDate, endDate);
  }

  @Get('cashiers')
  @ApiOperation({ summary: 'Xodimlar va kassirlar bo\'yicha savdo ko\'rsatkichlari' })
  async getCashiers(@CurrentUser('branchId') branchId: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.reportsService.getCashierSales(targetBranchId);
  }

  @Get('hourly')
  @ApiOperation({ summary: 'Bugungi soatlik yuklama va mijozlar oqimi' })
  async getHourly(@CurrentUser('branchId') branchId: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.reportsService.getHourlyTraffic(targetBranchId);
  }

  @Get('debts')
  @ApiOperation({ summary: 'Nasiya qarzdorlar ro\'yxati' })
  async getDebts(@CurrentUser('branchId') branchId: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.reportsService.getDebtorsReport(targetBranchId);
  }

  @Get(':type/export')
  @ApiOperation({ summary: 'Hisobotni CSV / Excel ko\'rinishida yuklab olish' })
  async exportReport(
    @Param('type') type: string,
    @CurrentUser('branchId') branchId: string,
    @Res() res: Response,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    const rows = await this.reportsService.exportReport(targetBranchId, type);

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="hisobot_${type}_${Date.now()}.csv"`);
    res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8
  }
}
