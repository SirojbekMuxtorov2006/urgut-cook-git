import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Alisher Usmonov', description: 'Mijoz ismi va familiyasi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '+998901234567', description: 'Telefon raqami' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class DebtPaymentDto {
  @ApiProperty({ example: 50000, description: 'To\'lanayotgan qarz summasi (so\'m)' })
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ example: 'Qisman to\'lov qildi', description: 'Izoh' })
  @IsOptional()
  @IsString()
  note?: string;
}
