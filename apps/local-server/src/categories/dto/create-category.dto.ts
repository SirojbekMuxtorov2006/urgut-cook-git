import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Birinchi taomlar', description: 'Kategoriya nomi (o\'zbekcha)' })
  @IsString({ message: 'Kategoriya nomi satr bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Kategoriya nomi kiritilishi shart' })
  nameUz: string;

  @ApiPropertyOptional({ example: 'Первые блюда', description: 'Kategoriya nomi (ruscha)' })
  @IsOptional()
  @IsString()
  nameRu?: string;

  @ApiPropertyOptional({ example: 'soup', description: 'Belgi (icon nomi)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#f97316', description: 'Rang kodi (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 1, description: 'Tartib raqami' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'Faollik holati' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
