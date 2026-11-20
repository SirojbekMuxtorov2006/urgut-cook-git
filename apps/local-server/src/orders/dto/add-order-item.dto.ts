import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsArray } from 'class-validator';

export class SelectedModifierDto {
  @ApiProperty({ example: '+ Qazi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  price: number;
}

export class AddOrderItemDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000301', description: 'Taom IDsi' })
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @ApiPropertyOptional({ example: '019349c2-5500-7000-8000-000000000401', description: 'Variant IDsi (masalan 0.5 porsiya)' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ example: 2, default: 1, description: 'Soni / miqdori' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  quantity?: number;

  @ApiPropertyOptional({ type: [SelectedModifierDto], description: 'Tanlangan qo\'shimchalar ro\'yxati' })
  @IsOptional()
  @IsArray()
  selectedModifiers?: SelectedModifierDto[];

  @ApiPropertyOptional({ example: 'Piyozsiz bo\'lsin', description: 'Taomga maxsus izoh' })
  @IsOptional()
  @IsString()
  notes?: string;
}
