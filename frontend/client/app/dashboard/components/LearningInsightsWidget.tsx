"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { statisticsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function LearningInsightsWidget() {
  const user = useAuthStore((state) => state.user);

  const { data: patterns } = useQuery({
    queryKey: ["learning-patterns"],
    queryFn: async () => {
      const response = await statisticsAPI.getLearningPatterns();
      return response.data;
    },
    enabled: !!user,
  });

  const { data: weakness } = useQuery({
    queryKey: ["weakness-analysis"],
    queryFn: async () => {
      const response = await statisticsAPI.getWeaknessAnalysis();
      return response.data;
    },
    enabled: !!user,
  });

  const { data: efficiency } = useQuery({
    queryKey: ["efficiency-metrics"],
    queryFn: async () => {
      const response = await statisticsAPI.getEfficiencyMetrics();
      return response.data;
    },
    enabled: !!user,
  });

  const isLoading = !patterns || !weakness || !efficiency;

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  // 최적 학습 시간대 찾기
  const optimalHours = patterns?.timePatterns?.mostProductiveHours || [];
  const optimalHourText = optimalHours.length > 0
    ? `${optimalHours.slice(0, 2).join("시, ")}시`
    : "분석 중";

  // 주요 약점 영역 (상위 3개)
  const topWeaknesses = (weakness?.weaknessAreas || []).slice(0, 3);

  // 효율성 지표 요약
  const improvementRate = (efficiency as any)?.learningSpeed?.weeklyImprovementRate || 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
          학습 패턴 인사이트
        </h2>
        <Link
          href="/analysis"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          자세한 분석 보기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="space-y-6">
        {/* 최적 학습 시간대 */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⏰</span>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">최적 학습 시간대</div>
              <div className="text-xl font-bold text-indigo-700">{optimalHourText}</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            이 시간대에 학습하면 가장 효율적입니다
          </p>
        </div>

        {/* 주요 약점 영역 */}
        {topWeaknesses.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              주요 약점 영역
            </div>
            <div className="space-y-2">
              {topWeaknesses.map((area: any, index: number) => (
                <div
                  key={index}
                  className="bg-red-50 rounded-lg p-3 border border-red-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">{area.tag}</span>
                    <span className="text-xs font-semibold text-red-600">
                      {Math.round(area.correctRate)}% 정답률
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${area.correctRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 효율성 지표 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">주당 점수 향상률</div>
              <div className="text-xl font-bold text-blue-700">
                {improvementRate > 0 ? "+" : ""}{Math.round(improvementRate * 10) / 10}점/주
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            지속적인 학습으로 점진적 향상을 보이고 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}

