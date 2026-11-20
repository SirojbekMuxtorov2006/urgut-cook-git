import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { SplitOrderDto } from './dto/split-order.dto';
import { MergeOrdersDto } from './dto/merge-orders.dto';
import { MoveOrderDto } from './dto/move-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Orders - Buyurtmalar va Kassa Boshqaruvi')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('active')
  @ApiOperation({ summary: 'Barcha faol (ochiq va oshxonadagi) buyurtmalar ro\'yxati' })
  async getActiveOrders(@CurrentUser('branchId') branchId?: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.ordersService.getActiveOrders(targetBranchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buyurtma tafsilotlari (taomlari, hisob-kitobi va stoli bilan)' })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi buyurtma ochish (Zal, Olib ketish, Yetkazib berish)' })
  async create(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') cashierId: string,
    @Body() dto: CreateOrderDto,
  ) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.ordersService.create(targetBranchId, cashierId, dto);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Buyurtmaga taom qo\'shish (sotuv paytidagi narx muzlatiladi)' })
  async addItem(@Param('id') orderId: string, @Body() dto: AddOrderItemDto) {
    return this.ordersService.addItem(orderId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Buyurtmadan taomni olib tashlash' })
  async removeItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.ordersService.removeItem(orderId, itemId);
  }

  @Post(':id/send-kitchen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '"Oshxonaga yuborish" -> KDS ekrani va printerlarga yuborish' })
  async sendToKitchen(@Param('id') orderId: string) {
    return this.ordersService.sendToKitchen(orderId);
  }

  @Post(':id/discount')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chegirma qo\'llash (Kassir limiti tekshiriladi, masalan 10%)' })
  async applyDiscount(
    @Param('id') orderId: string,
    @Body() dto: ApplyDiscountDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.applyDiscount(orderId, dto, user);
  }

  @Post(':id/split')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buyurtmani bo\'lish (Split bill - hisobni bo\'lib to\'lash uchun)' })
  async splitOrder(
    @Param('id') orderId: string,
    @Body() dto: SplitOrderDto,
    @CurrentUser('id') cashierId: string,
  ) {
    return this.ordersService.splitOrder(orderId, dto, cashierId);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ikki buyurtmani bitta buyurtmaga birlashtirish' })
  async mergeOrders(@Body() dto: MergeOrdersDto) {
    return this.ordersService.mergeOrders(dto.sourceOrderId, dto.targetOrderId);
  }

  @Post(':id/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buyurtmani boshqa stolga ko\'chirish' })
  async moveTable(@Param('id') orderId: string, @Body() dto: MoveOrderDto) {
    return this.ordersService.moveTable(orderId, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buyurtmani bekor qilish (Faqat Admin PIN tasdig\'i bilan!)' })
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.ordersService.cancelOrder(orderId, dto, currentUserId);
  }
}
