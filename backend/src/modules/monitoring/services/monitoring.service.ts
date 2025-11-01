import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { ExamMonitoringEvent, CheatingDetectionEvent } from '../dto/monitoring-events.dto';

@Injectable()
export class MonitoringService {
  private activeSessions = new Map<string, {
    sessionId: string;
    userId: string;
    examId: string;
    startTime: Date;
    lastActivity: Date;
    tabSwitches: number;
    submitTime?: Date;
  }>();

  constructor(private prisma: PrismaService) {}

  /**
   * 시험 세션 등록 (시험 시작 시)
   */
  registerSession(sessionId: string, userId: string, examId: string) {
    this.activeSessions.set(sessionId, {
      sessionId,
      userId,
      examId,
      startTime: new Date(),
      lastActivity: new Date(),
      tabSwitches: 0,
    });
  }

  /**
   * 세션 종료 (시험 제출 시)
   */
  unregisterSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
  }

  /**
   * 탭 전환 탐지
   */
  detectTabSwitch(sessionId: string, userId: string, examId: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    session.tabSwitches += 1;
    session.lastActivity = new Date();

    // 부정행위 의심 로그 기록
    if (session.tabSwitches > 3) {
      this.logCheatingEvent({
        sessionId,
        userId,
        examId,
        eventType: 'excessive_tab_switches',
        severity: 'warning',
        details: { tabSwitchCount: session.tabSwitches },
      });
    }

    return {
      sessionId,
      tabSwitches: session.tabSwitches,
      warning: session.tabSwitches > 3,
    };
  }

  /**
   * 빠른 제출 탐지
   */
  async detectFastSubmit(sessionId: string, examId: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { estimatedTime: true },
    });

    if (!exam || !exam.estimatedTime) return null;

    const timeSpent = (new Date().getTime() - session.startTime.getTime()) / 1000 / 60; // 분
    const estimatedMinutes = exam.estimatedTime;

    // 예상 시간의 30% 미만으로 제출하면 의심
    if (timeSpent < estimatedMinutes * 0.3) {
      this.logCheatingEvent({
        sessionId,
        userId: session.userId,
        examId,
        eventType: 'fast_submit',
        severity: 'warning',
        details: {
          timeSpent: Math.floor(timeSpent),
          estimatedTime: estimatedMinutes,
          percentage: (timeSpent / estimatedMinutes) * 100,
        },
      });

      return {
        sessionId,
        suspicious: true,
        timeSpent,
        estimatedTime: estimatedMinutes,
        percentage: (timeSpent / estimatedMinutes) * 100,
      };
    }

    return null;
  }

  /**
   * 활동 시간 업데이트
   */
  updateActivity(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * 부정행위 이벤트 로깅
   */
  async logCheatingEvent(event: Omit<CheatingDetectionEvent, 'timestamp'>) {
    // Audit Log에 기록
    await this.prisma.auditLog.create({
      data: {
        userId: event.userId,
        action: `CHEATING_DETECTED_${event.eventType}`,
        entityType: 'ExamSession',
        entityId: event.sessionId,
        changes: {
          severity: event.severity,
          details: event.details,
        },
        ipAddress: null, // TODO: request에서 추출
        userAgent: null, // TODO: request에서 추출
      },
    });
  }

  /**
   * 활성 세션 목록 조회
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map((session) => ({
      sessionId: session.sessionId,
      userId: session.userId,
      examId: session.examId,
      startTime: session.startTime,
      duration: Math.floor(
        (new Date().getTime() - session.startTime.getTime()) / 1000 / 60,
      ),
      tabSwitches: session.tabSwitches,
    }));
  }

  /**
   * 특정 시험의 활성 세션 조회
   */
  getActiveSessionsByExam(examId: string) {
    return this.getActiveSessions().filter(
      (session) => session.examId === examId,
    );
  }
}

