import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Yaroqli refresh token' })
  @IsString({ message: 'Refresh token satr ko\'rinishida bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Refresh token kiritilishi shart' })
  refreshToken: string;
}
