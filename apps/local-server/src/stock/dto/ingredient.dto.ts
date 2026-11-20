import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { Unit } from '@prisma/client';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Lazer guruch', description: 'Xomashyo nomi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Unit, example: Unit.KG, description: 'O\'lchov birligi (KG, LITER, PIECE...)' })
  @IsEnum(Unit)
  @IsNotEmpty()
  unit: Unit;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Minimal ogohlantirish qoldig\'i' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minQty?: number;

  @ApiPropertyOptional({ example: 50, default: 0, description: 'Boshlang\'ich qoldiq miqdori' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentQty?: number;

  @ApiPropertyOptional({ example: 24000, default: 0, description: 'O\'rtacha xarid narxi (so\'m)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  avgCost?: number;
}

export class UpdateIngredientDto {
  @ApiPropertyOptional({ example: 'Lazer guruch (Xorazm)', description: 'Xomashyo nomi' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: Unit, example: Unit.KG })
  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minQty?: number;
}
