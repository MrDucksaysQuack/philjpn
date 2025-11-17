import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/utils/prisma.module';
import { CoreModule } from './modules/core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { LicenseModule } from './modules/license/license.module';
import { ReportModule } from './modules/report/report.module';
import { WordBookModule } from './modules/wordbook/wordbook.module';
import { AdminModule } from './modules/admin/admin.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { AIModule } from './modules/ai/ai.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule, // Phase 3: 인증
    LicenseModule, // Phase 4: License Key System
    ReportModule, // Phase 5: 리포트 & 학습 피드백
    WordBookModule, // Phase 5: 단어장
    AdminModule, // Phase 7: Admin Panel
    MonitoringModule, // Phase 8: 실시간 모니터링
    AIModule, // Phase 9: AI 분석 통합
    CoreModule, // Phase 1-2: Core Engine
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
