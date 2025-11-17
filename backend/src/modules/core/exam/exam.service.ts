import { Injectable, NotFoundException, Inject, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { MetricsService } from '../../../common/services/metrics.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto } from './dto/exam-query.dto';

@Injectable()
export class ExamService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    @Optional() @Inject(MetricsService) private metricsService?: MetricsService,
  ) {}

  async findAll(query: ExamQueryDto) {
    const { page = 1, limit = 10, examType, subject, isPublic, categoryId, subcategoryId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExamWhereInput & { categoryId?: string; subcategoryId?: string } = {
      deletedAt: null, // Soft delete 필터
    };
    if (examType) where.examType = examType;
    if (subject) where.subject = subject;
    if (isPublic !== undefined) where.isPublic = isPublic;
    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;

    const include: Prisma.ExamInclude & {
      category?: { select: { id: true; name: true; icon: true } };
      subcategory?: { select: { id: true; name: true; icon: true } };
    } = {
      config: true,
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include,
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
    const include: Prisma.ExamInclude & {
      category?: { select: { id: true; name: true; icon: true } };
      subcategory?: { select: { id: true; name: true; icon: true } };
    } = {
      config: true,
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      subcategory: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
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
    };

    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include,
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${id}`);
    }

    return exam;
  }

  async create(createExamDto: CreateExamDto, userId?: string) {
    const { config, isAdaptive, adaptiveConfig, ...examData } = createExamDto;

    const data: Prisma.ExamCreateInput & {
      isAdaptive?: boolean;
      adaptiveConfig?: Prisma.InputJsonValue | null;
      category?: { connect: { id: string } };
      subcategory?: { connect: { id: string } };
    } = {
      ...examData,
      isAdaptive: isAdaptive || false,
      adaptiveConfig: adaptiveConfig ? (adaptiveConfig as Prisma.InputJsonValue) : undefined,
      ...(userId ? { createdBy: { connect: { id: userId } } } : {}),
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
    };

    // categoryId와 subcategoryId가 있으면 연결
    if (examData.categoryId) {
      data.category = { connect: { id: examData.categoryId } };
    }
    if (examData.subcategoryId) {
      data.subcategory = { connect: { id: examData.subcategoryId } };
    }

    // 시험 생성
    const exam = await this.prisma.exam.create({
      data,
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

    const { config, isAdaptive, adaptiveConfig, ...examData } = updateExamDto;

    // 시험 업데이트
    const updateData: Prisma.ExamUpdateInput & {
      isAdaptive?: boolean;
      adaptiveConfig?: Prisma.InputJsonValue | null;
      category?: { connect: { id: string } } | { disconnect: true };
      subcategory?: { connect: { id: string } } | { disconnect: true };
    } = {
      ...examData,
    };

    if (isAdaptive !== undefined) {
      updateData.isAdaptive = isAdaptive;
    }

    if (adaptiveConfig !== undefined) {
      updateData.adaptiveConfig = adaptiveConfig ? (adaptiveConfig as Prisma.InputJsonValue) : undefined;
    }

    // categoryId와 subcategoryId 업데이트
    if (examData.categoryId !== undefined) {
      updateData.category = examData.categoryId 
        ? { connect: { id: examData.categoryId } }
        : { disconnect: true };
    }
    if (examData.subcategoryId !== undefined) {
      updateData.subcategory = examData.subcategoryId
        ? { connect: { id: examData.subcategoryId } }
        : { disconnect: true };
    }

    const exam = await this.prisma.exam.update({
      where: { id },
      data: {
        ...updateData,
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

    // 캐시 무효화
    const cacheKey = CacheService.createKey('exam', id);
    await this.cacheService.del(cacheKey);

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

