import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/utils/prisma.service';

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
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtSecret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    try {
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
    } catch (error: any) {
      // Prepared statement 에러인 경우 재시도 (UnauthorizedException 제외)
      if (
        !(error instanceof UnauthorizedException) &&
        (error?.code === '42P05' || error?.code === '26000' || error?.code === 'P1017')
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.validate(payload);
      }
      throw error;
    }
  }
}

