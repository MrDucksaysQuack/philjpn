import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ExamType, Difficulty, QuestionType } from '../../../common/types';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { QuestionPoolService } from './question-pool.service';
import { SeededRandom } from '../../../common/utils/seeded-random';

@Injectable()
export class TemplateService {
  constructor(
    private prisma: PrismaService,
    private questionPoolService: QuestionPoolService,
  ) {}

  /**
   * 템플릿 생성
   */
  async createTemplate(userId: string, createDto: CreateTemplateDto) {
    return this.prisma.examTemplate.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        structure: createDto.structure as unknown as Prisma.InputJsonValue,
        questionPoolIds: createDto.questionPoolIds || [],
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 템플릿 목록 조회
   */
  async getTemplates(userId?: string) {
    const where: Prisma.ExamTemplateWhereInput = {};
    
    // 관리자가 아니면 본인이 만든 템플릿만 조회
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      
      if (user?.role !== 'admin') {
        where.createdBy = userId;
      }
    }

    return this.prisma.examTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            exams: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 템플릿 상세 조회
   */
  async getTemplate(templateId: string, userId?: string) {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id: templateId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            exams: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`템플릿을 찾을 수 없습니다. ID: ${templateId}`);
    }

    // 관리자가 아니면 본인이 만든 템플릿만 조회 가능
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      
      if (user?.role !== 'admin' && template.createdBy !== userId) {
        throw new ForbiddenException('본인이 만든 템플릿만 조회할 수 있습니다.');
      }
    }

    return template;
  }

  /**
   * 템플릿 수정
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    updateData: Partial<CreateTemplateDto>,
  ) {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`템플릿을 찾을 수 없습니다. ID: ${templateId}`);
    }

    // 관리자가 아니면 본인이 만든 템플릿만 수정 가능
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'admin' && template.createdBy !== userId) {
      throw new ForbiddenException('본인이 만든 템플릿만 수정할 수 있습니다.');
    }

    return this.prisma.examTemplate.update({
      where: { id: templateId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.structure && { structure: updateData.structure as unknown as Prisma.InputJsonValue }),
        ...(updateData.questionPoolIds && { questionPoolIds: updateData.questionPoolIds }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 템플릿 삭제
   */
  async deleteTemplate(templateId: string, userId: string) {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: {
            exams: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`템플릿을 찾을 수 없습니다. ID: ${templateId}`);
    }

    // 관리자가 아니면 본인이 만든 템플릿만 삭제 가능
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'admin' && template.createdBy !== userId) {
      throw new ForbiddenException('본인이 만든 템플릿만 삭제할 수 있습니다.');
    }

    // 템플릿을 사용하는 시험이 있으면 삭제 불가
    if (template._count.exams > 0) {
      throw new ForbiddenException(
        `이 템플릿을 사용하는 시험이 ${template._count.exams}개 있습니다. 먼저 해당 시험을 삭제해주세요.`,
      );
    }

    await this.prisma.examTemplate.delete({
      where: { id: templateId },
    });

    return { message: '템플릿이 삭제되었습니다.' };
  }

  /**
   * 템플릿으로부터 시험 생성
   */
  async createExamFromTemplate(
    templateId: string,
    userId: string,
    examData: {
      title: string;
      description?: string;
      examType: string;
      subject?: string;
      overrides?: {
        questionCount?: number;
        structure?: Prisma.InputJsonValue;
        randomSeed?: number; // 랜덤 시드 (재현성 보장)
      };
    },
  ) {
    const template = await this.getTemplate(templateId, userId);

    // 템플릿 구조 가져오기
    interface SectionDef {
      type?: string;
      description?: string;
      questionPoolId?: string;
      tags?: string[];
      difficulty?: string;
      questionCount?: number;
    }
    
    const structure = template.structure as Prisma.JsonValue;
    const sections: SectionDef[] = (structure && typeof structure === 'object' && 'sections' in structure) 
      ? ((structure as { sections?: SectionDef[] }).sections || [])
      : [];

    // 랜덤 시드 생성 (제공되지 않으면 타임스탬프 사용)
    const randomSeed = examData.overrides?.randomSeed || Date.now();

    // 새 시험 생성
    const examDataInput: Prisma.ExamCreateInput & {
      randomSeed?: number;
    } = {
      title: examData.title,
      description: examData.description,
      examType: examData.examType as ExamType,
      subject: examData.subject,
      ...(userId ? { createdBy: { connect: { id: userId } } } : {}),
      template: { connect: { id: templateId } },
      randomSeed: randomSeed,
      totalQuestions: 0,
      totalSections: sections.length,
    };

    const exam = await this.prisma.exam.create({
      data: examDataInput,
    });

    // 섹션 및 문제 생성
    let sectionOrder = 1;

    for (const sectionDef of sections) {
      let filteredQuestions: Array<{
        id: string;
        content: string;
        options: Prisma.JsonValue;
        correctAnswer: string;
        explanation?: string | null;
        points: number;
        difficulty?: string | null;
        tags: string[];
        questionType: string;
      }> = [];

      // 우선순위 1: questionPoolId가 있으면 Pool에서 문제 선택
      if (sectionDef.questionPoolId) {
        try {
          const pool = await this.questionPoolService.getQuestionPool(
            sectionDef.questionPoolId,
            userId,
          );
          
          if (pool.questionIds && pool.questionIds.length > 0) {
            // Pool의 questionIds로 문제 조회
            filteredQuestions = await this.prisma.question.findMany({
              where: {
                id: { in: pool.questionIds },
              },
              include: {
                section: {
                  include: {
                    exam: true,
                  },
                },
              },
            });
          }
        } catch (error) {
          // Pool을 찾을 수 없으면 태그/난이도 기반 필터링으로 fallback
          console.warn(`Question Pool ${sectionDef.questionPoolId} not found, falling back to tag/difficulty filter`);
        }
      }

      // 우선순위 2: questionPoolId가 없거나 Pool에 문제가 없으면 태그/난이도 기반 필터링
      if (filteredQuestions.length === 0) {
        const whereClause: Prisma.QuestionWhereInput = {};
        
        // 태그 필터
        if (sectionDef.tags && sectionDef.tags.length > 0) {
          whereClause.tags = { hasSome: sectionDef.tags };
        }
        
        // 난이도 필터
        if (sectionDef.difficulty) {
          const difficulty = sectionDef.difficulty as Difficulty;
          if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
            whereClause.difficulty = difficulty;
          }
        }

        filteredQuestions = await this.prisma.question.findMany({
          where: whereClause,
          include: {
            section: {
              include: {
                exam: true,
              },
            },
          },
        });
      }

      // 무작위로 문제 선택 (시드 기반 결정적 랜덤)
      const questionCount = examData.overrides?.questionCount
        ? Math.min(
            examData.overrides.questionCount,
            sectionDef.questionCount || filteredQuestions.length,
          )
        : sectionDef.questionCount || filteredQuestions.length;

      // 시드 기반 결정적 랜덤 선택
      // 섹션별로 다른 시드 사용 (섹션 인덱스 추가)
      const sectionSeed = randomSeed + sectionOrder;
      const rng = new SeededRandom(sectionSeed);
      const selectedQuestions = rng
        .shuffle(filteredQuestions)
        .slice(0, Math.min(questionCount, filteredQuestions.length));

      // 섹션 생성
      const section = await this.prisma.section.create({
        data: {
          examId: exam.id,
          title: sectionDef.type || 'Section',
          description: sectionDef.description,
          order: sectionOrder++,
          questionCount: selectedQuestions.length,
        },
      });


      // 문제 복제 및 생성
      let questionNumber = 1;
      for (const question of selectedQuestions) {
        await this.prisma.question.create({
          data: {
            sectionId: section.id,
            questionNumber: questionNumber++,
            content: question.content,
            options: question.options as Prisma.InputJsonValue,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            points: question.points,
            difficulty: question.difficulty as Difficulty | null | undefined,
            tags: question.tags,
            questionType: question.questionType as QuestionType,
          },
        });
      }
    }

    // 시험 총 문제 수 업데이트 (섹션 정보 재조회)
    const sectionsWithCount = await this.prisma.section.findMany({
      where: { examId: exam.id },
      select: { questionCount: true },
    });
    const totalQuestions = sectionsWithCount.reduce(
      (sum, s) => sum + (s.questionCount || 0),
      0,
    );

    const updatedExam = await this.prisma.exam.update({
      where: { id: exam.id },
      data: {
        totalQuestions,
      },
      include: {
        sections: true,
        template: true,
      },
    });

    return updatedExam;
  }
}

