import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsEnum, IsBoolean, Min } from 'class-validator';
import { Unit } from '@prisma/client';

export class CreateMenuItemDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000101', description: 'Kategoriya IDsi' })
  @IsString({ message: 'Kategoriya IDsi kiritilishi shart' })
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Choyxona Oshi', description: 'Taom nomi (o\'zbekcha)' })
  @IsString({ message: 'Taom nomi satr bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Taom nomi kiritilishi shart' })
  nameUz: string;

  @ApiPropertyOptional({ example: 'Чайханский плов', description: 'Taom nomi (ruscha)' })
  @IsOptional()
  @IsString()
  nameRu?: string;

  @ApiPropertyOptional({ example: 'https://example.com/osh.jpg', description: 'Rasm URL manzili' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 38000, description: 'Sotuv narxi (so\'m, tiyinsiz)' })
  @IsInt({ message: 'Narx butun son (so\'m) bo\'lishi kerak' })
  @Min(0, { message: 'Narx noldan kam bo\'lishi mumkin emas' })
  price: number;

  @ApiPropertyOptional({ example: 23000, description: 'Tannarx (so\'m, tiyinsiz)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ enum: Unit, default: Unit.PORTION, description: 'O\'lchov birligi' })
  @IsOptional()
  @IsEnum(Unit, { message: 'Noto\'g\'ri birlik turi (PORTION, KG, PIECE, LITER, BOTTLE, CUP)' })
  unit?: Unit;

  @ApiPropertyOptional({ example: 'KITCHEN_HOT', description: 'Oshxona bo\'limi / stansiyasi' })
  @IsOptional()
  @IsString()
  kitchenStationId?: string;

  @ApiPropertyOptional({ example: true, description: 'Sotuvda mavjudligi ("tugadi" belgisi)' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
