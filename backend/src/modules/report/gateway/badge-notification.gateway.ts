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
  namespace: '/badges',
})
export class BadgeNotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BadgeNotificationGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      this.logger.log(`User ${userId} connected (socket: ${client.id})`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  /**
   * 특정 사용자에게 배지 획득 알림 전송
   */
  notifyBadgeEarned(userId: string, badgeData: {
    badgeId: string;
    badgeName: string;
    badgeIcon?: string;
    badgeRarity: string;
    earnedAt: Date;
  }) {
    const userSocketIds = this.userSockets.get(userId);
    
    if (userSocketIds && userSocketIds.size > 0) {
      userSocketIds.forEach((socketId) => {
        this.server.to(socketId).emit('badge_earned', badgeData);
      });
      this.logger.log(`Badge notification sent to user ${userId} (${userSocketIds.size} socket(s))`);
    } else {
      this.logger.debug(`User ${userId} is not connected, notification not sent`);
    }
  }

  /**
   * 여러 배지 획득 알림 전송
   */
  notifyBadgesEarned(userId: string, badges: Array<{
    badgeId: string;
    badgeName: string;
    badgeIcon?: string;
    badgeRarity: string;
    earnedAt: Date;
  }>) {
    const userSocketIds = this.userSockets.get(userId);
    
    if (userSocketIds && userSocketIds.size > 0) {
      userSocketIds.forEach((socketId) => {
        this.server.to(socketId).emit('badges_earned', { badges });
      });
      this.logger.log(`Multiple badge notifications sent to user ${userId} (${userSocketIds.size} socket(s))`);
    } else {
      this.logger.debug(`User ${userId} is not connected, notifications not sent`);
    }
  }
}

