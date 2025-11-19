import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/utils/prisma.module';
import { CommonModule } from './common/utils/common.module';
import { CoreModule } from './modules/core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { LicenseModule } from './modules/license/license.module';
import { ReportModule } from './modules/report/report.module';
import { WordBookModule } from './modules/wordbook/wordbook.module';
import { AdminModule } from './modules/admin/admin.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { AIModule } from './modules/ai/ai.module';
import { ContactModule } from './modules/contact/contact.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { loggerConfig } from './common/config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot(loggerConfig),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1분
        limit: 100, // 100회 요청
      },
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // 현재는 메모리 캐시 사용
        // Redis를 사용하려면 cache-manager-redis-yet 또는 @nestjs/cache-manager-redis-store 사용 필요
        return {
          ttl: 3600, // 기본 TTL 1시간
          max: 1000, // 최대 1000개 항목
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
    CommonModule,
    PrismaModule,
    AuthModule, // Phase 3: 인증
    LicenseModule, // Phase 4: License Key System
    ReportModule, // Phase 5: 리포트 & 학습 피드백
    WordBookModule, // Phase 5: 단어장
    AdminModule, // Phase 7: Admin Panel
    MonitoringModule, // Phase 8: 실시간 모니터링
    AIModule, // Phase 9: AI 분석 통합
    CoreModule, // Phase 1-2: Core Engine
    ContactModule, // 연락처 폼
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
