import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { Difficulty } from '../../../common/types';

export interface SectionDifficultyAnalysis {
  sectionId: string;
  sectionTitle: string;
  order: number;
  totalQuestions: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
    unknown: number;
  };
  averageDifficulty: number; // 0.0 (easy) ~ 1.0 (hard)
  difficultyScore: number; // 계산된 난이도 점수
}

export interface ExamDifficultyAnalysis {
  examId: string;
  examTitle: string;
  totalSections: number;
  totalQuestions: number;
  overallAverageDifficulty: number;
  sections: SectionDifficultyAnalysis[];
  imbalanceIssues: Array<{
    type: 'high_variance' | 'extreme_section' | 'uneven_distribution';
    severity: 'low' | 'medium' | 'high';
    message: string;
    sectionId?: string;
    details?: any;
  }>;
}

export interface BalanceRecommendation {
  sectionId: string;
  sectionTitle: string;
  currentDifficulty: number;
  targetDifficulty: number;
  recommendations: Array<{
    action: 'move_question' | 'replace_question' | 'add_question' | 'remove_question';
    questionId?: string;
    questionContent?: string;
    fromSectionId?: string;
    toSectionId?: string;
    reason: string;
  }>;
}

@Injectable()
export class SectionDifficultyBalancerService {
  private readonly logger = new Logger(SectionDifficultyBalancerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 시험의 섹션 난이도 분석
   */
  async analyzeExamDifficulty(examId: string): Promise<ExamDifficultyAnalysis> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                statistics: {
                  select: {
                    calculatedDifficulty: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    const sections: SectionDifficultyAnalysis[] = exam.sections.map((section) => {
      const questionsWithTypedDifficulty = section.questions.map(q => ({
        difficulty: q.difficulty as Difficulty | null,
        statistics: q.statistics ? {
          calculatedDifficulty: q.statistics.calculatedDifficulty ? Number(q.statistics.calculatedDifficulty) : null,
        } : null,
      }));
      const distribution = this.calculateDifficultyDistribution(questionsWithTypedDifficulty);
      const averageDifficulty = this.calculateAverageDifficulty(questionsWithTypedDifficulty);
      const difficultyScore = this.calculateDifficultyScore(distribution, averageDifficulty);

      return {
        sectionId: section.id,
        sectionTitle: section.title,
        order: section.order,
        totalQuestions: section.questions.length,
        difficultyDistribution: distribution,
        averageDifficulty,
        difficultyScore,
      };
    });

    const overallAverageDifficulty =
      sections.reduce((sum, s) => sum + s.averageDifficulty, 0) / sections.length || 0;

    const imbalanceIssues = this.detectImbalanceIssues(sections, overallAverageDifficulty);

    return {
      examId: exam.id,
      examTitle: exam.title,
      totalSections: sections.length,
      totalQuestions: sections.reduce((sum, s) => sum + s.totalQuestions, 0),
      overallAverageDifficulty,
      sections,
      imbalanceIssues,
    };
  }

  /**
   * 섹션 난이도 분포 계산
   */
  private calculateDifficultyDistribution(questions: Array<{ difficulty: Difficulty | null }>) {
    const distribution = {
      easy: 0,
      medium: 0,
      hard: 0,
      unknown: 0,
    };

    questions.forEach((q) => {
      if (!q.difficulty) {
        distribution.unknown++;
      } else if (q.difficulty === 'easy') {
        distribution.easy++;
      } else if (q.difficulty === 'medium') {
        distribution.medium++;
      } else if (q.difficulty === 'hard') {
        distribution.hard++;
      }
    });

    return distribution;
  }

  /**
   * 섹션 평균 난이도 계산
   * 통계 데이터의 calculatedDifficulty를 우선 사용, 없으면 difficulty 필드 사용
   */
  private calculateAverageDifficulty(
    questions: Array<{
      difficulty: Difficulty | null;
      statistics?: { calculatedDifficulty: number | null } | null;
    }>,
  ): number {
    if (questions.length === 0) return 0.5; // 기본값

    let totalDifficulty = 0;
    let count = 0;

    questions.forEach((q) => {
      // 통계 데이터의 calculatedDifficulty 우선 사용
      if (q.statistics?.calculatedDifficulty !== null && q.statistics?.calculatedDifficulty !== undefined) {
        totalDifficulty += Number(q.statistics.calculatedDifficulty);
        count++;
      } else if (q.difficulty) {
        // difficulty 필드 사용
        const difficultyValue = q.difficulty === 'easy' ? 0.33 : q.difficulty === 'medium' ? 0.66 : 1.0;
        totalDifficulty += difficultyValue;
        count++;
      }
    });

    return count > 0 ? totalDifficulty / count : 0.5;
  }

  /**
   * 섹션 난이도 점수 계산 (0.0 ~ 1.0)
   */
  private calculateDifficultyScore(
    distribution: { easy: number; medium: number; hard: number; unknown: number },
    averageDifficulty: number,
  ): number {
    const total = distribution.easy + distribution.medium + distribution.hard + distribution.unknown;
    if (total === 0) return 0.5;

    // 가중 평균 계산
    const weightedScore =
      (distribution.easy * 0.33 + distribution.medium * 0.66 + distribution.hard * 1.0) / total;

    // 평균 난이도와 분포 점수의 평균
    return (weightedScore + averageDifficulty) / 2;
  }

  /**
   * 불균형 이슈 감지
   */
  private detectImbalanceIssues(
    sections: SectionDifficultyAnalysis[],
    overallAverage: number,
  ): ExamDifficultyAnalysis['imbalanceIssues'] {
    const issues: ExamDifficultyAnalysis['imbalanceIssues'] = [];

    if (sections.length === 0) return issues;

    // 1. 섹션 간 난이도 분산이 큰 경우
    const difficulties = sections.map((s) => s.difficultyScore);
    const variance = this.calculateVariance(difficulties);
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation > 0.3) {
      issues.push({
        type: 'high_variance',
        severity: standardDeviation > 0.5 ? 'high' : standardDeviation > 0.4 ? 'medium' : 'low',
        message: `섹션 간 난이도 분산이 큽니다 (표준편차: ${standardDeviation.toFixed(2)})`,
        details: { standardDeviation, variance },
      });
    }

    // 2. 극단적인 난이도를 가진 섹션
    sections.forEach((section) => {
      const deviation = Math.abs(section.difficultyScore - overallAverage);
      if (deviation > 0.4) {
        issues.push({
          type: 'extreme_section',
          severity: deviation > 0.6 ? 'high' : 'medium',
          sectionId: section.sectionId,
          message: `"${section.sectionTitle}" 섹션이 전체 평균과 크게 벗어납니다 (차이: ${deviation.toFixed(2)})`,
          details: {
            sectionDifficulty: section.difficultyScore,
            overallAverage,
            deviation,
          },
        });
      }
    });

    // 3. 불균등한 난이도 분포
    sections.forEach((section) => {
      const total = section.difficultyDistribution.easy + section.difficultyDistribution.medium + section.difficultyDistribution.hard;
      if (total === 0) return;

      const easyRatio = section.difficultyDistribution.easy / total;
      const mediumRatio = section.difficultyDistribution.medium / total;
      const hardRatio = section.difficultyDistribution.hard / total;

      // 한 난이도에 80% 이상 집중된 경우
      if (easyRatio > 0.8 || hardRatio > 0.8) {
        issues.push({
          type: 'uneven_distribution',
          severity: easyRatio > 0.9 || hardRatio > 0.9 ? 'high' : 'medium',
          sectionId: section.sectionId,
          message: `"${section.sectionTitle}" 섹션의 난이도 분포가 불균등합니다`,
          details: {
            easyRatio,
            mediumRatio,
            hardRatio,
            distribution: section.difficultyDistribution,
          },
        });
      }
    });

    return issues;
  }

  /**
   * 분산 계산
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * 난이도 균형 조정 제안 생성
   */
  async generateBalanceRecommendations(examId: string): Promise<BalanceRecommendation[]> {
    const analysis = await this.analyzeExamDifficulty(examId);
    const recommendations: BalanceRecommendation[] = [];

    if (analysis.sections.length === 0) return recommendations;

    const targetDifficulty = analysis.overallAverageDifficulty;

    for (const section of analysis.sections) {
      const deviation = section.difficultyScore - targetDifficulty;
      const sectionRecommendations: BalanceRecommendation['recommendations'] = [];

      // 난이도가 너무 높은 섹션 (쉬운 문제 추가 또는 어려운 문제 제거)
      if (deviation > 0.2) {
        // 쉬운 문제 추가 제안
        sectionRecommendations.push({
          action: 'add_question',
          reason: `섹션 난이도가 높습니다. 쉬운 문제를 추가하여 난이도를 낮추세요.`,
        });

        // 어려운 문제를 다른 섹션으로 이동 제안
        const hardQuestions = await this.getQuestionsByDifficulty(examId, section.sectionId, 'hard' as Difficulty);
        if (hardQuestions.length > 0) {
          const easierSections = analysis.sections.filter(
            (s) => s.sectionId !== section.sectionId && s.difficultyScore < targetDifficulty - 0.1,
          );
          if (easierSections.length > 0) {
            sectionRecommendations.push({
              action: 'move_question',
              questionId: hardQuestions[0].id,
              questionContent: hardQuestions[0].content.substring(0, 50) + '...',
              fromSectionId: section.sectionId,
              toSectionId: easierSections[0].sectionId,
              reason: `어려운 문제를 더 쉬운 섹션으로 이동하여 균형을 맞추세요.`,
            });
          }
        }
      }

      // 난이도가 너무 낮은 섹션 (어려운 문제 추가 또는 쉬운 문제 제거)
      if (deviation < -0.2) {
        // 어려운 문제 추가 제안
        sectionRecommendations.push({
          action: 'add_question',
          reason: `섹션 난이도가 낮습니다. 어려운 문제를 추가하여 난이도를 높이세요.`,
        });

        // 쉬운 문제를 다른 섹션으로 이동 제안
        const easyQuestions = await this.getQuestionsByDifficulty(examId, section.sectionId, 'easy' as Difficulty);
        if (easyQuestions.length > 0) {
          const harderSections = analysis.sections.filter(
            (s) => s.sectionId !== section.sectionId && s.difficultyScore > targetDifficulty + 0.1,
          );
          if (harderSections.length > 0) {
            sectionRecommendations.push({
              action: 'move_question',
              questionId: easyQuestions[0].id,
              questionContent: easyQuestions[0].content.substring(0, 50) + '...',
              fromSectionId: section.sectionId,
              toSectionId: harderSections[0].sectionId,
              reason: `쉬운 문제를 더 어려운 섹션으로 이동하여 균형을 맞추세요.`,
            });
          }
        }
      }

      if (sectionRecommendations.length > 0) {
        recommendations.push({
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          currentDifficulty: section.difficultyScore,
          targetDifficulty,
          recommendations: sectionRecommendations,
        });
      }
    }

    return recommendations;
  }

  /**
   * 특정 난이도의 문제 조회
   */
  private async getQuestionsByDifficulty(
    examId: string,
    sectionId: string,
    difficulty: Difficulty,
  ): Promise<Array<{ id: string; content: string }>> {
    const questions = await this.prisma.question.findMany({
      where: {
        sectionId,
        difficulty,
      },
      select: {
        id: true,
        content: true,
      },
      orderBy: {
        questionNumber: 'asc',
      },
    });

    return questions;
  }

  /**
   * 문제를 다른 섹션으로 이동
   */
  async moveQuestionToSection(questionId: string, targetSectionId: string): Promise<void> {
    // 대상 섹션의 최대 questionNumber 확인
    const targetSection = await this.prisma.section.findUnique({
      where: { id: targetSectionId },
      include: {
        questions: {
          select: {
            questionNumber: true,
          },
        },
      },
    });

    if (!targetSection) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${targetSectionId}`);
    }

    const maxQuestionNumber =
      targetSection.questions.length > 0
        ? Math.max(...targetSection.questions.map((q) => q.questionNumber))
        : 0;

    // 문제 이동
    await this.prisma.question.update({
      where: { id: questionId },
      data: {
        sectionId: targetSectionId,
        questionNumber: maxQuestionNumber + 1,
      },
    });

    // 원본 섹션의 questionNumber 재정렬
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { sectionId: true },
    });

    if (question && question.sectionId) {
      const originalSection = await this.prisma.section.findUnique({
        where: { id: question.sectionId },
        include: {
          questions: {
            orderBy: {
              questionNumber: 'asc',
            },
          },
        },
      });

      if (originalSection && originalSection.questions) {
        // questionNumber 재정렬
        for (let i = 0; i < originalSection.questions.length; i++) {
          await this.prisma.question.update({
            where: { id: originalSection.questions[i].id },
            data: {
              questionNumber: i + 1,
            },
          });
        }

        // questionCount 업데이트
        await this.prisma.section.update({
          where: { id: originalSection.id },
          data: {
            questionCount: originalSection.questions.length,
          },
        });
      }
    }

    // 대상 섹션의 questionCount 업데이트
    await this.prisma.section.update({
      where: { id: targetSectionId },
      data: {
        questionCount: targetSection.questions.length + 1,
      },
    });
  }
}

