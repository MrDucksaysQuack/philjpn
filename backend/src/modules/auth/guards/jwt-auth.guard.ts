import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private tokenBlacklistService?: TokenBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 토큰 추출
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    
    if (token && this.tokenBlacklistService) {
      try {
        // 블랙리스트 확인
        const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
        if (isBlacklisted) {
          throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
      } catch (error: any) {
        // 블랙리스트 체크 실패 시에도 계속 진행 (블랙리스트는 보조 기능)
        // cacheManager가 없을 수 있으므로 에러를 무시하고 기본 JWT 검증 수행
        if (error?.message?.includes('isBlacklisted') || error?.message?.includes('cacheManager')) {
          console.warn('Token blacklist check failed, continuing with JWT validation:', error?.message);
        } else {
          // 다른 에러는 재throw
          throw error;
        }
      }
    }

    // 기본 JWT 검증 수행
    return super.canActivate(context) as Promise<boolean>;
  }
}

