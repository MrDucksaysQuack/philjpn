import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';
import { ExamMonitoringEvent } from '../dto/monitoring-events.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // 프로덕션에서는 특정 도메인으로 제한
  },
  namespace: '/monitoring',
})
export class ExamMonitoringGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private monitoringService: MonitoringService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 시험 시작 이벤트 (WebSocket 또는 직접 호출)
   */
  handleExamStart(
    data: { sessionId: string; userId: string; examId: string },
    client: Socket | null,
  ) {
    this.monitoringService.registerSession(
      data.sessionId,
      data.userId,
      data.examId,
    );

    // Admin에게 알림 (실시간 모니터링)
    this.server.emit('session_started', {
      sessionId: data.sessionId,
      userId: data.userId,
      examId: data.examId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  /**
   * 시험 시작 이벤트 (WebSocket)
   */
  @SubscribeMessage('exam_start')
  handleExamStartWS(
    @MessageBody() data: { sessionId: string; userId: string; examId: string },
    @ConnectedSocket() client: Socket,
  ) {
    return this.handleExamStart(data, client);
  }

  /**
   * 시험 종료 이벤트
   */
  async handleExamEnd(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.monitoringService
      .getActiveSessions()
      .find((s) => s.sessionId === data.sessionId);

    if (session) {
      // 빠른 제출 탐지
      const fastSubmit = await this.monitoringService.detectFastSubmit(
        data.sessionId,
        session.examId,
      );

      if (fastSubmit) {
        this.server.emit('cheating_detected', {
          sessionId: data.sessionId,
          userId: session.userId,
          examId: session.examId,
          eventType: 'fast_submit',
          details: fastSubmit,
          timestamp: new Date(),
        });
      }

      this.monitoringService.unregisterSession(data.sessionId);

      this.server.emit('session_ended', {
        sessionId: data.sessionId,
        timestamp: new Date(),
      });
    }

    return { success: true };
  }

  /**
   * 탭 전환 이벤트
   */
  @SubscribeMessage('tab_switch')
  handleTabSwitch(
    @MessageBody()
    data: { sessionId: string; userId: string; examId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.monitoringService.detectTabSwitch(
      data.sessionId,
      data.userId,
      data.examId,
    );

    if (result && result.warning) {
      // 부정행위 의심 시 Admin에게 알림
      this.server.emit('cheating_detected', {
        sessionId: data.sessionId,
        userId: data.userId,
        examId: data.examId,
        eventType: 'excessive_tab_switches',
        details: { tabSwitches: result.tabSwitches },
        timestamp: new Date(),
      });
    }

    return { success: true, tabSwitches: result?.tabSwitches || 0 };
  }

  /**
   * 활동 업데이트
   */
  @SubscribeMessage('activity')
  handleActivity(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.monitoringService.updateActivity(data.sessionId);
    return { success: true };
  }

  /**
   * 활성 세션 조회 (Admin용)
   */
  @SubscribeMessage('get_active_sessions')
  handleGetActiveSessions(
    @MessageBody() data: { examId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sessions = data.examId
      ? this.monitoringService.getActiveSessionsByExam(data.examId)
      : this.monitoringService.getActiveSessions();

    return { sessions };
  }

  /**
   * Admin에게 실시간 이벤트 전송
   */
  emitToAdmins(event: string, data: any) {
    this.server.emit(`admin:${event}`, data);
  }
}

