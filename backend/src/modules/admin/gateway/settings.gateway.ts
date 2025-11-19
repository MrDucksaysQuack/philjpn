import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // 프로덕션에서는 특정 도메인으로 제한
  },
  namespace: '/settings',
})
export class SettingsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SettingsGateway.name);
  private connectedClients: Set<string> = new Set();

  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
    this.logger.log(`Settings client connected: ${client.id} (Total: ${this.connectedClients.size})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Settings client disconnected: ${client.id} (Total: ${this.connectedClients.size})`);
  }

  /**
   * 모든 클라이언트에 설정 변경 알림 브로드캐스트
   */
  broadcastSettingsUpdate(settings: any) {
    this.server.emit('settings_updated', {
      settings,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Settings update broadcasted to ${this.connectedClients.size} client(s)`);
  }

  /**
   * 특정 사용자에게만 설정 변경 알림 전송
   */
  notifySettingsUpdate(userId: string, settings: any) {
    this.server.to(`user:${userId}`).emit('settings_updated', {
      settings,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Settings update sent to user ${userId}`);
  }
}

