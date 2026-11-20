import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({ example: '0.5 porsiya', description: 'Variant nomi (o\'zbekcha)' })
  @IsString()
  @IsNotEmpty()
  nameUz: string;

  @ApiPropertyOptional({ example: '0.5 порции', description: 'Variant nomi (ruscha)' })
  @IsOptional()
  @IsString()
  nameRu?: string;

  @ApiProperty({ example: 22000, description: 'Ushbu variant narxi (so\'m)' })
  @IsInt()
  @Min(0)
  price: number;
}
