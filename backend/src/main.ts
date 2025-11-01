import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  const config = appConfig();
  
  // 🔍 CORS_ORIGIN 환경 변수 상세 분석 로그
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 CORS 환경 변수 분석 시작');
  console.log('═══════════════════════════════════════════════════');
  console.log('📌 process.env.CORS_ORIGIN:', process.env.CORS_ORIGIN || '(undefined)');
  console.log('📌 config.corsOrigin:', config.corsOrigin || '(undefined)');
  
  // ✅ 핵심: CORS_ORIGIN을 쉼표로 분리하여 배열로 처리
  // "https://philjpn.vercel.app,https://railway.com" → ["https://philjpn.vercel.app", "https://railway.com"]
  const allowedOriginsArray = process.env.CORS_ORIGIN
    ?.split(',')
    .map(o => o.trim())
    .filter(o => o.length > 0 && o !== 'https://railway.com') // railway.com 자동 필터링
    || config.corsOrigin
      ?.split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0 && o !== 'https://railway.com')
    || [];
  
  console.log('📋 파싱된 도메인 목록:', allowedOriginsArray);
  
  // Vercel 도메인 패턴 검증 함수
  const isVercelDomain = (origin: string): boolean => {
    return /^https:\/\/philjpn(-[a-z0-9-]+)?(-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
  };
  
  // 프로덕션 환경에서는 Vercel 프로덕션 도메인 자동 추가
  if (process.env.NODE_ENV === 'production') {
    const vercelProdDomain = 'https://philjpn.vercel.app';
    if (!allowedOriginsArray.includes(vercelProdDomain)) {
      allowedOriginsArray.push(vercelProdDomain);
      console.log('✅ Vercel 프로덕션 도메인 자동 추가:', vercelProdDomain);
    }
  }
  
  console.log('✅ 최종 허용 도메인 목록:', allowedOriginsArray);
  console.log('═══════════════════════════════════════════════════');
  
  // CORS 설정: origin 함수 사용 (제안된 방식)
  app.enableCors({
    origin: (origin, callback) => {
      // Origin이 없는 경우 (동일 출처 요청, Postman 등)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // 1. 환경 변수에 명시된 도메인 목록 확인
      if (allowedOriginsArray.includes(origin)) {
        callback(null, true);
        return;
      }
      
      // 2. 프로덕션: Vercel 프리뷰 도메인 패턴 자동 허용
      if (process.env.NODE_ENV === 'production' && isVercelDomain(origin)) {
        console.log(`✅ Vercel 프리뷰 도메인 자동 허용: ${origin}`);
        callback(null, true);
        return;
      }
      
      // 3. 개발 환경: localhost 허용
      if (origin.startsWith('http://localhost:')) {
        callback(null, true);
        return;
      }
      
      // 4. 차단된 도메인
      console.warn(`❌ Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-License-Key'],
  });

  // CORS 설정 로그
  console.log('═══════════════════════════════════════════════════');
  console.log('🔒 CORS 설정 완료');
  console.log('═══════════════════════════════════════════════════');
  console.log('🔒 허용된 도메인 목록:', allowedOriginsArray);
  console.log('🔒 프로덕션 모드:', process.env.NODE_ENV === 'production' ? '예 (Vercel 프리뷰 자동 허용)' : '아니오');
  console.log('═══════════════════════════════════════════════════');

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
