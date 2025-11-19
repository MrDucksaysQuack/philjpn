import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';

export type ContentType = 'exam' | 'question' | 'template';

export interface CreateVersionDto {
  contentType: ContentType;
  contentId: string;
  versionLabel?: string;
  changeDescription?: string;
  changedBy?: string;
}

export interface VersionComparison {
  field: string;
  oldValue: any;
  newValue: any;
}

@Injectable()
export class ContentVersionService {
  private readonly logger = new Logger(ContentVersionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 콘텐츠 버전 생성
   */
  async createVersion(dto: CreateVersionDto) {
    const { contentType, contentId, versionLabel, changeDescription, changedBy } = dto;

    // 콘텐츠 존재 확인 및 스냅샷 생성
    const snapshot = await this.createSnapshot(contentType, contentId);
    if (!snapshot) {
      throw new NotFoundException(`${contentType}를 찾을 수 없습니다. ID: ${contentId}`);
    }

    // 최신 버전 번호 조회
    const latestVersion = await this.prisma.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // 버전 생성
    const version = await this.prisma.contentVersion.create({
      data: {
        contentType,
        contentId,
        versionNumber,
        versionLabel: versionLabel || `v${versionNumber}`,
        snapshot,
        changeDescription,
        changedBy,
        parentVersionId: latestVersion?.id || null,
      },
    });

    this.logger.log(`버전 생성: ${contentType} ${contentId} -> v${versionNumber}`);
    return version;
  }

  /**
   * 콘텐츠 스냅샷 생성
   */
  private async createSnapshot(contentType: ContentType, contentId: string): Promise<any | null> {
    switch (contentType) {
      case 'exam':
        const exam = await this.prisma.exam.findUnique({
          where: { id: contentId },
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
            config: true,
            category: true,
            subcategory: true,
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        });
        if (!exam) return null;
        // 민감한 정보 제외
        return {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          examType: exam.examType,
          subject: exam.subject,
          difficulty: exam.difficulty,
          totalQuestions: exam.totalQuestions,
          totalSections: exam.totalSections,
          estimatedTime: exam.estimatedTime,
          passingScore: exam.passingScore,
          isActive: exam.isActive,
          isPublic: exam.isPublic,
          status: exam.status,
          sections: exam.sections.map((section) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            order: section.order,
            questionCount: section.questionCount,
            timeLimit: section.timeLimit,
            questions: section.questions.map((q) => ({
              id: q.id,
              questionNumber: q.questionNumber,
              questionType: q.questionType,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              points: q.points,
              difficulty: q.difficulty,
              tags: q.tags,
              imageUrl: q.imageUrl,
              audioUrl: q.audioUrl,
            })),
          })),
          config: exam.config,
          categoryId: exam.categoryId,
          subcategoryId: exam.subcategoryId,
        };

      case 'question':
        const question = await this.prisma.question.findUnique({
          where: { id: contentId },
          include: {
            section: {
              select: { id: true, title: true, examId: true },
            },
            questionBank: {
              select: { id: true, name: true },
            },
            statistics: true,
          },
        });
        if (!question) return null;
        return {
          id: question.id,
          sectionId: question.sectionId,
          questionBankId: question.questionBankId,
          questionNumber: question.questionNumber,
          questionType: question.questionType,
          content: question.content,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: question.points,
          difficulty: question.difficulty,
          tags: question.tags,
          imageUrl: question.imageUrl,
          audioUrl: question.audioUrl,
          audioPlayLimit: question.audioPlayLimit,
        };

      case 'template':
        const template = await this.prisma.examTemplate.findUnique({
          where: { id: contentId },
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        });
        if (!template) return null;
        return {
          id: template.id,
          name: template.name,
          description: template.description,
          structure: template.structure,
          questionPoolIds: template.questionPoolIds,
        };

      default:
        throw new BadRequestException(`지원하지 않는 콘텐츠 타입: ${contentType}`);
    }
  }

  /**
   * 버전 목록 조회
   */
  async getVersions(contentType: ContentType, contentId: string) {
    const versions = await this.prisma.contentVersion.findMany({
      where: {
        contentType,
        contentId,
      },
      include: {
        changedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    return versions;
  }

  /**
   * 특정 버전 조회
   */
  async getVersion(versionId: string) {
    const version = await this.prisma.contentVersion.findUnique({
      where: { id: versionId },
      include: {
        changedByUser: {
          select: { id: true, name: true, email: true },
        },
        parentVersion: {
          include: {
            changedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`버전을 찾을 수 없습니다. ID: ${versionId}`);
    }

    return version;
  }

  /**
   * 버전 비교
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionComparison[]> {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2),
    ]);

    if (version1.contentType !== version2.contentType || version1.contentId !== version2.contentId) {
      throw new BadRequestException('같은 콘텐츠의 버전만 비교할 수 있습니다.');
    }

    const differences: VersionComparison[] = [];
    const snapshot1 = version1.snapshot as any;
    const snapshot2 = version2.snapshot as any;

    // 재귀적으로 객체 비교
    this.compareObjects(snapshot1, snapshot2, '', differences);

    return differences;
  }

  /**
   * 객체 재귀 비교
   */
  private compareObjects(obj1: any, obj2: any, prefix: string, differences: VersionComparison[]) {
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of allKeys) {
      const field = prefix ? `${prefix}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (val1 === undefined && val2 !== undefined) {
        differences.push({ field, oldValue: null, newValue: val2 });
      } else if (val1 !== undefined && val2 === undefined) {
        differences.push({ field, oldValue: val1, newValue: null });
      } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
        this.compareObjects(val1, val2, field, differences);
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({ field, oldValue: val1, newValue: val2 });
      }
    }
  }

  /**
   * 특정 버전으로 롤백
   */
  async rollbackToVersion(versionId: string, userId: string): Promise<any> {
    const version = await this.getVersion(versionId);
    const snapshot = version.snapshot as any;

    // 롤백 실행
    switch (version.contentType) {
      case 'exam':
        // 시험 롤백: 기본 정보만 롤백 (섹션/문제는 유지)
        // 섹션과 문제를 삭제하면 기존 시험 결과와 연결이 끊어질 수 있으므로
        // 기본 정보만 롤백하고 섹션/문제는 수동으로 관리하도록 함
        const exam = await this.prisma.exam.findUnique({
          where: { id: version.contentId },
        });

        if (!exam) {
          throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${version.contentId}`);
        }

        // 시험 기본 정보 롤백
        const updatedExam = await this.prisma.exam.update({
          where: { id: version.contentId },
          data: {
            title: snapshot.title,
            description: snapshot.description,
            examType: snapshot.examType,
            subject: snapshot.subject,
            difficulty: snapshot.difficulty,
            estimatedTime: snapshot.estimatedTime,
            passingScore: snapshot.passingScore,
            isActive: snapshot.isActive,
            isPublic: snapshot.isPublic,
            status: snapshot.status,
            categoryId: snapshot.categoryId,
            subcategoryId: snapshot.subcategoryId,
            // config는 별도로 처리
          },
        });

        // ExamConfig 롤백
        if (snapshot.config) {
          const existingConfig = await this.prisma.examConfig.findUnique({
            where: { examId: version.contentId },
          });

          if (existingConfig) {
            await this.prisma.examConfig.update({
              where: { examId: version.contentId },
              data: {
                allowSectionNavigation: snapshot.config.allowSectionNavigation ?? true,
                allowQuestionReview: snapshot.config.allowQuestionReview ?? true,
                showAnswerAfterSubmit: snapshot.config.showAnswerAfterSubmit ?? true,
                showScoreImmediately: snapshot.config.showScoreImmediately ?? true,
                timeLimitPerSection: snapshot.config.timeLimitPerSection ?? false,
                shuffleQuestions: snapshot.config.shuffleQuestions ?? false,
                shuffleOptions: snapshot.config.shuffleOptions ?? false,
                preventTabSwitch: snapshot.config.preventTabSwitch ?? false,
              },
            });
          } else {
            await this.prisma.examConfig.create({
              data: {
                examId: version.contentId,
                allowSectionNavigation: snapshot.config.allowSectionNavigation ?? true,
                allowQuestionReview: snapshot.config.allowQuestionReview ?? true,
                showAnswerAfterSubmit: snapshot.config.showAnswerAfterSubmit ?? true,
                showScoreImmediately: snapshot.config.showScoreImmediately ?? true,
                timeLimitPerSection: snapshot.config.timeLimitPerSection ?? false,
                shuffleQuestions: snapshot.config.shuffleQuestions ?? false,
                shuffleOptions: snapshot.config.shuffleOptions ?? false,
                preventTabSwitch: snapshot.config.preventTabSwitch ?? false,
              },
            });
          }
        }

        // 롤백 후 새 버전 생성
        await this.createVersion({
          contentType: 'exam',
          contentId: version.contentId,
          versionLabel: `rollback-to-${version.versionLabel}`,
          changeDescription: `버전 ${version.versionLabel}로 롤백 (기본 정보만 복원, 섹션/문제는 유지)`,
          changedBy: userId,
        });

        this.logger.warn(
          `시험 롤백 완료: ${version.contentId} - 기본 정보만 롤백되었습니다. 섹션과 문제는 수동으로 확인이 필요합니다.`,
        );

        return updatedExam;

      case 'question':
        const question = await this.prisma.question.update({
          where: { id: version.contentId },
          data: {
            content: snapshot.content,
            options: snapshot.options,
            correctAnswer: snapshot.correctAnswer,
            explanation: snapshot.explanation,
            points: snapshot.points,
            difficulty: snapshot.difficulty,
            tags: snapshot.tags,
            imageUrl: snapshot.imageUrl,
            audioUrl: snapshot.audioUrl,
            audioPlayLimit: snapshot.audioPlayLimit,
          },
        });
        // 롤백 후 새 버전 생성
        await this.createVersion({
          contentType: 'question',
          contentId: version.contentId,
          versionLabel: `rollback-to-${version.versionLabel}`,
          changeDescription: `버전 ${version.versionLabel}로 롤백`,
          changedBy: userId,
        });
        return question;

      case 'template':
        const template = await this.prisma.examTemplate.update({
          where: { id: version.contentId },
          data: {
            name: snapshot.name,
            description: snapshot.description,
            structure: snapshot.structure,
            questionPoolIds: snapshot.questionPoolIds,
          },
        });
        // 롤백 후 새 버전 생성
        await this.createVersion({
          contentType: 'template',
          contentId: version.contentId,
          versionLabel: `rollback-to-${version.versionLabel}`,
          changeDescription: `버전 ${version.versionLabel}로 롤백`,
          changedBy: userId,
        });
        return template;

      default:
        throw new BadRequestException(`지원하지 않는 콘텐츠 타입: ${version.contentType}`);
    }
  }

  /**
   * 최신 버전 조회
   */
  async getLatestVersion(contentType: ContentType, contentId: string) {
    const version = await this.prisma.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
      include: {
        changedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return version;
  }
}

