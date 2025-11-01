import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

@Injectable()
export class LearningCycleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 현재 학습 사이클 조회
   */
  async getCurrentCycle(userId: string) {
    // 활성 사이클 찾기
    let currentCycle = await this.prisma.learningCycle.findFirst({
      where: {
        userId,
        endDate: null, // 종료되지 않은 사이클
      },
      orderBy: { startDate: 'desc' },
    });

    // 활성 사이클이 없으면 새로 생성
    if (!currentCycle) {
      // 최근 시험 결과에서 약점 파악
      const recentResults = await this.prisma.examResult.findMany({
        where: {
          userId,
          status: 'completed',
        },
        orderBy: { startedAt: 'desc' },
        take: 1,
      });

      if (recentResults.length > 0) {
        // 약점 기반 사이클 생성
        currentCycle = await this.prisma.learningCycle.create({
          data: {
            userId,
            cycleType: 'weakness_focused',
            stage: 'identify',
            startDate: new Date(),
          },
        });
      }
    }

    if (!currentCycle) {
      return {
        currentCycle: null,
        cycleHistory: [],
      };
    }

    // 현재 단계별 데이터 수집
    const stageData = await this.getStageData(userId, currentCycle);

    // 사이클 히스토리
    const cycleHistory = await this.prisma.learningCycle.findMany({
      where: {
        userId,
        endDate: { not: null },
      },
      orderBy: { endDate: 'desc' },
      take: 10,
    });

    return {
      currentCycle: {
        ...currentCycle,
        ...stageData,
      },
      cycleHistory: cycleHistory.map((cycle) => ({
        cycleId: cycle.id,
        startedAt: cycle.startDate.toISOString(),
        completedAt: cycle.endDate?.toISOString(),
        improvement: cycle.improvement
          ? `${cycle.improvement >= 0 ? '+' : ''}${Math.round(cycle.improvement)}점`
          : null,
        wordsLearned: cycle.wordsLearned,
      })),
    };
  }

  /**
   * 단계별 데이터 수집
   */
  private async getStageData(userId: string, cycle: any) {
    const data: any = {};

    switch (cycle.stage) {
      case 'identify':
        // 약점 단어 추출 (시험 결과에서)
        const recentResult = await this.prisma.examResult.findFirst({
          where: {
            userId,
            status: 'completed',
          },
          orderBy: { startedAt: 'desc' },
        });

        if (recentResult) {
          // 단어장에서 시험 결과에서 추출된 단어 찾기
          const weakWords = await this.prisma.wordBook.findMany({
            where: {
              userId,
              sourceExamResultId: recentResult.id,
              masteryLevel: { lt: 70 }, // 숙련도 70% 미만
            },
            select: {
              id: true,
              word: true,
              nextReviewAt: true,
              masteryLevel: true,
            },
            orderBy: { masteryLevel: 'asc' },
            take: 20,
          });

          data.weakWords = weakWords.map((word) => ({
            wordId: word.id,
            word: word.word,
            reviewStatus: word.nextReviewAt && new Date(word.nextReviewAt) <= new Date() ? 'pending' : 'scheduled',
            nextReviewAt: word.nextReviewAt?.toISOString(),
            recommendedPractice: Math.ceil((70 - word.masteryLevel) / 10),
          }));
        } else {
          data.weakWords = [];
        }
        break;

      case 'practice':
        // 연습 중인 단어 (복습 예정이거나 낮은 숙련도)
        const practiceWords = await this.prisma.wordBook.findMany({
          where: {
            userId,
            OR: [
              { nextReviewAt: { lte: new Date() } },
              { masteryLevel: { lt: 70 } },
            ],
          },
          select: {
            id: true,
            word: true,
            nextReviewAt: true,
            masteryLevel: true,
          },
          orderBy: { nextReviewAt: 'asc' },
          take: 20,
        });

        data.weakWords = practiceWords.map((word) => ({
          wordId: word.id,
          word: word.word,
          reviewStatus: word.nextReviewAt && new Date(word.nextReviewAt) <= new Date() ? 'pending' : 'scheduled',
          nextReviewAt: word.nextReviewAt?.toISOString(),
          recommendedPractice: Math.ceil((70 - word.masteryLevel) / 10),
        }));
        break;

      case 'review':
        // 복습 단어 (숙련도 향상 필요)
        const reviewWords = await this.prisma.wordBook.findMany({
          where: {
            userId,
            masteryLevel: { gte: 50, lt: 90 },
          },
          select: {
            id: true,
            word: true,
            nextReviewAt: true,
            masteryLevel: true,
          },
          orderBy: { nextReviewAt: 'asc' },
          take: 20,
        });

        data.weakWords = reviewWords.map((word) => ({
          wordId: word.id,
          word: word.word,
          reviewStatus: 'review',
          nextReviewAt: word.nextReviewAt?.toISOString(),
          recommendedPractice: Math.ceil((90 - word.masteryLevel) / 5),
        }));
        break;

      case 'test':
        // 재시험 추천 (약점 회복 후)
        const recommendedExams = await this.getRecommendedReExams(userId, cycle);
        data.recommendedExams = recommendedExams;
        break;
    }

    return data;
  }

  /**
   * 재시험 추천
   */
  private async getRecommendedReExams(userId: string, cycle: any) {
    // 이전에 본 시험들 중 약점이 있었던 시험 추천
    const previousResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
        totalScore: { not: null },
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    // 낮은 점수를 받은 시험들 추천
    return previousResults
      .filter((result) => {
        if (!result.totalScore || !result.maxScore || result.maxScore === 0) return false;
        const percentage = (result.totalScore / result.maxScore) * 100;
        return percentage < 80; // 80% 미만
      })
      .slice(0, 5)
      .map((result) => ({
        examId: result.examId,
        title: result.exam.title,
        previousScore: result.totalScore && result.maxScore
          ? Math.round((result.totalScore / result.maxScore) * 100)
          : 0,
        reason: '약점을 개선한 후 재도전하세요',
      }));
  }

  /**
   * 사이클 단계 업데이트
   */
  async updateCycleStage(userId: string, stage: string) {
    const currentCycle = await this.prisma.learningCycle.findFirst({
      where: {
        userId,
        endDate: null,
      },
    });

    if (!currentCycle) {
      throw new Error('활성 사이클이 없습니다.');
    }

    return await this.prisma.learningCycle.update({
      where: { id: currentCycle.id },
      data: { stage },
    });
  }

  /**
   * 사이클 완료
   */
  async completeCycle(userId: string) {
    const currentCycle = await this.prisma.learningCycle.findFirst({
      where: {
        userId,
        endDate: null,
      },
    });

    if (!currentCycle) {
      throw new Error('활성 사이클이 없습니다.');
    }

    // 사이클 시작 전후 점수 비교
    const beforeResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        startedAt: { lt: currentCycle.startDate },
        status: 'completed',
        totalScore: { not: null },
      },
      orderBy: { startedAt: 'desc' },
      take: 3,
    });

    const afterResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        startedAt: { gte: currentCycle.startDate },
        status: 'completed',
        totalScore: { not: null },
      },
      orderBy: { startedAt: 'desc' },
      take: 3,
    });

    let improvement: number | null = null;
    if (beforeResults.length > 0 && afterResults.length > 0) {
      const beforeAvg =
        beforeResults.reduce((sum, r) => {
          if (!r.totalScore || !r.maxScore || r.maxScore === 0) return sum;
          return sum + (r.totalScore / r.maxScore) * 100;
        }, 0) / beforeResults.length;

      const afterAvg =
        afterResults.reduce((sum, r) => {
          if (!r.totalScore || !r.maxScore || r.maxScore === 0) return sum;
          return sum + (r.totalScore / r.maxScore) * 100;
        }, 0) / afterResults.length;

      improvement = afterAvg - beforeAvg;
    }

    // 학습한 단어 수 계산
    const wordsLearned = await this.prisma.wordBook.count({
      where: {
        userId,
        createdAt: { gte: currentCycle.startDate },
      },
    });

    return await this.prisma.learningCycle.update({
      where: { id: currentCycle.id },
      data: {
        endDate: new Date(),
        improvement,
        wordsLearned,
      },
    });
  }
}

