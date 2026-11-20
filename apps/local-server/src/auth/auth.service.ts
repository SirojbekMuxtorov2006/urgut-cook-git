import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { generateUUIDv7 } from '@oshxona/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Login + Parol orqali kirish (Admin va mas'ul xodimlar uchun)
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        username: dto.username,
        deletedAt: null,
      },
      include: {
        branch: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Foydalanuvchi hisobi bloklangan');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Ushbu foydalanuvchi uchun parol o\'rnatilmagan (PIN orqali kiring)');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    // Qurilmani yangilash (agar deviceId berilgan bo'lsa)
    if (dto.deviceId) {
      await this.prisma.device.updateMany({
        where: { id: dto.deviceId },
        data: { lastActiveAt: new Date() },
      });
    }

    // Audit log
    await this.logAudit(user.id, user.branchId, 'AUTH_LOGIN', 'Muvaffaqiyatli login parol bilan kirildi', dto.deviceId);

    return this.generateTokens(user, dto.deviceId);
  }

  /**
   * PIN-kod orqali tezkor kirish (Kassirlar va ofitsiantlar uchun)
   */
  async pinLogin(dto: PinLoginDto) {
    let targetUser = null;

    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        include: { branch: true },
      });
      if (user && user.isActive && !user.deletedAt) {
        const isPinValid = await bcrypt.compare(dto.pin, user.pinHash);
        if (isPinValid) {
          targetUser = user;
        }
      }
    } else {
      // Agar userId ko'rsatilmagan bo'lsa, kassa ekranida terilgan PIN bo'yicha qidiriladi
      const activeUsers = await this.prisma.user.findMany({
        where: { isActive: true, deletedAt: null },
        include: { branch: true },
      });

      for (const u of activeUsers) {
        const isMatch = await bcrypt.compare(dto.pin, u.pinHash);
        if (isMatch) {
          targetUser = u;
          break;
        }
      }
    }

    if (!targetUser) {
      throw new UnauthorizedException('PIN-kod noto\'g\'ri yoki bunday xodim topilmadi');
    }

    if (dto.deviceId) {
      await this.prisma.device.updateMany({
        where: { id: dto.deviceId },
        data: { lastActiveAt: new Date() },
      });
    }

    // Audit log
    await this.logAudit(targetUser.id, targetUser.branchId, 'AUTH_PIN_LOGIN', 'Muvaffaqiyatli PIN-kod bilan kassa ochildi', dto.deviceId);

    return this.generateTokens(targetUser, dto.deviceId);
  }

  /**
   * Refresh token orqali yangi access token olish
   */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'oshxona-pos-super-refresh-secret-jwt-key-2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { branch: true },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('Foydalanuvchi topilmadi yoki hisob faol emas');
      }

      return this.generateTokens(user, payload.deviceId);
    } catch (e) {
      throw new UnauthorizedException('Refresh token muddati tugagan yoki yaroqsiz');
    }
  }

  /**
   * Joriy profil ma'lumotlari
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        discountLimit: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  private async generateTokens(user: any, deviceId?: string) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
      deviceId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'oshxona-pos-super-secret-jwt-key-2026-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'oshxona-pos-super-refresh-secret-jwt-key-2026',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        discountLimit: user.discountLimit,
        branchId: user.branchId,
      },
    };
  }

  private async logAudit(userId: string, branchId: string, action: string, message: string, deviceId?: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: generateUUIDv7(),
          branchId,
          userId,
          action,
          entity: 'USER',
          entityId: userId,
          details: { message, timestamp: new Date().toISOString() },
          deviceId,
          version: 1,
        },
      });
    } catch (e) {
      console.error('Audit log yaratishda xato:', e);
    }
  }
}
