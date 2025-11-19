"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { authAPI } from "@/lib/api";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // URL 쿼리 파라미터에서 에러 확인
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // ✅ 입력값 검증 (빈 값 체크)
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      setError(t("auth.errors.emailPasswordRequired"));
      return;
    }
    
    // ✅ 이메일 형식 간단 체크
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t("auth.errors.invalidEmail"));
      return;
    }
    
    setLoading(true);

    try {
      const response = await authAPI.login({ 
        email: trimmedEmail, 
        password: trimmedPassword 
      });
      const { accessToken, refreshToken, user } = response.data;

      setAuth(user, accessToken, refreshToken);
      router.push("/exams");
    } catch (err) {
      const error = err as { 
        response?: { 
          data?: { 
            message?: string;
            errors?: Array<{ property: string; constraints: any }>;
          } 
        } 
      };
      
      // ✅ 상세한 에러 메시지 표시
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map(err => {
            const constraints = Object.values(err.constraints || {}).join(', ');
            return `${err.property}: ${constraints}`;
          })
          .join('\n');
        setError(errorMessages || error.response?.data?.message || t("auth.errors.loginFailed"));
      } else {
        setError(error.response?.data?.message || t("auth.errors.loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient-light py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-theme-gradient-primary rounded-2xl mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {t("auth.loginTitle")}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t("common.or")}{" "}
                <Link
                  href="/register"
                  className="font-medium text-theme-primary hover:opacity-80 transition-colors"
                >
                  {t("auth.register")}
                </Link>
              </p>
            </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-theme-gradient-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("auth.loggingIn")}
                  </span>
                ) : (
                  t("auth.login")
                )}
              </button>
            </div>

            {/* 소셜 로그인 구분선 */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {t("auth.socialLogin.divider")}
                  </span>
                </div>
              </div>

              {/* 소셜 로그인 버튼 */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/google`;
                  }}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/facebook`;
                  }}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-theme-gradient-light">
          <LoadingSpinner message="로딩 중..." />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </>
  );
}
