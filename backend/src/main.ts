import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { join } from 'path';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './common/services/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Winston 로거 설정
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Prometheus 메트릭 인터셉터
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));
  
  // 정적 파일 서빙 설정 (업로드된 파일 접근)
  // public/uploads 폴더를 /uploads 경로로 서빙
  const uploadsPath = join(process.cwd(), 'public', 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  
  // 이미지와 오디오 서브폴더도 서빙
  const imagesPath = join(process.cwd(), 'public', 'uploads', 'images');
  app.useStaticAssets(imagesPath, {
    prefix: '/uploads/images',
  });
  
  const audioPath = join(process.cwd(), 'public', 'uploads', 'audio');
  app.useStaticAssets(audioPath, {
    prefix: '/uploads/audio',
  });

  const config = appConfig();
  
  // 🔍 DATABASE_URL 확인 (환경 변수 로드 확인용)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    // 비밀번호는 보안을 위해 숨김
    const safeDbUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log('🔍 DATABASE_URL 확인:', safeDbUrl);
    console.log('🔍 DATABASE_URL 포트:', dbUrl.match(/:(6543|5432)\//)?.[1] || '알 수 없음');
    console.log('🔍 DATABASE_URL 호스트:', dbUrl.match(/@([^:]+)/)?.[1] || '알 수 없음');
  } else {
    console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다!');
  }

  // ✅ CORS 허용 도메인 파싱 (중복 제거)
  const rawCorsOrigin = process.env.CORS_ORIGIN || '';
  let allowedOriginsArray: string[] = [];
  
  if (rawCorsOrigin.trim().length > 0) {
    allowedOriginsArray = rawCorsOrigin
      .split(',')
      .map(o => o.trim())
      .filter(o => {
        if (o === 'https://railway.com' || o === 'railway.com') {
          return false;
        }
        return o.length > 0;
      });
  }
  
  // 프로덕션: Vercel 도메인 자동 추가
  const vercelProdDomain = 'https://philjpn.vercel.app';
  if (!allowedOriginsArray.includes(vercelProdDomain)) {
    allowedOriginsArray.push(vercelProdDomain);
  }
  
  // Vercel 도메인 패턴 검증 (모든 Vercel 프리뷰 및 프로덕션 도메인 포함)
  const isVercelDomain = (origin: string): boolean => {
    // philjpn.vercel.app 또는 philjpn-xxx-yyy.vercel.app 형식 모두 허용
    return /^https:\/\/philjpn(-[a-z0-9-]+)*\.vercel\.app$/.test(origin);
  };
  
  // ✅ CORS 미들웨어: 모든 응답에 헤더 강제 설정
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // 요청 로깅
    console.log(`🔍 [${req.method}] ${req.url} - Origin: ${origin || '(none)'}`);
    
    // 허용된 Origin인지 확인
    const isAllowed = !origin || 
      allowedOriginsArray.includes(origin) ||
      isVercelDomain(origin) ||
      origin.startsWith('http://localhost:');
    
    // OPTIONS 프리플라이트 요청 즉시 처리
    if (req.method === 'OPTIONS') {
      if (isAllowed && origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-License-Key');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
        console.log(`✅ OPTIONS CORS 헤더 설정: ${origin}`);
        return res.status(200).end();
      } else {
        console.warn(`❌ OPTIONS CORS 차단: ${origin}`);
        return res.status(403).end();
      }
    }
    
    // 허용되지 않은 Origin인 경우 차단
    if (origin && !isAllowed) {
      console.warn(`❌ CORS 차단: ${origin}`);
      return res.status(403).json({ 
        message: 'CORS policy: Origin not allowed',
        origin 
      });
    }
    
    // 일반 요청에도 CORS 헤더 즉시 설정
    if (origin && isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      console.log(`✅ CORS 헤더 설정: ${origin}`);
    }
    
    // 응답 전송 전 최종 확인 (요청 abort 방지)
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      // 응답 전송 직전 CORS 헤더 재확인
      if (origin && isAllowed && !res.getHeader('Access-Control-Allow-Origin')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        console.log(`✅ 응답 전송 전 CORS 헤더 재설정: ${origin}`);
      }
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  });

  // Global validation pipe (더 상세한 에러 메시지)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        console.error('❌ Validation error:', JSON.stringify(errors, null, 2));
        return new BadRequestException({
          message: '입력값 검증에 실패했습니다.',
          errors: errors.map(err => ({
            property: err.property,
            constraints: err.constraints,
          })),
        });
      },
    }),
  );

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Exam Platform API')
    .setDescription('시험 플랫폼 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(config.port);
  console.log(`🚀 Application is running on: http://localhost:${config.port}`);
  console.log(`📚 Swagger docs: http://localhost:${config.port}/api-docs`);
}
bootstrap();
