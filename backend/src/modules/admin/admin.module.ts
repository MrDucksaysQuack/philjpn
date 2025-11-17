import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from '../../common/utils/common.module';
import { ReportModule } from '../report/report.module';
import { AdminService } from './services/admin.service';
import { TemplateService } from './services/template.service';
import { QuestionPoolService } from './services/question-pool.service';
import { QuestionBankService } from './services/question-bank.service';
import { SiteSettingsService } from './services/site-settings.service';
import { ColorAnalysisService } from './services/color-analysis.service';
import { AdminController } from './admin.controller';
import { SiteSettingsController } from './controllers/site-settings.controller';

@Module({
  imports: [HttpModule, CommonModule, ReportModule],
  controllers: [AdminController, SiteSettingsController],
  providers: [
    AdminService,
    TemplateService,
    QuestionPoolService,
    QuestionBankService,
    SiteSettingsService,
    ColorAnalysisService,
  ],
  exports: [
    AdminService,
    TemplateService,
    QuestionPoolService,
    QuestionBankService,
    SiteSettingsService,
    ColorAnalysisService,
  ],
})
export class AdminModule {}

