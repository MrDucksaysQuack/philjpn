import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { AdminUserQueryDto } from '../dto/user-query.dto';
import { AdminUpdateUserDto } from '../dto/update-user.dto';
import { AdminExamResultQueryDto } from '../dto/exam-result-query.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자 목록 조회 (Admin)
   */
  async getUsers(query: AdminUserQueryDto) {
    try {
      const { page = 1, limit = 10, role, isActive, search } = query;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: true,
            createdAt: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      // Prepared statement 에러인 경우 재시도
      if (error?.code === '42P05' || error?.code === '26000' || error?.code === 'P1017') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getUsers(query);
      }
      throw error;
    }
  }

  /**
   * 사용자 상세 조회
   */
  async getUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          profileImage: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              examResults: true,
              licenseKeys: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`사용자를 찾을 수 없습니다. ID: ${userId}`);
      }

      return user;
    } catch (error: any) {
      // Prepared statement 에러인 경우 재시도 (NotFoundException 제외)
      if (
        !(error instanceof NotFoundException) &&
        (error?.code === '42P05' || error?.code === '26000' || error?.code === 'P1017')
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getUser(userId);
      }
      throw error;
    }
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(userId: string, updateDto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다. ID: ${userId}`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    return updatedUser;
  }

  /**
   * 사용자 삭제 (Soft Delete)
   */
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다. ID: ${userId}`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: '사용자가 삭제되었습니다.' };
  }

  /**
   * 사용자의 시험 결과 목록
   */
  async getUserExamResults(userId: string) {
    const results = await this.prisma.examResult.findMany({
      where: { userId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            examType: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return { data: results };
  }

  /**
   * 시험 통계
   */
  async getExamStatistics() {
    try {
      const [
        totalExams,
        activeExams,
        totalAttempts,
        completedResults,
      ] = await Promise.all([
        this.prisma.exam.count({
          where: { deletedAt: null },
        }),
        this.prisma.exam.count({
          where: { deletedAt: null, isActive: true },
        }),
        this.prisma.examResult.count(),
        this.prisma.examResult.count({
          where: { status: 'completed' },
        }),
      ]);

      const averageScoreResult = await this.prisma.examResult.aggregate({
        where: {
          status: 'completed',
          totalScore: { not: null },
        },
        _avg: {
          totalScore: true,
        },
      });

      const averageScore = averageScoreResult._avg.totalScore
        ? Math.round(averageScoreResult._avg.totalScore)
        : 0;

      const completionRate =
        totalAttempts > 0 ? (completedResults / totalAttempts) * 100 : 0;

      return {
        totalExams,
        activeExams,
        totalAttempts,
        averageScore,
        completionRate: parseFloat(completionRate.toFixed(2)),
      };
    } catch (error: any) {
      // Prepared statement 에러인 경우 재시도
      if (error?.code === '42P05' || error?.code === '26000' || error?.code === 'P1017') {
        // 1초 대기 후 재시도
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getExamStatistics();
      }
      throw error;
    }
  }

  /**
   * 전체 시험 결과 목록 (Admin)
   */
  async getExamResults(query: AdminExamResultQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        examId,
        userId,
        status,
        dateFrom,
        dateTo,
      } = query;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (examId) where.examId = examId;
      if (userId) where.userId = userId;
      if (status) where.status = status;
      if (dateFrom || dateTo) {
        where.startedAt = {};
        if (dateFrom) where.startedAt.gte = new Date(dateFrom);
        if (dateTo) where.startedAt.lte = new Date(dateTo);
      }

      const [data, total] = await Promise.all([
        this.prisma.examResult.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            exam: {
              select: {
                id: true,
                title: true,
                examType: true,
              },
            },
          },
        }),
        this.prisma.examResult.count({ where }),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      // Prepared statement 에러인 경우 재시도
      if (error?.code === '42P05' || error?.code === '26000' || error?.code === 'P1017') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getExamResults(query);
      }
      throw error;
    }
  }

  /**
   * 라이선스 키 통계
   */
  async getLicenseKeyStatistics() {
    try {
      const [totalKeys, activeKeys, totalUsage, expiringKeys] =
        await Promise.all([
          this.prisma.licenseKey.count(),
          this.prisma.licenseKey.count({
            where: { isActive: true },
          }),
          this.prisma.keyUsageLog.count({
            where: { status: 'success' },
          }),
          this.prisma.licenseKey.count({
            where: {
              isActive: true,
              validUntil: {
                gte: new Date(),
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 이내
              },
            },
          }),
        ]);

      return {
        totalKeys,
        activeKeys,
        totalUsage,
        expiringSoon: expiringKeys,
      };
    } catch (error: any) {
      // Prepared statement 에러인 경우 재시도
      if (error?.code === '42P05' || error?.code === '26000' || error?.code === 'P1017') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getLicenseKeyStatistics();
      }
      throw error;
    }
  }

  /**
   * Admin Dashboard 데이터
   */
  async getDashboardData() {
    try {
      const [
        totalUsers,
        activeUsers,
        totalExams,
        totalAttempts,
        recentResults,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.exam.count({ where: { deletedAt: null } }),
        this.prisma.examResult.count(),
        this.prisma.examResult.findMany({
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            exam: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
      ]);

      // 최근 7일간 일별 시험 응시 횟수
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const dailyAttemptsRaw = await this.prisma.examResult.groupBy({
        by: ['startedAt'],
        where: {
          startedAt: { gte: sevenDaysAgo },
        },
        _count: true,
      });

      const dailyAttempts = dailyAttemptsRaw.map((item) => ({
        date: item.startedAt.toISOString().split('T')[0],
        count: item._count,
      }));

      return {
        summary: {
          totalUsers,
          activeUsers,
          totalExams,
          totalAttempts,
        },
        recentActivity: recentResults.map((result) => ({
          type: 'exam_submit',
          userId: result.userId,
          examId: result.examId,
          user: result.user,
          exam: result.exam,
          timestamp: result.startedAt,
        })),
        chartData: {
          dailyAttempts,
        },
      };
    } catch (error: any) {
      // Prepared statement 에러인 경우 재시도
      if (error?.code === '42P05' || error?.code === '26000' || error?.code === 'P1017') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getDashboardData();
      }
      throw error;
    }
  }
}

