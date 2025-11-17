import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/utils/prisma.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtSecret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    try {
      return await this.prisma.executeWithRetry(async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) {
          throw new UnauthorizedException('사용자를 찾을 수 없거나 비활성화된 계정입니다.');
        }

        return user;
      });
    } catch (error: any) {
      // UnauthorizedException은 그대로 전달 (재시도하지 않음)
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // 그 외 에러도 그대로 전달 (executeWithRetry에서 이미 처리됨)
      throw error;
    }
  }
}

