import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly openai: OpenAI | null = null;
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const enabled = this.configService.get<string>('AI_ANALYSIS_ENABLED', 'false') === 'true';

    this.isEnabled = enabled && !!apiKey;

    if (this.isEnabled && apiKey) {
      try {
        this.openai = new OpenAI({
          apiKey,
        });
        this.logger.log(`OpenAI Provider 초기화 완료 (Model: ${model})`);
      } catch (error) {
        this.logger.error('OpenAI Provider 초기화 실패', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn('OpenAI API Key가 설정되지 않았거나 AI 분석이 비활성화되어 있습니다.');
    }
  }

  /**
   * 텍스트 생성 (GPT API 호출)
   */
  async generateText(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    if (!this.isEnabled || !this.openai) {
      throw new BadRequestException('AI 분석 기능이 활성화되지 않았습니다. OPENAI_API_KEY를 설정해주세요.');
    }

    const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const maxTokens = options?.maxTokens || 1000;
    const temperature = options?.temperature || 0.7;

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful educational assistant that provides clear, concise explanations in Korean.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('AI 응답을 생성할 수 없습니다.');
      }

      return content;
    } catch (error: any) {
      this.logger.error('OpenAI API 호출 실패', error);
      throw new BadRequestException(`AI 분석 실패: ${error.message || '알 수 없는 오류'}`);
    }
  }

  /**
   * AI 기능 활성화 여부 확인
   */
  isAIAvailable(): boolean {
    return this.isEnabled;
  }
}

