"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useAuthStore } from "@/lib/store";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import QuickStats from "./components/QuickStats";
import GoalProgressWidget from "./components/GoalProgressWidget";
import RecommendedExamsWidget from "./components/RecommendedExamsWidget";
import RecentActivityWidget from "./components/RecentActivityWidget";
import LearningInsightsWidget from "./components/LearningInsightsWidget";
import WordBookSummaryWidget from "./components/WordBookSummaryWidget";
import QuickActions from "./components/QuickActions";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // 로그인 체크
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in flex items-center justify-center gap-3">
                <span className="text-5xl">📊</span>
                나의 학습 대시보드
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                모든 학습 정보를 한눈에 확인하세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 빠른 통계 카드 */}
          <QuickStats />

          {/* 목표 진행 상황 위젯 (최상단, 가장 중요) */}
          <div className="mb-8">
            <GoalProgressWidget />
          </div>

          {/* 메인 콘텐츠 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* 왼쪽: 추천 시험 */}
            <div className="lg:col-span-2">
              <RecommendedExamsWidget />
            </div>

            {/* 오른쪽: 학습 패턴 인사이트 */}
            <div className="lg:col-span-1">
              <LearningInsightsWidget />
            </div>
          </div>

          {/* 하단 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 최근 학습 활동 */}
            <div>
              <RecentActivityWidget />
            </div>

            {/* 단어장 요약 */}
            <div>
              <WordBookSummaryWidget />
            </div>
          </div>

          {/* 빠른 액션 섹션 */}
          <QuickActions />
        </div>
      </div>
    </>
  );
}

