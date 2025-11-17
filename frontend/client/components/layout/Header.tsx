"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { siteSettingsAPI } from "@/lib/api";
import AboutUsDropdown from "./AboutUsDropdown";

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 사이트 설정 가져오기 (회사명, 로고)
  const { data: settingsResponse } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await siteSettingsAPI.getPublicSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });

  const data = (settingsResponse as any)?.data || settingsResponse;
  const settings = data as any;
  const companyName = settings?.companyName || "Exam Platform";
  const logoUrl = settings?.logoUrl;
  const [logoError, setLogoError] = useState(false);

  // logoUrl이 변경되면 에러 상태 리셋
  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  const handleLogout = () => {
    clearAuth();
    setIsMenuOpen(false);
    router.push("/login");
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const menuItems = [
    { href: "/dashboard", label: "대시보드", icon: "📊", isPrimary: true },
    { href: "/results", label: "내 결과", icon: "📝" },
    { href: "/wordbook", label: "단어장", icon: "📖" },
    { href: "/statistics", label: "통계", icon: "📈" },
    { href: "/analysis", label: "자기 분석", icon: "🔍" },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-xl font-bold gradient-text flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 rounded-lg"
              aria-label="홈페이지로 이동"
            >
              <div className="w-8 h-8 bg-theme-gradient-diagonal rounded-lg flex items-center justify-center overflow-hidden" aria-hidden="true">
                {logoUrl && !logoError ? (
                  <img
                    src={logoUrl}
                    alt={companyName}
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <span>{companyName}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="주요 메뉴">
              <AboutUsDropdown />
              <Link
                href="/exams"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
                aria-label="시험 목록 페이지로 이동"
              >
                시험 목록
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4" role="region" aria-label="사용자 메뉴">
            {user ? (
              <>
                {/* 사용자 프로필 드롭다운 메뉴 */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-theme-primary-light rounded-lg border border-theme-primary hover:bg-theme-primary-light transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
                    aria-label="사용자 메뉴 열기"
                    aria-expanded={isMenuOpen}
                    type="button"
                  >
                    <div className="w-8 h-8 bg-theme-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name}님</span>
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                        isMenuOpen ? "transform rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-semibold text-gray-900">{user.name}님</div>
                        <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                      </div>
                      
                      <div className="py-2">
                        {menuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              item.isPrimary
                                ? "text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                            aria-label={`${item.label} 페이지로 이동`}
                          >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
                            aria-label="관리자 페이지로 이동"
                          >
                            <span className="text-base">⚙️</span>
                            <span>관리자</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          aria-label="로그아웃"
                          type="button"
                        >
                          <span className="text-base">🚪</span>
                          <span>로그아웃</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 모바일: 간단한 사용자 정보 표시 */}
                <div className="sm:hidden flex items-center gap-2">
                  <div className="w-8 h-8 bg-theme-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.charAt(0)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 rounded-lg"
                  aria-label="로그인 페이지로 이동"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 text-sm font-semibold bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
                  aria-label="회원가입 페이지로 이동"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
