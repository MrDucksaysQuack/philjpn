"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { socketClient } from "@/lib/socket";

/**
 * 설정 변경 시 실시간으로 반영하는 컴포넌트
 * 전역적으로 사용되도록 Header나 Layout에 추가
 */
export default function SettingsSync() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 설정 업데이트 WebSocket 연결
    const settingsSocket = socketClient.connectSettingsNotifications(accessToken);

    // 설정 업데이트 이벤트 리스너
    const handleSettingsUpdate = (data: { settings: any; timestamp: string }) => {
      console.log("Settings updated via WebSocket:", data.timestamp);
      
      // 캐시 무효화하여 최신 설정 가져오기
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
    };

    socketClient.onSettingsUpdated(handleSettingsUpdate);

    return () => {
      socketClient.offSettingsUpdated(handleSettingsUpdate);
    };
  }, [accessToken, queryClient]);

  return null; // UI 없음
}

