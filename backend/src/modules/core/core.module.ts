import { Module } from '@nestjs/common';
import { ExamModule } from './exam/exam.module';
import { SectionModule } from './section/section.module';
import { QuestionModule } from './question/question.module';
import { SessionModule } from './session/session.module';
import { ResultModule } from './result/result.module';

@Module({
  imports: [ExamModule, SectionModule, QuestionModule, SessionModule, ResultModule],
  exports: [ExamModule, SectionModule, QuestionModule, SessionModule, ResultModule],
})
export class CoreModule {}

