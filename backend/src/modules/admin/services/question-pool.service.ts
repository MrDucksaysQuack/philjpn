import { Injectable } from '@nestjs/common';
import { Prisma, Difficulty } from '@prisma/client';
import { PrismaService } from '../../../common/utils/prisma.service';

export interface AutoSelectRule {
  minDifficulty?: 'easy' | 'medium' | 'hard'; // 최소 난이도 (이상)
  maxDifficulty?: 'easy' | 'medium' | 'hard'; // 최대 난이도 (이하)
  tags?: string[]; // 포함할 태그
  excludeTags?: string[]; // 제외할 태그
  maxCount?: number; // 최대 선택 개수
  minCount?: number; // 최소 선택 개수
  questionBankId?: string; // 문제 은행 ID (선택사항)
}

export interface CreateQuestionPoolDto {
  name: string;
  description?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  questionIds?: string[];
  isAutoSelect?: boolean;
  autoSelectRules?: AutoSelectRule;
}

export interface UpdateQuestionPoolDto {
  name?: string;
  description?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  questionIds?: string[];
  isAutoSelect?: boolean;
  autoSelectRules?: AutoSelectRule;
}

@Injectable()
export class QuestionPoolService {
  constructor(private prisma: PrismaService) {}

  /**
   * 규칙 기반 문제 자동 선택
   */
  async autoSelectQuestions(rules: AutoSelectRule): Promise<string[]> {
    const where: Prisma.QuestionWhereInput = {};

    // 난이도 필터
    if (rules.minDifficulty || rules.maxDifficulty) {
      const difficultyMap: Record<string, number> = {
        easy: 1,
        medium: 2,
        hard: 3,
      };

      if (rules.minDifficulty && rules.maxDifficulty) {
        // 범위 필터링은 복잡하므로 OR 조건 사용
        const difficulties: Difficulty[] = [];
        const minLevel = difficultyMap[rules.minDifficulty];
        const maxLevel = difficultyMap[rules.maxDifficulty];
        
        for (const [diff, level] of Object.entries(difficultyMap)) {
          if (level >= minLevel && level <= maxLevel) {
            difficulties.push(diff as Difficulty);
          }
        }
        if (difficulties.length > 0) {
          where.difficulty = { in: difficulties };
        }
      } else if (rules.minDifficulty) {
        const minLevel = difficultyMap[rules.minDifficulty];
        const difficulties: Difficulty[] = [];
        for (const [diff, level] of Object.entries(difficultyMap)) {
          if (level >= minLevel) {
            difficulties.push(diff as Difficulty);
          }
        }
        if (difficulties.length > 0) {
          where.difficulty = { in: difficulties };
        }
      } else if (rules.maxDifficulty) {
        const maxLevel = difficultyMap[rules.maxDifficulty];
        const difficulties: Difficulty[] = [];
        for (const [diff, level] of Object.entries(difficultyMap)) {
          if (level <= maxLevel) {
            difficulties.push(diff as Difficulty);
          }
        }
        if (difficulties.length > 0) {
          where.difficulty = { in: difficulties };
        }
      }
    }

    // 태그 필터
    if (rules.tags && rules.tags.length > 0) {
      where.tags = { hasSome: rules.tags };
    }

    // 제외 태그 필터
    if (rules.excludeTags && rules.excludeTags.length > 0) {
      where.NOT = rules.excludeTags.map((tag) => ({
        tags: { has: tag },
      }));
    }

    // 문제 은행 필터
    if (rules.questionBankId) {
      where.questionBankId = rules.questionBankId;
    }

    const questions = await this.prisma.question.findMany({
      where,
      select: { id: true },
      take: rules.maxCount || 1000,
    });

    return questions.map((q) => q.id);
  }

  /**
   * 문제 풀 Pre-check (규칙을 만족하는 문제 수 확인)
   */
  async preCheckPoolRules(rules: AutoSelectRule): Promise<{
    availableCount: number;
    requiredCount: number;
    isValid: boolean;
    message: string;
  }> {
    const questionIds = await this.autoSelectQuestions(rules);
    const availableCount = questionIds.length;
    const requiredCount = rules.minCount || rules.maxCount || 0;
    const isValid = availableCount >= requiredCount;

    let message = '';
    if (!isValid) {
      message = `규칙을 만족하는 문제가 부족합니다. 요청: ${requiredCount}개, 사용 가능: ${availableCount}개`;
    } else {
      message = `규칙을 만족하는 문제가 충분합니다. 사용 가능: ${availableCount}개`;
    }

    return {
      availableCount,
      requiredCount,
      isValid,
      message,
    };
  }

  /**
   * 문제 풀 생성
   */
  async createQuestionPool(userId: string, createDto: CreateQuestionPoolDto) {
    let questionIds = createDto.questionIds || [];

    // 자동 선택이 활성화되어 있으면 규칙에 따라 문제 선택
    if (createDto.isAutoSelect && createDto.autoSelectRules) {
      questionIds = await this.autoSelectQuestions(createDto.autoSelectRules);
    }

    return this.prisma.questionPool.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        tags: createDto.tags || [],
        difficulty: createDto.difficulty || null,
        questionIds,
        isAutoSelect: createDto.isAutoSelect || false,
        autoSelectRules: createDto.autoSelectRules
          ? (createDto.autoSelectRules as any)
          : null,
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

    let questionIds = updateDto.questionIds;

    // 자동 선택이 활성화되어 있고 규칙이 변경되었으면 재선택
    if (
      updateDto.isAutoSelect &&
      updateDto.autoSelectRules &&
      (!pool.isAutoSelect ||
        JSON.stringify(pool.autoSelectRules) !==
          JSON.stringify(updateDto.autoSelectRules))
    ) {
      questionIds = await this.autoSelectQuestions(updateDto.autoSelectRules);
    } else if (updateDto.isAutoSelect && pool.autoSelectRules) {
      // 자동 선택이 활성화되어 있고 규칙이 유지되면 재선택
      questionIds = await this.autoSelectQuestions(
        pool.autoSelectRules as AutoSelectRule,
      );
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
        ...(questionIds !== undefined && { questionIds }),
        ...(updateDto.isAutoSelect !== undefined && {
          isAutoSelect: updateDto.isAutoSelect,
        }),
        ...(updateDto.autoSelectRules !== undefined && {
          autoSelectRules: updateDto.autoSelectRules as any,
        }),
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

