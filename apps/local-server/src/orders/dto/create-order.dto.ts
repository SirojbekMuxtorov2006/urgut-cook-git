import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { OrderType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, default: OrderType.DINE_IN, description: 'Buyurtma turi (DINE_IN, TAKEAWAY, DELIVERY)' })
  @IsEnum(OrderType)
  @IsNotEmpty()
  type: OrderType;

  @ApiPropertyOptional({ example: '019349c2-5500-7000-8000-000000000501', description: 'Stol IDsi (DINE_IN uchun)' })
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiPropertyOptional({ example: '019349c2-5500-7000-8000-000000000011', description: 'Ofitsiant IDsi' })
  @IsOptional()
  @IsString()
  waiterId?: string;

  @ApiPropertyOptional({ example: 4, default: 1, description: 'Mehmonlar soni' })
  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number;

  @ApiPropertyOptional({ example: 'Oyna yonidagi joy', description: 'Buyurtma uchun umumiy izoh' })
  @IsOptional()
  @IsString()
  notes?: string;
}
