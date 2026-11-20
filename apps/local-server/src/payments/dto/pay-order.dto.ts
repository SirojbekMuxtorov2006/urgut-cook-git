import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PayOrderDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'To\'lov turi (CASH, CARD, CLICK, PAYME, DEBT, MIXED)',
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiProperty({ example: 100000, description: 'Mijoz bergan umumiy summa (so\'m)' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 50000, description: 'Aralash to\'lovda naqd qismi' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cashPart?: number;

  @ApiPropertyOptional({ example: 50000, description: 'Aralash to\'lovda karta/click qismi' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cardPart?: number;

  @ApiPropertyOptional({
    example: '019349c2-5500-7000-8000-000000000801',
    description: 'Nasiya (DEBT) to\'lov uchun mijoz IDsi',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 80, description: 'Chek qog\'oz kengligi (58 yoki 80)' })
  @IsOptional()
  @IsInt()
  paperWidth?: 58 | 80;
}
