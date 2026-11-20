import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export class ApplyDiscountDto {
  @ApiPropertyOptional({ example: 10, description: 'Chegirma foizi (masalan 10%)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percent?: number;

  @ApiPropertyOptional({ example: 15000, description: 'Chegirma aniq summasi (so\'m)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: 'Doimiy mijoz uchun', description: 'Chegirma sababi' })
  @IsOptional()
  @IsString()
  reason?: string;
}
