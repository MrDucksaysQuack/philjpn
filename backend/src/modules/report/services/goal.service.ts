import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateGoalDto } from '../dto/goal.dto';
import { BadgeService } from './badge.service';

@Injectable()
export class GoalService {
  constructor(
    private prisma: PrismaService,
    private badgeService: BadgeService,
  ) {}

  /**
   * 목표 생성
   */
  async createGoal(userId: string, createGoalDto: CreateGoalDto) {
    return await this.prisma.userGoal.create({
      data: {
        userId,
        goalType: createGoalDto.goalType as any,
        targetValue: createGoalDto.targetValue,
        deadline: new Date(createGoalDto.deadline),
        milestones: createGoalDto.milestones ? createGoalDto.milestones : undefined,
        status: 'active',
        currentValue: 0,
      },
    });
  }

  /**
   * 목표 목록 조회
   */
  async getGoals(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.prisma.userGoal.findMany({
      where,
      orderBy: { deadline: 'asc' },
    });
  }

  /**
   * 목표 상세 조회
   */
  async getGoal(goalId: string, userId: string) {
    const goal = await this.prisma.userGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('목표를 찾을 수 없습니다.');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('본인의 목표만 조회할 수 있습니다.');
    }

    return goal;
  }

  /**
   * 목표 진행 상황 조회
   */
  async getGoalProgress(userId: string) {
    try {
      const goals = await this.prisma.userGoal.findMany({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { deadline: 'asc' },
    });

    const activeGoals = await Promise.all(
      goals.map(async (goal) => {
        // 현재 값 계산
        let currentValue = 0;
        const now = new Date();

        switch (goal.goalType) {
          case 'score_target':
            const latestResult = await this.prisma.examResult.findFirst({
              where: {
                userId,
                status: 'completed',
                totalScore: { not: null },
              },
              orderBy: { startedAt: 'desc' },
              select: { totalScore: true, maxScore: true },
            });
            if (latestResult && latestResult.maxScore && latestResult.maxScore > 0) {
              currentValue = Math.round(
                (latestResult.totalScore! / latestResult.maxScore!) * 100 * 10,
              ); // 990점 만점 기준
            }
            break;

          case 'exam_count':
            const examCount = await this.prisma.examResult.count({
              where: {
                userId,
                status: 'completed',
                startedAt: { gte: goal.createdAt },
              },
            });
            currentValue = examCount;
            break;

          case 'word_count':
            const wordCount = await this.prisma.wordBook.count({
              where: {
                userId,
                createdAt: { gte: goal.createdAt },
              },
            });
            currentValue = wordCount;
            break;

          case 'weakness_recovery':
            // 약점 회복률 계산
            currentValue = await this.calculateWeaknessRecoveryRate(userId, goal.createdAt);
            break;
        }

        const progress = goal.targetValue > 0 ? currentValue / goal.targetValue : 0;
        const isOnTrack = progress <= 1 && now <= goal.deadline;

        // 일별 진행 상황 (최근 7일)
        const dailyProgress: Array<{ date: string; value: number }> = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          let value = 0;
          switch (goal.goalType) {
            case 'score_target':
              const result = await this.prisma.examResult.findFirst({
                where: {
                  userId,
                  status: 'completed',
                  startedAt: {
                    gte: new Date(dateStr + 'T00:00:00'),
                    lt: new Date(dateStr + 'T23:59:59'),
                  },
                  totalScore: { not: null },
                },
                select: { totalScore: true, maxScore: true },
              });
              if (result && result.maxScore && result.maxScore > 0) {
                value = Math.round((result.totalScore! / result.maxScore!) * 100 * 10);
              }
              break;

            case 'exam_count':
              value = await this.prisma.examResult.count({
                where: {
                  userId,
                  status: 'completed',
                  startedAt: {
                    gte: new Date(dateStr + 'T00:00:00'),
                    lt: new Date(dateStr + 'T23:59:59'),
                  },
                },
              });
              break;

            case 'word_count':
              value = await this.prisma.wordBook.count({
                where: {
                  userId,
                  createdAt: {
                    gte: new Date(dateStr + 'T00:00:00'),
                    lt: new Date(dateStr + 'T23:59:59'),
                  },
                },
              });
              break;
          }

          dailyProgress.push({ date: dateStr, value });
        }

        // 예상 완료 시점 계산
        const daysElapsed = Math.floor(
          (now.getTime() - goal.createdAt.getTime()) / (24 * 60 * 60 * 1000),
        );
        const estimatedCompletion =
          progress > 0 && daysElapsed > 0
            ? new Date(
                now.getTime() +
                  ((goal.deadline.getTime() - now.getTime()) / progress),
              ).toISOString().split('T')[0]
            : undefined;

        return {
          goalId: goal.id,
          type: goal.goalType,
          target: goal.targetValue,
          current: currentValue,
          progress: Math.min(progress, 1),
          estimatedCompletion,
          onTrack: isOnTrack,
          dailyProgress,
        };
      }),
    );

    // 배지 조회
    const achievements = await this.badgeService.getUserBadges(userId);

      return {
        activeGoals,
        achievements,
      };
    } catch (error: any) {
      console.error('❌ getGoalProgress 서비스 에러:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
        userId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * 목표 업데이트
   */
  async updateGoal(goalId: string, userId: string, updateData: any) {
    const goal = await this.getGoal(goalId, userId);

    return await this.prisma.userGoal.update({
      where: { id: goalId },
      data: updateData,
    });
  }

  /**
   * 목표 삭제
   */
  async deleteGoal(goalId: string, userId: string) {
    await this.getGoal(goalId, userId);

    await this.prisma.userGoal.delete({
      where: { id: goalId },
    });

    return { message: '목표가 삭제되었습니다.' };
  }

  /**
   * 약점 회복률 계산
   * 과거 약점 태그들이 최근 시험에서 얼마나 개선되었는지 측정
   */
  private async calculateWeaknessRecoveryRate(
    userId: string,
    since: Date,
  ): Promise<number> {
    // 목표 생성 시점 이전의 시험 결과 (과거 약점 식별용)
    const pastResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
        startedAt: {
          lt: since, // 목표 생성 이전
        },
      },
      include: {
        sectionResults: {
          include: {
            questionResults: {
              include: {
                question: {
                  select: {
                    tags: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10, // 최근 10개 시험
    });

    // 목표 생성 이후의 시험 결과 (최근 성과 확인용)
    const recentResults = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
        startedAt: {
          gte: since, // 목표 생성 이후
        },
      },
      include: {
        sectionResults: {
          include: {
            questionResults: {
              include: {
                question: {
                  select: {
                    tags: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10, // 최근 10개 시험
    });

    if (pastResults.length === 0 || recentResults.length === 0) {
      return 0; // 비교할 데이터가 없으면 0%
    }

    // 과거 약점 태그 식별 (정답률 70% 미만)
    const pastTagStats = new Map<string, { correct: number; total: number }>();
    
    pastResults.forEach((result) => {
      result.sectionResults.forEach((sr) => {
        sr.questionResults.forEach((qr) => {
          const question = qr.question;
          if (question.tags && question.tags.length > 0) {
            question.tags.forEach((tag: string) => {
              if (!pastTagStats.has(tag)) {
                pastTagStats.set(tag, { correct: 0, total: 0 });
              }
              const stats = pastTagStats.get(tag)!;
              stats.total++;
              if (qr.isCorrect) {
                stats.correct++;
              }
            });
          }
        });
      });
    });

    // 약점 태그 필터링 (정답률 70% 미만, 최소 3문제 이상)
    const weaknessTags = Array.from(pastTagStats.entries())
      .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.7)
      .map(([tag, stats]) => ({
        tag,
        pastCorrectRate: (stats.correct / stats.total) * 100,
      }));

    if (weaknessTags.length === 0) {
      return 100; // 약점이 없으면 100% 회복
    }

    // 최근 시험에서 같은 태그의 정답률 확인
    const recentTagStats = new Map<string, { correct: number; total: number }>();
    
    recentResults.forEach((result) => {
      result.sectionResults.forEach((sr) => {
        sr.questionResults.forEach((qr) => {
          const question = qr.question;
          if (question.tags && question.tags.length > 0) {
            question.tags.forEach((tag: string) => {
              if (!recentTagStats.has(tag)) {
                recentTagStats.set(tag, { correct: 0, total: 0 });
              }
              const stats = recentTagStats.get(tag)!;
              stats.total++;
              if (qr.isCorrect) {
                stats.correct++;
              }
            });
          }
        });
      });
    });

    // 각 약점 태그의 회복률 계산
    let totalRecoveryRate = 0;
    let validTags = 0;

    weaknessTags.forEach(({ tag, pastCorrectRate }) => {
      const recentStats = recentTagStats.get(tag);
      if (recentStats && recentStats.total >= 2) {
        const recentCorrectRate = (recentStats.correct / recentStats.total) * 100;
        
        // 회복률 = (최근 정답률 - 과거 정답률) / (100 - 과거 정답률) * 100
        // 예: 과거 50% -> 최근 80% = (80-50)/(100-50) * 100 = 60% 회복
        const recoveryRate = Math.max(
          0,
          Math.min(100, ((recentCorrectRate - pastCorrectRate) / (100 - pastCorrectRate)) * 100),
        );
        
        totalRecoveryRate += recoveryRate;
        validTags++;
      }
    });

    // 평균 회복률 반환
    return validTags > 0 ? Math.round(totalRecoveryRate / validTags) : 0;
  }
}

