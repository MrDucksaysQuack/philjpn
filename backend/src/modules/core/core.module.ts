import { Module } from '@nestjs/common';
import { ExamModule } from './exam/exam.module';
import { SectionModule } from './section/section.module';
import { QuestionModule } from './question/question.module';
import { SessionModule } from './session/session.module';
import { ResultModule } from './result/result.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [ExamModule, SectionModule, QuestionModule, SessionModule, ResultModule, CategoryModule],
  exports: [ExamModule, SectionModule, QuestionModule, SessionModule, ResultModule, CategoryModule],
})
export class CoreModule {}

