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
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Winston 로거 설정
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Prometheus 메트릭 인터셉터
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));
  
  // 전역 예외 필터 (모든 에러 응답에 CORS 헤더 보장)
  app.useGlobalFilters(new AllExceptionsFilter());
  
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

  // ✅ CORS 설정: 모든 요청 허용 (간단하고 확실한 방법)
  app.enableCors({
    origin: true, // 모든 origin 허용
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-License-Key'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
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
