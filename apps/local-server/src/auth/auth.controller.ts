import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth - Kirish va Identifikatsiya')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin / Xodim login va parol orqali tizimga kirishi' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli kirildi, tokenlar qaytariladi' })
  @ApiResponse({ status: 401, description: 'Login yoki parol xato' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('pin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kassirlar uchun 4 xonali PIN-kod bilan tezkor kassa ochish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli kirildi' })
  @ApiResponse({ status: 401, description: 'PIN-kod xato' })
  async pinLogin(@Body() dto: PinLoginDto) {
    return this.authService.pinLogin(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access tokenni refresh token orqali yangilash' })
  @ApiResponse({ status: 200, description: 'Yangi access token berildi' })
  @ApiResponse({ status: 401, description: 'Refresh token eskirgan yoki yaroqsiz' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy tizimga kirgan foydalanuvchi ma\'lumotlari' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi ma\'lumotlari' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
