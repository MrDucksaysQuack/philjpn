"use client";

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

class SocketClient {
  private socket: Socket | null = null;
  private badgeSocket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token?: string | null) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(`${SOCKET_URL}/monitoring`, {
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.badgeSocket) {
      this.badgeSocket.disconnect();
      this.badgeSocket = null;
    }
  }

  /**
   * 배지 알림용 WebSocket 연결
   */
  connectBadgeNotifications(userId: string, token?: string | null) {
    if (this.badgeSocket?.connected) {
      return this.badgeSocket;
    }

    this.badgeSocket = io(`${SOCKET_URL}/badges`, {
      auth: token ? { userId, token } : { userId },
      query: { userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.badgeSocket.on("connect", () => {
      console.log("Badge notification socket connected:", this.badgeSocket?.id);
    });

    this.badgeSocket.on("disconnect", () => {
      console.log("Badge notification socket disconnected");
    });

    this.badgeSocket.on("connect_error", (error) => {
      console.error("Badge notification socket connection error:", error);
    });

    return this.badgeSocket;
  }

  /**
   * 배지 알림 이벤트 리스너 등록
   */
  onBadgeEarned(callback: (data: {
    badgeId: string;
    badgeName: string;
    badgeIcon?: string;
    badgeRarity: string;
    earnedAt: Date;
  }) => void) {
    if (this.badgeSocket) {
      this.badgeSocket.on("badge_earned", callback);
    }
  }

  /**
   * 여러 배지 획득 이벤트 리스너 등록
   */
  onBadgesEarned(callback: (data: {
    badges: Array<{
      badgeId: string;
      badgeName: string;
      badgeIcon?: string;
      badgeRarity: string;
      earnedAt: Date;
    }>;
  }) => void) {
    if (this.badgeSocket) {
      this.badgeSocket.on("badges_earned", callback);
    }
  }

  /**
   * 배지 알림 이벤트 리스너 제거
   */
  offBadgeEarned(callback?: (...args: any[]) => void) {
    if (this.badgeSocket) {
      this.badgeSocket.off("badge_earned", callback);
      this.badgeSocket.off("badges_earned", callback);
    }
  }

  /**
   * 설정 업데이트용 WebSocket 연결
   */
  private settingsSocket: Socket | null = null;

  connectSettingsNotifications(token?: string | null) {
    if (this.settingsSocket?.connected) {
      return this.settingsSocket;
    }

    this.settingsSocket = io(`${SOCKET_URL}/settings`, {
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.settingsSocket.on("connect", () => {
      console.log("Settings notification socket connected:", this.settingsSocket?.id);
    });

    this.settingsSocket.on("disconnect", () => {
      console.log("Settings notification socket disconnected");
    });

    this.settingsSocket.on("connect_error", (error) => {
      console.error("Settings notification socket connection error:", error);
    });

    return this.settingsSocket;
  }

  /**
   * 설정 업데이트 이벤트 리스너 등록
   */
  onSettingsUpdated(callback: (data: { settings: any; timestamp: string }) => void) {
    if (this.settingsSocket) {
      this.settingsSocket.on("settings_updated", callback);
    }
  }

  /**
   * 설정 업데이트 이벤트 리스너 제거
   */
  offSettingsUpdated(callback?: (...args: any[]) => void) {
    if (this.settingsSocket) {
      this.settingsSocket.off("settings_updated", callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  // 시험 시작 이벤트
  emitExamStart(sessionId: string, userId: string, examId: string) {
    if (this.socket) {
      this.socket.emit("exam_start", { sessionId, userId, examId });
    }
  }

  // 시험 종료 이벤트
  emitExamEnd(sessionId: string) {
    if (this.socket) {
      this.socket.emit("exam_end", { sessionId });
    }
  }

  // 탭 전환 이벤트
  emitTabSwitch(sessionId: string, userId: string, examId: string) {
    if (this.socket) {
      this.socket.emit("tab_switch", { sessionId, userId, examId });
    }
  }

  // 활동 업데이트
  emitActivity(sessionId: string) {
    if (this.socket) {
      this.socket.emit("activity", { sessionId });
    }
  }

  // 이벤트 리스너 등록
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // 이벤트 리스너 제거
  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketClient = new SocketClient();
