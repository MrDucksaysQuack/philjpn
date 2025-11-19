import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { BadgeType, BadgeRarity } from '@prisma/client';

export interface BadgeCondition {
  examCount?: number;
  scoreThreshold?: number;
  streakDays?: number;
  wordCount?: number;
  improvementRate?: number;
  categoryId?: string;
  timeLimit?: number; // 초 단위
}

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 사용자의 배지 목록 조회
   */
  async getUserBadges(userId: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });

    return userBadges.map((ub) => ({
      id: ub.id,
      badgeId: ub.badgeId,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      rarity: ub.badge.rarity,
      earnedAt: ub.earnedAt,
      progress: ub.progress || 0,
    }));
  }

  /**
   * 배지 획득 가능 여부 확인 및 자동 획득
   */
  async checkAndAwardBadges(userId: string, context?: {
    examResultId?: string;
    examId?: string;
    score?: number;
    categoryId?: string;
  }): Promise<string[]> {
    const awardedBadgeIds: string[] = [];

    try {
      // 모든 활성 배지 조회
      const activeBadges = await this.prisma.badge.findMany({
        where: { isActive: true },
      });

      // 사용자가 이미 획득한 배지 ID 목록
      const earnedBadgeIds = new Set(
        (await this.prisma.userBadge.findMany({
          where: { userId },
          select: { badgeId: true },
        })).map((ub) => ub.badgeId),
      );

      // 각 배지 조건 확인
      for (const badge of activeBadges) {
        // 이미 획득한 배지는 스킵
        if (earnedBadgeIds.has(badge.id)) {
          continue;
        }

        // 배지 획득 조건 확인
        const shouldAward = await this.checkBadgeCondition(
          userId,
          badge.badgeType,
          badge.condition as BadgeCondition | null,
          context,
        );

        if (shouldAward) {
          // 배지 획득
          await this.prisma.userBadge.create({
            data: {
              userId,
              badgeId: badge.id,
              progress: 100,
            },
          });

          awardedBadgeIds.push(badge.id);
          this.logger.log(`User ${userId} earned badge: ${badge.name} (${badge.badgeType})`);
        } else {
          // 진행도 업데이트 (아직 획득하지 못한 경우)
          const progress = await this.calculateBadgeProgress(
            userId,
            badge.badgeType,
            badge.condition as BadgeCondition | null,
            context,
          );

          // 기존 진행도가 있으면 업데이트, 없으면 생성
          await this.prisma.userBadge.upsert({
            where: {
              userId_badgeId: {
                userId,
                badgeId: badge.id,
              },
            },
            create: {
              userId,
              badgeId: badge.id,
              progress,
            },
            update: {
              progress,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to check badges for user ${userId}:`, error);
    }

    return awardedBadgeIds;
  }

  /**
   * 배지 획득 조건 확인
   */
  private async checkBadgeCondition(
    userId: string,
    badgeType: BadgeType,
    condition: BadgeCondition | null,
    context?: any,
  ): Promise<boolean> {
    switch (badgeType) {
      case BadgeType.exam_completed:
        if (!condition?.examCount) return false;
        const completedCount = await this.prisma.examResult.count({
          where: {
            userId,
            status: 'completed',
          },
        });
        return completedCount >= condition.examCount;

      case BadgeType.perfect_score:
        if (!context?.score) return false;
        const examResult = await this.prisma.examResult.findUnique({
          where: { id: context.examResultId },
          include: { exam: true },
        });
        if (!examResult || !examResult.maxScore) return false;
        return examResult.totalScore === examResult.maxScore;

      case BadgeType.streak_days:
        if (!condition?.streakDays) return false;
        const streak = await this.calculateStreakDays(userId);
        return streak >= condition.streakDays;

      case BadgeType.word_master:
        if (!condition?.wordCount) return false;
        const wordCount = await this.prisma.wordBook.count({
          where: { userId },
        });
        return wordCount >= condition.wordCount;

      case BadgeType.improvement:
        if (!condition?.improvementRate) return false;
        const improvement = await this.calculateImprovement(userId);
        return improvement >= condition.improvementRate;

      case BadgeType.category_master:
        if (!condition?.categoryId || !context?.categoryId) return false;
        const categoryExamCount = await this.prisma.examResult.count({
          where: {
            userId,
            status: 'completed',
            exam: {
              categoryId: condition.categoryId,
            },
          },
        });
        return categoryExamCount >= (condition.examCount || 5);

      case BadgeType.speed_demon:
        if (!condition?.timeLimit || !context?.examResultId) return false;
        const result = await this.prisma.examResult.findUnique({
          where: { id: context.examResultId },
        });
        if (!result || !result.timeSpent) return false;
        return result.timeSpent <= condition.timeLimit;

      case BadgeType.consistency:
        if (!condition?.streakDays) return false;
        const consistencyStreak = await this.calculateStreakDays(userId);
        return consistencyStreak >= condition.streakDays;

      default:
        return false;
    }
  }

  /**
   * 배지 진행도 계산
   */
  private async calculateBadgeProgress(
    userId: string,
    badgeType: BadgeType,
    condition: BadgeCondition | null,
    context?: any,
  ): Promise<number> {
    if (!condition) return 0;

    switch (badgeType) {
      case BadgeType.exam_completed:
        const completedCount = await this.prisma.examResult.count({
          where: {
            userId,
            status: 'completed',
          },
        });
        return condition.examCount
          ? Math.min(100, Math.round((completedCount / condition.examCount) * 100))
          : 0;

      case BadgeType.streak_days:
        const streak = await this.calculateStreakDays(userId);
        return condition.streakDays
          ? Math.min(100, Math.round((streak / condition.streakDays) * 100))
          : 0;

      case BadgeType.word_master:
        const wordCount = await this.prisma.wordBook.count({
          where: { userId },
        });
        return condition.wordCount
          ? Math.min(100, Math.round((wordCount / condition.wordCount) * 100))
          : 0;

      default:
        return 0;
    }
  }

  /**
   * 배지 통계 조회 (관리자용)
   */
  async getBadgeStatistics() {
    // 전체 배지 수
    const totalBadges = await this.prisma.badge.count({
      where: { isActive: true },
    });

    // 전체 사용자 수
    const totalUsers = await this.prisma.user.count();

    // 배지 획득 통계
    const userBadges = await this.prisma.userBadge.findMany({
      include: {
        badge: true,
      },
    });

    // 희귀도별 분포
    const rarityDistribution = await this.prisma.badge.groupBy({
      by: ['rarity'],
      where: { isActive: true },
      _count: true,
    });

    // 타입별 분포
    const typeDistribution = await this.prisma.badge.groupBy({
      by: ['badgeType'],
      where: { isActive: true },
      _count: true,
    });

    // 희귀도별 획득률
    const rarityEarnedCount: Record<string, number> = {};
    const rarityTotalCount: Record<string, number> = {};
    
    userBadges.forEach((ub) => {
      const rarity = ub.badge.rarity;
      rarityEarnedCount[rarity] = (rarityEarnedCount[rarity] || 0) + 1;
    });

    rarityDistribution.forEach((r) => {
      rarityTotalCount[r.rarity] = r._count;
    });

    const rarityEarnedRate: Record<string, number> = {};
    Object.keys(rarityTotalCount).forEach((rarity) => {
      const earned = rarityEarnedCount[rarity] || 0;
      const total = rarityTotalCount[rarity] || 0;
      rarityEarnedRate[rarity] = total > 0 ? (earned / total) * 100 : 0;
    });

    // 타입별 획득률
    const typeEarnedCount: Record<string, number> = {};
    const typeTotalCount: Record<string, number> = {};
    
    userBadges.forEach((ub) => {
      const type = ub.badge.badgeType;
      typeEarnedCount[type] = (typeEarnedCount[type] || 0) + 1;
    });

    typeDistribution.forEach((t) => {
      typeTotalCount[t.badgeType] = t._count;
    });

    const typeEarnedRate: Record<string, number> = {};
    Object.keys(typeTotalCount).forEach((type) => {
      const earned = typeEarnedCount[type] || 0;
      const total = typeTotalCount[type] || 0;
      typeEarnedRate[type] = total > 0 ? (earned / total) * 100 : 0;
    });

    // 최근 획득 추이 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEarned = await this.prisma.userBadge.findMany({
      where: {
        earnedAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        earnedAt: 'asc',
      },
    });

    // 일별 획득 수
    const dailyEarned: Record<string, number> = {};
    recentEarned.forEach((ub) => {
      const date = ub.earnedAt.toISOString().split('T')[0];
      dailyEarned[date] = (dailyEarned[date] || 0) + 1;
    });

    // 전체 획득률
    const totalEarned = userBadges.length;
    const overallEarnedRate = totalUsers > 0 && totalBadges > 0
      ? (totalEarned / (totalUsers * totalBadges)) * 100
      : 0;

    return {
      totalBadges,
      totalUsers,
      totalEarned,
      overallEarnedRate: Math.min(100, overallEarnedRate),
      rarityDistribution: rarityDistribution.map((r) => ({
        rarity: r.rarity,
        count: r._count,
        earnedRate: rarityEarnedRate[r.rarity] || 0,
      })),
      typeDistribution: typeDistribution.map((t) => ({
        type: t.badgeType,
        count: t._count,
        earnedRate: typeEarnedRate[t.badgeType] || 0,
      })),
      dailyEarned: Object.entries(dailyEarned).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  /**
   * 연속 학습 일수 계산
   */
  private async calculateStreakDays(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const startOfDay = new Date(currentDate);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const hasActivity = await this.prisma.examResult.findFirst({
        where: {
          userId,
          status: 'completed',
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 성적 향상률 계산
   */
  private async calculateImprovement(userId: string): Promise<number> {
    const results = await this.prisma.examResult.findMany({
      where: {
        userId,
        status: 'completed',
        totalScore: { not: null },
        maxScore: { not: null },
      },
      orderBy: { startedAt: 'asc' },
      take: 10,
    });

    if (results.length < 2) return 0;

    const firstHalf = results.slice(0, Math.floor(results.length / 2));
    const secondHalf = results.slice(Math.floor(results.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, r) => {
        if (r.totalScore && r.maxScore) {
          return sum + (r.totalScore / r.maxScore) * 100;
        }
        return sum;
      }, 0) / firstHalf.length;

    const secondAvg =
      secondHalf.reduce((sum, r) => {
        if (r.totalScore && r.maxScore) {
          return sum + (r.totalScore / r.maxScore) * 100;
        }
        return sum;
      }, 0) / secondHalf.length;

    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  /**
   * 기본 배지 초기화 (시드 데이터)
   */
  async initializeDefaultBadges() {
    const defaultBadges = [
      {
        badgeType: BadgeType.exam_completed,
        name: '첫 시험 완료',
        description: '첫 번째 시험을 완료했습니다.',
        icon: '🎯',
        rarity: BadgeRarity.common,
        condition: { examCount: 1 },
      },
      {
        badgeType: BadgeType.exam_completed,
        name: '시험 마스터',
        description: '10개의 시험을 완료했습니다.',
        icon: '🏆',
        rarity: BadgeRarity.rare,
        condition: { examCount: 10 },
      },
      {
        badgeType: BadgeType.perfect_score,
        name: '만점 달성',
        description: '시험에서 만점을 받았습니다.',
        icon: '💯',
        rarity: BadgeRarity.epic,
        condition: {},
      },
      {
        badgeType: BadgeType.streak_days,
        name: '7일 연속 학습',
        description: '7일 연속으로 시험을 완료했습니다.',
        icon: '🔥',
        rarity: BadgeRarity.rare,
        condition: { streakDays: 7 },
      },
      {
        badgeType: BadgeType.streak_days,
        name: '30일 연속 학습',
        description: '30일 연속으로 시험을 완료했습니다.',
        icon: '🌟',
        rarity: BadgeRarity.legendary,
        condition: { streakDays: 30 },
      },
      {
        badgeType: BadgeType.word_master,
        name: '단어장 마스터',
        description: '100개의 단어를 학습했습니다.',
        icon: '📚',
        rarity: BadgeRarity.rare,
        condition: { wordCount: 100 },
      },
      {
        badgeType: BadgeType.improvement,
        name: '성적 향상',
        description: '최근 시험에서 20% 이상 성적이 향상되었습니다.',
        icon: '📈',
        rarity: BadgeRarity.epic,
        condition: { improvementRate: 20 },
      },
    ];

    for (const badgeData of defaultBadges) {
      // badgeType으로 unique 제약이 없으므로 findFirst + create/update 사용
      const existing = await this.prisma.badge.findFirst({
        where: {
          badgeType: badgeData.badgeType,
          name: badgeData.name,
        },
      });

      if (existing) {
        await this.prisma.badge.update({
          where: { id: existing.id },
          data: badgeData as any,
        });
      } else {
        await this.prisma.badge.create({
          data: badgeData as any,
        });
      }
    }

    this.logger.log('Default badges initialized');
  }

  /**
   * 모든 배지 조회 (Admin)
   */
  async getAllBadges(includeInactive = false) {
    return await this.prisma.badge.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { badgeType: 'asc' },
        { rarity: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * 배지 조회 (Admin)
   */
  async getBadge(id: string) {
    return await this.prisma.badge.findUnique({
      where: { id },
    });
  }

  /**
   * 배지 생성 (Admin)
   */
  async createBadge(data: {
    badgeType: BadgeType;
    name: string;
    description?: string;
    icon?: string;
    rarity?: BadgeRarity;
    condition?: BadgeCondition;
    isActive?: boolean;
  }) {
    return await this.prisma.badge.create({
      data: {
        badgeType: data.badgeType,
        name: data.name,
        description: data.description,
        icon: data.icon,
        rarity: data.rarity || BadgeRarity.common,
        condition: data.condition as any,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * 배지 수정 (Admin)
   */
  async updateBadge(id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    rarity?: BadgeRarity;
    condition?: BadgeCondition;
    isActive?: boolean;
  }) {
    return await this.prisma.badge.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.rarity !== undefined && { rarity: data.rarity }),
        ...(data.condition !== undefined && { condition: data.condition as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  /**
   * 배지 삭제 (Admin)
   */
  async deleteBadge(id: string) {
    return await this.prisma.badge.delete({
      where: { id },
    });
  }

  /**
   * ID 목록으로 배지 조회
   */
  async getBadgesByIds(badgeIds: string[]) {
    return await this.prisma.badge.findMany({
      where: {
        id: {
          in: badgeIds,
        },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        rarity: true,
        badgeType: true,
      },
    });
  }
}

