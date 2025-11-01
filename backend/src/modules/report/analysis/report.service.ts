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
}

