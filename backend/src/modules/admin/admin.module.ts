import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from '../../common/utils/common.module';
import { ReportModule } from '../report/report.module';
import { AdminService } from './services/admin.service';
import { TemplateService } from './services/template.service';
import { QuestionPoolService } from './services/question-pool.service';
import { QuestionBankService } from './services/question-bank.service';
import { QuestionStatisticsService } from './services/question-statistics.service';
import { ContentLinkingService } from './services/content-linking.service';
import { SectionDifficultyBalancerService } from './services/section-difficulty-balancer.service';
import { SiteSettingsService } from './services/site-settings.service';
import { ColorAnalysisService } from './services/color-analysis.service';
import { ContentVersionService } from './services/content-version.service';
import { AdminController } from './admin.controller';
import { SiteSettingsController } from './controllers/site-settings.controller';
import { SettingsGateway } from './gateway/settings.gateway';

@Module({
  imports: [HttpModule, CommonModule, ReportModule],
  controllers: [AdminController, SiteSettingsController],
  providers: [
    AdminService,
    TemplateService,
    QuestionPoolService,
    QuestionBankService,
    QuestionStatisticsService,
    ContentLinkingService,
    SectionDifficultyBalancerService,
    SiteSettingsService,
    ColorAnalysisService,
    ContentVersionService,
    SettingsGateway,
  ],
  exports: [
    AdminService,
    TemplateService,
    QuestionPoolService,
    QuestionBankService,
    QuestionStatisticsService,
    ContentLinkingService,
    SectionDifficultyBalancerService,
    SiteSettingsService,
    ColorAnalysisService,
    ContentVersionService,
  ],
})
export class AdminModule {}

