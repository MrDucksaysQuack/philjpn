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
   * 약점 진단 (시험 결과 분석)
   */
  async diagnoseWeakness(examResultId: string): Promise<any> {
    if (!this.openAIProvider.isAIAvailable()) {
      throw new BadRequestException('AI 분석 기능이 활성화되지 않았습니다.');
    }

    const examResult = await this.prisma.examResult.findUnique({
      where: { id: examResultId },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  select: {
                    id: true,
                    content: true,
                    tags: true,
                    difficulty: true,
                    questionType: true,
                  },
                },
              },
            },
          },
        },
        sectionResults: {
          include: {
            questionResults: {
              include: {
                question: {
                  select: {
                    id: true,
                    content: true,
                    tags: true,
                    difficulty: true,
                    questionType: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!examResult) {
      throw new NotFoundException(`시험 결과를 찾을 수 없습니다. ID: ${examResultId}`);
    }

    // 성취도 데이터 수집
    const performanceData = examResult.sectionResults.flatMap((sr) =>
      sr.questionResults.map((qr) => ({
        questionId: qr.question.id,
        question: qr.question.content.substring(0, 100), // 처음 100자만
        tags: qr.question.tags,
        difficulty: qr.question.difficulty,
        questionType: qr.question.questionType,
        isCorrect: qr.isCorrect,
        userAnswer: qr.userAnswer,
      })),
    );

    // 태그별 통계
    const tagStats: { [key: string]: { correct: number; total: number } } = {};
    const difficultyStats: { [key: string]: { correct: number; total: number } } = {};

    performanceData.forEach((data) => {
      // 태그별 통계
      data.tags.forEach((tag: string) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { correct: 0, total: 0 };
        }
        tagStats[tag].total++;
        if (data.isCorrect) {
          tagStats[tag].correct++;
        }
      });

      // 난이도별 통계
      const difficulty = data.difficulty || 'medium';
      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { correct: 0, total: 0 };
      }
      difficultyStats[difficulty].total++;
      if (data.isCorrect) {
        difficultyStats[difficulty].correct++;
      }
    });

    const prompt = this.buildWeaknessDiagnosisPrompt(
      examResult.exam.title,
      performanceData,
      tagStats,
      difficultyStats,
    );

    try {
      const analysis = await this.openAIProvider.generateText(prompt, {
        maxTokens: 1500,
        temperature: 0.7,
      });

      return {
        weaknesses: this.parseWeaknesses(analysis, tagStats),
        recommendations: this.parseRecommendations(analysis),
        detailedAnalysis: analysis,
        tagStats,
        difficultyStats,
      };
    } catch (error) {
      this.logger.error(`약점 진단 실패 (Exam Result ID: ${examResultId})`, error);
      throw error;
    }
  }

  /**
   * 약점 진단 프롬프트 구성
   */
  private buildWeaknessDiagnosisPrompt(
    examTitle: string,
    performanceData: any[],
    tagStats: any,
    difficultyStats: any,
  ): string {
    const totalQuestions = performanceData.length;
    const correctCount = performanceData.filter((d) => d.isCorrect).length;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // 약점 태그 추출 (정답률 50% 미만)
    const weakTags = Object.entries(tagStats)
      .filter(([_, stats]: [string, any]) => stats.total > 0 && (stats.correct / stats.total) * 100 < 50)
      .map(([tag, _]) => tag);

    return `
다음 시험 결과를 분석하여 학습자의 약점을 진단하고 개선 방안을 제시해주세요.

**시험 정보:**
- 시험명: ${examTitle}
- 총 문제 수: ${totalQuestions}
- 정답 수: ${correctCount}
- 정답률: ${accuracy.toFixed(1)}%

**태그별 성취도:**
${Object.entries(tagStats)
  .map(([tag, stats]: [string, any]) => {
    const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0';
    return `- ${tag}: ${stats.correct}/${stats.total} (${accuracy}%)`;
  })
  .join('\n')}

**난이도별 성취도:**
${Object.entries(difficultyStats)
  .map(([difficulty, stats]: [string, any]) => {
    const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0';
    return `- ${difficulty}: ${stats.correct}/${stats.total} (${accuracy}%)`;
  })
  .join('\n')}

${weakTags.length > 0 ? `**주요 약점 영역:** ${weakTags.join(', ')}` : ''}

**분석 요청:**
다음 형식으로 응답해주세요:

1. **주요 약점 영역 (태그별)**
   - 각 태그별로 구체적인 약점 설명
   - 왜 이 영역에서 실수했는지 분석

2. **난이도별 성취도 분석**
   - 쉬운/중간/어려운 문제에서의 성취도 차이
   - 어떤 난이도에서 가장 어려워하는지

3. **개선 방안 제안**
   - 약점 영역별 구체적인 학습 방법
   - 추천 학습 자료나 연습 방법
   - 단기/장기 학습 계획 제안

**중요:**
- 한국어로 작성
- 구체적이고 실행 가능한 제안
- 긍정적이고 격려하는 톤
- 교육적이고 도움이 되는 내용
`;
  }

  /**
   * 약점 파싱 (AI 응답에서 약점 추출)
   */
  private parseWeaknesses(analysis: string, tagStats: any): string[] {
    // AI 응답에서 약점 태그 추출
    const weaknesses: string[] = [];

    // 태그별 정답률이 50% 미만인 것들을 약점으로 추가
    Object.entries(tagStats).forEach(([tag, stats]: [string, any]) => {
      if (stats.total > 0) {
        const accuracy = (stats.correct / stats.total) * 100;
        if (accuracy < 50) {
          weaknesses.push(tag);
        }
      }
    });

    return weaknesses;
  }

  /**
   * 추천사항 파싱 (AI 응답에서 추천 추출)
   */
  private parseRecommendations(analysis: string): string[] {
    // AI 응답을 줄바꿈으로 분리하여 추천사항 추출
    const recommendations: string[] = [];
    const lines = analysis.split('\n');

    let inRecommendations = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('개선 방안') || trimmed.includes('추천')) {
        inRecommendations = true;
        continue;
      }
      if (inRecommendations && trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
        recommendations.push(trimmed.replace(/^[-•\d.]+\s*/, ''));
      }
    }

    // 추천사항이 없으면 전체 분석을 하나의 추천으로 추가
    if (recommendations.length === 0) {
      recommendations.push(analysis.substring(0, 500)); // 처음 500자만
    }

    return recommendations.slice(0, 10); // 최대 10개
  }

  /**
   * AI 기능 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.openAIProvider.isAIAvailable();
  }
}

