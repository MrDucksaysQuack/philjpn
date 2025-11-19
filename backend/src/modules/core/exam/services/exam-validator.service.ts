import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/utils/prisma.service';

export interface ValidationIssue {
  type: 'error' | 'warning';
  category: 'duplicate' | 'difficulty' | 'section' | 'question_pool' | 'structure';
  message: string;
  details?: any;
}

export interface ValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
  summary: {
    totalQuestions: number;
    totalSections: number;
    duplicateQuestions: number;
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
      unknown: number;
    };
    averageDifficulty?: number;
  };
}

@Injectable()
export class ExamValidatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * 시험 검증
   * @param examId 시험 ID
   */
  async validateExam(examId: string): Promise<ValidationResult> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                statistics: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new Error(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    const issues: ValidationIssue[] = [];
    const allQuestions = exam.sections.flatMap((section) => section.questions);
    const totalQuestions = allQuestions.length;
    const totalSections = exam.sections.length;

    // 1. 문제 중복 검사
    const duplicateIssues = this.checkDuplicateQuestions(allQuestions);
    issues.push(...duplicateIssues);

    // 2. 난이도 불균형 검사
    const difficultyIssues = this.checkDifficultyBalance(allQuestions);
    issues.push(...difficultyIssues);

    // 3. 섹션 규칙 검사
    const sectionIssues = this.checkSectionRules(exam.sections);
    issues.push(...sectionIssues);

    // 4. 문제 풀 문제 부족 검사 (템플릿 기반 시험인 경우)
    if (exam.templateId) {
      const poolIssues = await this.checkQuestionPoolAvailability(exam.templateId, exam.sections);
      issues.push(...poolIssues);
    }

    // 5. 구조 검증
    const structureIssues = this.checkStructure(exam);
    issues.push(...structureIssues);

    // 난이도 분포 계산
    const difficultyDistribution = this.calculateDifficultyDistribution(allQuestions);
    
    // 평균 난이도 계산 (통계 기반)
    const averageDifficulty = this.calculateAverageDifficulty(allQuestions);

    const hasErrors = issues.some((issue) => issue.type === 'error');
    const hasWarnings = issues.some((issue) => issue.type === 'warning');

    return {
      isValid: !hasErrors,
      hasErrors,
      hasWarnings,
      issues,
      summary: {
        totalQuestions,
        totalSections,
        duplicateQuestions: duplicateIssues.filter((i) => i.type === 'error').length,
        difficultyDistribution,
        averageDifficulty,
      },
    };
  }

  /**
   * 문제 중복 검사
   */
  private checkDuplicateQuestions(questions: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const questionMap = new Map<string, number[]>();

    questions.forEach((question, index) => {
      const key = this.getQuestionKey(question);
      if (!questionMap.has(key)) {
        questionMap.set(key, []);
      }
      questionMap.get(key)!.push(index);
    });

    questionMap.forEach((indices, key) => {
      if (indices.length > 1) {
        issues.push({
          type: 'error',
          category: 'duplicate',
          message: `동일한 문제가 ${indices.length}번 반복됩니다.`,
          details: {
            questionIndices: indices,
            questionKey: key,
          },
        });
      }
    });

    return issues;
  }

  /**
   * 문제 키 생성 (중복 검사용)
   */
  private getQuestionKey(question: any): string {
    // 문제 내용과 정답을 기반으로 키 생성
    return `${question.content}-${question.correctAnswer}`;
  }

  /**
   * 난이도 불균형 검사
   */
  private checkDifficultyBalance(questions: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    if (questions.length === 0) {
      return issues;
    }

    const difficultyCounts = {
      easy: 0,
      medium: 0,
      hard: 0,
      unknown: 0,
    };

    questions.forEach((q) => {
      if (q.difficulty === 'easy') difficultyCounts.easy++;
      else if (q.difficulty === 'medium') difficultyCounts.medium++;
      else if (q.difficulty === 'hard') difficultyCounts.hard++;
      else difficultyCounts.unknown++;
    });

    const total = questions.length;
    const easyRatio = difficultyCounts.easy / total;
    const mediumRatio = difficultyCounts.medium / total;
    const hardRatio = difficultyCounts.hard / total;

    // 난이도가 하나에만 집중되어 있는지 확인
    if (easyRatio > 0.8) {
      issues.push({
        type: 'warning',
        category: 'difficulty',
        message: `쉬운 문제가 ${(easyRatio * 100).toFixed(1)}%로 과도하게 많습니다.`,
        details: { easyRatio, mediumRatio, hardRatio },
      });
    }

    if (hardRatio > 0.8) {
      issues.push({
        type: 'warning',
        category: 'difficulty',
        message: `어려운 문제가 ${(hardRatio * 100).toFixed(1)}%로 과도하게 많습니다.`,
        details: { easyRatio, mediumRatio, hardRatio },
      });
    }

    // 중간 난이도가 너무 적은 경우
    if (mediumRatio < 0.2 && total > 10) {
      issues.push({
        type: 'warning',
        category: 'difficulty',
        message: `중간 난이도 문제가 ${(mediumRatio * 100).toFixed(1)}%로 부족합니다.`,
        details: { easyRatio, mediumRatio, hardRatio },
      });
    }

    // 난이도가 설정되지 않은 문제가 많은 경우
    if (difficultyCounts.unknown / total > 0.3) {
      issues.push({
        type: 'warning',
        category: 'difficulty',
        message: `난이도가 설정되지 않은 문제가 ${difficultyCounts.unknown}개 (${((difficultyCounts.unknown / total) * 100).toFixed(1)}%) 있습니다.`,
        details: { unknownCount: difficultyCounts.unknown },
      });
    }

    return issues;
  }

  /**
   * 섹션 규칙 검사
   */
  private checkSectionRules(sections: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    sections.forEach((section, index) => {
      // 섹션에 문제가 없는 경우
      if (section.questions.length === 0) {
        issues.push({
          type: 'error',
          category: 'section',
          message: `"${section.title}" 섹션에 문제가 없습니다.`,
          details: { sectionIndex: index, sectionId: section.id },
        });
      }

      // 섹션의 questionCount와 실제 문제 수가 다른 경우
      if (section.questionCount !== section.questions.length) {
        issues.push({
          type: 'warning',
          category: 'section',
          message: `"${section.title}" 섹션의 문제 수가 일치하지 않습니다. (기대: ${section.questionCount}, 실제: ${section.questions.length})`,
          details: {
            sectionIndex: index,
            sectionId: section.id,
            expected: section.questionCount,
            actual: section.questions.length,
          },
        });
      }

      // 섹션 순서가 올바른지 확인
      if (section.order !== index + 1) {
        issues.push({
          type: 'warning',
          category: 'section',
          message: `"${section.title}" 섹션의 순서가 올바르지 않습니다. (기대: ${index + 1}, 실제: ${section.order})`,
          details: { sectionIndex: index, sectionId: section.id, order: section.order },
        });
      }
    });

    return issues;
  }

  /**
   * 문제 풀 문제 부족 검사
   */
  private async checkQuestionPoolAvailability(
    templateId: string,
    sections: any[],
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      const template = await this.prisma.examTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return issues;
      }

      // 템플릿 구조 분석
      const structure = template.structure as any;
      if (!structure || !structure.sections) {
        return issues;
      }

      // 각 섹션의 요구사항 확인
      for (const sectionConfig of structure.sections) {
        const requiredCount = sectionConfig.questionCount || 0;
        const questionPoolId = sectionConfig.questionPoolId;

        if (questionPoolId && requiredCount > 0) {
          const pool = await this.prisma.questionPool.findUnique({
            where: { id: questionPoolId },
            select: {
              questionIds: true,
              isAutoSelect: true,
              autoSelectRules: true,
            },
          });

          if (pool) {
            let availableCount = pool.questionIds.length;
            
            // 자동 선택이 활성화된 경우 규칙 기반으로 사용 가능한 문제 수 계산
            if (pool.isAutoSelect && pool.autoSelectRules) {
              const rules = pool.autoSelectRules as any;
              const where: any = {};
              
              // 난이도 필터
              if (rules.minDifficulty || rules.maxDifficulty) {
                const difficultyValues = ['easy', 'medium', 'hard'];
                const minIndex = rules.minDifficulty ? difficultyValues.indexOf(rules.minDifficulty) : 0;
                const maxIndex = rules.maxDifficulty ? difficultyValues.indexOf(rules.maxDifficulty) : 2;
                const allowedDifficulties = difficultyValues.slice(minIndex, maxIndex + 1);
                where.difficulty = { in: allowedDifficulties };
              }
              
              // 태그 필터
              if (rules.tags && rules.tags.length > 0) {
                where.tags = { hasSome: rules.tags };
              }
              
              // 제외 태그 필터
              if (rules.excludeTags && rules.excludeTags.length > 0) {
                where.NOT = {
                  tags: { hasSome: rules.excludeTags },
                };
              }
              
              // 문제 은행 필터
              if (rules.questionBankId) {
                where.questionBankId = rules.questionBankId;
              }
              
              const matchingQuestions = await this.prisma.question.findMany({
                where,
                select: { id: true },
                take: rules.maxCount || 1000,
              });
              
              availableCount = matchingQuestions.length;
            }

            if (availableCount < requiredCount) {
              issues.push({
                type: 'error',
                category: 'question_pool',
                message: `"${sectionConfig.type || '섹션'}"에 필요한 문제 수(${requiredCount})가 문제 풀의 사용 가능한 문제 수(${availableCount})보다 많습니다.`,
                details: {
                  sectionType: sectionConfig.type,
                  requiredCount,
                  availableCount,
                  questionPoolId,
                },
              });
            } else if (availableCount < requiredCount * 1.2) {
              // 여유분이 20% 미만인 경우 경고
              issues.push({
                type: 'warning',
                category: 'question_pool',
                message: `"${sectionConfig.type || '섹션'}"의 문제 풀에 여유분이 부족합니다. (필요: ${requiredCount}, 사용 가능: ${availableCount})`,
                details: {
                  sectionType: sectionConfig.type,
                  requiredCount,
                  availableCount,
                  questionPoolId,
                },
              });
            }
          } else {
            issues.push({
              type: 'error',
              category: 'question_pool',
              message: `"${sectionConfig.type || '섹션'}"에 연결된 문제 풀을 찾을 수 없습니다.`,
              details: {
                sectionType: sectionConfig.type,
                questionPoolId,
              },
            });
          }
        }
      }
    } catch (error) {
      // 템플릿 조회 실패는 무시 (선택적 검증)
    }

    return issues;
  }

  /**
   * 구조 검증
   */
  private checkStructure(exam: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // 시험에 섹션이 없는 경우
    if (exam.sections.length === 0) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: '시험에 섹션이 없습니다.',
      });
    }

    // 총 문제 수가 0인 경우
    const totalQuestions = exam.sections.reduce(
      (sum: number, section: any) => sum + section.questions.length,
      0,
    );
    if (totalQuestions === 0) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: '시험에 문제가 없습니다.',
      });
    }

    // totalQuestions 필드와 실제 문제 수가 다른 경우
    if (exam.totalQuestions !== totalQuestions) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `시험의 총 문제 수가 일치하지 않습니다. (기대: ${exam.totalQuestions}, 실제: ${totalQuestions})`,
        details: { expected: exam.totalQuestions, actual: totalQuestions },
      });
    }

    // totalSections 필드와 실제 섹션 수가 다른 경우
    if (exam.totalSections !== exam.sections.length) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `시험의 총 섹션 수가 일치하지 않습니다. (기대: ${exam.totalSections}, 실제: ${exam.sections.length})`,
        details: { expected: exam.totalSections, actual: exam.sections.length },
      });
    }

    return issues;
  }

  /**
   * 난이도 분포 계산
   */
  private calculateDifficultyDistribution(questions: any[]): {
    easy: number;
    medium: number;
    hard: number;
    unknown: number;
  } {
    const distribution = {
      easy: 0,
      medium: 0,
      hard: 0,
      unknown: 0,
    };

    questions.forEach((q) => {
      if (q.difficulty === 'easy') distribution.easy++;
      else if (q.difficulty === 'medium') distribution.medium++;
      else if (q.difficulty === 'hard') distribution.hard++;
      else distribution.unknown++;
    });

    return distribution;
  }

  /**
   * 평균 난이도 계산 (통계 기반)
   */
  private calculateAverageDifficulty(questions: any[]): number | undefined {
    const questionsWithStats = questions.filter((q) => q.statistics?.calculatedDifficulty);
    
    if (questionsWithStats.length === 0) {
      return undefined;
    }

    const sum = questionsWithStats.reduce(
      (acc, q) => acc + Number(q.statistics.calculatedDifficulty),
      0,
    );
    return sum / questionsWithStats.length;
  }
}

