"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { useAuthStore, useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { siteSettingsAPI } from "@/lib/api";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  // SiteSettings에서 언어별 콘텐츠 가져오기
  const { data: settingsResponse } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await siteSettingsAPI.getPublicSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const data = (settingsResponse as any)?.data || settingsResponse;
  const settings = data as any;
  const homeContent = settings?.homeContent as any;
  
  // 언어별 콘텐츠 가져오기 (없으면 i18n fallback)
  const heroContent = homeContent?.[locale]?.hero || {
    title: t("home.hero.title"),
    subtitle: t("home.hero.subtitle"),
  };
  
  const featuresContent = homeContent?.[locale]?.features || [
    {
      title: t("home.features.realtimeExam.title"),
      description: t("home.features.realtimeExam.description"),
    },
    {
      title: t("home.features.detailedAnalysis.title"),
      description: t("home.features.detailedAnalysis.description"),
    },
    {
      title: t("home.features.learningTools.title"),
      description: t("home.features.learningTools.description"),
    },
  ];
  
  const featuresSectionTitle = homeContent?.[locale]?.featuresSectionTitle || t("home.features.title");
  const featuresSectionSubtitle = homeContent?.[locale]?.featuresSectionSubtitle || t("home.features.subtitle");

  return (
    <>
      <Header />
      {/* Hero Section with Gradient Background */}
      <div className="relative min-h-[600px] bg-theme-gradient-diagonal overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Orbs - Multiple layers with different animations */}
          <div className="absolute top-10 left-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute top-20 right-20 w-80 h-80 bg-purple-400 opacity-8 rounded-full blur-3xl animate-float-medium"></div>
          <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-blue-400 opacity-8 rounded-full blur-3xl animate-float-fast"></div>
          <div className="absolute bottom-10 right-1/3 w-72 h-72 bg-pink-400 opacity-10 rounded-full blur-3xl animate-float-slow delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>
          
          {/* Rotating Gradient Circles */}
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 opacity-15 rounded-full blur-2xl animate-spin-slow"></div>
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-15 rounded-full blur-2xl animate-spin-reverse-slow"></div>
          
          {/* Floating Particles */}
          <div className="absolute top-1/4 left-1/5 w-3 h-3 bg-white opacity-30 rounded-full animate-float-particle-1"></div>
          <div className="absolute top-1/3 right-1/5 w-2 h-2 bg-purple-300 opacity-40 rounded-full animate-float-particle-2"></div>
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-blue-300 opacity-25 rounded-full animate-float-particle-3"></div>
          <div className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-pink-300 opacity-35 rounded-full animate-float-particle-4"></div>
          <div className="absolute top-2/3 left-2/5 w-3.5 h-3.5 bg-white opacity-20 rounded-full animate-float-particle-5"></div>
          
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-grid-pattern animate-grid-move"></div>
          </div>
          
          {/* Gradient Waves */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/20 to-transparent animate-wave"></div>
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-900/20 to-transparent animate-wave-reverse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 animate-fade-in">
              {heroContent.title}
            </h1>
            <p className="text-xl sm:text-2xl text-theme-primary-light mb-8 sm:mb-12 px-4 max-w-3xl mx-auto">
              {heroContent.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 px-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="group w-full sm:w-auto bg-white text-theme-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-theme-primary-light transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">📊</span>
                      {t("home.hero.dashboardButton")}
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    href="/exams"
                    className="w-full sm:w-auto bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-theme-primary transition-all duration-300 transform hover:scale-105"
                  >
                    {t("home.hero.startExamButton")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/exams"
                    className="group w-full sm:w-auto bg-white text-theme-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-theme-primary-light transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {t("home.hero.startExamButton")}
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-theme-primary transition-all duration-300 transform hover:scale-105"
                  >
                    {t("home.hero.registerButton")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {featuresSectionTitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {featuresSectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuresContent.map((feature: any, index: number) => {
            const icons = [
              <svg key="icon1" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>,
              <svg key="icon2" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>,
              <svg key="icon3" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>,
            ];
            const gradientClasses = [
              "bg-theme-gradient-icon-primary",
              "bg-theme-gradient-icon-secondary",
              "bg-theme-gradient-icon-accent",
            ];
            
            return (
              <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 ${gradientClasses[index]} rounded-xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform`}>
                  {icons[index]}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
