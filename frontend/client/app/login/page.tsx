"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { authAPI } from "@/lib/api";
import Header from "@/components/layout/Header";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <>
      <Header />
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
          </form>
          </div>
        </div>
      </div>
    </>
  );
}
