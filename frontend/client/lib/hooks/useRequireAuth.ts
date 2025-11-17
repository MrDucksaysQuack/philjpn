"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";

/**
 * 로그인이 필요한 페이지에서 사용하는 표준화된 훅
 * 
 * @param options - 옵션 설정
 * @param options.redirectTo - 리다이렉트할 경로 (기본값: "/login")
 * @param options.requireRole - 필요한 역할 (예: "admin")
 * @param options.showMessage - 메시지를 표시할지 여부 (기본값: false, 리다이렉트만 수행)
 * 
 * @returns { user: User | null, isLoading: boolean }
 */
export function useRequireAuth(options?: {
  redirectTo?: string;
  requireRole?: string;
  showMessage?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(true);
  const isCheckingRef = useRef(false);

  const { redirectTo = "/login", requireRole, showMessage = false } = options || {};

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      // 이미 사용자 정보가 있으면 검증만 수행
      if (user) {
        // 역할 검증
        if (requireRole && user.role !== requireRole) {
          if (showMessage) {
            alert("접근 권한이 없습니다.");
          }
          if (mounted && typeof window !== 'undefined') {
            router.push(redirectTo);
          }
          return;
        }
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      // localStorage에 토큰이 있는지 확인
      if (typeof window === "undefined") {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      // 이미 체크 중이면 대기
      if (isCheckingRef.current) {
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      // 토큰이 없으면 리다이렉트
      if (!accessToken || !refreshToken) {
        if (mounted) {
          setIsLoading(false);
          router.push(redirectTo);
        }
        return;
      }

      // 토큰이 있으면 사용자 정보 가져오기 (한 번만 실행)
      isCheckingRef.current = true;
      try {
        const response = await authAPI.getCurrentUser();
        const userData = response.data;
        
        if (!mounted) return;
        
        // 사용자 정보 복원
        setAuth(userData, accessToken, refreshToken);

        // 역할 검증
        if (requireRole && userData.role !== requireRole) {
          if (showMessage) {
            alert("접근 권한이 없습니다.");
          }
          if (typeof window !== 'undefined') {
            router.push(redirectTo);
          }
          return;
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 리다이렉트
        if (mounted) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== 'undefined') {
            router.push(redirectTo);
          }
        }
      } finally {
        if (mounted) {
          isCheckingRef.current = false;
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, redirectTo, requireRole, showMessage]);

  return {
    user: user || null,
    isLoading,
  };
}

