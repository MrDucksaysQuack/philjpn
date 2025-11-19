import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { ExamValidatorService } from './services/exam-validator.service';
import { ExamWorkflowService } from './services/exam-workflow.service';
import { CommonModule } from '../../../common/utils/common.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [ExamController],
  providers: [ExamService, ExamValidatorService, ExamWorkflowService],
  exports: [ExamService, ExamValidatorService, ExamWorkflowService],
})
export class ExamModule {}

