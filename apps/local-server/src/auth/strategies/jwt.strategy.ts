import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayloadInternal {
  sub: string;
  username?: string;
  role: string;
  branchId: string;
  deviceId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'oshxona-pos-super-secret-jwt-key-2026-production',
    });
  }

  async validate(payload: JwtPayloadInternal) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi yoki faolsizlantirilgan');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
      discountLimit: user.discountLimit,
      deviceId: payload.deviceId,
    };
  }
}
