import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { StartExamDto } from './dto/start-exam.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { MoveSectionDto } from './dto/move-section.dto';
import { GradingService } from '../grading/grading.service';
import { ExamMonitoringGateway } from '../../monitoring/gateway/exam-monitoring.gateway';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private gradingService: GradingService,
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
}

