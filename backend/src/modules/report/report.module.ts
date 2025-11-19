import { Module } from '@nestjs/common';
import { ReportService } from './analysis/report.service';
import { ReportController } from './report.controller';
import { GoalService } from './services/goal.service';
import { RecommendationService } from './services/recommendation.service';
import { LearningCycleService } from './services/learning-cycle.service';
import { BadgeService } from './services/badge.service';
import { BadgeEventListener } from './listeners/badge-event.listener';
import { BadgeNotificationGateway } from './gateway/badge-notification.gateway';

@Module({
  controllers: [ReportController],
  providers: [
    ReportService,
    GoalService,
    RecommendationService,
    LearningCycleService,
    BadgeService,
    BadgeEventListener, // 배지 이벤트 리스너 등록
    BadgeNotificationGateway, // 배지 알림 Gateway 등록
  ],
  exports: [ReportService, GoalService, RecommendationService, LearningCycleService, BadgeService],
})
export class ReportModule {}

