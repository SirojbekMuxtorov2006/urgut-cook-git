import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PayOrderDto } from './dto/pay-order.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payments - To\'lovlar va Qaytarish (Refund)')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buyurtmaga to\'lov qabul qilish (Naqd, Karta, Click, Payme, Nasiya, Aralash)',
  })
  @ApiResponse({ status: 200, description: 'To\'lov muvaffaqiyatli qabul qilindi, chek chiqarildi' })
  async pay(
    @Param('id') orderId: string,
    @Body() dto: PayOrderDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.paymentsService.processPayment(orderId, dto, currentUserId);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'To\'lovni qaytarish (Refund — Faqat Admin PIN tasdig\'i bilan)',
  })
  async refund(
    @Param('id') orderId: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.paymentsService.refundPayment(orderId, dto, currentUserId);
  }
}
