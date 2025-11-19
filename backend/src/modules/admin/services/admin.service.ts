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
    return this.prisma.executeWithRetry(async () => {
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
    });
  }

  /**
   * 사용자 상세 조회
   */
  async getUser(userId: string) {
    return this.prisma.executeWithRetry(async () => {
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
    });
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
      return await this.prisma.executeWithRetry(async () => {
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
      }, 5); // 5회 재시도
    } catch (error: any) {
      console.error('❌ getExamStatistics 최종 에러:', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
      });
      throw error;
    }
  }

  /**
   * 전체 시험 결과 목록 (Admin)
   */
  async getExamResults(query: AdminExamResultQueryDto) {
    return this.prisma.executeWithRetry(async () => {
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
    });
  }

  /**
   * 라이선스 키 통계
   */
  async getLicenseKeyStatistics() {
    try {
      return await this.prisma.executeWithRetry(async () => {
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
      }, 5); // 5회 재시도
    } catch (error: any) {
      console.error('❌ getLicenseKeyStatistics 최종 에러:', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
      });
      throw error;
    }
  }

  /**
   * Admin Dashboard 데이터
   */
  async getDashboardData() {
    try {
      return await this.prisma.executeWithRetry(async () => {
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
      }, 5); // 5회 재시도
    } catch (error: any) {
      console.error('❌ getDashboardData 최종 에러:', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
      });
      throw error;
    }
  }

  /**
   * 시험별 상세 분석
   */
  async getExamAnalytics(examId: string) {
    return this.prisma.executeWithRetry(async () => {
      // 시험 존재 확인
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        include: {
          sections: {
            include: {
              questions: {
                select: {
                  id: true,
                  difficulty: true,
                  points: true,
                },
              },
            },
          },
        },
      });

      if (!exam) {
        throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
      }

      // 시험 결과 전체 조회
      const examResults = await this.prisma.examResult.findMany({
        where: {
          examId,
          status: 'completed',
        },
        include: {
          sectionResults: {
            include: {
              questionResults: {
                include: {
                  question: {
                    select: {
                      id: true,
                      correctAnswer: true,
                      difficulty: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // 기본 통계
      const totalAttempts = examResults.length;
      const completedResults = examResults.filter((r) => r.status === 'completed').length;
      const completionRate = totalAttempts > 0 ? completedResults / totalAttempts : 0;

      const scores = examResults
        .map((r) => r.totalScore || 0)
        .filter((s) => s > 0);
      const averageScore =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;

      const totalTimeSpent = examResults.reduce(
        (sum, r) => sum + (r.timeSpent || 0),
        0,
      );
      const averageTimeSpent =
        examResults.length > 0 ? totalTimeSpent / examResults.length / 60 : 0; // 분 단위

      // 문제별 분석
      const questionAnalysisMap = new Map<
        string,
        {
          questionId: string;
          correctCount: number;
          incorrectCount: number;
          totalTime: number;
          attempts: number;
          wrongAnswers: Map<string, number>;
        }
      >();

      exam.sections.forEach((section) => {
        section.questions.forEach((question) => {
          questionAnalysisMap.set(question.id, {
            questionId: question.id,
            correctCount: 0,
            incorrectCount: 0,
            totalTime: 0,
            attempts: 0,
            wrongAnswers: new Map(),
          });
        });
      });

      examResults.forEach((result) => {
        result.sectionResults.forEach((sr) => {
          sr.questionResults.forEach((qr) => {
            const analysis = questionAnalysisMap.get(qr.questionId);
            if (analysis) {
              analysis.attempts++;
              if (qr.isCorrect) {
                analysis.correctCount++;
              } else {
                analysis.incorrectCount++;
                const wrongAnswer = qr.userAnswer || '미답';
                analysis.wrongAnswers.set(
                  wrongAnswer,
                  (analysis.wrongAnswers.get(wrongAnswer) || 0) + 1,
                );
              }
              if (qr.timeSpent) {
                analysis.totalTime += qr.timeSpent;
              }
            }
          });
        });
      });

      // 문제별 상세 분석 생성
      const questionAnalysis = Array.from(questionAnalysisMap.values()).map((analysis) => {
        const correctRate =
          analysis.attempts > 0 ? analysis.correctCount / analysis.attempts : 0;
        const averageTime =
          analysis.attempts > 0 ? analysis.totalTime / analysis.attempts : 0;

        // 변별력 지수 계산 (간단 버전: 상위 27%와 하위 27%의 정답률 차이)
        const sortedResults = examResults
          .map((r) => r.totalScore || 0)
          .sort((a, b) => b - a);
        const top27Percentile = Math.ceil(sortedResults.length * 0.27);
        const bottom27Percentile = Math.ceil(sortedResults.length * 0.73);

        // TODO: 실제로는 상위/하위 집단에서 이 문제의 정답률을 계산해야 함
        // 현재는 간단한 버전으로 제공
        const discriminationIndex = correctRate * 0.5; // 플레이스홀더

        // 난이도 지수 (정답률이 낮을수록 어려움)
        const difficultyIndex = 1 - correctRate;

        // 가장 많이 선택한 오답
        let commonWrongAnswer: string | null = null;
        let maxCount = 0;
        analysis.wrongAnswers.forEach((count, answer) => {
          if (count > maxCount) {
            maxCount = count;
            commonWrongAnswer = answer;
          }
        });

        // 이슈 추천
        const issues: string[] = [];
        if (correctRate < 0.3) {
          issues.push('너무 어려움');
        } else if (correctRate > 0.9) {
          issues.push('너무 쉬움');
        }
        if (averageTime > 120) {
          issues.push('소요 시간이 과도함');
        }
        if (discriminationIndex < 0.2) {
          issues.push('변별력 부족');
        }

        return {
          questionId: analysis.questionId,
          correctRate: Math.round(correctRate * 100 * 100) / 100,
          averageTime: Math.round(averageTime),
          discriminationIndex: Math.round(discriminationIndex * 100) / 100,
          difficultyIndex: Math.round(difficultyIndex * 100) / 100,
          commonWrongAnswer,
          issues,
          attempts: analysis.attempts,
        };
      });

      // 점수 분포
      const scoreDistribution = [
        { range: '90-100', count: 0 },
        { range: '80-89', count: 0 },
        { range: '70-79', count: 0 },
        { range: '60-69', count: 0 },
        { range: '0-59', count: 0 },
      ];

      examResults.forEach((result) => {
        const percentage = typeof result.percentage === 'number' 
          ? result.percentage 
          : result.percentage ? Number(result.percentage) : 0;
        if (percentage >= 90) {
          scoreDistribution[0].count++;
        } else if (percentage >= 80) {
          scoreDistribution[1].count++;
        } else if (percentage >= 70) {
          scoreDistribution[2].count++;
        } else if (percentage >= 60) {
          scoreDistribution[3].count++;
        } else {
          scoreDistribution[4].count++;
        }
      });

      // 평균 점수 향상율 계산 (첫 시도 vs 마지막 시도)
      let improvementRate = 0;
      if (examResults.length >= 2) {
        const userFirstLast = new Map<
          string,
          { first: number; last: number }
        >();
        examResults.forEach((result) => {
          const percentage = typeof result.percentage === 'number' 
            ? result.percentage 
            : result.percentage ? Number(result.percentage) : 0;
          const existing = userFirstLast.get(result.userId) || {
            first: percentage,
            last: percentage,
          };
          userFirstLast.set(result.userId, {
            first: existing.first,
            last: percentage,
          });
        });

        const improvements = Array.from(userFirstLast.values())
          .map((v) => v.last - v.first)
          .filter((imp) => imp > 0);
        improvementRate =
          improvements.length > 0
            ? improvements.reduce((sum, imp) => sum + imp, 0) /
              improvements.length
            : 0;
      }

      // 추천사항 생성
      const recommendations: string[] = [];
      questionAnalysis.forEach((qa, index) => {
        if (qa.correctRate < 40) {
          recommendations.push(
            `문제 ${index + 1}번의 난이도 조정 권장 (정답률 ${qa.correctRate}%)`,
          );
        }
        if (qa.issues.length > 0) {
          recommendations.push(
            `문제 ${index + 1}번: ${qa.issues.join(', ')}`,
          );
        }
      });

      return {
        examStats: {
          totalAttempts,
          completedResults,
          completionRate: Math.round(completionRate * 100 * 100) / 100,
          averageScore: Math.round(averageScore * 100) / 100,
          averageTimeSpent: Math.round(averageTimeSpent * 100) / 100,
        },
        questionAnalysis,
        userPatterns: {
          scoreDistribution,
          improvementRate: Math.round(improvementRate * 100) / 100,
        },
        recommendations,
      };
    });
  }

  /**
   * 사용자 학습 패턴 분석 (관리자용)
   */
  async getUserLearningPattern(userId: string) {
    return this.prisma.executeWithRetry(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`사용자를 찾을 수 없습니다. ID: ${userId}`);
      }

      // 지난 30일 데이터
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // 시험 결과 조회
      const examResults = await this.prisma.examResult.findMany({
        where: {
          userId,
          status: 'completed',
          startedAt: { gte: thirtyDaysAgo },
        },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { startedAt: 'asc' },
      });

      // 참여도 메트릭
      const activeDays = new Set(
        examResults.map((r) =>
          r.startedAt.toISOString().split('T')[0],
        ),
      ).size;

      const totalTimeSpent = examResults.reduce(
        (sum, r) => sum + (r.timeSpent || 0),
        0,
      );
      const averageSessionLength =
        examResults.length > 0 ? totalTimeSpent / examResults.length / 60 : 0; // 분

      // 일관성 계산 (학습 빈도의 일관성)
      const dailyCounts = new Map<string, number>();
      examResults.forEach((r) => {
        const date = r.startedAt.toISOString().split('T')[0];
        dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
      });
      const counts = Array.from(dailyCounts.values());
      const avgDailyCount =
        counts.length > 0
          ? counts.reduce((sum, c) => sum + c, 0) / counts.length
          : 0;
      const variance =
        counts.length > 0
          ? counts.reduce(
              (sum, c) => sum + Math.pow(c - avgDailyCount, 2),
              0,
            ) / counts.length
          : 0;
      const consistency = Math.max(0, 1 - variance / (avgDailyCount + 1)); // 0-1 스케일

      // 성능 트렌드
      const scores = examResults.map((r) => {
        const p = r.percentage;
        return typeof p === 'number' ? p : p ? Number(p) : 0;
      });
      let improvementRate = 0;
      let volatility = 0;

      if (scores.length >= 2) {
        // 주당 점수 향상률 (간단 계산)
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        const firstAvg =
          firstHalf.length > 0
            ? firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length
            : 0;
        const secondAvg =
          secondHalf.length > 0
            ? secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length
            : 0;
        improvementRate = secondAvg - firstAvg;

        // 변동성 (표준편차 대신 간단한 계산)
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const varianceScore =
          scores.length > 0
            ? scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) /
              scores.length
            : 0;
        volatility = Math.sqrt(varianceScore) / 100; // 0-1 스케일로 정규화
      }

      // 최고 성능 시간대 찾기
      const hourPerformance = new Map<number, { total: number; count: number }>();
      examResults.forEach((r) => {
        const hour = r.startedAt.getHours();
        const existing = hourPerformance.get(hour) || { total: 0, count: 0 };
        hourPerformance.set(hour, {
          total: existing.total + (typeof r.percentage === 'number' ? r.percentage : r.percentage ? Number(r.percentage) : 0),
          count: existing.count + 1,
        });
      });

      let peakHour = 14; // 기본값: 오후 2시
      let peakPerformance = '';
      let maxAvg = 0;
      hourPerformance.forEach((stats, hour) => {
        const avg = stats.total / stats.count;
        if (avg > maxAvg) {
          maxAvg = avg;
          peakHour = hour;
        }
      });

      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const dayPerformance = new Map<number, { total: number; count: number }>();
      examResults.forEach((r) => {
        const day = r.startedAt.getDay();
        const existing = dayPerformance.get(day) || { total: 0, count: 0 };
        dayPerformance.set(day, {
          total: existing.total + (typeof r.percentage === 'number' ? r.percentage : r.percentage ? Number(r.percentage) : 0),
          count: existing.count + 1,
        });
      });

      let peakDay = 3; // 기본값: 목요일
      let maxDayAvg = 0;
      dayPerformance.forEach((stats, day) => {
        const avg = stats.total / stats.count;
        if (avg > maxDayAvg) {
          maxDayAvg = avg;
          peakDay = day;
        }
      });

      peakPerformance = `${dayNames[peakDay]} 오후 ${peakHour}시`;

      // 리스크 팩터 분석
      const riskFactors: any[] = [];
      const recentWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentResults = examResults.filter((r) => r.startedAt >= recentWeek);
      const olderResults = examResults.filter((r) => r.startedAt < recentWeek);

      if (olderResults.length > 0 && recentResults.length > 0) {
        const olderAvg = olderResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / olderResults.length;
        const recentAvg = recentResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / recentResults.length;
        const decline = (olderAvg - recentAvg) / olderAvg;

        if (decline > 0.3) {
          riskFactors.push({
            type: 'engagement_decline',
            severity: 'medium',
            description: `최근 1주일 학습 시간 ${Math.round(decline * 100)}% 감소`,
            suggestedAction: '학습 계획 확인 및 동기 부여 필요',
          });
        }
      }

      // 강점/약점 분석 (간단 버전)
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (averageSessionLength > 60) {
        strengths.push('긴 세션 지속 능력');
      }
      if (consistency > 0.8) {
        strengths.push('일관된 학습 습관');
      }
      if (improvementRate > 5) {
        strengths.push('지속적인 성적 향상');
      }

      if (volatility > 0.2) {
        weaknesses.push('점수 변동성이 큼');
      }
      if (consistency < 0.5) {
        weaknesses.push('학습 일관성 부족');
      }

      return {
        engagementMetrics: {
          activeDays,
          averageSessionLength: Math.round(averageSessionLength * 100) / 100,
          consistency: Math.round(consistency * 100) / 100,
        },
        performanceTrends: {
          improvementRate: Math.round(improvementRate * 100) / 100,
          volatility: Math.round(volatility * 100) / 100,
          peakPerformance,
        },
        riskFactors,
        strengths,
        weaknesses,
      };
    });
  }

  /**
   * 문제 목록 조회 (검색 및 필터링 지원)
   */
  async getQuestions(params: {
    search?: string;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    examId?: string;
    limit?: number;
  }) {
    const where: any = {};

    // 검색어 필터 (제목, 내용)
    if (params.search) {
      where.OR = [
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // 태그 필터
    if (params.tags && params.tags.length > 0) {
      where.tags = { hasSome: params.tags };
    }

    // 난이도 필터
    if (params.difficulty) {
      where.difficulty = params.difficulty;
    }

    // 시험 필터
    if (params.examId) {
      where.section = {
        examId: params.examId,
      };
    }

    const questions = await this.prisma.question.findMany({
      where,
      include: {
        section: {
          select: {
            id: true,
            title: true,
            examId: true,
            exam: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit || 100,
    });

    return {
      data: questions.map((q) => ({
        id: q.id,
        content: q.content,
        questionType: q.questionType,
        difficulty: q.difficulty,
        tags: q.tags,
        points: q.points,
        section: q.section,
        usageCount: q.usageCount || 0,
        lastUsedAt: q.lastUsedAt,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
    };
  }
}

