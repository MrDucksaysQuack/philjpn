"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { recommendationAPI } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/common/Button";

export default function RecommendedExamsPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useRequireAuth();

  const { data, isLoading, error, refetch } = useQuery({
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

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-error/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("common.error")}</h2>
              <p className="text-gray-600 mb-6">{t("exam.recommended.errorLoading")}</p>
              <Button onClick={() => refetch()} variant="primary">
                {t("exam.recommended.retry")}
              </Button>
            </div>
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
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8 border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-theme-secondary to-theme-accent rounded-full"></div>
                {t("exam.recommended.learningPath")}
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                <div className="flex-1 bg-gradient-to-r from-theme-secondary/10 to-theme-accent/10 rounded-xl p-4 sm:p-6 border border-theme-secondary/20">
                  <div className="text-xs sm:text-sm font-semibold text-theme-secondary mb-2">{t("exam.recommended.currentLevel")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-theme-secondary capitalize">{adaptivePath.currentLevel || "-"}</div>
                </div>
                <div className="text-2xl text-gray-400 self-center">→</div>
                <div className="flex-1 bg-gradient-to-r from-theme-accent/10 to-theme-primary/10 rounded-xl p-4 sm:p-6 border border-theme-accent/20">
                  <div className="text-xs sm:text-sm font-semibold text-theme-accent mb-2">{t("exam.recommended.nextMilestone")}</div>
                  <div className="text-xl sm:text-2xl font-bold text-theme-accent capitalize">{adaptivePath.nextMilestone || "-"}</div>
                </div>
              </div>
              {adaptivePath?.recommendedSequence && adaptivePath.recommendedSequence.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700 mb-3">{t("exam.recommended.recommendedOrder")}:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(adaptivePath.recommendedSequence || []).map((item: any, index: number) => (
                      <div key={item.examId || index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-theme-secondary/40 transition-all">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-theme-secondary to-theme-accent rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                          {item.order || index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
                            {t("exam.recommended.examNumber")}{item.examId?.slice(0, 8) || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t("exam.recommended.estimatedPeriod")}: {item.estimatedWeek || "-"}{t("exam.recommended.weeks")}
                          </div>
                        </div>
                      </div>
                    ))}
                      </div>
                    </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t("exam.recommended.noLearningPath")}
                </div>
              )}
            </div>
          )}

          {/* 추천 시험 목록 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t("exam.recommended.recommendedExams")}</h2>
              {recommendations.length > 0 && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {recommendations.length} {recommendations.length === 1 ? t("exam.questions") : t("exam.questions")}
                </span>
              )}
            </div>
            {recommendations.length === 0 ? (
              <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-theme-secondary/20 to-theme-accent/20 rounded-2xl mb-4">
                  <span className="text-4xl">⭐</span>
                </div>
                <p className="text-gray-600 mb-6 text-base sm:text-lg">{t("exam.recommended.noRecommendations")}</p>
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-theme-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {t("exam.recommended.viewAllExams")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {recommendations.map((rec: any) => (
                  <Link
                    key={rec.examId}
                    href={`/exams/${rec.examId}`}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
                  >
                    <div className="relative">
                      {/* 매칭 점수 바 */}
                      <div className="h-1.5 bg-gray-200">
                        <div
                          className="h-1.5 bg-gradient-to-r from-theme-secondary via-theme-accent to-theme-primary transition-all"
                          style={{ width: `${(rec.matchScore || 0) * 100}%` }}
                        />
                      </div>
                      
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4 gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-theme-secondary group-hover:to-theme-accent group-hover:bg-clip-text group-hover:text-transparent transition-all line-clamp-2">
                              {rec.title || `${t("exam.recommended.examNumber")}${rec.examId?.slice(0, 8) || ""}`}
                            </h3>
                            {rec.description && (
                              <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                                {rec.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-theme-secondary via-theme-accent to-theme-primary rounded-xl flex flex-col items-center justify-center transform group-hover:scale-110 transition-all shadow-lg">
                              <span className="text-lg sm:text-2xl font-bold text-white">
                                {Math.round((rec.matchScore || 0) * 100)}%
                              </span>
                              <span className="text-[10px] sm:text-xs text-white/80 font-medium mt-0.5">
                                {t("exam.recommended.matchScore")}
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

                        {/* 도전도 및 시험 유형 */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
                          <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-theme-secondary/20 to-theme-accent/20 text-theme-secondary border border-theme-secondary/20 truncate">
                            {rec.examType ? t(`exam.examType${rec.examType.toUpperCase()}`) || rec.examType : "-"}
                          </span>
                          <span
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${
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

