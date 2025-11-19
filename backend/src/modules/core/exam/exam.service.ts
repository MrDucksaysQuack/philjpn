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
      isActive: true, // 활성화된 시험만
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
      where: { id, isActive: true },
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
      where: { id, isActive: true },
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
    // Soft delete - isActive를 false로 설정
    const exam = await this.prisma.exam.update({
      where: { id },
      data: { isActive: false },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${id}`);
    }

    return { message: '시험이 삭제되었습니다.' };
  }

  /**
   * 시험 복제 (Clone)
   * 기존 시험을 복사하여 새 시험 생성
   * 구조/섹션/문제 그대로 유지
   * @param id 원본 시험 ID
   * @param userId 사용자 ID
   * @param newTitle 새 시험 제목
   * @param createVersion 버전 생성 여부
   * @param version 버전 식별자 (예: "A", "B", "C")
   * @param shuffleQuestions 문제 순서 섞기 여부
   */
  async clone(
    id: string,
    userId?: string,
    newTitle?: string,
    createVersion?: boolean,
    version?: string,
    shuffleQuestions?: boolean,
  ) {
    // 원본 시험 조회 (섹션 및 문제 포함)
    const originalExam = await this.prisma.exam.findFirst({
      where: { id, isActive: true },
      include: {
        config: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { questionNumber: 'asc' },
            },
          },
        },
        category: true,
        subcategory: true,
      },
    });

    if (!originalExam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${id}`);
    }

    // 버전 관리: 원본 시험 ID 결정 (원본이 버전이면 원본의 parentExamId 사용)
    const parentExamId = (originalExam as any).parentExamId || id;
    
    // 버전 번호 계산
    let versionNumber = 1;
    let versionIdentifier = version;
    
    if (createVersion) {
      // 기존 버전들 조회
      const existingVersions = await this.prisma.exam.findMany({
        where: {
          OR: [
            { id: parentExamId },
            { parentExamId: parentExamId } as any,
          ],
        },
        select: {
          version: true,
          versionNumber: true,
        } as any,
      });

      // 다음 버전 번호 계산
      const maxVersionNumber = existingVersions
        .map((v: any) => v.versionNumber || 0)
        .reduce((max, num) => Math.max(max, num), 0);
      versionNumber = maxVersionNumber + 1;

      // 버전 식별자 자동 생성 (없는 경우)
      if (!versionIdentifier) {
        // A, B, C, ... 순서로 생성
        const versionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const usedVersions = existingVersions
          .map((v: any) => v.version)
          .filter((v: any) => v && versionLetters.includes(v))
          .sort();
        
        // 사용되지 않은 첫 번째 버전 문자 찾기
        versionIdentifier = versionLetters.find((v) => !usedVersions.includes(v)) || 
          versionLetters[versionNumber - 1] || `V${versionNumber}`;
      }
    }

    // 새 시험 생성
    const clonedExamData: Prisma.ExamCreateInput = {
      title: newTitle || (createVersion 
        ? `${originalExam.title} (버전 ${versionIdentifier})`
        : `${originalExam.title} (복사본)`),
      description: originalExam.description,
      examType: originalExam.examType,
      subject: originalExam.subject,
      difficulty: originalExam.difficulty,
      estimatedTime: originalExam.estimatedTime,
      passingScore: originalExam.passingScore,
      isActive: false, // 복제된 시험은 기본적으로 비활성화
      isPublic: false, // 복제된 시험은 기본적으로 비공개
      isAdaptive: originalExam.isAdaptive,
      adaptiveConfig: originalExam.adaptiveConfig as Prisma.InputJsonValue,
      ...(userId ? { createdBy: { connect: { id: userId } } } : {}),
      ...(originalExam.categoryId ? { category: { connect: { id: originalExam.categoryId } } } : {}),
      ...(originalExam.subcategoryId ? { subcategory: { connect: { id: originalExam.subcategoryId } } } : {}),
      // 버전 관리 필드
      ...(createVersion ? {
        parentExam: { connect: { id: parentExamId } },
        version: versionIdentifier,
        versionNumber: versionNumber,
      } : {}),
    };

    // ExamConfig 복제
    if (originalExam.config) {
      clonedExamData.config = {
        create: {
          allowSectionNavigation: originalExam.config.allowSectionNavigation,
          allowQuestionReview: originalExam.config.allowQuestionReview,
          showAnswerAfterSubmit: originalExam.config.showAnswerAfterSubmit,
          showScoreImmediately: originalExam.config.showScoreImmediately,
          timeLimitPerSection: originalExam.config.timeLimitPerSection,
          shuffleQuestions: originalExam.config.shuffleQuestions,
          shuffleOptions: originalExam.config.shuffleOptions,
          preventTabSwitch: originalExam.config.preventTabSwitch,
        },
      };
    }

    // 섹션 및 문제 복제
    if (originalExam.sections && originalExam.sections.length > 0) {
      clonedExamData.sections = {
        create: originalExam.sections.map((section) => {
          // 문제 순서 처리 (섞기 옵션이 있으면 섞기)
          let questions = [...section.questions];
          if (shuffleQuestions && questions.length > 0) {
            // Fisher-Yates 셔플 알고리즘
            for (let i = questions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [questions[i], questions[j]] = [questions[j], questions[i]];
            }
          }

          return {
            title: section.title,
            description: section.description,
            order: section.order,
            questionCount: section.questionCount,
            timeLimit: section.timeLimit,
            questions: {
              create: questions.map((question, index) => ({
                questionNumber: index + 1, // 섞인 경우 순서 재정렬
                questionType: question.questionType,
                content: question.content,
                options: question.options as Prisma.InputJsonValue,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                points: question.points,
                difficulty: question.difficulty,
                tags: question.tags,
                imageUrl: question.imageUrl,
                audioUrl: question.audioUrl,
                audioPlayLimit: question.audioPlayLimit,
                usageCount: 1, // 복제된 문제는 새 시험에 사용되므로 1로 시작
                lastUsedAt: new Date(),
                ...(question.questionBankId ? { questionBank: { connect: { id: question.questionBankId } } } : {}),
              })),
            },
          };
        }),
      };
    }

    // 시험 생성
    const clonedExam = await this.prisma.exam.create({
      data: clonedExamData,
      include: {
        config: true,
        sections: {
          include: {
            questions: true,
          },
        },
      },
    });

    // 총 문제 수 및 섹션 수 업데이트
    const totalQuestions = clonedExam.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0,
    );

    await this.prisma.exam.update({
      where: { id: clonedExam.id },
      data: {
        totalQuestions,
        totalSections: clonedExam.sections.length,
      },
    });

    // 버전별 문제 순서 저장 (버전 생성 시)
    if (createVersion && clonedExam.sections.length > 0) {
      const questionOrder: Record<string, string[]> = {};
      clonedExam.sections.forEach((section) => {
        questionOrder[section.id] = section.questions.map((q) => q.id);
      });

      await (this.prisma as any).examVersion.create({
        data: {
          examId: clonedExam.id,
          version: versionIdentifier!,
          versionNumber: versionNumber,
          questionOrder: questionOrder as Prisma.InputJsonValue,
        },
      });
    }

    return {
      ...clonedExam,
      totalQuestions,
      totalSections: clonedExam.sections.length,
      version: createVersion ? versionIdentifier : undefined,
      versionNumber: createVersion ? versionNumber : undefined,
    };
  }

  /**
   * 시험 버전 목록 조회
   */
  async getVersions(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        parentExamId: true,
        version: true,
        versionNumber: true,
      } as any,
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    // 원본 시험 ID 결정
    const parentExamId = (exam as any).parentExamId || exam.id;

    // 원본 시험 및 모든 버전 조회
    const versions = await this.prisma.exam.findMany({
      where: {
        OR: [
          { id: parentExamId },
          { parentExamId: parentExamId } as any,
        ],
      },
      select: {
        id: true,
        title: true,
        version: true,
        versionNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      } as any,
      orderBy: [
        { versionNumber: 'asc' } as any,
        { createdAt: 'asc' },
      ],
    });

    return versions;
  }
}

