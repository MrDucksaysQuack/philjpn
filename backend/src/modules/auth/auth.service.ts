import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/utils/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * 회원가입
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    // 이메일 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'user',
        isActive: true,
        isEmailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * 로그인
   */
  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // 사용자 조회
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 계정 활성화 확인
      if (!user.isActive) {
        throw new UnauthorizedException('비활성화된 계정입니다.');
      }

      // 마지막 로그인 시간 업데이트
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // JWT 토큰 생성
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

        // JWT_SECRET 확인 (app.config.ts에서 로드됨)
      const jwtSecret = this.configService.get<string>('app.jwtSecret') || 
                        this.configService.get<string>('JWT_SECRET');
      
      console.log('🔍 JWT_SECRET check:', {
        'app.jwtSecret': this.configService.get<string>('app.jwtSecret'),
        'JWT_SECRET (direct)': this.configService.get<string>('JWT_SECRET'),
        'final jwtSecret': jwtSecret ? `${jwtSecret.substring(0, 5)}...` : 'null',
      });
      
      if (!jwtSecret || jwtSecret === 'default-secret') {
        console.error('❌ JWT_SECRET이 설정되지 않았습니다.');
        console.error('Current JWT_SECRET:', jwtSecret);
        throw new BadRequestException({
          message: '서버 설정 오류가 발생했습니다.',
          code: 'JWT_SECRET_MISSING',
        });
      }

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d' as any,
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      // 이미 NestJS 예외면 그대로 전달
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      
      // 예상치 못한 에러 로깅
      console.error('❌ Login error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Prisma 에러인 경우
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any;
        console.error('Prisma error code:', prismaError.code);
        console.error('Prisma error message:', prismaError.message);
        throw new BadRequestException({
          message: '데이터베이스 연결 오류가 발생했습니다.',
          code: 'DATABASE_ERROR',
          prismaCode: prismaError.code,
        });
      }
      
      throw new BadRequestException({
        message: '로그인 처리 중 오류가 발생했습니다.',
        code: 'LOGIN_ERROR',
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(refreshToken: string) {
    try {
      // 블랙리스트 확인
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      // 사용자 확인
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 새 토큰 생성
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d' as any,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  /**
   * 로그아웃 (토큰 블랙리스트에 추가)
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Access Token 블랙리스트에 추가
      // JWT의 만료 시간을 확인하여 그만큼 블랙리스트에 유지
      const accessTokenPayload = this.jwtService.decode(accessToken) as JwtPayload & { exp?: number };
      const accessTokenExpiresIn = accessTokenPayload.exp 
        ? Math.max(0, accessTokenPayload.exp - Math.floor(Date.now() / 1000))
        : 3600; // 기본 1시간

      await this.tokenBlacklistService.addToBlacklist(accessToken, accessTokenExpiresIn);

      // Refresh Token도 블랙리스트에 추가
      if (refreshToken) {
        const refreshTokenPayload = this.jwtService.decode(refreshToken) as JwtPayload & { exp?: number };
        const refreshTokenExpiresIn = refreshTokenPayload.exp
          ? Math.max(0, refreshTokenPayload.exp - Math.floor(Date.now() / 1000))
          : 7 * 24 * 60 * 60; // 기본 7일

        await this.tokenBlacklistService.addToBlacklist(refreshToken, refreshTokenExpiresIn);
      }
    } catch (error) {
      // 토큰 파싱 실패 시에도 블랙리스트에 추가 (안전을 위해)
      await this.tokenBlacklistService.addToBlacklist(accessToken, 3600);
      if (refreshToken) {
        await this.tokenBlacklistService.addToBlacklist(refreshToken, 7 * 24 * 60 * 60);
      }
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        profileImage: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  /**
   * 비밀번호 검증 (내부 사용)
   */
  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 비밀번호 해시 생성 (내부 사용)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

