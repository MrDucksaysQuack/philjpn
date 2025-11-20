"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { recommendationAPI } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";

export default function RecommendedExamsPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useRequireAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["recommended-exams"],
    queryFn: async () => {
      const response = await recommendationAPI.getRecommendedExams();
      return response.data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("common.authenticating")} />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("exam.recommended.analyzing")} />
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
      <div className="min-h-screen bg-theme-gradient-light">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-theme-secondary via-theme-accent to-theme-primary overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                {t("exam.recommended.title")}
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                {t("exam.recommended.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 적응형 학습 경로 */}
          {adaptivePath && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-theme-secondary to-theme-accent rounded-full"></div>
                {t("exam.recommended.learningPath")}
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-gradient-to-r from-theme-secondary/10 to-theme-accent/10 rounded-xl p-6 border border-theme-secondary/20">
                  <div className="text-sm font-semibold text-theme-secondary mb-2">{t("exam.recommended.currentLevel")}</div>
                  <div className="text-2xl font-bold text-theme-secondary capitalize">{adaptivePath.currentLevel}</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="flex-1 bg-gradient-to-r from-theme-accent/10 to-theme-primary/10 rounded-xl p-6 border border-theme-accent/20">
                  <div className="text-sm font-semibold text-theme-accent mb-2">{t("exam.recommended.nextMilestone")}</div>
                  <div className="text-2xl font-bold text-theme-accent capitalize">{adaptivePath.nextMilestone}</div>
                </div>
              </div>
              {adaptivePath?.recommendedSequence && adaptivePath.recommendedSequence.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700 mb-3">{t("exam.recommended.recommendedOrder")}:</div>
                  {(adaptivePath.recommendedSequence || []).map((item: any, index: number) => (
                    <div key={item.examId} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-theme-secondary to-theme-accent rounded-full flex items-center justify-center text-white font-bold">
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">{t("exam.recommended.estimatedPeriod")}: {item.estimatedWeek}{t("exam.recommended.weeks")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 추천 시험 목록 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("exam.recommended.recommendedExams")}</h2>
            {recommendations.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <p className="text-gray-500">{t("exam.recommended.noRecommendations")}</p>
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
                          className="h-1 bg-gradient-to-r from-theme-secondary via-theme-accent to-theme-primary"
                          style={{ width: `${rec.matchScore * 100}%` }}
                        />
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-theme-secondary group-hover:to-theme-accent group-hover:bg-clip-text group-hover:text-transparent transition-all">
                              {rec.title}
                            </h3>
                            {rec.description && (
                              <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                                {rec.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-theme-secondary via-theme-accent to-theme-primary rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all">
                              <span className="text-2xl font-bold text-white">
                                {Math.round(rec.matchScore * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 추천 이유 */}
                        <div className="bg-gradient-to-r from-theme-secondary/10 to-theme-accent/10 rounded-lg p-4 mb-4 border border-theme-secondary/20">
                          <div className="text-sm font-semibold text-theme-secondary mb-1">💡 {t("exam.recommended.reason")}</div>
                          <p className="text-sm text-gray-700">{rec.reason}</p>
                        </div>

                        {/* 예상 점수 범위 */}
                        {rec.estimatedScoreRange && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 mb-1">{t("exam.recommended.estimatedScoreRange")}</div>
                            <div className="text-lg font-bold text-gray-900">
                              {rec.estimatedScoreRange[0]} ~ {rec.estimatedScoreRange[1]}{t("exam.detail.points")}
                            </div>
                          </div>
                        )}

                        {/* 학습 목표 */}
                        {rec.learningGoals && rec.learningGoals.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 mb-2">{t("exam.recommended.learningGoals")}</div>
                            <div className="flex flex-wrap gap-2">
                              {rec.learningGoals.map((goal: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-theme-primary/20 text-theme-primary rounded-full text-xs font-medium"
                                >
                                  {goal}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 도전도 */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-theme-secondary/20 to-theme-accent/20 text-theme-secondary border border-theme-secondary/20">
                            {rec.examType}
                          </span>
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              rec.challengeLevel === "high"
                                ? "bg-error/20 text-error border border-error/20"
                                : rec.challengeLevel === "medium"
                                ? "bg-warning/20 text-warning border border-warning/20"
                                : "bg-success/20 text-success border border-success/20"
                            }`}
                          >
                            {rec.challengeLevel === "high" ? `🔥 ${t("exam.recommended.challenge")}` : rec.challengeLevel === "medium" ? `⚡ ${t("exam.recommended.appropriate")}` : `✅ ${t("exam.recommended.easy")}`}
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
              {t("exam.recommended.viewAllExams")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

