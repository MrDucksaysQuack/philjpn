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
   * Pool의 usedByTemplateIds 동기화 (Helper 메서드)
   * Template 생성/수정/삭제 시 Pool의 역방향 참조를 업데이트
   */
  private async syncPoolTemplateReferences(
    templateId: string,
    oldPoolIds: string[],
    newPoolIds: string[],
  ) {
    // 제거된 Pool들: oldPoolIds에만 있는 것들
    const removedPoolIds = oldPoolIds.filter((id) => !newPoolIds.includes(id));
    // 추가된 Pool들: newPoolIds에만 있는 것들
    const addedPoolIds = newPoolIds.filter((id) => !oldPoolIds.includes(id));

    // 제거된 Pool들에서 templateId 제거
    for (const poolId of removedPoolIds) {
      const pool = await this.prisma.questionPool.findUnique({
        where: { id: poolId },
        select: { usedByTemplateIds: true },
      });

      if (pool) {
        const currentIds = (pool as any).usedByTemplateIds || [];
        await this.prisma.questionPool.update({
          where: { id: poolId },
          data: {
            usedByTemplateIds: currentIds.filter(
              (id: string) => id !== templateId,
            ),
          } as any,
        });
      }
    }

    // 추가된 Pool들에 templateId 추가
    for (const poolId of addedPoolIds) {
      const pool = await this.prisma.questionPool.findUnique({
        where: { id: poolId },
        select: { usedByTemplateIds: true },
      });

      const currentIds = (pool as any).usedByTemplateIds || [];
      if (pool && !currentIds.includes(templateId)) {
        await this.prisma.questionPool.update({
          where: { id: poolId },
          data: {
            usedByTemplateIds: [...currentIds, templateId],
          } as any,
        });
      }
    }
  }

  /**
   * 템플릿 생성
   */
  async createTemplate(userId: string, createDto: CreateTemplateDto) {
    const questionPoolIds = createDto.questionPoolIds || [];
    
    const template = await this.prisma.examTemplate.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        structure: createDto.structure as unknown as Prisma.InputJsonValue,
        questionPoolIds,
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

    // Pool의 usedByTemplateIds 동기화
    if (questionPoolIds.length > 0) {
      await this.syncPoolTemplateReferences(template.id, [], questionPoolIds);
    }

    return template;
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

    const oldPoolIds = template.questionPoolIds || [];
    const newPoolIds = updateData.questionPoolIds || oldPoolIds;

    const updatedTemplate = await this.prisma.examTemplate.update({
      where: { id: templateId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.structure && { structure: updateData.structure as unknown as Prisma.InputJsonValue }),
        ...(updateData.questionPoolIds !== undefined && { questionPoolIds: updateData.questionPoolIds }),
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

    // Pool의 usedByTemplateIds 동기화 (변경된 경우만)
    if (updateData.questionPoolIds !== undefined) {
      await this.syncPoolTemplateReferences(templateId, oldPoolIds, newPoolIds);
    }

    return updatedTemplate;
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

    const poolIds = template.questionPoolIds || [];

    // 템플릿 삭제
    await this.prisma.examTemplate.delete({
      where: { id: templateId },
    });

    // Pool의 usedByTemplateIds에서 templateId 제거
    if (poolIds.length > 0) {
      await this.syncPoolTemplateReferences(templateId, poolIds, []);
    }

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
        questionBankId?: string | null;
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
              select: {
                id: true,
                content: true,
                options: true,
                correctAnswer: true,
                explanation: true,
                points: true,
                difficulty: true,
                tags: true,
                questionType: true,
                questionBankId: true,
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
          select: {
            id: true,
            content: true,
            options: true,
            correctAnswer: true,
            explanation: true,
            points: true,
            difficulty: true,
            tags: true,
            questionType: true,
            questionBankId: true,
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
        // 새 시험에 문제가 사용되므로 원본 문제의 usageCount 증가
        if (question.id) {
          await this.prisma.question.update({
            where: { id: question.id },
            data: {
              usageCount: { increment: 1 },
              lastUsedAt: new Date(),
            } as any,
          });
        }

        // 새 문제 생성 (복제)
        const questionData: any = {
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
          usageCount: 1, // 새로 생성된 문제는 시험에 포함되므로 1로 시작
          lastUsedAt: new Date(),
        };

        // questionBankId가 있으면 연결
        if (question.questionBankId) {
          questionData.questionBank = { connect: { id: question.questionBankId } };
        }

        await this.prisma.question.create({
          data: questionData,
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

  /**
   * 템플릿 Preview - 실제로 시험을 생성하지 않고 미리보기
   */
  async previewTemplate(templateId: string, userId: string) {
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

    const previewSections: Array<{
      type: string;
      description?: string;
      questionCount: number;
      availableQuestions: number;
      selectedQuestions: Array<{
        id: string;
        content: string;
        difficulty?: string | null;
        tags: string[];
        points: number;
      }>;
      questionPoolId?: string;
      tags?: string[];
      difficulty?: string;
    }> = [];

    // 각 섹션에 대해 Preview 생성
    for (const sectionDef of sections) {
      let availableQuestions: Array<{
        id: string;
        content: string;
        difficulty?: string | null;
        tags: string[];
        points: number;
      }> = [];

      // 우선순위 1: questionPoolId가 있으면 Pool에서 문제 선택
      if (sectionDef.questionPoolId) {
        try {
          const pool = await this.questionPoolService.getQuestionPool(
            sectionDef.questionPoolId,
            userId,
          );
          
          if (pool.questionIds && pool.questionIds.length > 0) {
            const questions = await this.prisma.question.findMany({
              where: {
                id: { in: pool.questionIds },
              },
              select: {
                id: true,
                content: true,
                difficulty: true,
                tags: true,
                points: true,
              },
            });
            availableQuestions = questions;
          }
        } catch (error) {
          // Pool을 찾을 수 없으면 무시
        }
      } else {
        // 우선순위 2: 태그와 난이도로 필터링
        const where: Prisma.QuestionWhereInput = {};

        if (sectionDef.tags && sectionDef.tags.length > 0) {
          where.tags = { hasSome: sectionDef.tags };
        }

        if (sectionDef.difficulty) {
          where.difficulty = sectionDef.difficulty as Difficulty;
        }

        const questions = await this.prisma.question.findMany({
          where,
          select: {
            id: true,
            content: true,
            difficulty: true,
            tags: true,
            points: true,
          },
          take: 100, // Preview용으로 최대 100개만
        });
        availableQuestions = questions;
      }

      // 요청된 문제 개수만큼 선택 (랜덤 시드 없이 순서대로)
      const questionCount = sectionDef.questionCount || 0;
      const selectedQuestions = availableQuestions.slice(0, questionCount);

      previewSections.push({
        type: sectionDef.type || 'unknown',
        description: sectionDef.description,
        questionCount,
        availableQuestions: availableQuestions.length,
        selectedQuestions,
        questionPoolId: sectionDef.questionPoolId,
        tags: sectionDef.tags,
        difficulty: sectionDef.difficulty,
      });
    }

    return {
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
      },
      preview: {
        totalSections: previewSections.length,
        totalQuestions: previewSections.reduce((sum, s) => sum + s.questionCount, 0),
        sections: previewSections,
      },
    };
  }
}

