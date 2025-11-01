import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

export interface CreateQuestionPoolDto {
  name: string;
  description?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  questionIds?: string[];
}

export interface UpdateQuestionPoolDto {
  name?: string;
  description?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  questionIds?: string[];
}

@Injectable()
export class QuestionPoolService {
  constructor(private prisma: PrismaService) {}

  /**
   * 문제 풀 생성
   */
  async createQuestionPool(userId: string, createDto: CreateQuestionPoolDto) {
    return this.prisma.questionPool.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        tags: createDto.tags || [],
        difficulty: createDto.difficulty || null,
        questionIds: createDto.questionIds || [],
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
   * 문제 풀 목록 조회
   */
  async getQuestionPools(userId?: string) {
    const where: any = {};
    if (userId) {
      where.createdBy = userId;
    }

    return this.prisma.questionPool.findMany({
      where,
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
  }

  /**
   * 문제 풀 상세 조회
   */
  async getQuestionPool(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.createdBy = userId;
    }

    const pool = await this.prisma.questionPool.findFirst({
      where,
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

    if (!pool) {
      throw new Error('문제 풀을 찾을 수 없습니다.');
    }

    return pool;
  }

  /**
   * 문제 풀 수정
   */
  async updateQuestionPool(
    id: string,
    userId: string,
    updateDto: UpdateQuestionPoolDto,
  ) {
    // 권한 확인
    const pool = await this.getQuestionPool(id, userId);
    if (!pool) {
      throw new Error('문제 풀을 찾을 수 없거나 수정 권한이 없습니다.');
    }

    return this.prisma.questionPool.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
        ...(updateDto.tags && { tags: updateDto.tags }),
        ...(updateDto.difficulty !== undefined && {
          difficulty: updateDto.difficulty,
        }),
        ...(updateDto.questionIds && { questionIds: updateDto.questionIds }),
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
   * 문제 풀 삭제
   */
  async deleteQuestionPool(id: string, userId: string) {
    // 권한 확인
    const pool = await this.getQuestionPool(id, userId);
    if (!pool) {
      throw new Error('문제 풀을 찾을 수 없거나 삭제 권한이 없습니다.');
    }

    await this.prisma.questionPool.delete({
      where: { id },
    });

    return { message: '문제 풀이 삭제되었습니다.' };
  }
}

