"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteSettingsAPI } from "@/lib/api";
import { applyTheme, resetTheme } from "@/lib/theme";

/**
 * 사이트 설정의 테마를 자동으로 적용하는 Provider 컴포넌트
 * 앱의 루트 레벨에서 사용
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settingsResponse } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await siteSettingsAPI.getPublicSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시
    refetchOnWindowFocus: false,
  });

  const settings = (settingsResponse as any)?.data || settingsResponse;

  useEffect(() => {
    if (settings) {
      applyTheme(settings as any);
    } else {
      resetTheme();
    }

    // 컴포넌트 언마운트 시 기본값으로 복원
    return () => {
      resetTheme();
    };
  }, [settings]);

  return <>{children}</>;
}

