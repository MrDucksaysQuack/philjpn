import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = appConfig();

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
  if (process.env.NODE_ENV === 'production') {
    const vercelProdDomain = 'https://philjpn.vercel.app';
    if (!allowedOriginsArray.includes(vercelProdDomain)) {
      allowedOriginsArray.push(vercelProdDomain);
    }
  }
  
  // Vercel 도메인 패턴 검증
  const isVercelDomain = (origin: string): boolean => {
    return /^https:\/\/philjpn(-[a-z0-9-]+)?(-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
  };
  
  // ✅ 단일 CORS 미들웨어 (모든 중복 제거)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // 요청 로깅
    console.log(`🔍 [${req.method}] ${req.url} - Origin: ${origin || '(none)'}`);
    
    // 허용된 Origin인지 확인
    const isAllowed = !origin || 
      allowedOriginsArray.includes(origin) ||
      (process.env.NODE_ENV === 'production' && isVercelDomain(origin)) ||
      origin.startsWith('http://localhost:');
    
    if (!isAllowed) {
      console.warn(`❌ CORS 차단: ${origin}`);
      next();
      return;
    }
    
    // OPTIONS 프리플라이트 요청 즉시 처리
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-License-Key');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    
    // 일반 요청에도 CORS 헤더 설정
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
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
