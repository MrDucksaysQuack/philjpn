import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private tokenBlacklistService: TokenBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 토큰 추출
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    
    if (token) {
      // 블랙리스트 확인
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
    }

    // 기본 JWT 검증 수행
    return super.canActivate(context) as Promise<boolean>;
  }
}

