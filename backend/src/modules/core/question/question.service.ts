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

  async create(sectionId: string, createQuestionDto: CreateQuestionDto) {
    // 섹션 존재 확인
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${sectionId}`);
    }

    const { options, ...questionData } = createQuestionDto;

    // 문제 생성
    const question = await this.prisma.question.create({
      data: {
        ...questionData,
        sectionId,
        options: options ? (options as any) : null,
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

    // 섹션의 questionCount 업데이트
    await this.updateSectionQuestionCount(question.section.id);

    // 시험의 totalQuestions 업데이트
    await this.updateExamQuestionCount(question.section.examId);

    return { message: '문제가 삭제되었습니다.' };
  }

  private async updateSectionQuestionCount(sectionId: string) {
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

