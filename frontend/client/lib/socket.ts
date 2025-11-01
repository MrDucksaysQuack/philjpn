"use client";

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

class SocketClient {
  private socket: Socket | null = null;
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
