"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { recommendationAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function RecommendedExamsPage() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, error } = useQuery({
    queryKey: ["recommended-exams"],
    queryFn: async () => {
      const response = await recommendationAPI.getRecommendedExams();
      return response.data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">로그인이 필요합니다.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="추천 시험을 분석하는 중..." />
          </div>
        </div>
      </>
    );
  }


  const recommendations = data?.recommendations || [];
  const adaptivePath = data?.adaptivePath;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                개인 맞춤형 시험 추천
              </h1>
              <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                당신의 학습 패턴과 약점을 분석하여 최적의 시험을 추천합니다
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 적응형 학습 경로 */}
          {adaptivePath && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                학습 경로
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="text-sm font-semibold text-purple-700 mb-2">현재 수준</div>
                  <div className="text-2xl font-bold text-purple-900 capitalize">{adaptivePath.currentLevel}</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="flex-1 bg-gradient-to-r from-pink-50 to-indigo-50 rounded-xl p-6 border border-pink-200">
                  <div className="text-sm font-semibold text-pink-700 mb-2">다음 목표</div>
                  <div className="text-2xl font-bold text-pink-900 capitalize">{adaptivePath.nextMilestone}</div>
                </div>
              </div>
              {adaptivePath.recommendedSequence.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700 mb-3">추천 순서:</div>
                  {adaptivePath.recommendedSequence.map((item: any, index: number) => (
                    <div key={item.examId} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">예상 기간: {item.estimatedWeek}주</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 추천 시험 목록 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">추천 시험</h2>
            {recommendations.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <p className="text-gray-500">추천할 시험이 없습니다. 시험을 더 응시하면 맞춤형 추천이 가능합니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec: any) => (
                  <Link
                    key={rec.examId}
                    href={`/exams/${rec.examId}`}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
                  >
                    <div className="relative">
                      {/* 매칭 점수 바 */}
                      <div className="h-1 bg-gray-200">
                        <div
                          className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600"
                          style={{ width: `${rec.matchScore * 100}%` }}
                        />
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                              {rec.title}
                            </h3>
                            {rec.description && (
                              <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                                {rec.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all">
                              <span className="text-2xl font-bold text-white">
                                {Math.round(rec.matchScore * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 추천 이유 */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border border-purple-200">
                          <div className="text-sm font-semibold text-purple-700 mb-1">💡 추천 이유</div>
                          <p className="text-sm text-gray-700">{rec.reason}</p>
                        </div>

                        {/* 예상 점수 범위 */}
                        {rec.estimatedScoreRange && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 mb-1">예상 점수 범위</div>
                            <div className="text-lg font-bold text-gray-900">
                              {rec.estimatedScoreRange[0]} ~ {rec.estimatedScoreRange[1]}점
                            </div>
                          </div>
                        )}

                        {/* 학습 목표 */}
                        {rec.learningGoals && rec.learningGoals.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 mb-2">학습 목표</div>
                            <div className="flex flex-wrap gap-2">
                              {rec.learningGoals.map((goal: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                                >
                                  {goal}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 도전도 */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
                            {rec.examType}
                          </span>
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              rec.challengeLevel === "high"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : rec.challengeLevel === "medium"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : "bg-green-100 text-green-700 border border-green-200"
                            }`}
                          >
                            {rec.challengeLevel === "high" ? "🔥 도전" : rec.challengeLevel === "medium" ? "⚡ 적정" : "✅ 완화"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 전체 시험 보기 링크 */}
          <div className="text-center mt-8">
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              전체 시험 목록 보기
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

