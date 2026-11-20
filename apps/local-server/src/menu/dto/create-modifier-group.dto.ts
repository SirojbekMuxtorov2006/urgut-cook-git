import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateModifierGroupDto {
  @ApiProperty({ example: 'Qo\'shimchalar', description: 'Modifier guruhi nomi' })
  @IsString()
  @IsNotEmpty()
  nameUz: string;

  @ApiPropertyOptional({ example: 'Добавки', description: 'Guruh nomi (ruscha)' })
  @IsOptional()
  @IsString()
  nameRu?: string;

  @ApiPropertyOptional({ example: 0, description: 'Minimal tanlov soni' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @ApiPropertyOptional({ example: 3, description: 'Maksimal tanlov soni' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number;
}
