import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIAnalysisService } from './services/ai-analysis.service';
import { AIQueueService } from './services/ai-queue.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AIController } from './ai.controller';

@Module({
  imports: [
    HttpModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
  ],
  controllers: [AIController],
  providers: [AIAnalysisService, AIQueueService, OpenAIProvider],
  exports: [AIAnalysisService, AIQueueService, OpenAIProvider],
})
export class AIModule {}

