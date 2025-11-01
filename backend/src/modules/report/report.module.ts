import { Module } from '@nestjs/common';
import { ReportService } from './analysis/report.service';
import { ReportController } from './report.controller';
import { GoalService } from './services/goal.service';
import { RecommendationService } from './services/recommendation.service';
import { LearningCycleService } from './services/learning-cycle.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, GoalService, RecommendationService, LearningCycleService],
  exports: [ReportService, GoalService, RecommendationService, LearningCycleService],
})
export class ReportModule {}

