import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/utils/prisma.service';
import { StartExamDto } from './dto/start-exam.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { MoveSectionDto } from './dto/move-section.dto';
import { GetNextQuestionDto } from './dto/get-next-question.dto';
import { GradingService } from '../grading/grading.service';
import { ExamMonitoringGateway } from '../../monitoring/gateway/exam-monitoring.gateway';
import { QuestionPoolService } from '../../admin/services/question-pool.service';
import { Difficulty } from '../../../common/types';
import { IRTService } from './services/irt.service';
import { ExamCompletedEvent } from '../../report/events/exam-completed.event';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private gradingService: GradingService,
    private questionPoolService: QuestionPoolService,
    private irtService: IRTService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => ExamMonitoringGateway))
    private monitoringGateway?: ExamMonitoringGateway,
  ) {}

  /**
   * 시험 시작
   */
  async startExam(examId: string, userId: string, dto: StartExamDto, licenseKeyId?: string) {
    // 시험 존재 확인
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, deletedAt: null, isActive: true },
      include: {
        config: true,
        sections: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    // 이미 진행 중인 시험이 있는지 확인
    const existingSession = await this.prisma.userExamSession.findFirst({
      where: {
        userId,
        examId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingSession) {
      // 시험 결과 확인
      if (existingSession.examResultId) {
        const examResult = await this.prisma.examResult.findUnique({
          where: { id: existingSession.examResultId },
        });
        if (examResult && examResult.status === 'in_progress') {
          throw new ConflictException('이미 진행 중인 시험이 있습니다.');
        }
      }
    }

    // 시험 결과 생성
    const examResult = await this.prisma.examResult.create({
      data: {
        userId,
        examId,
        status: 'in_progress',
        licenseKeyId: licenseKeyId || null,
      },
    });

    // 만료 시간 계산 (시험 예상 시간 + 30분 여유)
    const expiresAt = exam.estimatedTime
      ? new Date(Date.now() + (exam.estimatedTime + 30) * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 기본 24시간

    // 세션 생성
    const session = await this.prisma.userExamSession.create({
      data: {
        userId,
        examId,
        examResultId: examResult.id,
        currentSectionId: exam.sections[0]?.id || null,
        currentQuestionNumber: 1,
        answers: {},
        expiresAt,
      },
    });

    // 모니터링 시스템에 등록 (Phase 8)
    if (this.monitoringGateway) {
      this.monitoringGateway.handleExamStart(
        { sessionId: session.id, userId, examId },
        null as any,
      );
    }

    return {
      sessionId: session.id,
      examResultId: examResult.id,
      exam: {
        id: exam.id,
        title: exam.title,
        config: exam.config,
      },
      currentSection: exam.sections[0]
        ? {
            id: exam.sections[0].id,
            title: exam.sections[0].title,
            order: exam.sections[0].order,
          }
        : null,
      startTime: session.startTime,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * 세션 상태 조회
   */
  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            config: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`세션을 찾을 수 없습니다. ID: ${sessionId}`);
    }

    if (session.userId !== userId) {
      throw new BadRequestException('본인의 세션만 조회할 수 있습니다.');
    }

    // 만료 확인
    if (session.expiresAt && session.expiresAt < new Date()) {
      throw new BadRequestException('시험 시간이 만료되었습니다.');
    }

    return {
      id: session.id,
      examId: session.examId,
      currentSectionId: session.currentSectionId,
      currentQuestionNumber: session.currentQuestionNumber,
      answers: session.answers,
      startTime: session.startTime,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * 답안 저장
   */
  async saveAnswer(sessionId: string, userId: string, dto: SaveAnswerDto) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`세션을 찾을 수 없습니다. ID: ${sessionId}`);
    }

    if (session.userId !== userId) {
      throw new BadRequestException('본인의 세션만 수정할 수 있습니다.');
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      throw new BadRequestException('시험 시간이 만료되었습니다.');
    }

    // 답안 업데이트
    const answers = session.answers as Record<string, string>;
    answers[dto.questionId] = dto.answer;

    const updatedSession = await this.prisma.userExamSession.update({
      where: { id: sessionId },
      data: {
        answers,
        lastActivityAt: new Date(),
      },
    });

    return { message: '답안이 저장되었습니다.' };
  }

  /**
   * 섹션 이동
   */
  async moveSection(
    sessionId: string,
    sectionId: string,
    userId: string,
    dto: MoveSectionDto,
  ) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            config: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`세션을 찾을 수 없습니다. ID: ${sessionId}`);
    }

    if (session.userId !== userId) {
      throw new BadRequestException('본인의 세션만 수정할 수 있습니다.');
    }

    // 섹션 간 이동 허용 여부 확인
    if (
      session.exam.config &&
      !session.exam.config.allowSectionNavigation
    ) {
      throw new BadRequestException('섹션 간 이동이 허용되지 않습니다.');
    }

    // 섹션 존재 확인
    const section = await this.prisma.section.findFirst({
      where: {
        id: sectionId,
        examId: session.examId,
      },
    });

    if (!section) {
      throw new NotFoundException(`섹션을 찾을 수 없습니다. ID: ${sectionId}`);
    }

    const updatedSession = await this.prisma.userExamSession.update({
      where: { id: sessionId },
      data: {
        currentSectionId: sectionId,
        currentQuestionNumber: dto.currentQuestionNumber || 1,
        lastActivityAt: new Date(),
      },
    });

    return {
      message: '섹션이 변경되었습니다.',
      currentSectionId: updatedSession.currentSectionId,
      currentQuestionNumber: updatedSession.currentQuestionNumber,
    };
  }

  /**
   * 문제별 피드백 (실시간 피드백)
   */
  async submitQuestion(
    sessionId: string,
    questionId: string,
    userId: string,
    dto: any,
  ) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  where: { id: questionId },
                  include: {
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`세션을 찾을 수 없습니다. ID: ${sessionId}`);
    }

    if (session.userId !== userId) {
      throw new BadRequestException('본인의 시험만 사용할 수 있습니다.');
    }

    const question = session.exam.sections
      .flatMap((s) => s.questions)
      .find((q) => q.id === questionId);

    if (!question) {
      throw new NotFoundException(`문제를 찾을 수 없습니다. ID: ${questionId}`);
    }

    // 답안 확인
    const isCorrect = dto.answer === question.correctAnswer;

    // 시간 관리 힌트 계산
    const avgTimeForDifficulty: { [key: string]: number } = {
      easy: 30,
      medium: 60,
      hard: 90,
    };
    const avgTime = avgTimeForDifficulty[question.difficulty || 'medium'] || 60;
    const timeHint = dto.timeSpent
      ? dto.timeSpent < avgTime * 0.7
        ? `이 문제는 평균보다 ${Math.round(avgTime - dto.timeSpent)}초 빠르게 해결했습니다`
        : dto.timeSpent > avgTime * 1.5
          ? `이 문제에 평균보다 ${Math.round(dto.timeSpent - avgTime)}초 더 소요되었습니다`
          : '시간 관리가 적절합니다'
      : null;

    // 즉각 피드백 생성
    const immediateFeedback = isCorrect
      ? '정답입니다! 👍'
      : '아쉽네요. 설명을 확인해보세요';

    // 팁 생성
    const tips: string[] = [];
    if (isCorrect && question.difficulty === 'hard') {
      tips.push('고난이도 문제를 정확히 풀었습니다. 실력이 향상되고 있습니다!');
    } else if (!isCorrect && question.tags && question.tags.length > 0) {
      tips.push(`${question.tags[0]} 개념을 다시 확인해보세요`);
    }

    return {
      isCorrect,
      feedback: {
        immediate: immediateFeedback,
        explanation: question.explanation || '설명이 없습니다.',
        tips,
      },
      performanceHint: {
        timeManagement: timeHint,
        difficulty: `난이도 ${question.difficulty || '중급'} 문제를 ${isCorrect ? '정확히' : '오답'}했습니다`,
      },
    };
  }

  /**
   * 시험 제출
   */
  async submitExam(sessionId: string, userId: string) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`세션을 찾을 수 없습니다. ID: ${sessionId}`);
    }

    if (session.userId !== userId) {
      throw new BadRequestException('본인의 시험만 제출할 수 있습니다.');
    }

    if (!session.examResultId) {
      throw new BadRequestException('시험 결과를 찾을 수 없습니다.');
    }

    // 시험 결과 확인
    const examResult = await this.prisma.examResult.findUnique({
      where: { id: session.examResultId },
    });

    if (!examResult) {
      throw new NotFoundException('시험 결과를 찾을 수 없습니다.');
    }

    // 이미 제출된 경우
    if (examResult.status !== 'in_progress') {
      throw new BadRequestException('이미 제출된 시험입니다.');
    }

    // 세션 업데이트
    await this.prisma.userExamSession.update({
      where: { id: sessionId },
      data: {
        lastActivityAt: new Date(),
      },
    });

    // 모니터링 시스템에 종료 알림 (Phase 8)
    if (this.monitoringGateway) {
      await this.monitoringGateway.handleExamEnd(
        { sessionId },
        null as any,
      );
    }

    // 시험 결과 상태 변경
    const submittedAt = new Date();
    await this.prisma.examResult.update({
      where: { id: session.examResultId },
      data: {
        status: 'completed',
        submittedAt,
      },
    });

    // 채점 실행
    const gradedResult = await this.gradingService.gradeExam(
      session.examResultId,
    );

    // 시험 정보 가져오기 (categoryId 확인용)
    const exam = await this.prisma.exam.findUnique({
      where: { id: examResult.examId },
      select: { categoryId: true },
    });

    // 배지 자동 부여를 위한 이벤트 발행
    if (
      gradedResult.totalScore !== null && 
      gradedResult.totalScore !== undefined && 
      gradedResult.maxScore !== null && 
      gradedResult.maxScore !== undefined &&
      gradedResult.percentage !== null &&
      gradedResult.percentage !== undefined
    ) {
      this.eventEmitter.emit(
        'exam.completed',
        new ExamCompletedEvent(
          userId,
          session.examResultId,
          examResult.examId,
          gradedResult.totalScore,
          Number(gradedResult.maxScore),
          Number(gradedResult.percentage),
          exam?.categoryId ?? undefined,
          gradedResult.timeSpent ?? undefined,
        ),
      );
    }

    return {
      examResultId: session.examResultId,
      status: gradedResult.status,
      totalScore: gradedResult.totalScore,
      maxScore: gradedResult.maxScore,
      percentage: gradedResult.percentage,
      timeSpent: gradedResult.timeSpent,
      submittedAt: gradedResult.submittedAt,
    };
  }

  /**
   * 적응형 시험: 다음 문제 가져오기
   */
  async getNextQuestion(
    sessionId: string,
    userId: string,
    dto?: GetNextQuestionDto,
  ) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            config: true,
          },
        },
        adaptiveQuestions: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`세션을 찾을 수 없습니다. ID: ${sessionId}`);
    }

    if (session.userId !== userId) {
      throw new BadRequestException('본인의 세션만 조회할 수 있습니다.');
    }

    if (!session.exam.isAdaptive) {
      throw new BadRequestException('이 시험은 적응형 시험이 아닙니다.');
    }

    // 현재 답안 분석 (제공된 경우)
    if (dto?.currentAnswer) {
      await this.analyzeAnswer(sessionId, dto.currentAnswer);
    }

    // 사용자 능력 추정
    const ability = await this.estimateAbility(sessionId);

    // 적합한 난이도 계산
    const targetDifficulty = this.calculateTargetDifficulty(ability);

    // 다음 문제 선택
    const nextQuestion = await this.selectAdaptiveQuestion(
      sessionId,
      targetDifficulty,
    );

    return {
      question: {
        id: nextQuestion.id,
        content: nextQuestion.content,
        options: nextQuestion.options,
        questionType: nextQuestion.questionType,
        points: nextQuestion.points,
        difficulty: nextQuestion.difficulty,
      },
      ability,
      targetDifficulty,
      order: await this.getNextOrder(sessionId),
    };
  }

  /**
   * 답안 분석 (내부 메서드)
   */
  private async analyzeAnswer(sessionId: string, answer: string) {
    // 마지막 AdaptiveQuestion 가져오기
    const lastAdaptiveQuestion = await this.prisma.adaptiveQuestion.findFirst({
      where: { sessionId },
      orderBy: { order: 'desc' },
      include: {
        question: true,
      },
    });

    if (!lastAdaptiveQuestion) {
      return;
    }

    const isCorrect = answer === lastAdaptiveQuestion.question.correctAnswer;

    // AdaptiveQuestion 업데이트
    await this.prisma.adaptiveQuestion.update({
      where: { id: lastAdaptiveQuestion.id },
      data: {
        answeredAt: new Date(),
        isCorrect,
      },
    });
  }

  /**
   * 사용자 능력 추정 (IRT 모델 기반)
   */
  private async estimateAbility(sessionId: string): Promise<number> {
    const adaptiveQuestions = await this.prisma.adaptiveQuestion.findMany({
      where: {
        sessionId,
        answeredAt: { not: null },
      },
      include: {
        question: true,
      },
      orderBy: { order: 'asc' },
    });

    if (adaptiveQuestions.length === 0) {
      return 0.5; // 기본 능력 (중간)
    }

    // IRT 모델을 사용한 능력 추정
    const responses = adaptiveQuestions.map((aq) => ({
      isCorrect: aq.isCorrect || false,
      difficulty: this.irtService.convertDifficultyToIRT(
        aq.difficulty || Difficulty.MEDIUM,
      ),
      discrimination: 1.0, // 기본 변별도
      guessing: 0.25, // 기본 추측 확률
    }));

    // IRT 능력 추정 (theta: -3 ~ +3)
    const theta = this.irtService.estimateAbility(responses, 0);

    // 정규화된 능력으로 변환 (0 ~ 1)
    const normalizedAbility = this.irtService.normalizeAbility(theta);

    return Math.max(0, Math.min(1, normalizedAbility));
  }

  /**
   * 목표 난이도 계산
   */
  private calculateTargetDifficulty(ability: number): Difficulty {
    if (ability >= 0.7) {
      return Difficulty.HARD;
    } else if (ability >= 0.4) {
      return Difficulty.MEDIUM;
    } else {
      return Difficulty.EASY;
    }
  }

  /**
   * 적응형 문제 선택
   */
  private async selectAdaptiveQuestion(
    sessionId: string,
    targetDifficulty: Difficulty,
  ) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`세션을 찾을 수 없습니다. ID: ${sessionId}`);
    }

    const exam = session.exam;
    const adaptiveConfig = (exam.adaptiveConfig as any) || {};

    // 이미 풀은 문제 ID 목록
    const answeredQuestionIds = await this.prisma.adaptiveQuestion
      .findMany({
        where: { sessionId },
        select: { questionId: true },
      })
      .then((aqs) => aqs.map((aq) => aq.questionId));

    // Question Pool에서 문제 선택
    const poolIds = adaptiveConfig.questionPoolIds || [];
    let filteredQuestions: any[] = [];

    if (poolIds.length > 0) {
      // Pool의 questionIds로 문제 조회
      const allPoolQuestionIds: string[] = [];
      for (const poolId of poolIds) {
        try {
          const pool = await this.questionPoolService.getQuestionPool(
            poolId,
            undefined,
          );
          if (pool.questionIds && pool.questionIds.length > 0) {
            allPoolQuestionIds.push(...pool.questionIds);
          }
        } catch (error) {
          // Pool을 찾을 수 없으면 스킵
          console.warn(`Question Pool ${poolId} not found`);
        }
      }

      if (allPoolQuestionIds.length > 0) {
        const availablePoolIds = allPoolQuestionIds.filter(
          (id) => !answeredQuestionIds.includes(id),
        );
        filteredQuestions = await this.prisma.question.findMany({
          where: {
            id: { in: availablePoolIds },
            difficulty: targetDifficulty,
          },
          take: 50, // 최대 50개만 조회
        });
      }
    }

    // Pool에 문제가 없으면 전체 문제에서 필터링
    if (filteredQuestions.length === 0) {
      filteredQuestions = await this.prisma.question.findMany({
        where: {
          id: { notIn: answeredQuestionIds },
          difficulty: targetDifficulty,
        },
        take: 50,
      });
    }

    if (filteredQuestions.length === 0) {
      throw new NotFoundException(
        `적합한 문제를 찾을 수 없습니다. (난이도: ${targetDifficulty})`,
      );
    }

    // 랜덤 선택 (간단한 랜덤)
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    const selectedQuestion = filteredQuestions[randomIndex];

    // AdaptiveQuestion 레코드 생성
    const order = await this.getNextOrder(sessionId);
    await this.prisma.adaptiveQuestion.create({
      data: {
        sessionId,
        questionId: selectedQuestion.id,
        examId: exam.id,
        difficulty: targetDifficulty,
        order,
      },
    });

    return selectedQuestion;
  }

  /**
   * 다음 순서 번호 가져오기
   */
  private async getNextOrder(sessionId: string): Promise<number> {
    const lastQuestion = await this.prisma.adaptiveQuestion.findFirst({
      where: { sessionId },
      orderBy: { order: 'desc' },
    });

    return (lastQuestion?.order || 0) + 1;
  }
}

