import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { TemplateService } from './services/template.service';
import { QuestionPoolService } from './services/question-pool.service';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  providers: [AdminService, TemplateService, QuestionPoolService],
  exports: [AdminService, TemplateService, QuestionPoolService],
})
export class AdminModule {}

