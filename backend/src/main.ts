import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🚨 CORS 미들웨어를 가장 먼저 설정 (Railway가 덮어쓰는 것 방지)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log(`🔍 [${req.method}] ${req.url} - Origin: ${origin || '(none)'}`);
    
    // OPTIONS 프리플라이트 요청 즉시 처리
    if (req.method === 'OPTIONS') {
      console.log('🔍 OPTIONS 프리플라이트 요청 처리');
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-License-Key');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(200);
    }
    
    // 일반 요청에도 CORS 헤더 추가
    if (origin && (
      origin === 'https://philjpn.vercel.app' ||
      origin.startsWith('https://philjpn-') && origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:')
    )) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      console.log(`✅ CORS 헤더 추가: ${origin}`);
    }
    
    next();
  });

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
  
  // 🔍 CORS_ORIGIN 환경 변수 상세 분석 로그 (본질 원인 파악용)
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 CORS 환경 변수 본질 분석');
  console.log('═══════════════════════════════════════════════════');
  console.log('📌 process.env.CORS_ORIGIN (타입):', typeof process.env.CORS_ORIGIN);
  console.log('📌 process.env.CORS_ORIGIN (값):', JSON.stringify(process.env.CORS_ORIGIN));
  console.log('📌 process.env.CORS_ORIGIN (길이):', process.env.CORS_ORIGIN?.length || 0);
  console.log('📌 config.corsOrigin:', JSON.stringify(config.corsOrigin));
  console.log('📌 process.env.NODE_ENV:', process.env.NODE_ENV);
  
  // ✅ 핵심: 환경 변수에서 직접 읽기 (app.config 우회)
  // Railway에서 CORS_ORIGIN이 제대로 설정되었는지 확인
  const rawCorsOrigin = process.env.CORS_ORIGIN;
  console.log('📌 원본 CORS_ORIGIN 값:', JSON.stringify(rawCorsOrigin));
  
  // 빈 문자열이나 undefined 처리
  let allowedOriginsArray: string[] = [];
  
  if (rawCorsOrigin && rawCorsOrigin.trim().length > 0) {
    allowedOriginsArray = rawCorsOrigin
      .split(',')
      .map(o => o.trim())
      .filter(o => {
        // railway.com 완전히 제거
        if (o === 'https://railway.com' || o === 'railway.com') {
          console.log('⚠️  제거됨:', o);
          return false;
        }
        return o.length > 0;
      });
  }
  
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
  
  // CORS 설정: 함수 방식 (프리플라이트 요청도 처리)
  app.enableCors({
    origin: (origin, callback) => {
      // 로그 출력
      console.log(`🔍 CORS 검증 - Origin: ${origin || '(none)'}`);
      console.log(`🔍 허용 목록:`, allowedOriginsArray);
      
      // Origin이 없는 경우 (동일 출처 요청, Postman 등)
      if (!origin) {
        console.log('✅ Origin 없음 - 허용');
        callback(null, true);
        return;
      }
      
      // 1. 허용 목록 확인
      if (allowedOriginsArray.includes(origin)) {
        console.log(`✅ 허용 목록에 있음 - 허용: ${origin}`);
        callback(null, true);
        return;
      }
      
      // 2. 프로덕션: Vercel 프리뷰 도메인 패턴 자동 허용
      if (process.env.NODE_ENV === 'production' && isVercelDomain(origin)) {
        console.log(`✅ Vercel 프리뷰 도메인 패턴 매칭 - 허용: ${origin}`);
        callback(null, true);
        return;
      }
      
      // 3. 개발 환경: localhost 허용
      if (origin.startsWith('http://localhost:')) {
        console.log(`✅ Localhost - 허용: ${origin}`);
        callback(null, true);
        return;
      }
      
      // 4. 차단
      console.warn(`❌ 차단됨: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-License-Key'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
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
