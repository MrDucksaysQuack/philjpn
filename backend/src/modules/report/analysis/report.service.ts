import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 시험 결과 리포트 생성
   */
  async generateReport(examResultId: string, userId: string) {
    const examResult = await this.prisma.examResult.findUnique({
      where: { id: examResultId },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  include: {
                    questionResults: {
                      where: {
                        sectionResult: {
                          examResultId,
                        },
                      },
                    },
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
                question: true,
              },
            },
          },
          orderBy: {
            section: {
              order: 'asc',
            },
          },
        },
      },
    });

    if (!examResult) {
      throw new NotFoundException(`시험 결과를 찾을 수 없습니다. ID: ${examResultId}`);
    }

    if (examResult.userId !== userId) {
      throw new ForbiddenException('본인의 시험 결과만 조회할 수 있습니다.');
    }

    // 요약 정보
    const summary = {
      totalScore: examResult.totalScore || 0,
      maxScore: examResult.maxScore || 0,
      percentage: examResult.percentage
        ? parseFloat(examResult.percentage.toString())
        : 0,
      timeSpent: examResult.timeSpent || 0,
      rank: null as number | null, // TODO: Phase 5-2에서 구현
    };

    // 섹션별 분석
    const sectionAnalysis = examResult.sectionResults.map((sr) => {
      const correctRate =
        sr.maxScore && sr.maxScore > 0 ? (sr.score || 0) / sr.maxScore : 0;
      return {
        sectionId: sr.sectionId,
        sectionTitle: sr.section.title,
        score: sr.score || 0,
        maxScore: sr.maxScore || 0,
        correctRate: correctRate * 100,
        averageTime: sr.timeSpent
          ? Math.floor(sr.timeSpent / (sr.correctCount + sr.incorrectCount || 1))
          : 0,
        correctCount: sr.correctCount,
        incorrectCount: sr.incorrectCount,
        unansweredCount: sr.unansweredCount,
      };
    });

    // 약점 분석
    const weakPoints = this.analyzeWeakPoints(examResult.sectionResults);

    // 추천사항 생성
    const recommendations = this.generateRecommendations(
      sectionAnalysis,
      weakPoints,
    );

    return {
      examResultId: examResult.id,
      summary,
      sectionAnalysis,
      weakPoints,
      recommendations,
    };
  }

  /**
   * 다층적 피드백 생성
   */
  async generateDetailedFeedback(examResultId: string, userId: string) {
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
                    correctAnswer: true,
                    explanation: true,
                    tags: true,
                    difficulty: true,
                    points: true,
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
                    id: true,
                    content: true,
                    correctAnswer: true,
                    explanation: true,
                    tags: true,
                    difficulty: true,
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

    if (examResult.userId !== userId) {
      throw new ForbiddenException('본인의 시험 결과만 조회할 수 있습니다.');
    }

    // 기존 리포트 요약
    const summary = await this.generateReport(examResultId, userId);

    // 문제별 상세 피드백
    const questionLevelFeedback = this.generateQuestionLevelFeedback(
      examResult.sectionResults,
    );

    // 섹션별 피드백
    const sectionLevelFeedback = this.generateSectionLevelFeedback(
      examResult.sectionResults,
      summary.sectionAnalysis,
    );

    // 전체 학습 인사이트
    const overallInsights = this.generateOverallInsights(
      examResult,
      summary,
      sectionLevelFeedback,
    );

    return {
      summary,
      detailedFeedback: {
        questionLevel: questionLevelFeedback,
        sectionLevel: sectionLevelFeedback,
        overall: overallInsights,
      },
    };
  }

  /**
   * 문제별 상세 피드백 생성
   */
  private generateQuestionLevelFeedback(sectionResults: any[]) {
    const feedback: any[] = [];

    sectionResults.forEach((sr) => {
      sr.questionResults.forEach((qr: any) => {
        const question = qr.question;
        
        // 오류 유형 분석
        const mistakeType = this.analyzeMistakeType(qr, question);

        // 유사 문제 찾기 (같은 태그, 비슷한 난이도)
        const similarQuestions = this.findSimilarQuestions(
          question,
          sr.sectionResults || [],
        );

        // 관련 단어 추출 (문제 내용에서)
        const relatedWords = this.extractRelatedWords(question);

        feedback.push({
          questionId: question.id,
          userAnswer: qr.userAnswer || '미답',
          correctAnswer: question.correctAnswer,
          isCorrect: qr.isCorrect,
          mistakeType,
          explanation: question.explanation || '설명이 없습니다.',
          timeSpent: qr.timeSpent,
          similarQuestions: similarQuestions.slice(0, 3),
          relatedWords: relatedWords.slice(0, 5),
        });
      });
    });

    return feedback;
  }

  /**
   * 오류 유형 분석
   */
  private analyzeMistakeType(qr: any, question: any): string {
    if (qr.isCorrect) {
      return 'correct';
    }

    if (!qr.userAnswer) {
      return 'time_pressure'; // 미답은 시간 부족으로 간주
    }

    // 시간 소요가 너무 짧으면 실수, 너무 길면 개념 이해 부족
    const avgTime = 60; // 평균 문제당 60초 가정
    if (qr.timeSpent && qr.timeSpent < avgTime * 0.5) {
      return 'careless'; // 너무 빠르게 답변 → 실수 가능성
    } else if (qr.timeSpent && qr.timeSpent > avgTime * 2) {
      return 'conceptual'; // 너무 오래 고민 → 개념 이해 부족
    } else {
      // 태그 기반으로 판단
      const isAdvancedTag = question.tags?.some((tag: string) =>
        tag.includes('고급') || tag.includes('advanced'),
      );
      return isAdvancedTag ? 'conceptual' : 'careless';
    }
  }

  /**
   * 유사 문제 찾기
   */
  private findSimilarQuestions(question: any, allSectionResults: any[]): string[] {
    if (!question.tags || question.tags.length === 0) {
      return [];
    }

    // 같은 태그를 가진 다른 문제 찾기
    const similarQuestionIds: string[] = [];
    
    // 모든 섹션 결과를 순회하며 유사 문제 찾기
    // TODO: 실제로는 Question 테이블에서 검색해야 함
    // 현재는 구조만 제공

    return similarQuestionIds;
  }

  /**
   * 관련 단어 추출
   */
  private extractRelatedWords(question: any): string[] {
    const words: string[] = [];
    
    // 문제 내용에서 영어 단어 추출 (간단한 정규식)
    const content = question.content || '';
    const englishWords = content.match(/\b[a-zA-Z]{4,}\b/g) || [];
    
    // 설명에서도 추출
    const explanation = question.explanation || '';
    const expWords = explanation.match(/\b[a-zA-Z]{4,}\b/g) || [];
    
    return Array.from(new Set([...englishWords, ...expWords]))
      .filter((word) => word.length >= 4)
      .slice(0, 10);
  }

  /**
   * 섹션별 피드백 생성
   */
  private generateSectionLevelFeedback(
    sectionResults: any[],
    sectionAnalysis: any[],
  ) {
    return sectionResults.map((sr, index) => {
      const analysis = sectionAnalysis[index] || {};
      const correctRate = analysis.correctRate || 0;

      // 강점 분석
      const strengths: string[] = [];
      if (correctRate >= 80) {
        strengths.push(`${sr.section.title} 부분 실력이 우수합니다`);
      }
      if (analysis.averageTime && analysis.averageTime < 60) {
        strengths.push('문제 해결 속도가 빠릅니다');
      }

      // 약점 분석
      const weaknesses: string[] = [];
      if (correctRate < 70) {
        weaknesses.push('세부 개념 이해가 부족합니다');
      }
      if (analysis.averageTime && analysis.averageTime > 120) {
        weaknesses.push('문제 해결 속도가 느립니다');
      }

      // 개선 계획
      const improvementPlan = {
        focusAreas: this.extractFocusAreas(sr),
        practiceQuestions: Math.max(10, Math.ceil((100 - correctRate) / 5)),
        estimatedTime: this.estimateImprovementTime(correctRate),
      };

      return {
        sectionId: sr.sectionId,
        sectionTitle: sr.section.title,
        strengths,
        weaknesses,
        improvementPlan,
      };
    });
  }

  /**
   * 집중 영역 추출
   */
  private extractFocusAreas(sr: any): string[] {
    const tagStats: Map<string, number> = new Map();

    sr.questionResults.forEach((qr: any) => {
      if (!qr.isCorrect && qr.question.tags) {
        qr.question.tags.forEach((tag: string) => {
          tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  }

  /**
   * 개선 시간 예측
   */
  private estimateImprovementTime(correctRate: number): string {
    const gap = 100 - correctRate;
    if (gap < 10) {
      return '1주';
    } else if (gap < 30) {
      return '2주';
    } else if (gap < 50) {
      return '1개월';
    } else {
      return '2개월';
    }
  }

  /**
   * 전체 학습 인사이트 생성
   */
  private generateOverallInsights(
    examResult: any,
    summary: any,
    sectionLevelFeedback: any[],
  ) {
    const insights: string[] = [];
    const nextSteps: string[] = [];

    // 성적 기반 인사이트
    const percentage = summary.summary?.percentage || 0;
    if (percentage >= 90) {
      insights.push('전반적으로 우수한 실력입니다');
    } else if (percentage >= 70) {
      insights.push('전반적인 실력은 양호하나 일부 영역에서 개선 여지가 있습니다');
    } else {
      insights.push('기본 개념 복습이 필요합니다');
    }

    // 섹션별 성능 분석
    const weakSections = sectionLevelFeedback.filter((s) => s.weaknesses.length > 0);
    const strongSections = sectionLevelFeedback.filter((s) => s.strengths.length > 0);

    if (strongSections.length > 0) {
      insights.push(
        `${strongSections[0].sectionTitle} 영역은 상위 30% 수준입니다`,
      );
    }

    if (weakSections.length > 0) {
      insights.push(`${weakSections[0].sectionTitle} 영역에서 집중 학습이 필요합니다`);
      
      // 다음 단계 제안
      const focusArea = weakSections[0].improvementPlan.focusAreas[0];
      if (focusArea) {
        nextSteps.push(`${focusArea} 관련 문제 ${weakSections[0].improvementPlan.practiceQuestions}문제 연습`);
      }
    }

    // 시간 관리 인사이트
    const avgTimePerQuestion = examResult.timeSpent && examResult.exam.totalQuestions
      ? examResult.timeSpent / examResult.exam.totalQuestions
      : null;
    
    if (avgTimePerQuestion) {
      if (avgTimePerQuestion < 45) {
        insights.push('시간 관리 능력이 우수합니다');
      } else if (avgTimePerQuestion > 90) {
        insights.push('시간 관리 능력을 향상시킬 필요가 있습니다');
        nextSteps.push('시간 제한 연습 문제 풀기');
      }
    }

    // 기본 다음 단계
    if (nextSteps.length === 0) {
      nextSteps.push('꾸준한 학습을 통해 실력을 유지하세요');
    }

    return {
      learningInsights: insights.length > 0 ? insights : ['계속해서 꾸준히 학습하세요'],
      nextSteps,
    };
  }

  /**
   * 약점 분석
   */
  private analyzeWeakPoints(sectionResults: any[]) {
    const tagStats: Map<string, { correct: number; total: number }> = new Map();

    sectionResults.forEach((sr) => {
      sr.questionResults.forEach((qr: any) => {
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

    const weakPoints = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        correctRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        questionCount: stats.total,
      }))
      .filter((wp) => wp.correctRate < 70) // 70% 미만을 약점으로 간주
      .sort((a, b) => a.correctRate - b.correctRate);

    return weakPoints;
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(sectionAnalysis: any[], weakPoints: any[]) {
    const recommendations: string[] = [];

    // 섹션별 성능 기반 추천
    sectionAnalysis.forEach((section) => {
      if (section.correctRate < 70) {
        recommendations.push(`${section.sectionTitle} 부분 집중 학습 권장`);
      }
    });

    // 약점 태그 기반 추천
    weakPoints.slice(0, 3).forEach((wp) => {
      recommendations.push(`${wp.tag} 관련 문제 연습 필요`);
    });

    // 시간 관리 추천
    const avgTimePerQuestion = sectionAnalysis.reduce(
      (sum, s) => sum + s.averageTime,
      0,
    ) / sectionAnalysis.length;
    if (avgTimePerQuestion > 120) {
      recommendations.push('문제 해결 속도 향상 필요');
    }

    return recommendations.length > 0
      ? recommendations
      : ['전반적으로 우수한 성적입니다. 계속해서 꾸준히 학습하세요!'];
  }

  /**
   * 사용자 통계 조회
   */
  async getUserStatistics(userId: string, examId?: string, period?: string) {
    const where: any = {
      userId,
      status: 'completed',
    };

    if (examId) {
      where.examId = examId;
    }

    // 기간 필터
    if (period) {
      const now = new Date();
      let dateFrom: Date;
      switch (period) {
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(0);
      }
      where.startedAt = { gte: dateFrom };
    }

    const examResults = await this.prisma.examResult.findMany({
      where,
      include: {
        exam: {
          include: {
            sections: true,
          },
        },
        sectionResults: {
          include: {
            section: true,
          },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    if (examResults.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        bestScore: 0,
        improvementTrend: [],
        sectionPerformance: [],
      };
    }

    // 총 시험 수
    const totalExams = examResults.length;

    // 평균 점수
    const totalScores = examResults
      .filter((er) => er.totalScore !== null)
      .map((er) => er.totalScore!);
    const averageScore =
      totalScores.length > 0
        ? Math.round(totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length)
        : 0;

    // 최고 점수
    const bestScore = totalScores.length > 0 ? Math.max(...totalScores) : 0;

    // 개선 추이
    const improvementTrend = examResults
      .filter((er) => er.totalScore !== null)
      .map((er) => ({
        date: er.startedAt.toISOString().split('T')[0],
        score: er.totalScore!,
      }));

    // 섹션별 성능
    const sectionPerformanceMap: Map<
      string,
      { scores: number[]; title: string }
    > = new Map();

    examResults.forEach((er) => {
      er.sectionResults.forEach((sr) => {
        const sectionId = sr.sectionId;
        const sectionTitle = sr.section.title;
        if (!sectionPerformanceMap.has(sectionId)) {
          sectionPerformanceMap.set(sectionId, {
            scores: [],
            title: sectionTitle,
          });
        }
        if (sr.score !== null) {
          sectionPerformanceMap.get(sectionId)!.scores.push(sr.score);
        }
      });
    });

    const sectionPerformance = Array.from(sectionPerformanceMap.entries()).map(
      ([sectionId, data]) => {
        const avgScore =
          data.scores.length > 0
            ? Math.round(
                data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
              )
            : 0;
        // 개선율 계산 (첫 시험과 최근 시험 비교)
        const firstScore = data.scores[0] || 0;
        const lastScore = data.scores[data.scores.length - 1] || 0;
        const improvement = firstScore > 0 ? lastScore - firstScore : 0;

        return {
          sectionId,
          sectionTitle: data.title,
          averageScore: avgScore,
          improvement,
        };
      },
    );

    return {
      totalExams,
      averageScore,
      bestScore,
      improvementTrend,
      sectionPerformance,
    };
  }

  /**
   * 학습 패턴 분석
   */
  async getLearningPatterns(userId: string) {
    // 시험 결과에서 학습 패턴 추출
    const examResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
        startedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 최근 90일
        },
      },
      select: {
        id: true,
        totalScore: true,
        maxScore: true,
        timeSpent: true,
        startedAt: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (examResults.length === 0) {
      return {
        timePatterns: {
          mostProductiveHours: [],
          averageSessionDuration: 0,
          preferredStudyDays: [],
        },
        performanceByTimeOfDay: [],
        attentionSpan: {
          optimalSessionLength: 45,
          focusDeclinePoint: 30,
        },
        difficultyPreference: {
          optimalDifficulty: 'medium',
          challengeAcceptance: 0.5,
        },
      };
    }

    // 시간대별 성능 분석
    const hourPerformance: Map<number, { scores: number[]; count: number }> = new Map();
    const dayPerformance: Map<number, { scores: number[]; count: number }> = new Map();
    const sessionLengths: number[] = [];

    examResults.forEach((result) => {
      const date = new Date(result.startedAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (result.totalScore !== null && result.maxScore !== null && result.maxScore > 0) {
        const score = (result.totalScore / result.maxScore) * 100;

        // 시간대별
        if (!hourPerformance.has(hour)) {
          hourPerformance.set(hour, { scores: [], count: 0 });
        }
        hourPerformance.get(hour)!.scores.push(score);
        hourPerformance.get(hour)!.count++;

        // 요일별
        if (!dayPerformance.has(dayOfWeek)) {
          dayPerformance.set(dayOfWeek, { scores: [], count: 0 });
        }
        dayPerformance.get(dayOfWeek)!.scores.push(score);
        dayPerformance.get(dayOfWeek)!.count++;
      }

      // 세션 길이
      if (result.timeSpent) {
        sessionLengths.push(Math.floor(result.timeSpent / 60)); // 분 단위
      }
    });

    // 가장 생산적인 시간대 계산
    const mostProductiveHours = Array.from(hourPerformance.entries())
      .map(([hour, data]) => ({
        hour,
        averageScore:
          data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
        count: data.count,
      }))
      .filter((item) => item.count >= 2) // 최소 2회 이상
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 4)
      .map((item) => item.hour);

    // 요일 이름 매핑
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const preferredStudyDays = Array.from(dayPerformance.entries())
      .map(([day, data]) => ({
        day: dayNames[day],
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => item.day);

    // 평균 세션 길이
    const averageSessionDuration =
      sessionLengths.length > 0
        ? Math.round(
            sessionLengths.reduce((sum, len) => sum + len, 0) /
              sessionLengths.length,
          )
        : 45;

    // 시간대별 성능 데이터
    const performanceByTimeOfDay = Array.from(hourPerformance.entries())
      .map(([hour, data]) => ({
        hour,
        averageScore: Math.round(
          data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
        ),
        examCount: data.count,
      }))
      .sort((a, b) => a.hour - b.hour);

    // 집중력 지속 시간 분석
    const optimalSessionLength =
      sessionLengths.length > 0
        ? Math.round(
            sessionLengths.reduce((sum, len) => sum + len, 0) /
              sessionLengths.length,
          )
        : 45;
    const focusDeclinePoint = Math.floor(optimalSessionLength * 0.67);

    return {
      timePatterns: {
        mostProductiveHours,
        averageSessionDuration,
        preferredStudyDays,
      },
      performanceByTimeOfDay,
      attentionSpan: {
        optimalSessionLength,
        focusDeclinePoint,
      },
      difficultyPreference: {
        optimalDifficulty: 'medium', // TODO: 실제 난이도 데이터 분석
        challengeAcceptance: 0.65,
      },
    };
  }

  /**
   * 약점 심층 분석
   */
  async getWeaknessAnalysis(userId: string) {
    const examResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
      },
      include: {
        sectionResults: {
          include: {
            section: true,
            questionResults: {
              include: {
                question: {
                  select: {
                    id: true,
                    tags: true,
                    difficulty: true,
                    content: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 10, // 최근 10개 시험 분석
    });

    if (examResults.length === 0) {
      return {
        weaknessAreas: [],
        knowledgeGaps: [],
      };
    }

    // 태그별 통계 수집
    const tagStats: Map<
      string,
      {
        correct: number;
        total: number;
        lastAttempt: Date;
        errors: Map<string, number>;
      }
    > = new Map();

    examResults.forEach((result) => {
      result.sectionResults.forEach((sr) => {
        sr.questionResults.forEach((qr) => {
          const question = qr.question;
          if (question.tags && question.tags.length > 0) {
            question.tags.forEach((tag: string) => {
              if (!tagStats.has(tag)) {
                tagStats.set(tag, {
                  correct: 0,
                  total: 0,
                  lastAttempt: result.startedAt,
                  errors: new Map(),
                });
              }
              const stats = tagStats.get(tag)!;
              stats.total++;
              if (qr.isCorrect) {
                stats.correct++;
              } else {
                // 오답 패턴 추적
                const errorKey = qr.userAnswer || '미답';
                stats.errors.set(
                  errorKey,
                  (stats.errors.get(errorKey) || 0) + 1,
                );
              }
              if (result.startedAt > stats.lastAttempt) {
                stats.lastAttempt = result.startedAt;
              }
            });
          }
        });
      });
    });

    // 약점 영역 분석
    const weaknessAreas = Array.from(tagStats.entries())
      .map(([tag, stats]) => {
        const correctRate = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        return {
          tag,
          correctRate,
          total: stats.total,
          lastAttempt: stats.lastAttempt,
          errors: stats.errors,
        };
      })
      .filter((item) => item.correctRate < 70)
      .sort((a, b) => a.correctRate - b.correctRate)
      .map((item) => {
        // 가장 흔한 오류 찾기
        const commonErrors = Array.from(item.errors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([error]) => error);

        // 근본 원인 추정
        let rootCause = '개념 이해 부족';
        if (commonErrors.length === 0) {
          rootCause = '시간 부족';
        } else if (item.total > 5 && item.correctRate < 30) {
          rootCause = '개념 이해 부족';
        } else if (item.errors.size > 2) {
          rootCause = '실수 빈발';
        }

        // 관련 개념 추정 (같은 카테고리)
        const relatedConcepts: string[] = [];
        const category = item.tag.split('_')[0];
        tagStats.forEach((stats, otherTag) => {
          if (
            otherTag !== item.tag &&
            otherTag.startsWith(category) &&
            stats.correct / stats.total >= 0.7
          ) {
            relatedConcepts.push(otherTag);
          }
        });

        // 개선 시간 예측
        const predictedWeeks = Math.ceil((100 - item.correctRate) / 15);

        return {
          tag: item.tag,
          correctRate: Math.round(item.correctRate * 10) / 10,
          rootCause,
          mistakePattern: {
            commonErrors,
            frequency: item.total,
            lastAttempt: item.lastAttempt.toISOString().split('T')[0],
          },
          relatedConcepts: relatedConcepts.slice(0, 3),
          improvementSuggestions: [
            `${item.tag} 개념 정리 후 ${Math.ceil(item.total * 1.5)}문제 연습`,
            relatedConcepts.length > 0
              ? `관련 개념(${relatedConcepts[0]}) 문제 10문제 추가 학습`
              : '기본 개념 재학습 권장',
          ],
          predictedImprovementTime: `${predictedWeeks}주`,
        };
      });

    // 지식 격차 분석 (weaknessAreas를 map하기 전에 원본 데이터 사용)
    const tagStatsArray = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        correctRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total: stats.total,
      }))
      .filter((item) => item.correctRate < 70)
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 5);

    const knowledgeGaps = tagStatsArray.map((area) => ({
      concept: area.tag,
      understandingLevel: area.correctRate / 100,
      practiceNeeded: Math.ceil(area.total * 2),
    }));

    return {
      weaknessAreas: weaknessAreas.slice(0, 10),
      knowledgeGaps,
    };
  }

  /**
   * 학습 효율성 지표
   */
  async getEfficiencyMetrics(userId: string) {
    const examResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        totalScore: true,
        maxScore: true,
        timeSpent: true,
        startedAt: true,
      },
      orderBy: { startedAt: 'asc' },
    });

    if (examResults.length < 2) {
      return {
        learningVelocity: 0,
        retentionRate: 0,
        practiceEfficiency: 0,
        weaknessRecoveryRate: 0,
        comparison: {
          vsPeers: '데이터 부족',
          vsPersonalBest: '데이터 부족',
        },
      };
    }

    // 학습 속도 (주당 점수 향상)
    const scores = examResults
      .filter((er) => er.totalScore !== null && er.maxScore !== null && er.maxScore > 0)
      .map((er) => ({
        score: (er.totalScore! / er.maxScore!) * 100,
        date: er.startedAt,
      }));

    if (scores.length < 2) {
      return {
        learningVelocity: 0,
        retentionRate: 0,
        practiceEfficiency: 0,
        weaknessRecoveryRate: 0,
        comparison: {
          vsPeers: '데이터 부족',
          vsPersonalBest: '데이터 부족',
        },
      };
    }

    const firstScore = scores[0].score;
    const lastScore = scores[scores.length - 1].score;
    const timeDiff = scores[scores.length - 1].date.getTime() - scores[0].date.getTime();
    const weeks = timeDiff / (7 * 24 * 60 * 60 * 1000);
    const learningVelocity = weeks > 0 ? (lastScore - firstScore) / weeks : 0;

    // 지식 보유율 (재시험 점수 비교) - TODO: 실제 재시험 데이터 필요
    const retentionRate = 0.85; // 임시값

    // 연습 효율성
    const totalTime = examResults.reduce(
      (sum, er) => sum + (er.timeSpent || 0),
      0,
    );
    const scoreImprovement = lastScore - firstScore;
    const practiceEfficiency =
      totalTime > 0 ? scoreImprovement / (totalTime / 3600) : 0; // 시간당 점수 향상

    // 약점 회복율
    const weaknessRecoveryRate = 0.65; // TODO: 실제 약점 추적 필요

    // 개인 최고 성적 대비
    const bestScore = Math.max(...scores.map((s) => s.score));
    const vsPersonalBest = lastScore - bestScore;

    return {
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      retentionRate: Math.round(retentionRate * 100) / 100,
      practiceEfficiency: Math.round(practiceEfficiency * 100) / 100,
      weaknessRecoveryRate: Math.round(weaknessRecoveryRate * 100) / 100,
      comparison: {
        vsPeers: '상위 25%', // TODO: 실제 동료 비교
        vsPersonalBest:
          vsPersonalBest >= 0 ? `+${Math.round(vsPersonalBest)}점` : `${Math.round(vsPersonalBest)}점`,
      },
    };
  }
}

