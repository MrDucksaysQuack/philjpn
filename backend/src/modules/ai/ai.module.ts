import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AIAnalysisService } from './services/ai-analysis.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AIController } from './ai.controller';

@Module({
  imports: [HttpModule],
  controllers: [AIController],
  providers: [AIAnalysisService, OpenAIProvider],
  exports: [AIAnalysisService, OpenAIProvider],
})
export class AIModule {}

