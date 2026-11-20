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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, DebtPaymentDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Customers & Debts - Mijozlar va Nasiya (Qarz) Daftari')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Mijozlar va ularning qarz balansi ro\'yxati' })
  @ApiQuery({ name: 'search', required: false, description: 'Ism yoki telefon bo\'yicha qidirish' })
  async findAll(
    @CurrentUser('branchId') branchId: string,
    @Query('search') search?: string,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.customersService.findAll(targetBranchId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mijoz tafsilotlari va qarz tarixi' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi mijoz qo\'shish' })
  async create(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.customersService.create(targetBranchId, dto);
  }

  @Post(':id/debt-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mijozning qarzini to\'lash (Qarz daftari so\'ndirish)' })
  async payDebt(
    @Param('id') id: string,
    @Body() dto: DebtPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.payDebt(id, dto, userId);
  }
}
