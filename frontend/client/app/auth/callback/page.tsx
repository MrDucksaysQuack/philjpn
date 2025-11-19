"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (token && refreshToken) {
      // 토큰에서 사용자 정보 추출 (간단한 디코딩)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name || "",
          role: payload.role,
          isEmailVerified: true,
        };

        setAuth(user, token, refreshToken);
        router.push("/exams");
      } catch (error) {
        console.error("토큰 파싱 오류:", error);
        router.push("/login?error=" + encodeURIComponent("인증에 실패했습니다."));
      }
    } else {
      router.push("/login?error=" + encodeURIComponent("인증 정보를 받을 수 없습니다."));
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient-light">
      <LoadingSpinner message="로그인 처리 중..." />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-theme-gradient-light">
          <LoadingSpinner message="로딩 중..." />
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </>
  );
}

