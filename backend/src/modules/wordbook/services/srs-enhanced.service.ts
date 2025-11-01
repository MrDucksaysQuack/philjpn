import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

/**
 * 향상된 SRS (Spaced Repetition System) 서비스
 * 
 * 알고리즘: SuperMemo 2 (SM-2) 알고리즘 기반
 * - 성공 시 간격 증가 (EF 증가)
 * - 실패 시 간격 감소 (EF 감소, 재복습 필요)
 */
@Injectable()
export class SRSEnhancedService {
  constructor(private prisma: PrismaService) {}

  /**
   * 복습 결과에 따른 다음 복습 시간 계산 (SM-2 알고리즘)
   */
  calculateNextReview(
    currentEF: number,
    interval: number,
    isCorrect: boolean,
  ): { nextInterval: number; nextEF: number; nextReviewAt: Date } {
    let newEF = currentEF;
    let newInterval = interval;

    if (isCorrect) {
      // 정답 시: EF 증가 (최소 1.3)
      newEF = Math.max(1.3, currentEF + 0.1);
      
      // 간격 증가
      if (interval === 0) {
        newInterval = 1; // 첫 복습: 다음날
      } else if (interval === 1) {
        newInterval = 6; // 두 번째: 6일 후
      } else {
        newInterval = Math.floor(interval * newEF);
      }
    } else {
      // 오답 시: EF 감소, 간격 초기화
      newEF = Math.max(1.3, currentEF - 0.2);
      newInterval = 0; // 즉시 재복습
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

    return {
      nextInterval: newInterval,
      nextEF: Number(newEF.toFixed(2)),
      nextReviewAt,
    };
  }

  /**
   * 단어 복습 기록 및 다음 복습 시간 업데이트
   */
  async recordReview(wordId: string, isCorrect: boolean) {
    const word = await this.prisma.wordBook.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new Error('단어를 찾을 수 없습니다.');
    }

    // 현재 EF (Easiness Factor) 계산
    const currentEF = word.masteryLevel > 0 ? 2.5 - (100 - word.masteryLevel) / 100 : 2.5;
    
    // 현재 간격 계산
    const lastReview = word.lastReviewedAt || word.createdAt;
    const daysSinceLastReview = Math.floor(
      (new Date().getTime() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24),
    );
    const currentInterval = Math.max(0, daysSinceLastReview);

    // 다음 복습 계산
    const { nextInterval, nextEF, nextReviewAt } = this.calculateNextReview(
      currentEF,
      currentInterval,
      isCorrect,
    );

    // 숙련도 업데이트 (0-100)
    let newMasteryLevel = word.masteryLevel;
    if (isCorrect) {
      newMasteryLevel = Math.min(100, word.masteryLevel + Math.max(1, Math.floor(10 / (currentInterval + 1))));
    } else {
      newMasteryLevel = Math.max(0, word.masteryLevel - 10);
    }

    // 업데이트
    const updated = await this.prisma.wordBook.update({
      where: { id: wordId },
      data: {
        masteryLevel: newMasteryLevel,
        reviewCount: word.reviewCount + 1,
        lastReviewedAt: new Date(),
        nextReviewAt,
      },
    });

    return {
      word: updated,
      masteryLevel: newMasteryLevel,
      nextReviewAt,
      interval: nextInterval,
    };
  }

  /**
   * 오늘 복습해야 할 단어 목록 조회 (우선순위 정렬)
   */
  async getTodayReviewList(userId: string, limit: number = 20) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reviews = await this.prisma.wordBook.findMany({
      where: {
        userId,
        OR: [
          { nextReviewAt: { lte: today } },
          { nextReviewAt: null },
          { reviewCount: 0 },
        ],
      },
      orderBy: [
        { nextReviewAt: 'asc' }, // 먼저 복습할 것
        { masteryLevel: 'asc' }, // 낮은 숙련도 우선
        { reviewCount: 'asc' }, // 적게 복습한 것 우선
      ],
      take: limit,
    });

    return reviews;
  }

  /**
   * 학습 통계 계산
   */
  async getLearningStats(userId: string) {
    const [totalWords, masteredWords, dueWords, learningWords] = await Promise.all([
      this.prisma.wordBook.count({ where: { userId } }),
      this.prisma.wordBook.count({
        where: {
          userId,
          masteryLevel: { gte: 80 },
        },
      }),
      this.prisma.wordBook.count({
        where: {
          userId,
          nextReviewAt: { lte: new Date() },
        },
      }),
      this.prisma.wordBook.count({
        where: {
          userId,
          masteryLevel: { gte: 30, lt: 80 },
        },
      }),
    ]);

    const avgMastery = await this.prisma.wordBook.aggregate({
      where: { userId },
      _avg: { masteryLevel: true },
    });

    return {
      totalWords,
      masteredWords,
      dueWords,
      learningWords,
      avgMastery: avgMastery._avg.masteryLevel || 0,
      masteryRate: totalWords > 0 ? (masteredWords / totalWords) * 100 : 0,
    };
  }

  /**
   * 간격별 복습 예정 단어 수
   */
  async getReviewSchedule(userId: string) {
    const now = new Date();
    const schedule = await Promise.all([
      // 오늘
      this.prisma.wordBook.count({
        where: {
          userId,
          nextReviewAt: {
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      // 이번 주
      this.prisma.wordBook.count({
        where: {
          userId,
          nextReviewAt: {
            gte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // 이번 달
      this.prisma.wordBook.count({
        where: {
          userId,
          nextReviewAt: {
            gte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      today: schedule[0],
      thisWeek: schedule[1],
      thisMonth: schedule[2],
    };
  }
}

