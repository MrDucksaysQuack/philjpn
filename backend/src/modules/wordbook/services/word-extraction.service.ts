import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

@Injectable()
export class WordExtractionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 시험 결과에서 단어 추출
   */
  async extractWordsFromResult(examResultId: string, userId: string) {
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
                    explanation: true,
                    options: true,
                    tags: true,
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
                    explanation: true,
                    options: true,
                    tags: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!examResult) {
      throw new Error('시험 결과를 찾을 수 없습니다.');
    }

    if (examResult.userId !== userId) {
      throw new Error('본인의 시험 결과만 사용할 수 있습니다.');
    }

    // 오답 문제에서 단어 추출
    const suggestedWords: Array<{
      word: string;
      meaning: string;
      context: string;
      difficulty: 'easy' | 'medium' | 'hard';
      source: string;
      sourceId: string;
      reason: string;
      questionId: string;
    }> = [];

    examResult.sectionResults.forEach((sr) => {
      sr.questionResults.forEach((qr) => {
        // 오답이거나 미답인 경우만
        if (!qr.isCorrect) {
          const question = qr.question;
          
          // 문제 내용에서 영어 단어 추출 (간단한 정규식)
          const words = this.extractEnglishWords(question.content || '');
          
          // 선택지에서도 단어 추출
          if (question.options) {
            const options = question.options as any;
            if (Array.isArray(options)) {
              options.forEach((opt: any) => {
                const optWords = this.extractEnglishWords(
                  typeof opt === 'string' ? opt : opt.text || '',
                );
                words.push(...optWords);
              });
            }
          }

          // 설명에서도 단어 추출
          if (question.explanation) {
            const expWords = this.extractEnglishWords(question.explanation);
            words.push(...expWords);
          }

          // 중복 제거 및 필터링
          const uniqueWords = Array.from(new Set(words))
            .filter((word) => word.length >= 4) // 4자 이상만
            .filter((word) => /^[a-zA-Z]+$/.test(word)) // 영어만
            .slice(0, 5); // 최대 5개

          uniqueWords.forEach((word) => {
            // 이미 단어장에 있는지 확인
            // TODO: 실제로는 확인해야 하지만 성능을 위해 일단 건너뛰기

            suggestedWords.push({
              word: word.toLowerCase(),
              meaning: this.generateMeaning(word, question), // TODO: 실제 의미 추출
              context: this.extractContext(word, question.content || ''),
              difficulty: this.determineDifficulty(word, question),
              source: 'exam_result',
              sourceId: examResultId,
              reason: qr.isCorrect === false ? '오답 문제에서 출현, 이해 부족 의심' : '미답 문제에서 출현',
              questionId: question.id,
            });
          });
        }
      });
    });

    // 중복 제거 (같은 단어는 한 번만)
    const uniqueSuggestedWords = Array.from(
      new Map(suggestedWords.map((w) => [w.word, w])).values(),
    );

    return {
      suggestedWords: uniqueSuggestedWords.slice(0, 20), // 최대 20개
      oneClickAdd: true,
      examResultId,
    };
  }

  /**
   * 텍스트에서 영어 단어 추출
   */
  private extractEnglishWords(text: string): string[] {
    // 간단한 영어 단어 추출 정규식
    const words = text.match(/\b[a-zA-Z]{4,}\b/g) || [];
    return words;
  }

  /**
   * 의미 생성 (TODO: 실제로는 사전 API 사용)
   */
  private generateMeaning(word: string, question: any): string {
    // 현재는 플레이스홀더
    // TODO: 사전 API 연동 또는 문제 설명에서 추출
    return `[${word}]의 의미를 확인하세요`;
  }

  /**
   * 문맥 추출
   */
  private extractContext(word: string, content: string): string {
    const index = content.toLowerCase().indexOf(word.toLowerCase());
    if (index === -1) return content.substring(0, 100);

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + word.length + 50);
    return content.substring(start, end);
  }

  /**
   * 난이도 결정
   */
  private determineDifficulty(
    word: string,
    question: any,
  ): 'easy' | 'medium' | 'hard' {
    // 단어 길이와 문제 난이도 기반
    if (word.length > 10 || question.tags?.includes('고급')) {
      return 'hard';
    } else if (word.length > 7 || question.tags?.includes('중급')) {
      return 'medium';
    } else {
      return 'easy';
    }
  }

  /**
   * 추출된 단어를 일괄 추가
   */
  async addExtractedWords(
    userId: string,
    words: Array<{
      word: string;
      meaning: string;
      context?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      source?: string;
      sourceId?: string;
      tags?: string[];
    }>,
  ) {
    const createdWords = await Promise.all(
      words.map((wordData) =>
        this.prisma.wordBook.create({
          data: {
            userId,
            word: wordData.word,
            meaning: wordData.meaning,
            example: wordData.context,
            difficulty: wordData.difficulty || 'medium',
            source: wordData.source || 'manual',
            sourceId: wordData.sourceId,
            sourceExamResultId: wordData.sourceId,
            extractedAt: new Date(),
            tags: wordData.tags || [],
            masteryLevel: 0,
          },
        }),
      ),
    );

    return {
      message: `${createdWords.length}개의 단어가 추가되었습니다.`,
      words: createdWords,
    };
  }
}

