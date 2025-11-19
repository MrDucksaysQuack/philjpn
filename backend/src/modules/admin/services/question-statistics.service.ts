import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/utils/prisma.service';
import { Difficulty } from '../../../common/types';

@Injectable()
export class QuestionStatisticsService {
  private readonly logger = new Logger(QuestionStatisticsService.name);
  private readonly RECALCULATE_THRESHOLD_HOURS = 24; // 통계 재계산 주기 (24시간)

  constructor(private prisma: PrismaService) {}

  /**
   * 문제 통계 계산 및 업데이트
   */
  async calculateStatistics(questionId: string) {
    // QuestionResult에서 통계 수집
    const results = await this.prisma.questionResult.findMany({
      where: { questionId },
      select: {
        isCorrect: true,
        userAnswer: true,
        timeSpent: true,
      },
    });

    const totalAttempts = results.length;
    const correctCount = results.filter((r) => r.isCorrect === true).length;
    const incorrectCount = results.filter((r) => r.isCorrect === false).length;
    const unansweredCount = results.filter((r) => r.isCorrect === null).length;

    // 평균 소요 시간 계산
    const timeSpentValues = results
      .map((r) => r.timeSpent)
      .filter((t) => t !== null && t !== undefined) as number[];
    const averageTimeSpent =
      timeSpentValues.length > 0
        ? Math.round(
            timeSpentValues.reduce((sum, t) => sum + t, 0) /
              timeSpentValues.length,
          )
        : null;

    // 정답률 계산 (0-100)
    const correctRate =
      totalAttempts > 0
        ? (correctCount / totalAttempts) * 100
        : null;

    // 계산된 난이도 계산 (0.00-1.00, 높을수록 어려움)
    // 정답률이 낮을수록 어려움 (1 - correctRate/100)
    const calculatedDifficulty =
      correctRate !== null ? 1 - correctRate / 100 : null;

    // 오답 패턴 수집
    const mistakeCounts: Record<string, number> = {};
    results
      .filter((r) => r.isCorrect === false && r.userAnswer)
      .forEach((r) => {
        const answer = r.userAnswer as string;
        mistakeCounts[answer] = (mistakeCounts[answer] || 0) + 1;
      });

    // 가장 많이 선택된 오답 상위 5개
    const commonMistakes = Object.entries(mistakeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .reduce((acc, [answer, count]) => {
        acc[answer] = count;
        return acc;
      }, {} as Record<string, number>);

    // 통계 업데이트 또는 생성
    const statisticsData = {
      where: { questionId },
      update: {
        totalAttempts,
        correctCount,
        incorrectCount,
        unansweredCount,
        averageTimeSpent,
        calculatedDifficulty: calculatedDifficulty
          ? new Prisma.Decimal(calculatedDifficulty.toFixed(2))
          : null,
        correctRate: correctRate
          ? new Prisma.Decimal(correctRate.toFixed(2))
          : null,
        commonMistakes: Object.keys(commonMistakes).length > 0 ? commonMistakes : Prisma.JsonNull,
        lastCalculatedAt: new Date(),
      },
      create: {
        questionId,
        totalAttempts,
        correctCount,
        incorrectCount,
        unansweredCount,
        averageTimeSpent,
        calculatedDifficulty: calculatedDifficulty
          ? new Prisma.Decimal(calculatedDifficulty.toFixed(2))
          : null,
        correctRate: correctRate
          ? new Prisma.Decimal(correctRate.toFixed(2))
          : null,
        commonMistakes: Object.keys(commonMistakes).length > 0 ? commonMistakes : Prisma.JsonNull,
        lastCalculatedAt: new Date(),
      },
    };

    const statistics = await this.prisma.questionStatistics.upsert(statisticsData);

    // 통계 기반으로 문제 난이도 자동 업데이트
    if (calculatedDifficulty !== null && totalAttempts >= 5) {
      // 최소 5번 이상 시도된 경우에만 자동 업데이트
      await this.updateQuestionDifficultyFromStatistics(questionId, calculatedDifficulty);
    }

    return statistics;
  }

  /**
   * 통계 기반 문제 난이도 자동 업데이트
   * calculatedDifficulty (0.00-1.00)를 Difficulty (easy/medium/hard)로 변환
   */
  private async updateQuestionDifficultyFromStatistics(
    questionId: string,
    calculatedDifficulty: number,
  ): Promise<void> {
    try {
      // calculatedDifficulty를 Difficulty로 매핑
      // 0.00-0.33: easy (정답률 67% 이상)
      // 0.34-0.66: medium (정답률 34-66%)
      // 0.67-1.00: hard (정답률 33% 이하)
      let difficulty: Difficulty | null = null;
      if (calculatedDifficulty <= 0.33) {
        difficulty = Difficulty.EASY;
      } else if (calculatedDifficulty <= 0.66) {
        difficulty = Difficulty.MEDIUM;
      } else {
        difficulty = Difficulty.HARD;
      }

      // 문제의 난이도 업데이트
      await this.prisma.question.update({
        where: { id: questionId },
        data: { difficulty },
      });

      this.logger.log(
        `Question ${questionId} difficulty auto-updated to ${difficulty} (calculatedDifficulty: ${calculatedDifficulty.toFixed(2)})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update difficulty for question ${questionId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * 문제 난이도 자동 업데이트 (수동 트리거)
   */
  async updateQuestionDifficulty(questionId: string): Promise<{
    questionId: string;
    oldDifficulty: Difficulty | null;
    newDifficulty: Difficulty | null;
    calculatedDifficulty: number | null;
  }> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { difficulty: true },
    });

    if (!question) {
      throw new Error(`문제를 찾을 수 없습니다. ID: ${questionId}`);
    }

    const statistics = await this.calculateStatistics(questionId);
    const calculatedDifficulty = statistics.calculatedDifficulty
      ? Number(statistics.calculatedDifficulty)
      : null;

    let newDifficulty: Difficulty | null = null;
    if (calculatedDifficulty !== null && statistics.totalAttempts >= 5) {
      if (calculatedDifficulty <= 0.33) {
        newDifficulty = Difficulty.EASY;
      } else if (calculatedDifficulty <= 0.66) {
        newDifficulty = Difficulty.MEDIUM;
      } else {
        newDifficulty = Difficulty.HARD;
      }

      await this.prisma.question.update({
        where: { id: questionId },
        data: { difficulty: newDifficulty },
      });
    }

    return {
      questionId,
      oldDifficulty: question.difficulty as Difficulty | null,
      newDifficulty,
      calculatedDifficulty,
    };
  }

  /**
   * 여러 문제의 난이도 일괄 자동 업데이트
   */
  async updateQuestionDifficultiesBatch(questionIds: string[]): Promise<{
    updated: number;
    skipped: number;
    results: Array<{
      questionId: string;
      oldDifficulty: Difficulty | null;
      newDifficulty: Difficulty | null;
      calculatedDifficulty: number | null;
      error?: string;
    }>;
  }> {
    const results = await Promise.allSettled(
      questionIds.map((id) => this.updateQuestionDifficulty(id)),
    );

    let updated = 0;
    let skipped = 0;
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.newDifficulty !== null) {
          updated++;
        } else {
          skipped++;
        }
        return result.value;
      } else {
        skipped++;
        return {
          questionId: questionIds[index],
          oldDifficulty: null,
          newDifficulty: null,
          calculatedDifficulty: null,
          error: result.reason?.message || String(result.reason),
        };
      }
    });

    return {
      updated,
      skipped,
      results: processedResults,
    };
  }

  /**
   * 문제 통계 조회
   */
  async getStatistics(questionId: string) {
    let statistics = await this.prisma.questionStatistics.findUnique({
      where: { questionId },
    });

    // 통계가 없거나 오래된 경우 재계산
    const shouldRecalculate =
      !statistics ||
      (statistics.lastCalculatedAt &&
        new Date().getTime() - statistics.lastCalculatedAt.getTime() >
          this.RECALCULATE_THRESHOLD_HOURS * 60 * 60 * 1000);

    if (shouldRecalculate) {
      this.logger.log(`Question statistics for ${questionId} are missing or outdated. Recalculating...`);
      statistics = await this.calculateStatistics(questionId);
    }

    return statistics;
  }

  /**
   * 여러 문제의 통계 일괄 계산
   */
  async calculateStatisticsBatch(questionIds: string[]) {
    const results = await Promise.all(
      questionIds.map((id) => this.calculateStatistics(id)),
    );
    return results;
  }

  /**
   * QuestionResult 생성 시 통계 업데이트 (비동기)
   */
  async updateStatisticsOnResult(questionId: string) {
    // 비동기로 통계 업데이트 (성능 최적화)
    setImmediate(() => {
      this.calculateStatistics(questionId).catch((error) => {
        console.error(`Failed to update statistics for question ${questionId}:`, error);
      });
    });
  }
}

