import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { PermissionService } from './services/permission.service';
import { CommonModule } from '../../common/utils/common.module';

// 환경 변수 기반으로 조건부 providers 생성
function getOAuthProviders(): any[] {
  const providers: any[] = [];
  
  // 환경 변수 확인 (process.env 직접 사용)
  const hasGoogleConfig = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  const hasFacebookConfig = !!(
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_SECRET
  );

  // 환경 변수가 있을 때만 Strategy 추가
  if (hasGoogleConfig) {
    providers.push(GoogleStrategy);
  }
  
  if (hasFacebookConfig) {
    providers.push(FacebookStrategy);
  }

  return providers;
}

@Module({
  imports: [
    CommonModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('app.jwtSecret') || 'default-secret';
        const jwtExpiresIn = configService.get<string>('app.jwtExpiresIn') || '1h';
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: jwtExpiresIn,
          },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ...getOAuthProviders(), // 조건부 OAuth providers
    JwtAuthGuard,
    RolesGuard,
    TokenBlacklistService,
    PermissionService,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, TokenBlacklistService, PermissionService],
})
export class AuthModule {}
