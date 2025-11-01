import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 개인 맞춤형 시험 추천
   */
  async getRecommendedExams(userId: string) {
    // 사용자의 최근 시험 결과 분석
    const recentResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
        totalScore: { not: null },
      },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  select: {
                    tags: true,
                    difficulty: true,
                  },
                },
              },
            },
          },
        },
        sectionResults: {
          include: {
            section: true,
            questionResults: {
              include: {
                question: {
                  select: {
                    tags: true,
                    difficulty: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 5, // 최근 5개 분석
    });

    // 사용자의 약점 태그 추출
    const weakTags = this.extractWeakTags(recentResults);
    
    // 사용자의 현재 수준 추정
    const currentLevel = this.estimateUserLevel(recentResults);
    
    // 사용자의 단어장 단어 분석
    const wordbookWords = await this.prisma.wordBook.findMany({
      where: {
        userId,
        masteryLevel: { gte: 50 }, // 숙련도 50% 이상
      },
      select: {
        word: true,
        tags: true,
        masteryLevel: true,
      },
      take: 50,
    });

    // 모든 활성 시험 조회
    const allExams = await this.prisma.exam.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        isPublic: true,
      },
      include: {
        sections: {
          include: {
            questions: {
              select: {
                tags: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    // 시험별 매칭 점수 계산
    const recommendations = allExams.map((exam) => {
      const matchScore = this.calculateMatchScore(exam, {
        weakTags,
        currentLevel,
        wordbookWords,
      });

      // 예상 점수 범위 계산
      const estimatedScoreRange = this.estimateScoreRange(exam, currentLevel);

      // 추천 이유 생성
      const reason = this.generateReason(exam, {
        weakTags,
        matchScore,
        wordbookWords,
      });

      // 학습 목표 생성
      const learningGoals = this.generateLearningGoals(exam, weakTags);

      return {
        examId: exam.id,
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        matchScore: Math.round(matchScore * 100) / 100,
        reason,
        estimatedScoreRange,
        learningGoals,
        difficultyMatch: this.calculateDifficultyMatch(exam, currentLevel),
        challengeLevel: this.determineChallengeLevel(exam, currentLevel),
      };
    })
      .filter((rec) => rec.matchScore > 0.3) // 30% 이상 매칭만
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // 상위 10개

    // 적응형 학습 경로 생성
    const adaptivePath = this.generateAdaptivePath(recommendations, currentLevel);

    return {
      recommendations,
      adaptivePath,
    };
  }

  /**
   * 약점 태그 추출
   */
  private extractWeakTags(examResults: any[]): string[] {
    const tagStats: Map<string, { correct: number; total: number }> = new Map();

    examResults.forEach((result) => {
      result.sectionResults.forEach((sr) => {
        sr.questionResults.forEach((qr) => {
          const question = qr.question;
          if (question.tags && question.tags.length > 0) {
            question.tags.forEach((tag: string) => {
              if (!tagStats.has(tag)) {
                tagStats.set(tag, { correct: 0, total: 0 });
              }
              const stats = tagStats.get(tag)!;
              stats.total++;
              if (qr.isCorrect) {
                stats.correct++;
              }
            });
          }
        });
      });
    });

    // 정답률 70% 미만인 태그를 약점으로 분류
    return Array.from(tagStats.entries())
      .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.7)
      .map(([tag]) => tag);
  }

  /**
   * 사용자 수준 추정
   */
  private estimateUserLevel(examResults: any[]): {
    level: 'beginner' | 'intermediate' | 'advanced';
    averageScore: number;
  } {
    if (examResults.length === 0) {
      return { level: 'beginner', averageScore: 0 };
    }

    const scores = examResults
      .filter((r) => r.totalScore !== null && r.maxScore !== null && r.maxScore > 0)
      .map((r) => (r.totalScore! / r.maxScore!) * 100);

    if (scores.length === 0) {
      return { level: 'beginner', averageScore: 0 };
    }

    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    let level: 'beginner' | 'intermediate' | 'advanced';
    if (averageScore < 60) {
      level = 'beginner';
    } else if (averageScore < 80) {
      level = 'intermediate';
    } else {
      level = 'advanced';
    }

    return { level, averageScore };
  }

  /**
   * 매칭 점수 계산
   */
  private calculateMatchScore(
    exam: any,
    context: {
      weakTags: string[];
      currentLevel: { level: string; averageScore: number };
      wordbookWords: any[];
    },
  ): number {
    let score = 0.5; // 기본 점수

    // 약점 태그 매칭 (40% 가중치)
    const examTags = new Set<string>();
    exam.sections.forEach((section: any) => {
      section.questions.forEach((q: any) => {
        if (q.tags) {
          q.tags.forEach((tag: string) => examTags.add(tag));
        }
      });
    });

    if (context.weakTags.length > 0 && examTags.size > 0) {
      const matchingWeakTags = context.weakTags.filter((tag) =>
        examTags.has(tag),
      ).length;
      const weakTagMatch = matchingWeakTags / Math.max(context.weakTags.length, examTags.size);
      score += weakTagMatch * 0.4;
    }

    // 난이도 매칭 (30% 가중치)
    const difficultyMatch = this.calculateDifficultyMatch(exam, context.currentLevel);
    score += difficultyMatch * 0.3;

    // 단어장 단어 포함율 (20% 가중치)
    if (context.wordbookWords.length > 0) {
      const wordMatch = this.calculateWordMatch(exam, context.wordbookWords);
      score += wordMatch * 0.2;
    }

    // 최근 응시 여부 (10% 가중치, 최근에 본 시험은 낮은 점수)
    // TODO: 실제로는 최근 응시 기록을 확인해야 함

    return Math.min(score, 1.0);
  }

  /**
   * 난이도 매칭 계산
   */
  private calculateDifficultyMatch(
    exam: any,
    currentLevel: { level: string; averageScore: number },
  ): number {
    // 시험의 평균 난이도 계산
    const difficulties: { [key: string]: number } = { easy: 1, medium: 2, hard: 3 };
    let totalDifficulty = 0;
    let questionCount = 0;

    exam.sections.forEach((section: any) => {
      section.questions.forEach((q: any) => {
        if (q.difficulty) {
          totalDifficulty += difficulties[q.difficulty] || 2;
          questionCount++;
        }
      });
    });

    const examDifficulty = questionCount > 0 ? totalDifficulty / questionCount : 2;
    const userLevelScore = currentLevel.averageScore / 33.33; // 0-100을 0-3으로 변환

    // 사용자 수준과 시험 난이도 차이가 작을수록 높은 점수
    const diff = Math.abs(examDifficulty - userLevelScore);
    return Math.max(0, 1 - diff / 2); // 차이가 2 이상이면 0
  }

  /**
   * 단어 매칭 계산
   */
  private calculateWordMatch(exam: any, wordbookWords: any[]): number {
    // TODO: 실제로는 시험 문제 내용에서 단어를 추출해야 함
    // 현재는 단어장 태그와 시험 태그 매칭으로 대체
    const examTags = new Set<string>();
    exam.sections.forEach((section: any) => {
      section.questions.forEach((q: any) => {
        if (q.tags) {
          q.tags.forEach((tag: string) => examTags.add(tag));
        }
      });
    });

    const wordTags = new Set<string>();
    wordbookWords.forEach((word) => {
      if (word.tags) {
        word.tags.forEach((tag: string) => wordTags.add(tag));
      }
    });

    if (wordTags.size === 0 || examTags.size === 0) {
      return 0.5; // 데이터 없으면 중간값
    }

    const matchingTags = Array.from(wordTags).filter((tag) =>
      examTags.has(tag),
    ).length;

    return matchingTags / Math.max(wordTags.size, examTags.size);
  }

  /**
   * 예상 점수 범위 계산
   */
  private estimateScoreRange(
    exam: any,
    currentLevel: { level: string; averageScore: number },
  ): [number, number] {
    const baseScore = currentLevel.averageScore;
    const difficultyMatch = this.calculateDifficultyMatch(exam, currentLevel);

    // 난이도가 잘 맞으면 높은 점수 예상
    const estimated = baseScore * (0.8 + difficultyMatch * 0.2);
    const variance = baseScore * 0.1;

    return [
      Math.max(0, Math.round(estimated - variance)),
      Math.min(100, Math.round(estimated + variance)),
    ];
  }

  /**
   * 추천 이유 생성
   */
  private generateReason(
    exam: any,
    context: {
      weakTags: string[];
      matchScore: number;
      wordbookWords: any[];
    },
  ): string {
    if (context.matchScore > 0.8) {
      return `${context.weakTags.length > 0 ? context.weakTags[0] + ' 부분' : '현재 수준에 맞는'} 집중 연습에 최적`;
    } else if (context.matchScore > 0.6) {
      return '실력 향상을 위한 좋은 연습 문제';
    } else if (context.matchScore > 0.4) {
      return '다양한 영역을 다루는 도전 문제';
    } else {
      return '기초 실력 향상을 위한 문제';
    }
  }

  /**
   * 학습 목표 생성
   */
  private generateLearningGoals(exam: any, weakTags: string[]): string[] {
    const goals: string[] = [];

    if (weakTags.length > 0) {
      goals.push(`${weakTags[0]} 개념 정리`);
      goals.push('실전 감각 향상');
    } else {
      goals.push('전반적 실력 향상');
      goals.push('시간 관리 연습');
    }

    return goals;
  }

  /**
   * 도전도 결정
   */
  private determineChallengeLevel(
    exam: any,
    currentLevel: { level: string; averageScore: number },
  ): 'low' | 'medium' | 'high' {
    const difficultyMatch = this.calculateDifficultyMatch(exam, currentLevel);

    if (difficultyMatch > 0.8) {
      return 'low'; // 수준에 맞음
    } else if (difficultyMatch > 0.5) {
      return 'medium'; // 약간 도전적
    } else {
      return 'high'; // 높은 도전
    }
  }

  /**
   * 적응형 학습 경로 생성
   */
  private generateAdaptivePath(
    recommendations: any[],
    currentLevel: { level: string; averageScore: number },
  ): {
    currentLevel: string;
    nextMilestone: string;
    recommendedSequence: Array<{
      examId: string;
      order: number;
      estimatedWeek: number;
    }>;
  } {
    const nextMilestone =
      currentLevel.level === 'beginner'
        ? 'intermediate'
        : currentLevel.level === 'intermediate'
          ? 'advanced'
          : 'expert';

    const recommendedSequence = recommendations
      .slice(0, 5)
      .map((rec, index) => ({
        examId: rec.examId,
        order: index + 1,
        estimatedWeek: index + 1,
      }));

    return {
      currentLevel: currentLevel.level,
      nextMilestone,
      recommendedSequence,
    };
  }

  /**
   * 단어장 기반 시험 추천
   */
  async getExamsByWordbook(userId: string) {
    // 사용자의 단어장 단어 조회
    const words = await this.prisma.wordBook.findMany({
      where: {
        userId,
        masteryLevel: { gte: 40 }, // 숙련도 40% 이상
      },
      select: {
        word: true,
        tags: true,
        masteryLevel: true,
      },
    });

    if (words.length === 0) {
      return { recommendedExams: [] };
    }

    // 단어 태그 추출
    const wordTags = new Set<string>();
    words.forEach((word) => {
      if (word.tags) {
        word.tags.forEach((tag: string) => wordTags.add(tag));
      }
    });

    // 모든 활성 시험 조회
    const allExams = await this.prisma.exam.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        isPublic: true,
      },
      include: {
        sections: {
          include: {
            questions: {
              select: {
                tags: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    // 단어장 단어 포함율 계산
    const recommendedExams = allExams
      .map((exam) => {
        const examTags = new Set<string>();
        exam.sections.forEach((section: any) => {
          section.questions.forEach((q: any) => {
            if (q.tags) {
              q.tags.forEach((tag: string) => examTags.add(tag));
            }
          });
        });

        const matchingTags = Array.from(wordTags).filter((tag) =>
          examTags.has(tag),
        );
        const wordCoverage = wordTags.size > 0 ? matchingTags.length / wordTags.size : 0;

        // 평균 숙련도 계산
        const matchingWords = words.filter((word) => {
          if (!word.tags) return false;
          return word.tags.some((tag) => examTags.has(tag));
        });
        const averageMastery =
          matchingWords.length > 0
            ? matchingWords.reduce((sum, w) => sum + w.masteryLevel, 0) /
              matchingWords.length
            : 0;

        return {
          examId: exam.id,
          title: exam.title,
          wordCoverage: Math.round(wordCoverage * 100) / 100,
          wordsInExam: matchingWords.slice(0, 10).map((w) => w.word),
          masteryMatch: Math.round((averageMastery / 100) * 100) / 100,
        };
      })
      .filter((exam) => exam.wordCoverage > 0.3) // 30% 이상 포함
      .sort((a, b) => b.wordCoverage - a.wordCoverage)
      .slice(0, 10);

    return { recommendedExams };
  }
}

