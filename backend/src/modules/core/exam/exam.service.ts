import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto } from './dto/exam-query.dto';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ExamQueryDto) {
    const { page = 1, limit = 10, examType, subject, isPublic } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (examType) where.examType = examType;
    if (subject) where.subject = subject;
    if (isPublic !== undefined) where.isPublic = isPublic;
    where.deletedAt = null; // Soft delete 필터

    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          config: true,
        },
      }),
      this.prisma.exam.count({ where }),
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
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        config: true,
        sections: {
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${id}`);
    }

    return exam;
  }

  async create(createExamDto: CreateExamDto, userId?: string) {
    const { config, ...examData } = createExamDto;

    // 시험 생성
    const exam = await this.prisma.exam.create({
      data: {
        ...examData,
        createdBy: userId,
        config: config
          ? {
              create: {
                allowSectionNavigation: config.allowSectionNavigation ?? true,
                allowQuestionReview: config.allowQuestionReview ?? true,
                showAnswerAfterSubmit: config.showAnswerAfterSubmit ?? true,
                showScoreImmediately: config.showScoreImmediately ?? true,
                timeLimitPerSection: config.timeLimitPerSection ?? false,
                shuffleQuestions: config.shuffleQuestions ?? false,
                shuffleOptions: config.shuffleOptions ?? false,
                preventTabSwitch: config.preventTabSwitch ?? false,
              },
            }
          : undefined,
      },
      include: {
        config: true,
      },
    });

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    // 시험 존재 확인
    const existingExam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingExam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${id}`);
    }

    const { config, ...examData } = updateExamDto;

    // 시험 업데이트
    const exam = await this.prisma.exam.update({
      where: { id },
      data: {
        ...examData,
        config: config
          ? {
              update: {
                allowSectionNavigation: config.allowSectionNavigation,
                allowQuestionReview: config.allowQuestionReview,
                showAnswerAfterSubmit: config.showAnswerAfterSubmit,
                showScoreImmediately: config.showScoreImmediately,
                timeLimitPerSection: config.timeLimitPerSection,
                shuffleQuestions: config.shuffleQuestions,
                shuffleOptions: config.shuffleOptions,
                preventTabSwitch: config.preventTabSwitch,
              },
            }
          : undefined,
      },
      include: {
        config: true,
      },
    });

    return exam;
  }

  async remove(id: string) {
    // Soft delete
    const exam = await this.prisma.exam.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${id}`);
    }

    return { message: '시험이 삭제되었습니다.' };
  }
}

