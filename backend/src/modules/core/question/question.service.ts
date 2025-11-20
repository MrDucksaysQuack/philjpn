import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async findAllBySectionId(sectionId: string) {
    // 섹션 존재 확인
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${sectionId}`);
    }

    const questions = await this.prisma.question.findMany({
      where: { sectionId },
      orderBy: { questionNumber: 'asc' },
    });

    return {
      data: questions.map((q) => ({
        ...q,
        options: q.options as any,
      })),
    };
  }

  async findOne(id: string, query: QuestionQueryDto = {}) {
    const { includeAnswer = false } = query;

    const question = await this.prisma.question.findUnique({
      where: { id },
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
        questionBank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${id}`);
    }

    const result: any = {
      ...question,
      options: question.options as any,
    };

    // 응시 중에는 정답/해설 제외
    if (!includeAnswer) {
      delete result.correctAnswer;
      delete result.explanation;
    }

    return result;
  }

  /**
   * 독립적인 Question 생성 (sectionId 없이)
   * 아키텍처 흐름: Question → Pool → Template → Exam
   */
  async createStandalone(createQuestionDto: CreateQuestionDto) {
    const { options, questionNumber, ...questionData } = createQuestionDto;

    // 독립적인 Question 생성
    const question = await this.prisma.question.create({
      data: {
        ...questionData,
        sectionId: null, // 독립적인 Question
        questionNumber: questionNumber || 1, // 기본값
        options: options ? (options as any) : null,
        usageCount: 0, // 아직 사용되지 않음 (Pool에 추가되면 증가)
        // lastUsedAt은 null (아직 사용되지 않음)
      },
      include: {
        questionBank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...question,
      options: question.options as any,
    };
  }

  /**
   * Section에 속한 Question 생성 (기존 기능 유지 - 하위 호환성)
   */
  async create(sectionId: string, createQuestionDto: CreateQuestionDto) {
    // 섹션 존재 확인
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${sectionId}`);
    }

    const { options, ...questionData } = createQuestionDto;

    // 문제 생성 (시험에 포함되므로 usageCount 증가)
    const question = await this.prisma.question.create({
      data: {
        ...questionData,
        sectionId,
        options: options ? (options as any) : null,
        usageCount: 1, // 새로 생성된 문제는 시험에 포함되므로 1로 시작
        lastUsedAt: new Date(),
      },
    });

    // 섹션의 questionCount 업데이트
    await this.updateSectionQuestionCount(sectionId);

    // 시험의 totalQuestions 업데이트
    await this.updateExamQuestionCount(section.examId);

    return {
      ...question,
      options: question.options as any,
    };
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    const existingQuestion = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${id}`);
    }

    const { options, ...questionData } = updateQuestionDto;

    const question = await this.prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        options: options !== undefined ? (options as any) : undefined,
      },
    });

    return {
      ...question,
      options: question.options as any,
    };
  }

  async remove(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        section: {
          select: {
            id: true,
            examId: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${id}`);
    }

    await this.prisma.question.delete({
      where: { id },
    });

    // Section에 속한 Question인 경우에만 카운트 업데이트
    if (question.section) {
      // 섹션의 questionCount 업데이트
      await this.updateSectionQuestionCount(question.section.id);

      // 시험의 totalQuestions 업데이트
      await this.updateExamQuestionCount(question.section.examId);
    }

    return { message: '문제가 삭제되었습니다.' };
  }

  private async updateSectionQuestionCount(sectionId: string) {
    if (!sectionId) return; // sectionId가 없으면 업데이트 불필요

    const questionCount = await this.prisma.question.count({
      where: { sectionId },
    });

    await this.prisma.section.update({
      where: { id: sectionId },
      data: { questionCount },
    });
  }

  private async updateExamQuestionCount(examId: string) {
    const totalQuestions = await this.prisma.question.count({
      where: {
        section: {
          examId,
        },
      },
    });

    await this.prisma.exam.update({
      where: { id: examId },
      data: { totalQuestions },
    });
  }
}

