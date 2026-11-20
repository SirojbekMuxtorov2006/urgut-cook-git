import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, IsString, IsOptional } from 'class-validator';

export class UpdatePriceDto {
  @ApiProperty({ example: 42000, description: 'Yangi sotuv narxi (so\'m)' })
  @IsInt({ message: 'Narx butun son bo\'lishi kerak' })
  @Min(0, { message: 'Narx noldan kam bo\'lishi mumkin emas' })
  newPrice: number;

  @ApiPropertyOptional({ example: 'Go\'sht narxi qimmatlashganligi sababli', description: 'Narx o\'zgarish sababi' })
  @IsOptional()
  @IsString()
  reason?: string;
}
