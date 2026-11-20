import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateModifierDto {
  @ApiProperty({ example: '+ Qazi (ot go\'shti)', description: 'Qo\'shimcha nomi' })
  @IsString()
  @IsNotEmpty()
  nameUz: string;

  @ApiPropertyOptional({ example: '+ Казы', description: 'Qo\'shimcha nomi (ruscha)' })
  @IsOptional()
  @IsString()
  nameRu?: string;

  @ApiProperty({ example: 12000, description: 'Qo\'shimcha narxi (0 bo\'lsa bepul)' })
  @IsInt()
  @Min(0)
  price: number;
}
