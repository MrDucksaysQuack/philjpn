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
  const corsOrigin = process.env.CORS_ORIGIN || config.corsOrigin || '*';
  
  // CORS 설정 개선: 여러 도메인 지원 및 디버깅 로그
  // Railway에서 환경 변수가 제대로 읽히지 않을 경우를 대비한 fallback
  let allowedOrigins: string[] | boolean;
  
  if (corsOrigin === '*') {
    allowedOrigins = true;
  } else {
    // 쉼표로 구분된 도메인 목록 처리
    const origins = corsOrigin
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    
    // 프로덕션 환경에서는 Vercel 도메인 추가 (안전장치)
    if (process.env.NODE_ENV === 'production') {
      const vercelDomains = [
        'https://philjpn.vercel.app',
        'https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app',
      ];
      vercelDomains.forEach(domain => {
        if (!origins.includes(domain)) {
          origins.push(domain);
        }
      });
    }
    
    allowedOrigins = origins;
  }
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-License-Key'],
  });

  // CORS 설정 로그 (항상 출력하여 디버깅)
  console.log('🔒 CORS 설정:', allowedOrigins === true ? '*' : allowedOrigins);
  console.log('🔍 CORS_ORIGIN 환경 변수:', corsOrigin);

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
