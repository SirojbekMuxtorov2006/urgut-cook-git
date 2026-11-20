import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MoveOrderDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000503', description: 'Ko\'chiriladigan yangi stol IDsi' })
  @IsString()
  @IsNotEmpty()
  targetTableId: string;
}

export class CancelOrderDto {
  @ApiProperty({ example: '1111', description: 'Admin PIN-kodi (bekor qilish faqat admin tasdig\'i bilan)' })
  @IsString()
  @IsNotEmpty()
  adminPin: string;

  @ApiProperty({ example: 'Mijoz kelishmadi / buyurtmadan voz kechdi', description: 'Bekor qilish sababi' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
