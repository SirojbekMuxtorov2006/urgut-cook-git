import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto, CloseShiftDto, CreateCashMovementDto } from './dto/shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Shifts & Cash - Smena va Kassa Boshqaruvi (X/Z Hisobotlar)')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('shifts/open')
  @ApiOperation({ summary: 'Yangi kassa smenasini ochish (boshlang\'ich mayda pul bilan)' })
  async openShift(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') cashierId: string,
    @Body() dto: OpenShiftDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.shiftsService.openShift(targetBranchId, cashierId, dto);
  }

  @Get('shifts/current')
  @ApiOperation({ summary: 'Kassirning joriy ochiq smenasi va oraliq tushumi' })
  async getCurrentShift(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') cashierId: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.shiftsService.getCurrentShift(targetBranchId, cashierId);
  }

  @Post('shifts/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Smenani yopish va Z-Hisobot chiqarish (haqiqiy naqd pul kiritiladi)' })
  @ApiQuery({ name: 'width', required: false, enum: [58, 80], description: 'Qog\'oz kengligi' })
  async closeShift(
    @Param('id') shiftId: string,
    @Body() dto: CloseShiftDto,
    @Query('width') width?: string,
  ) {
    const paperWidth = width === '58' ? 58 : 80;
    return this.shiftsService.closeShift(shiftId, dto, paperWidth);
  }

  @Get('shifts/:id/x-report')
  @ApiOperation({ summary: 'X-Hisobot olish (Oraliq ko\'rish — smena yopilmaydi)' })
  @ApiQuery({ name: 'width', required: false, enum: [58, 80], description: 'Qog\'oz kengligi' })
  async getXReport(
    @Param('id') shiftId: string,
    @Query('width') width?: string,
  ) {
    const paperWidth = width === '58' ? 58 : 80;
    return this.shiftsService.getXReport(shiftId, paperWidth);
  }

  @Get('shifts/:id/z-report')
  @ApiOperation({ summary: 'Z-Hisobot olish (Yopilgan smena yakuniy hisoboti)' })
  @ApiQuery({ name: 'width', required: false, enum: [58, 80], description: 'Qog\'oz kengligi' })
  async getZReport(
    @Param('id') shiftId: string,
    @Query('width') width?: string,
  ) {
    const paperWidth = width === '58' ? 58 : 80;
    return this.shiftsService.getZReport(shiftId, paperWidth);
  }

  @Post('cash-movements')
  @ApiOperation({ summary: 'Kassa harakati kiritish (Inkassatsiya, Xarajat, Kassa to\'ldirish)' })
  async createCashMovement(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateCashMovementDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.shiftsService.createCashMovement(targetBranchId, dto);
  }

  @Get('shifts')
  @ApiOperation({ summary: 'Barcha smenalar tarixi (Admin uchun)' })
  async getAllShifts(@CurrentUser('branchId') branchId: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.shiftsService.findAllShifts(targetBranchId);
  }
}
