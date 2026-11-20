import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class PinLoginDto {
  @ApiProperty({ example: '1234', description: '4 xonali PIN-kod' })
  @IsString({ message: 'PIN satr ko\'rinishida bo\'lishi kerak' })
  @IsNotEmpty({ message: 'PIN kiritilishi shart' })
  @Length(4, 6, { message: 'PIN 4 dan 6 xonagacha bo\'lishi kerak' })
  pin: string;

  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000011', required: false, description: 'Foydalanuvchi IDsi (agar kassa ekranida kassir avval tanlangan bo\'lsa)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'DEV-MAIN-POS-01', required: false, description: 'Qurilma IDsi' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
