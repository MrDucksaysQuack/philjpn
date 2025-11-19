import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

export interface QuestionUsage {
  exam: {
    id: string;
    title: string;
    examType: string;
    status?: string;
    createdAt: Date;
  };
  section: {
    id: string;
    title: string;
    order: number;
  };
  questionNumber: number;
  usedAt: Date;
}

export interface TemplateUsage {
  exam: {
    id: string;
    title: string;
    examType: string;
    status?: string;
    createdAt: Date;
    createdBy?: string;
    creator?: {
      id: string;
      name: string;
      email: string;
    };
  };
  usedAt: Date;
}

export interface QuestionLinkingTrace {
  question: {
    id: string;
    content: string;
    questionType: string;
    difficulty?: string | null;
    tags: string[];
    questionBank?: {
      id: string;
      name: string;
    } | null;
  };
  currentUsage: {
    exam: {
      id: string;
      title: string;
    };
    section: {
      id: string;
      title: string;
    };
    questionNumber: number;
  } | null;
  usageHistory: QuestionUsage[];
  totalUsages: number;
}

export interface TemplateLinkingTrace {
  template: {
    id: string;
    name: string;
    description?: string | null;
    createdAt: Date;
  };
  usageHistory: TemplateUsage[];
  totalUsages: number;
}

@Injectable()
export class ContentLinkingService {
  constructor(private prisma: PrismaService) {}

  /**
   * 문제 사용 추적
   * 문제가 어느 시험에서 사용되었는지 추적
   */
  async getQuestionUsage(questionId: string): Promise<QuestionLinkingTrace> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        section: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                examType: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        questionBank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${questionId}`);
    }

    // 현재 사용 중인 시험 (section을 통해)
    const currentUsage = question.section
      ? {
          exam: {
            id: question.section.exam.id,
            title: question.section.exam.title,
          },
          section: {
            id: question.section.id,
            title: question.section.title,
          },
          questionNumber: question.questionNumber,
        }
      : null;

    // 사용 이력 조회 (같은 문제가 다른 시험에서도 사용되었을 수 있음)
    // 문제 내용과 정답이 같은 문제들을 찾아서 그들이 속한 시험들을 조회
    const similarQuestions = await this.prisma.question.findMany({
      where: {
        content: question.content,
        correctAnswer: question.correctAnswer,
      },
      include: {
        section: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                examType: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    // 사용 이력 구성 (중복 제거)
    const usageMap = new Map<string, QuestionUsage>();
    similarQuestions.forEach((q) => {
      if (q.section && q.section.exam) {
        const key = `${q.section.exam.id}-${q.section.id}`;
        if (!usageMap.has(key)) {
          usageMap.set(key, {
            exam: {
              id: q.section.exam.id,
              title: q.section.exam.title,
              examType: q.section.exam.examType,
              status: q.section.exam.status || undefined,
              createdAt: q.section.exam.createdAt,
            },
            section: {
              id: q.section.id,
              title: q.section.title,
              order: q.section.order,
            },
            questionNumber: q.questionNumber,
            usedAt: q.lastUsedAt || q.createdAt,
          });
        }
      }
    });

    const usageHistory = Array.from(usageMap.values()).sort(
      (a, b) => b.usedAt.getTime() - a.usedAt.getTime(),
    );

    return {
      question: {
        id: question.id,
        content: question.content,
        questionType: question.questionType,
        difficulty: question.difficulty,
        tags: question.tags,
        questionBank: question.questionBank
          ? {
              id: question.questionBank.id,
              name: question.questionBank.name,
            }
          : null,
      },
      currentUsage,
      usageHistory,
      totalUsages: usageHistory.length,
    };
  }

  /**
   * 템플릿 사용 추적
   * 템플릿이 어느 시험에서 사용되었는지 추적
   */
  async getTemplateUsage(templateId: string): Promise<TemplateLinkingTrace> {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    if (!template) {
      throw new NotFoundException(`템플릿을 찾을 수 없습니다. ID: ${templateId}`);
    }

    // 템플릿을 사용한 시험들 조회
    const exams = await this.prisma.exam.findMany({
      where: {
        templateId: templateId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usageHistory: TemplateUsage[] = exams.map((exam) => ({
      exam: {
        id: exam.id,
        title: exam.title,
        examType: exam.examType,
        status: exam.status || undefined,
        createdAt: exam.createdAt,
        createdBy: exam.createdBy || undefined,
        creator: exam.creator
          ? {
              id: exam.creator.id,
              name: exam.creator.name,
              email: exam.creator.email,
            }
          : undefined,
      },
      usedAt: exam.createdAt,
    }));

    return {
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        createdAt: template.createdAt,
      },
      usageHistory,
      totalUsages: usageHistory.length,
    };
  }

  /**
   * 문제 은행 사용 추적
   * 문제 은행의 문제들이 어느 시험에서 사용되었는지 추적
   */
  async getQuestionBankUsage(questionBankId: string) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id: questionBankId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!questionBank) {
      throw new NotFoundException(`문제 은행을 찾을 수 없습니다. ID: ${questionBankId}`);
    }

    // 문제 은행에 속한 문제들 조회
    const questions = await this.prisma.question.findMany({
      where: {
        questionBankId: questionBankId,
      },
      include: {
        section: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                examType: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    // 시험별로 그룹화
    const examMap = new Map<
      string,
      {
        exam: {
          id: string;
          title: string;
          examType: string;
          status?: string;
          createdAt: Date;
        };
        questionCount: number;
        sections: Array<{
          id: string;
          title: string;
          questionCount: number;
        }>;
      }
    >();

    questions.forEach((q) => {
      if (q.section && q.section.exam) {
        const examId = q.section.exam.id;
        if (!examMap.has(examId)) {
          examMap.set(examId, {
            exam: {
              id: q.section.exam.id,
              title: q.section.exam.title,
              examType: q.section.exam.examType,
              status: q.section.exam.status || undefined,
              createdAt: q.section.exam.createdAt,
            },
            questionCount: 0,
            sections: [],
          });
        }

        const examData = examMap.get(examId)!;
        examData.questionCount++;

        const sectionIndex = examData.sections.findIndex((s) => s.id === q.section.id);
        if (sectionIndex === -1) {
          examData.sections.push({
            id: q.section.id,
            title: q.section.title,
            questionCount: 1,
          });
        } else {
          examData.sections[sectionIndex].questionCount++;
        }
      }
    });

    const usageHistory = Array.from(examMap.values()).sort(
      (a, b) => b.exam.createdAt.getTime() - a.exam.createdAt.getTime(),
    );

    return {
      questionBank: {
        id: questionBank.id,
        name: questionBank.name,
        description: questionBank.description,
      },
      totalQuestions: questions.length,
      usageHistory,
      totalExams: usageHistory.length,
    };
  }
}

