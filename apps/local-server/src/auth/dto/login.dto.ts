import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Foydalanuvchi logini' })
  @IsString({ message: 'Login satr ko\'rinishida bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Login kiritilishi shart' })
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Parol' })
  @IsString({ message: 'Parol satr ko\'rinishida bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  @MinLength(6, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
  password: string;

  @ApiProperty({ example: 'DEV-MAIN-POS-01', required: false, description: 'Qurilma IDsi' })
  deviceId?: string;
}
