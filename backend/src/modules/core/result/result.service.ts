import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { ResultQueryDto } from './dto/result-query.dto';

@Injectable()
export class ResultService {
  constructor(private prisma: PrismaService) {}

  /**
   * 내 시험 결과 목록 조회
   */
  async findAll(userId: string, query: ResultQueryDto) {
    try {
      const { page = 1, limit = 10, examId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (examId) where.examId = examId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.examResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.examResult.count({ where }),
    ]);

      return {
        data: data.map((result) => ({
          id: result.id,
          examId: result.examId,
          examTitle: result.exam?.title || '알 수 없음',
          status: result.status,
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          percentage: result.percentage,
          timeSpent: result.timeSpent,
          startedAt: result.startedAt,
          submittedAt: result.submittedAt,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('❌ findAll (ResultService) 에러:', {
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
   * 시험 결과 상세 조회
   */
  async findOne(id: string, userId: string) {
    const result = await this.prisma.examResult.findUnique({
      where: { id },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
        sectionResults: {
          include: {
            section: {
              select: {
                id: true,
                title: true,
              },
            },
            questionResults: {
              include: {
                question: {
                  select: {
                    id: true,
                    questionNumber: true,
                    correctAnswer: true,
                  },
                },
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

    if (!result) {
      throw new NotFoundException(`시험 결과를 찾을 수 없습니다. ID: ${id}`);
    }

    // 본인의 결과만 조회 가능 (Phase 3에서 더 엄격하게 구현)
    if (result.userId !== userId) {
      throw new ForbiddenException('본인의 시험 결과만 조회할 수 있습니다.');
    }

    return {
      id: result.id,
      examId: result.examId,
      examTitle: result.exam.title,
      status: result.status,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage,
      timeSpent: result.timeSpent,
      sectionResults: result.sectionResults.map((sr) => ({
        id: sr.id,
        sectionId: sr.sectionId,
        sectionTitle: sr.section.title,
        correctCount: sr.correctCount,
        incorrectCount: sr.incorrectCount,
        unansweredCount: sr.unansweredCount,
        score: sr.score,
        maxScore: sr.maxScore,
      })),
      questionResults: result.sectionResults.flatMap((sr) =>
        sr.questionResults.map((qr) => ({
          id: qr.id,
          questionId: qr.questionId,
          questionNumber: qr.question.questionNumber,
          userAnswer: qr.userAnswer,
          correctAnswer: qr.question.correctAnswer,
          isCorrect: qr.isCorrect,
          pointsEarned: qr.pointsEarned,
          pointsPossible: qr.pointsPossible,
        })),
      ),
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
    };
  }
}

