import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ example: '1111', description: 'Admin PIN-kodi (qaytarish faqat admin tasdig\'i bilan)' })
  @IsString()
  @IsNotEmpty()
  adminPin: string;

  @ApiProperty({ example: 'Mijoz taom sifatidan norozi bo\'ldi / adashib to\'landi', description: 'Qaytarish sababi' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
