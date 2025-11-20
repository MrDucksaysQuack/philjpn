"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, useLocaleStore, type Locale } from "@/lib/store";
import { useRouter } from "next/navigation";
import { siteSettingsAPI, categoryAPI, type Category, type SiteSettings } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import AboutUsDropdown from "./AboutUsDropdown";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import BadgeNotification from "@/components/common/BadgeNotification";
import SettingsSync from "@/components/common/SettingsSync";

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const { locale, setLocale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { resetOnboarding } = useOnboarding();
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const localeMenuRef = useRef<HTMLDivElement>(null);

  // 사이트 설정 가져오기 (회사명, 로고)
  const { data: settingsResponse } = useQuery<{ data: SiteSettings }>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await siteSettingsAPI.getPublicSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });

  // 카테고리 목록 가져오기 (헤더용)
  const { data: categoriesResponse } = useQuery<{ data: Category[] }>({
    queryKey: ["categories-public", locale],
    queryFn: async () => {
      const response = await categoryAPI.getPublicCategories(locale);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });

  const settings = settingsResponse?.data;
  const companyName = settings?.companyName || t("header.defaultCompanyName");
  const logoUrl = settings?.logoUrl;
  const [logoError, setLogoError] = useState(false);
  const categories = categoriesResponse?.data || [];

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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (localeMenuRef.current && !localeMenuRef.current.contains(event.target as Node)) {
        setIsLocaleMenuOpen(false);
      }
    };

    if (isMenuOpen || isMobileMenuOpen || isLocaleMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, isMobileMenuOpen, isLocaleMenuOpen]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsLocaleMenuOpen(false);
  };

  // 언어 이름은 하드코딩 (hydration mismatch 방지)
  const localeLabels: Record<Locale, string> = {
    ko: "한국어",
    en: "English",
    ja: "日本語",
  };

  // 모바일 메뉴 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const menuItems = [
    { href: "/dashboard", labelKey: "header.menu.dashboard", icon: "📊", isPrimary: true },
    { href: "/profile", labelKey: "header.menu.profile", icon: "👤", isPrimary: false },
    { href: "/badges", labelKey: "header.menu.badges", icon: "🏆", isPrimary: false },
    { href: "/results", labelKey: "header.menu.results", icon: "📝" },
    { href: "/wordbook", labelKey: "header.menu.wordbook", icon: "📖" },
    { href: "/statistics", labelKey: "header.menu.statistics", icon: "📈" },
    { href: "/analysis", labelKey: "header.menu.analysis", icon: "🔍" },
  ];

  return (
    <header className="bg-surface/95 backdrop-blur-sm shadow-md border-b border-border-light sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-xl font-bold gradient-text flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 rounded-lg"
              aria-label={t("header.home")}
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
              {/* 동적 카테고리 메뉴 */}
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category: Category) => (
                  <Link
                    key={category.id}
                    href={`/exams?categoryId=${category.id}`}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 flex items-center gap-2"
                    aria-label={`${category.name} ${t("header.navigateToCategory")}`}
                  >
                    {category.icon && <span>{category.icon}</span>}
                    <span>{category.name}</span>
                  </Link>
                ))
              ) : (
                <Link
                  href="/exams"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
                  aria-label={t("header.examList")}
                >
                  {t("header.examList")}
                </Link>
              )}
            </nav>
            
            {/* 모바일 햄버거 메뉴 버튼 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-primary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-theme-primary"
              aria-label="메뉴 열기"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
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
                    <span className="text-sm font-medium text-text-primary">{user.name}{t("header.nameSuffix")}</span>
                    <svg
                      className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
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
                    <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-border-light bg-surface-hover/50">
                        <div className="text-sm font-semibold text-text-primary">{user.name}{t("header.nameSuffix")}</div>
                        <div className="text-xs text-text-muted mt-1">{user.email}</div>
                      </div>
                      
                      <div className="py-2">
                        {menuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              item.isPrimary
                                ? "text-theme-primary font-semibold bg-theme-primary-light hover:bg-theme-primary-light"
                                : "text-text-primary hover:bg-surface-hover hover:text-text-primary"
                            }`}
                            aria-label={`${t(item.labelKey)} 페이지로 이동`}
                          >
                            <span className="text-base">{item.icon}</span>
                            <span>{t(item.labelKey)}</span>
                          </Link>
                        ))}
                        <button
                          onClick={() => {
                            resetOnboarding();
                            setShowOnboarding(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover hover:text-text-primary transition-colors text-left"
                        >
                          <span className="text-base">📚</span>
                          <span>{t("header.menu.guide")}</span>
                        </button>
                      </div>

                      <div className="border-t border-border-light pt-2">
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:bg-theme-secondary-light transition-colors"
                            aria-label={t("header.menu.admin")}
                          >
                            <span className="text-base">⚙️</span>
                            <span>{t("header.menu.admin")}</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors text-left"
                          aria-label={t("header.menu.logout")}
                          type="button"
                        >
                          <span className="text-base">🚪</span>
                          <span>{t("header.menu.logout")}</span>
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
                  className="px-4 py-2 text-sm font-medium text-text-primary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 rounded-lg"
                  aria-label={t("auth.login")}
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 text-sm font-semibold bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
                  aria-label={t("auth.register")}
                >
                  {t("auth.register")}
                </Link>
              </>
            )}
            
            {/* 언어 선택기 */}
            <div className="relative" ref={localeMenuRef}>
              <button
                onClick={() => setIsLocaleMenuOpen(!isLocaleMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-primary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 bg-surface-hover/30"
                aria-label={t("header.language")}
                aria-expanded={isLocaleMenuOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="hidden sm:inline">{localeLabels[locale]}</span>
                <svg className={`w-4 h-4 transition-transform ${isLocaleMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLocaleMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-surface rounded-lg shadow-lg border border-border py-1 z-50">
                  {(["ko", "en", "ja"] as Locale[]).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocaleChange(loc)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        locale === loc
                          ? "bg-theme-primary-light text-theme-primary font-semibold"
                          : "text-text-primary hover:bg-surface-hover"
                      }`}
                    >
                      {localeLabels[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" ref={mobileMenuRef}>
          <div className="bg-surface w-80 h-full shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-hover/30">
              <h2 className="text-lg font-semibold text-text-primary">{t("header.menuTitle")}</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-text-primary hover:bg-surface-hover"
                aria-label="메뉴 닫기"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {/* 카테고리 메뉴 (모든 사용자에게 표시) */}
              {Array.isArray(categories) && categories.length > 0 && (
                <div className="mb-4 pb-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary mb-2">{t("header.examCategories")}</h3>
                  <div className="space-y-1">
                    {categories.map((category: Category) => (
                      <Link
                        key={category.id}
                        href={`/exams?categoryId=${category.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-text-primary hover:bg-surface-hover transition-colors"
                      >
                        {category.icon && <span className="text-lg">{category.icon}</span>}
                        <span>{category.name}</span>
                      </Link>
                    ))}
                    <Link
                      href="/exams"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <span className="text-lg">📋</span>
                      <span>{t("header.allExams")}</span>
                    </Link>
                  </div>
                </div>
              )}

              {user ? (
                <>
                  {/* 사용자 정보 */}
                  <div className="mb-4 pb-4 border-b border-border bg-surface-hover/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-theme-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{user.name}{t("header.nameSuffix")}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* 메뉴 항목 */}
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                          item.isPrimary
                            ? "text-theme-primary font-semibold bg-theme-primary-light"
                            : "text-text-primary hover:bg-surface-hover"
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        resetOnboarding();
                        setShowOnboarding(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-text-primary hover:bg-surface-hover transition-colors text-left"
                    >
                      <span className="text-lg">📚</span>
                      <span>{t("header.menu.guide")}</span>
                    </button>
                  </div>

                  {/* 관리자 메뉴 */}
                  {user.role === "admin" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-theme-secondary bg-theme-secondary-light hover:bg-theme-secondary-light transition-colors"
                      >
                        <span className="text-lg">⚙️</span>
                        <span>{t("header.menu.admin")}</span>
                      </Link>
                    </div>
                  )}

                  {/* 로그아웃 */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-error hover:bg-error/10 transition-colors"
                      type="button"
                    >
                      <span className="text-lg">🚪</span>
                      <span>{t("header.menu.logout")}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t("auth.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 border border-border text-text-primary rounded-lg font-semibold hover:bg-surface-hover transition-colors"
                  >
                    {t("auth.register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 온보딩 모달 */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* 배지 알림 */}
      <BadgeNotification />

      {/* 설정 실시간 동기화 */}
      <SettingsSync />
    </header>
  );
}
