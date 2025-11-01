import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateTemplateDto } from '../dto/create-template.dto';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  /**
   * 템플릿 생성
   */
  async createTemplate(userId: string, createDto: CreateTemplateDto) {
    return this.prisma.examTemplate.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        structure: createDto.structure as any,
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
    const where: any = {};
    
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
        ...(updateData.structure && { structure: updateData.structure as any }),
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
        structure?: any;
      };
    },
  ) {
    const template = await this.getTemplate(templateId, userId);

    // 템플릿 구조 가져오기
    const structure = template.structure as any;
    const sections = structure.sections || [];

    // 문제 선택 (태그/난이도 기반)
    const allQuestions = await this.prisma.question.findMany({
      where: {
        // deletedAt 필드는 Question 모델에 없으므로 제거
      },
      include: {
        section: {
          include: {
            exam: true,
          },
        },
      },
    });

    // 새 시험 생성
    const exam = await this.prisma.exam.create({
      data: {
        title: examData.title,
        description: examData.description,
        examType: examData.examType as any,
        subject: examData.subject,
        createdBy: userId,
        templateId: templateId,
        totalQuestions: 0,
        totalSections: sections.length,
      },
    });

    // 섹션 및 문제 생성
    let sectionOrder = 1;

    for (const sectionDef of sections) {
      // 필터링된 문제 선택
      let filteredQuestions = allQuestions;

      if (sectionDef.tags && sectionDef.tags.length > 0) {
        filteredQuestions = filteredQuestions.filter((q) =>
          q.tags?.some((tag) => sectionDef.tags.includes(tag)),
        );
      }

      if (sectionDef.difficulty) {
        filteredQuestions = filteredQuestions.filter(
          (q) => q.difficulty === sectionDef.difficulty,
        );
      }

      // 무작위로 문제 선택 (오버라이드된 개수 사용)
      const questionCount = examData.overrides?.questionCount
        ? Math.min(
            examData.overrides.questionCount,
            sectionDef.questionCount || filteredQuestions.length,
          )
        : sectionDef.questionCount || filteredQuestions.length;

      const selectedQuestions = filteredQuestions
        .sort(() => Math.random() - 0.5)
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
            options: question.options as any,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            points: question.points,
            difficulty: question.difficulty,
            tags: question.tags,
            questionType: question.questionType,
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

