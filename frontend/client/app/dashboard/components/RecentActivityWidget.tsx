"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Link from "next/link";
import { resultAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function RecentActivityWidget() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const response = await resultAPI.getResults();
      return response.data.data || [];
    },
    enabled: !!user,
  });

  // ⚠️ 중요: 모든 hooks는 early return 전에 호출되어야 함 (React Hooks 규칙)
  // recentResults와 계산된 값들을 useMemo로 메모이제이션
  const processedResults = useMemo(() => {
    // data가 배열이 아닌 경우 빈 배열 반환
    if (!Array.isArray(data)) {
      return [];
    }
    
    const recentResults = data.slice(0, 3);
    
    // recentResults가 배열이 아닌 경우 빈 배열 반환
    if (!Array.isArray(recentResults)) {
      return [];
    }
    
    return recentResults.map((result: any, index: number) => {
      const percentage = result.percentage
        ? parseFloat(result.percentage.toString())
        : result.totalScore !== null && result.maxScore !== null && result.maxScore > 0
        ? (result.totalScore / result.maxScore) * 100
        : null;

      // 이전 결과와 비교하여 개선 추이 계산
      const previousResult = index < recentResults.length - 1 ? recentResults[index + 1] : null;
      const previousPercentage = previousResult?.percentage
        ? parseFloat(previousResult.percentage.toString())
        : previousResult &&
          previousResult.totalScore !== null &&
          previousResult.totalScore !== undefined &&
          previousResult.maxScore !== null &&
          previousResult.maxScore !== undefined &&
          previousResult.maxScore > 0
        ? (previousResult.totalScore / previousResult.maxScore) * 100
        : null;

      const improvement = percentage !== null && previousPercentage !== null
        ? percentage - previousPercentage
        : null;

      return {
        ...result,
        percentage,
        improvement,
      };
    });
  }, [data]);

  const recentResults = processedResults;

  // Early return은 모든 hooks 호출 후에 수행
  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-success to-success rounded-full"></div>
          최근 학습 활동
        </h2>
        {Array.isArray(recentResults) && recentResults.length > 0 && (
          <Link
            href="/results"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            전체 결과 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {Array.isArray(recentResults) && recentResults.length > 0 ? (
        <div className="space-y-4">
          {recentResults.map((result: any) => {
            const { percentage, improvement } = result;

            return (
              <Link
                key={result.id}
                href={`/results/${result.id}`}
                className="group block bg-gradient-to-r from-success/10 to-success/20 rounded-xl p-6 border border-success/20 hover:border-success/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-text-muted">
                        {new Date(result.startedAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {improvement !== null && (
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 ${
                            improvement > 0 ? "text-success" : improvement < 0 ? "text-error" : "text-text-muted"
                          }`}
                        >
                          {improvement > 0 ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              {Math.round(improvement)}점 향상
                            </>
                          ) : improvement < 0 ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                              {Math.round(Math.abs(improvement))}점 하락
                            </>
                          ) : (
                            "변화 없음"
                          )}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-success transition-colors">
                      시험 #{result.id.slice(0, 8)}
                    </h3>
                    {percentage !== null && (
                      <div className="text-2xl font-extrabold bg-gradient-to-r from-success to-success bg-clip-text text-transparent">
                        {Math.round(percentage)}점
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-success to-success rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-success/20 to-success/30 rounded-2xl mb-4">
            <span className="text-4xl">📈</span>
          </div>
          <p className="text-text-secondary mb-6">아직 응시한 시험이 없습니다.</p>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-theme-primary to-theme-secondary text-white rounded-xl font-semibold hover:from-theme-primary hover:to-theme-secondary transition-all shadow-lg"
          >
            시험 시작하기
          </Link>
        </div>
      )}
    </div>
  );
}

