import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Receipts - Cheklar va Qayta Chop Etish')
@Controller('receipts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Chek tafsilotlarini olish' })
  async getReceipt(@Param('id') id: string) {
    return this.receiptsService.getReceipt(id);
  }

  @Post(':id/reprint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chekni qayta chiqarish ("NUSXA" belgisi bilan, audit logga yoziladi)' })
  @ApiQuery({ name: 'width', required: false, enum: [58, 80], description: 'Qog\'oz kengligi (58mm yoki 80mm)' })
  async reprint(
    @Param('id') receiptId: string,
    @CurrentUser('id') userId: string,
    @Query('width') width?: string,
  ) {
    const paperWidth = width === '58' ? 58 : 80;
    return this.receiptsService.reprintReceipt(receiptId, userId, paperWidth);
  }
}
