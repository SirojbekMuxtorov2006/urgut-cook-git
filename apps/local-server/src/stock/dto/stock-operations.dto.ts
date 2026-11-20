import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StockInDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000201', description: 'Xomashyo IDsi' })
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @ApiPropertyOptional({ example: '019349c2-5500-7000-8000-000000000250', description: 'Yetkazib beruvchi IDsi' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ example: 50, description: 'Kirim miqdori (kg/l/dona)' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 25000, description: '1 birlik xarid narxi (so\'m)' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Chorsu bozoridan xarid qilindi', description: 'Izoh / faktura raqami' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class StockWasteDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000203', description: 'Xomashyo IDsi' })
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @ApiProperty({ example: 2.5, description: 'Isrof miqdori' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 'Buzilgan / yaroqsiz holga kelgan sabzilar tashlandi', description: 'Isrof sababi' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class InventoryItemDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000201', description: 'Xomashyo IDsi' })
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @ApiProperty({ example: 48.5, description: 'Omborda amalda sanalgan haqiqiy miqdor' })
  @IsNumber()
  @Min(0)
  actualQty: number;

  @ApiPropertyOptional({ example: 'Oylik inventarizatsiya natijasi', description: 'Izoh' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class StockInventoryDto {
  @ApiProperty({ type: [InventoryItemDto], description: 'Sanalgan xomashyolar ro\'yxati' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  items: InventoryItemDto[];
}

export class CreateSupplierDto {
  @ApiProperty({ example: 'Shavkat Aka (Go\'shtchi)', description: 'Yetkazib beruvchi ismi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '+998901234567', description: 'Telefon' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Chorsu Go\'sht Savdo MCHJ', description: 'Kompaniya / do\'kon nomi' })
  @IsOptional()
  @IsString()
  company?: string;
}

export class RecipeItemInputDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000201', description: 'Xomashyo IDsi' })
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @ApiProperty({ example: 0.15, description: '1 porsiya uchun sarf miqdori (masalan 150g = 0.15 kg)' })
  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000301', description: 'Taom IDsi' })
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @ApiPropertyOptional({ example: 'Choyxona oshi 1 porsiya texnologik kartasi', description: 'Tavsif' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [RecipeItemInputDto], description: 'Retsept tarkibiy xomashyolari' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemInputDto)
  items: RecipeItemInputDto[];
}
