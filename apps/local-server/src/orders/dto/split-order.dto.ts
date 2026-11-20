import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsNumber, Min, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SplitItemDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000601', description: 'Ajratilayotgan OrderItem IDsi' })
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @ApiProperty({ example: 1, description: 'Ajratilayotgan soni' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class SplitOrderDto {
  @ApiPropertyOptional({ example: '019349c2-5500-7000-8000-000000000502', description: 'Yangi ajratilgan hisob uchun stol IDsi (agar stol bo\'sh bo\'lsa yoki xuddi shu stol)' })
  @IsOptional()
  @IsString()
  targetTableId?: string;

  @ApiProperty({ type: [SplitItemDto], description: 'Ajratilayotgan taomlar ro\'yxati' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitItemDto)
  items: SplitItemDto[];
}
