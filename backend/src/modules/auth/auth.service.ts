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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      if (!jwtSecret || jwtSecret === 'default-secret') {
        console.error('❌ JWT_SECRET이 설정되지 않았습니다.');
        console.error('Current JWT_SECRET:', jwtSecret);
        throw new BadRequestException('서버 설정 오류가 발생했습니다.');
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
        console.error('Prisma error code:', (error as any).code);
        throw new BadRequestException('데이터베이스 연결 오류가 발생했습니다.');
      }
      
      throw new BadRequestException('로그인 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(refreshToken: string) {
    try {
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

