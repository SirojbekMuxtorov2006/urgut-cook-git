import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: '1111', description: 'Admin 4 xonali PIN kodi' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  adminPin: string;

  @ApiProperty({ example: 'Mijoz buyurtmani rad etdi', description: 'Bekor qilish sababi' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
