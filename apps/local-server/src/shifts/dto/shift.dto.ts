import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { CashMovementType } from '@prisma/client';

export class OpenShiftDto {
  @ApiProperty({ example: 200000, description: 'Smena ochilishidagi boshlang\'ich naqd pul (mayda pullar)' })
  @IsInt()
  @Min(0)
  startCash: number;

  @ApiPropertyOptional({ example: 'Ertalabki smena ochildi', description: 'Izoh' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: 1450000, description: 'Kassada sanab chiqilgan haqiqiy naqd pul' })
  @IsInt()
  @Min(0)
  endCashActual: number;

  @ApiPropertyOptional({ example: 'Smena yakunlandi, pul inkassatsiyaga berildi', description: 'Izoh' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCashMovementDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000901', description: 'Smena IDsi' })
  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @ApiProperty({
    enum: CashMovementType,
    example: CashMovementType.EXPENSE,
    description: 'Harakat turi (INFLOW, OUTFLOW, EXPENSE, COLLECTION)',
  })
  @IsEnum(CashMovementType)
  @IsNotEmpty()
  type: CashMovementType;

  @ApiProperty({ example: 35000, description: 'Summa (so\'m)' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Ko\'katlar va non uchun do\'konga berildi', description: 'Sababi' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
