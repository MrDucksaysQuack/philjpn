"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { recommendationAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function RecommendedExamsWidget() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ["recommended-exams"],
    queryFn: async () => {
      const response = await recommendationAPI.getRecommendedExams();
      return response.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  const recommendations = data?.recommendations || [];
  const topRecommendations = recommendations.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
          추천 시험
        </h2>
        {recommendations.length > 0 && (
          <Link
            href="/exams/recommended"
            className="text-sm text-theme-primary hover:opacity-80 font-medium flex items-center gap-1"
          >
            모든 추천 시험 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {topRecommendations.length > 0 ? (
        <div className="space-y-4">
          {topRecommendations.map((rec: any) => (
            <Link
              key={rec.examId}
              href={`/exams/${rec.examId}`}
              className="group block bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                      적합도 {Math.round(rec.matchScore * 100)}%
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    시험 #{rec.examId.slice(0, 8)}
                  </h3>
                  {rec.reason && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {rec.reason}
                    </p>
                  )}
                  {rec.expectedScoreRange && (
                    <div className="text-xs text-gray-500">
                      예상 점수: {rec.expectedScoreRange.min} - {rec.expectedScoreRange.max}점
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4">
            <span className="text-4xl">⭐</span>
          </div>
          <p className="text-gray-600 mb-6">추천할 시험이 없습니다.</p>
          <Link
            href="/exams"
              className="inline-flex items-center gap-2 px-6 py-3 bg-theme-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
          >
            시험 목록 보기
          </Link>
        </div>
      )}
    </div>
  );
}

