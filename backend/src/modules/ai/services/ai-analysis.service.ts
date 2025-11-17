import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { OpenAIProvider } from '../providers/openai.provider';

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private openAIProvider: OpenAIProvider,
  ) {}

  /**
   * 문제별 맞춤형 해설 생성
   */
  async generateExplanation(
    questionId: string,
    userAnswer: string,
    isCorrect: boolean,
  ): Promise<string> {
    if (!this.openAIProvider.isAIAvailable()) {
      throw new BadRequestException('AI 분석 기능이 활성화되지 않았습니다.');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        section: {
          include: {
            exam: {
              select: {
                title: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${questionId}`);
    }

    const prompt = this.buildExplanationPrompt(question, userAnswer, isCorrect);

    try {
      const explanation = await this.openAIProvider.generateText(prompt, {
        maxTokens: 500,
        temperature: 0.7,
      });

      return explanation;
    } catch (error) {
      this.logger.error(`해설 생성 실패 (Question ID: ${questionId})`, error);
      throw error;
    }
  }

  /**
   * 해설 생성 프롬프트 구성
   */
  private buildExplanationPrompt(question: any, userAnswer: string, isCorrect: boolean): string {
    const options = question.options ? JSON.stringify(question.options) : '없음';
    const subject = question.section?.exam?.subject || '일반';

    return `
다음 ${subject} 시험 문제에 대한 맞춤형 해설을 생성해주세요.

**문제:**
${question.content}

**선택지:**
${options}

**정답:**
${question.correctAnswer}

**사용자 답안:**
${userAnswer}

**정답 여부:**
${isCorrect ? '✅ 정답' : '❌ 오답'}

${isCorrect
  ? `사용자가 정답을 맞췄으므로, 왜 이 답이 정답인지 명확하고 이해하기 쉽게 설명해주세요. 
     - 정답의 핵심 개념 설명
     - 왜 다른 선택지가 틀렸는지 간단히 언급
     - 관련된 추가 학습 팁 (선택사항)`
  : `사용자가 오답을 선택했으므로, 다음을 포함하여 설명해주세요:
     - 사용자가 선택한 답이 왜 틀렸는지
     - 정답이 왜 맞는지
     - 핵심 개념 설명
     - 비슷한 실수를 방지하는 방법`}

**중요:**
- 한국어로 작성
- 명확하고 이해하기 쉽게
- 교육적이고 도움이 되는 내용
- 불필요한 장문은 피하고 핵심만 전달
`;
  }

  /**
   * AI 기능 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.openAIProvider.isAIAvailable();
  }
}

