import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  /**
   * 문제 은행 목록 조회
   */
  async findAll(params?: {
    category?: string;
    search?: string;
    includeQuestions?: boolean;
  }) {
    const where: Prisma.QuestionBankWhereInput = {};

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const questionBanks = await this.prisma.questionBank.findMany({
      where,
      include: {
        questions: params?.includeQuestions
          ? {
              select: {
                id: true,
                content: true,
                questionType: true,
                difficulty: true,
                tags: true,
                points: true,
              },
            }
          : false,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return questionBanks;
  }

  /**
   * 문제 은행 조회
   */
  async findOne(id: string, includeQuestions = false) {
    const questionBank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: includeQuestions
          ? {
              select: {
                id: true,
                content: true,
                questionType: true,
                difficulty: true,
                tags: true,
                points: true,
                section: {
                  select: {
                    id: true,
                    title: true,
                    exam: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            }
          : false,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!questionBank) {
      throw new NotFoundException(`문제 은행을 찾을 수 없습니다. ID: ${id}`);
    }

    return questionBank;
  }

  /**
   * 문제 은행 생성
   */
  async create(data: {
    name: string;
    description?: string;
    category?: string;
    subcategory?: string;
    level?: string;
    source?: string;
    sourceYear?: number;
    createdBy?: string;
  }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('문제 은행 이름은 필수입니다.');
    }

    return await this.prisma.questionBank.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        category: data.category?.trim() || undefined,
        subcategory: data.subcategory?.trim() || undefined,
        level: data.level?.trim() || undefined,
        source: data.source?.trim() || undefined,
        sourceYear: data.sourceYear || undefined,
        createdBy: data.createdBy || undefined,
      },
    });
  }

  /**
   * 문제 은행 수정
   */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      subcategory?: string;
      level?: string;
      source?: string;
      sourceYear?: number;
    },
  ) {
    // 존재 확인
    await this.findOne(id);

    const updateData: Prisma.QuestionBankUpdateInput = {};

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new BadRequestException('문제 은행 이름은 필수입니다.');
      }
      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }

    if (data.category !== undefined) {
      updateData.category = data.category.trim() || null;
    }

    if (data.subcategory !== undefined) {
      updateData.subcategory = data.subcategory.trim() || null;
    }

    if (data.level !== undefined) {
      updateData.level = data.level.trim() || null;
    }

    if (data.source !== undefined) {
      updateData.source = data.source.trim() || null;
    }

    if (data.sourceYear !== undefined) {
      updateData.sourceYear = data.sourceYear || null;
    }

    return await this.prisma.questionBank.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 문제 은행 삭제
   */
  async delete(id: string) {
    // 존재 확인
    await this.findOne(id);

    // 문제가 연결되어 있는지 확인
    const questionCount = await this.prisma.question.count({
      where: { questionBankId: id },
    });

    if (questionCount > 0) {
      throw new BadRequestException(
        `이 문제 은행에 연결된 문제가 ${questionCount}개 있습니다. 먼저 문제의 연결을 해제해주세요.`,
      );
    }

    return await this.prisma.questionBank.delete({
      where: { id },
    });
  }

  /**
   * 문제 은행에 문제 추가
   */
  async addQuestion(questionBankId: string, questionId: string) {
    // 문제 은행 존재 확인
    await this.findOne(questionBankId);

    // 문제 존재 확인
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${questionId}`);
    }

    // 이미 연결되어 있는지 확인
    if (question.questionBankId === questionBankId) {
      throw new BadRequestException('이미 이 문제 은행에 연결되어 있습니다.');
    }

    return await this.prisma.question.update({
      where: { id: questionId },
      data: {
        questionBankId,
      },
    });
  }

  /**
   * 문제 은행에서 문제 제거
   */
  async removeQuestion(questionBankId: string, questionId: string) {
    // 문제 존재 및 연결 확인
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${questionId}`);
    }

    if (question.questionBankId !== questionBankId) {
      throw new BadRequestException('이 문제 은행에 연결되어 있지 않습니다.');
    }

    return await this.prisma.question.update({
      where: { id: questionId },
      data: {
        questionBankId: null,
      },
    });
  }

  /**
   * 문제 은행의 모든 문제 제거
   */
  async removeAllQuestions(questionBankId: string) {
    // 존재 확인
    await this.findOne(questionBankId);

    return await this.prisma.question.updateMany({
      where: { questionBankId },
      data: {
        questionBankId: null,
      },
    });
  }

  /**
   * 문제 은행 간 문제 이동
   */
  async moveQuestion(
    questionId: string,
    targetBankId: string,
    sourceBankId?: string,
  ) {
    // 문제 존재 확인
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${questionId}`);
    }

    // 소스 은행 확인 (선택사항)
    if (sourceBankId && question.questionBankId !== sourceBankId) {
      throw new BadRequestException(
        '문제가 지정된 소스 문제 은행에 연결되어 있지 않습니다.',
      );
    }

    // 타겟 은행 존재 확인
    await this.findOne(targetBankId);

    // 같은 은행으로 이동하려는 경우
    if (question.questionBankId === targetBankId) {
      throw new BadRequestException(
        '문제가 이미 해당 문제 은행에 연결되어 있습니다.',
      );
    }

    return await this.prisma.question.update({
      where: { id: questionId },
      data: {
        questionBankId: targetBankId,
      },
    });
  }

  /**
   * 문제 은행 간 일괄 문제 이동
   */
  async moveQuestions(
    questionIds: string[],
    targetBankId: string,
    sourceBankId?: string,
  ) {
    if (!questionIds || questionIds.length === 0) {
      throw new BadRequestException('이동할 문제를 선택해주세요.');
    }

    // 타겟 은행 존재 확인
    await this.findOne(targetBankId);

    // 소스 은행 확인 (선택사항)
    if (sourceBankId) {
      const questionsInSource = await this.prisma.question.count({
        where: {
          id: { in: questionIds },
          questionBankId: sourceBankId,
        },
      });

      if (questionsInSource !== questionIds.length) {
        throw new BadRequestException(
          '일부 문제가 지정된 소스 문제 은행에 연결되어 있지 않습니다.',
        );
      }
    }

    // 문제 이동
    const result = await this.prisma.question.updateMany({
      where: {
        id: { in: questionIds },
      },
      data: {
        questionBankId: targetBankId,
      },
    });

    return {
      movedCount: result.count,
      totalRequested: questionIds.length,
    };
  }

  /**
   * 카테고리 목록 조회 (문제 은행에 사용된 카테고리)
   */
  async getCategories() {
    const questionBanks = await this.prisma.questionBank.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return questionBanks
      .map((qb) => qb.category)
      .filter((cat): cat is string => cat !== null);
  }
}

