"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { resultAPI, wordExtractionAPI, aiAPI, DetailedFeedback, GenerateExplanationPayload, badgeAPI, UserBadge } from "@/lib/api";
import { emotionalToast, toast } from "@/components/common/Toast";
import CelebrationModal from "@/components/common/CelebrationModal";

export default function ResultDetailPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;
  const queryClient = useQueryClient();
  const [showWordExtraction, setShowWordExtraction] = useState(false);
  const [generatingExplanations, setGeneratingExplanations] = useState<Record<string, boolean>>({});
  const [aiJobIds, setAiJobIds] = useState<Record<string, string>>({});
  const [diagnosingWeakness, setDiagnosingWeakness] = useState(false);
  const [weaknessDiagnosisResult, setWeaknessDiagnosisResult] = useState<any>(null);
  const [newBadges, setNewBadges] = useState<UserBadge[]>([]);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [checkedBadges, setCheckedBadges] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["result", resultId],
    queryFn: async () => {
      const response = await resultAPI.getResult(resultId);
      return response.data;
    },
  });

  // 배지 확인 (시험 완료 후 한 번만)
  const { data: badgesResponse } = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      const response = await badgeAPI.getUserBadges();
      return response.data;
    },
    enabled: !!result && result.status === "completed" && !checkedBadges,
  });

  // 새로 획득한 배지 확인
  useEffect(() => {
    if (result && result.status === "completed" && badgesResponse?.data && !checkedBadges) {
      const badges = badgesResponse.data;
      // 최근 1분 이내에 획득한 배지 찾기
      const recentBadges = badges.filter((badge: UserBadge) => {
        const earnedAt = new Date(badge.earnedAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - earnedAt.getTime()) / (1000 * 60);
        return diffMinutes < 1; // 1분 이내
      });

      if (recentBadges.length > 0) {
        setNewBadges(recentBadges);
        setShowBadgeCelebration(true);
        toast.success(`${t("result.badgeEarned")}: ${recentBadges[0].name}`);
      }
      setCheckedBadges(true);
    }
    // checkedBadges를 의존성에서 제거하여 무한 루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, badgesResponse]);

  const { data: report } = useQuery({
    queryKey: ["result-report", resultId],
    queryFn: async () => {
      const response = await resultAPI.getReport(resultId);
      return response.data;
    },
    enabled: !!result && result.status === "completed",
  });

  const { data: detailedFeedback } = useQuery<DetailedFeedback>({
    queryKey: ["result-detailed-feedback", resultId],
    queryFn: async () => {
      const response = await resultAPI.getDetailedFeedback(resultId);
      return response.data;
    },
    enabled: !!result && result.status === "completed",
  });

  const [activeFeedbackTab, setActiveFeedbackTab] = useState<"summary" | "questions" | "sections" | "overall">("summary");

  const { data: extractedWords, refetch: refetchWords } = useQuery({
    queryKey: ["extracted-words", resultId],
    queryFn: async () => {
      const response = await wordExtractionAPI.extractFromResult(resultId);
      return response.data;
    },
    enabled: showWordExtraction && !!result && result.status === "completed",
  });

  const addWordsMutation = useMutation({
    mutationFn: async (words: any[]) => {
      await wordExtractionAPI.addExtractedWords(words);
    },
    onSuccess: (_, words) => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      emotionalToast.success.wordAdded(words.length);
      setShowWordExtraction(false);
    },
  });

  // AI 가용성 확인
  const checkAIAvailability = async (): Promise<boolean> => {
    try {
      const response = await aiAPI.checkAvailability();
      return response.data.available;
    } catch (error) {
      console.error("AI 가용성 확인 실패:", error);
      return false;
    }
  };

  // AI 해설 생성 (비동기)
  const generateExplanationMutation = useMutation({
    mutationFn: async (data: GenerateExplanationPayload & { questionId: string }) => {
      // AI 가용성 확인
      const isAvailable = await checkAIAvailability();
      if (!isAvailable) {
        throw new Error("AI 기능이 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }

      const response = await aiAPI.generateExplanationAsync({
        questionId: data.questionId,
        userAnswer: data.userAnswer,
        isCorrect: data.isCorrect,
        questionResultId: data.questionResultId,
      });
      return { ...response.data, questionId: data.questionId };
    },
    onSuccess: (data) => {
      setAiJobIds((prev) => ({ ...prev, [data.questionId]: data.jobId }));
      toast.success("AI 해설 생성이 시작되었습니다. 잠시만 기다려주세요.");
      // 작업 상태 폴링 시작
      pollJobStatus(data.jobId, data.questionId);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.response?.data?.message || "AI 해설 생성에 실패했습니다.";
      toast.error(errorMessage);
      emotionalToast.error(error);
    },
  });

  // 작업 상태 폴링
  const pollJobStatus = async (jobId: string, questionId: string) => {
    const maxAttempts = 30; // 최대 30번 시도 (약 1분)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await aiAPI.getJobStatus(jobId);
        const status = response.data.status;

        if (status === "completed") {
          setGeneratingExplanations((prev) => ({ ...prev, [questionId]: false }));
          queryClient.invalidateQueries({ queryKey: ["result-detailed-feedback", resultId] });
          toast.success("AI 해설이 생성되었습니다!");
        } else if (status === "failed") {
          setGeneratingExplanations((prev) => ({ ...prev, [questionId]: false }));
          toast.error("AI 해설 생성에 실패했습니다.");
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // 2초마다 폴링
        } else {
          setGeneratingExplanations((prev) => ({ ...prev, [questionId]: false }));
          toast.error("AI 해설 생성 시간이 초과되었습니다.");
        }
      } catch (error) {
        setGeneratingExplanations((prev) => ({ ...prev, [questionId]: false }));
        emotionalToast.error(error);
      }
    };

    poll();
  };

  const handleGenerateExplanation = (question: any) => {
    setGeneratingExplanations((prev) => ({ ...prev, [question.questionId]: true }));
    generateExplanationMutation.mutate({
      questionId: question.questionId,
      userAnswer: question.userAnswer,
      isCorrect: question.isCorrect,
    });
  };

  // AI 약점 진단 (비동기)
  const diagnoseWeaknessMutation = useMutation({
    mutationFn: async () => {
      // AI 가용성 확인
      const isAvailable = await checkAIAvailability();
      if (!isAvailable) {
        throw new Error("AI 기능이 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }

      const response = await aiAPI.diagnoseWeaknessAsync(resultId);
      return response.data;
    },
    onSuccess: (data) => {
      setDiagnosingWeakness(true);
      toast.success("AI 약점 진단이 시작되었습니다. 잠시만 기다려주세요.");
      // 작업 상태 폴링 시작
      pollWeaknessDiagnosisStatus(data.jobId);
    },
    onError: (error) => {
      emotionalToast.error(error);
    },
  });

  // 약점 진단 작업 상태 폴링
  const pollWeaknessDiagnosisStatus = async (jobId: string) => {
    const maxAttempts = 60; // 최대 60번 시도 (약 2분)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await aiAPI.getJobStatus(jobId);
        const status = response.data.status;

        if (status === "completed") {
          setDiagnosingWeakness(false);
          setWeaknessDiagnosisResult(response.data.result);
          queryClient.invalidateQueries({ queryKey: ["result-detailed-feedback", resultId] });
          toast.success("AI 약점 진단이 완료되었습니다!");
        } else if (status === "failed") {
          setDiagnosingWeakness(false);
          toast.error("AI 약점 진단에 실패했습니다.");
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // 2초마다 폴링
        } else {
          setDiagnosingWeakness(false);
          toast.error("AI 약점 진단 시간이 초과되었습니다.");
        }
      } catch (error) {
        setDiagnosingWeakness(false);
        emotionalToast.error(error);
      }
    };

    poll();
  };

  const handleDiagnoseWeakness = () => {
    if (confirm("AI 약점 진단을 시작하시겠습니까? 진단에는 시간이 걸릴 수 있습니다.")) {
      diagnoseWeaknessMutation.mutate();
    }
  };

  // 목표 달성 체크 (점수 개선 확인)
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
    // 결과가 로드되고 점수가 있을 때 축하 모달 표시 로직은 나중에 추가
    // 현재는 목표 달성 시에만 표시
  }, [result]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!result) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-error">
            {t("common.error")}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-surface via-theme-primary/5 to-theme-secondary/5">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                {t("result.title")}
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                {t("result.summary")}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-theme-primary to-theme-secondary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {t("result.title")}
            </h1>

            {/* 피드백 탭 네비게이션 */}
            {detailedFeedback && (
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                  {[
                    { id: "summary", label: t("result.summary"), icon: "📊" },
                    { id: "questions", label: t("result.questions"), icon: "📝" },
                    { id: "sections", label: t("result.sections"), icon: "📚" },
                    { id: "overall", label: t("result.overall"), icon: "💡" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFeedbackTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeFeedbackTab === tab.id
                          ? "border-theme-primary text-theme-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* AI 약점 진단 버튼 */}
            {result && result.status === "completed" && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={handleDiagnoseWeakness}
                  disabled={diagnosingWeakness || diagnoseWeaknessMutation.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-theme-secondary to-theme-accent text-white rounded-lg font-semibold hover:from-theme-secondary hover:to-theme-accent transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {diagnosingWeakness || diagnoseWeaknessMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("result.diagnosing")}
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      {t("result.diagnoseWeakness")}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 약점 진단 결과 표시 */}
            {weaknessDiagnosisResult && (
              <div className="mb-6 p-6 bg-gradient-to-r from-theme-secondary/10 to-theme-accent/10 rounded-xl border border-theme-secondary/20 shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🤖</span>
                  AI 약점 진단 결과
                </h3>
                <div className="space-y-4">
                  {weaknessDiagnosisResult.weaknessAreas && weaknessDiagnosisResult.weaknessAreas.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">주요 약점 영역</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {weaknessDiagnosisResult.weaknessAreas.map((area: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-error/20">
                            <div className="font-semibold text-error mb-1">{area.tag}</div>
                            <div className="text-sm text-gray-600 mb-2">
                              정답률: {area.correctRate.toFixed(1)}%
                            </div>
                            {area.rootCause && (
                              <div className="text-xs text-gray-500 mb-2">
                                원인: {area.rootCause}
                              </div>
                            )}
                            {area.improvementSuggestions && area.improvementSuggestions.length > 0 && (
                              <div className="text-xs">
                                <div className="font-semibold text-gray-700 mb-1">개선 제안:</div>
                                <ul className="list-disc list-inside space-y-1">
                                  {area.improvementSuggestions.map((suggestion: string, i: number) => (
                                    <li key={i} className="text-gray-600">{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-info/10 to-info/20 p-6 rounded-xl border border-info/20 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-info to-info rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-info">{t("result.score")}</div>
                </div>
                <div className="text-3xl font-extrabold text-theme-primary">
                  {result.totalScore ?? "-"} <span className="text-lg text-gray-500">/ {result.maxScore ?? "-"}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-success/10 to-success/20 p-6 rounded-xl border border-success/20 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-success to-success rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-success">{t("result.correct")}</div>
                </div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-success to-success bg-clip-text text-transparent">
                  {result.percentage
                    ? `${parseFloat(result.percentage.toString()).toFixed(1)}%`
                    : "-"}
                </div>
              </div>
              <div className="bg-gradient-to-br from-theme-secondary/10 to-theme-accent/10 p-6 rounded-xl border border-theme-secondary/20 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-theme-secondary to-theme-accent rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-theme-secondary">{t("result.timeSpent")}</div>
                </div>
                <div className="text-3xl font-extrabold text-theme-secondary">
                  {result.timeSpent
                    ? `${Math.floor(result.timeSpent / 60)}분 ${result.timeSpent % 60}초`
                    : "-"}
                </div>
              </div>
            </div>

          {/* 요약 탭 */}
          {activeFeedbackTab === "summary" && report && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-secondary rounded-full"></div>
                  섹션별 분석
                </h2>
                <div className="space-y-4">
                  {(report.sectionAnalysis || []).map(
                    (section: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-surface-hover to-info/10 rounded-xl p-6 border border-border shadow-md hover:shadow-lg transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {section.sectionTitle}
                          </h3>
                          <span className="text-xl font-bold bg-gradient-to-r from-theme-primary to-theme-secondary bg-clip-text text-transparent">
                            {section.score} / {section.maxScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent rounded-full transition-all duration-1000 shadow-sm"
                            style={{ width: `${section.correctRate}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-success font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t("result.correct")}: {section.correctCount}
                          </span>
                          <span className="flex items-center gap-1.5 text-error font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t("result.incorrect")}: {section.incorrectCount}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t("result.unanswered")}: {section.unansweredCount}
                          </span>
                          <span className="flex items-center gap-1.5 text-theme-secondary font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {t("result.correct")}: {section.correctRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {report.weakPoints && report.weakPoints.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-error to-warning rounded-full"></div>
                    약점 분석
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(report.weakPoints || []).map((weak: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-error/10 to-warning/10 rounded-xl p-5 border border-error/20 shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-error to-warning rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="font-semibold text-error text-lg">
                            {weak.tag}
                          </div>
                        </div>
                        <div className="ml-13">
                          <div className="text-sm font-medium text-error mb-1">
                            정답률: {weak.correctRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-error">
                            {weak.questionCount}문제 출제
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recommendations && report.recommendations.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-success to-success rounded-full"></div>
                    학습 추천사항
                  </h2>
                  <div className="bg-gradient-to-r from-success/10 to-success/20 rounded-xl p-6 border border-success/20 shadow-md">
                    <ul className="space-y-3">
                      {(report.recommendations || []).map(
                        (rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-success to-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-700 leading-relaxed">{rec}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* 다음 단계 강조 */}
              {result && result.status === "completed" && (
                <div className="mt-8 p-6 bg-gradient-to-r from-theme-primary/10 via-theme-secondary/10 to-theme-accent/10 rounded-xl border border-theme-primary/20 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    다음 단계로 계속 학습하기
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    결과를 분석하고 약점을 개선하여 더 높은 점수를 목표로 해보세요!
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link 
                      href="/analysis" 
                      className="inline-block bg-gradient-to-r from-theme-primary to-theme-secondary text-white px-6 py-3 rounded-lg font-semibold hover:from-theme-primary hover:to-theme-secondary transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      내 학습 패턴 분석하기 →
                    </Link>
                    <Link 
                      href="/exams/recommended" 
                      className="inline-block bg-gradient-to-r from-theme-secondary to-theme-accent text-white px-6 py-3 rounded-lg font-semibold hover:from-theme-secondary hover:to-theme-accent transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      추천 시험 보기 →
                    </Link>
                  </div>
                </div>
              )}

              {/* 단어 추출 기능 */}
              {result && result.status === "completed" && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-accent rounded-full"></div>
                    단어 학습 연계
                  </h2>
                  <div className="bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 rounded-xl p-6 border border-theme-primary/20 shadow-md">
                    <p className="text-gray-700 mb-4">
                      오답 문제에서 나온 단어를 단어장에 자동으로 추가하여 복습하세요.
                    </p>
                    {!showWordExtraction ? (
                      <button
                        onClick={() => {
                          setShowWordExtraction(true);
                          refetchWords();
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-lg font-semibold hover:from-theme-primary hover:to-theme-accent transition-all shadow-md hover:shadow-lg"
                      >
                        {t("result.extractWords")}
                      </button>
                    ) : extractedWords?.suggestedWords && extractedWords.suggestedWords.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                          {extractedWords.suggestedWords.length}개의 단어를 추출했습니다
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                          {(extractedWords.suggestedWords || []).map((word: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-bold text-lg text-gray-900 mb-1">{word.word}</div>
                                  <div className="text-sm text-gray-600 mb-2">{word.meaning}</div>
                                  {word.context && (
                                    <div className="text-xs text-gray-500 italic">"{word.context}"</div>
                                  )}
                                  <div className="text-xs text-theme-accent mt-2">{word.reason}</div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  word.difficulty === "hard" ? "bg-error/20 text-error" :
                                  word.difficulty === "medium" ? "bg-warning/20 text-warning" :
                                  "bg-success/20 text-success"
                                }`}>
                                  {word.difficulty === "hard" ? "어려움" : word.difficulty === "medium" ? "중급" : "쉬움"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`추출된 ${extractedWords.suggestedWords.length}개의 단어를 단어장에 추가하시겠습니까?`)) {
                              addWordsMutation.mutate(extractedWords.suggestedWords);
                            }
                          }}
                          disabled={addWordsMutation.isPending}
                          className="w-full px-6 py-3 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-lg font-semibold hover:from-theme-primary hover:to-theme-accent transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {addWordsMutation.isPending ? t("common.loadingText") : t("result.addToWordbook")}
                        </button>
                        <button
                          onClick={() => setShowWordExtraction(false)}
                          className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          닫기
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">추출할 단어가 없습니다.</p>
                        <button
                          onClick={() => setShowWordExtraction(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          닫기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 문제별 분석 탭 */}
          {activeFeedbackTab === "questions" && detailedFeedback && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-accent rounded-full"></div>
                문제별 상세 분석
              </h2>
              <div className="space-y-4">
                {(detailedFeedback.detailedFeedback?.questionLevel || []).map((question: any, index: number) => (
                  <div
                    key={question.questionId}
                    className={`bg-white rounded-xl p-6 border-2 ${
                      question.isCorrect
                        ? "border-success/20 bg-success/10"
                        : "border-error/20 bg-error/10"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-500">문제 {index + 1}</span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            question.isCorrect
                              ? "bg-success/20 text-success"
                              : "bg-error/20 text-error"
                          }`}
                        >
                          {question.isCorrect ? t("result.correct") : t("result.incorrect")}
                        </span>
                        {question.mistakeType && question.mistakeType !== "correct" && (
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              question.mistakeType === "conceptual"
                                ? "bg-theme-secondary/20 text-theme-secondary"
                                : question.mistakeType === "careless"
                                ? "bg-warning/20 text-warning"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {question.mistakeType === "conceptual"
                              ? "개념 이해 부족"
                              : question.mistakeType === "careless"
                              ? "실수"
                              : "시간 부족"}
                          </span>
                        )}
                      </div>
                      {question.timeSpent && (
                        <span className="text-sm text-gray-500">
                          소요 시간: {question.timeSpent}초
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">내 답안:</span> {question.userAnswer}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">정답:</span> {question.correctAnswer}
                      </div>
                      {question.explanation ? (
                        <div className="mt-4 p-4 bg-info/10 rounded-lg border border-info/20">
                          <div className="text-sm font-semibold text-info mb-2 flex items-center gap-2">
                            <span>🤖 AI 해설</span>
                          </div>
                          <div className="text-sm text-gray-700">{question.explanation}</div>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                해설이 없습니다
                              </div>
                              <div className="text-xs text-gray-500">
                                AI가 이 문제에 대한 해설을 생성해드립니다
                              </div>
                            </div>
                            <button
                              onClick={() => handleGenerateExplanation(question)}
                              disabled={generatingExplanations[question.questionId]}
                              className="px-4 py-2 bg-gradient-to-r from-theme-primary to-theme-secondary text-white rounded-lg text-sm font-semibold hover:from-theme-primary hover:to-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {generatingExplanations[question.questionId] ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  생성 중...
                                </>
                              ) : (
                                <>
                                  <span>✨</span>
                                  AI 해설 생성
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {question.relatedWords && question.relatedWords.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2">관련 단어</div>
                        <div className="flex flex-wrap gap-2">
                          {(question.relatedWords || []).map((word: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-theme-primary/20 text-theme-primary rounded text-xs"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 섹션별 분석 탭 */}
          {activeFeedbackTab === "sections" && detailedFeedback && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-theme-secondary to-theme-accent rounded-full"></div>
                섹션별 분석 및 개선 계획
              </h2>
              {(detailedFeedback.detailedFeedback?.sectionLevel || []).map((section: any) => (
                <div
                  key={section.sectionId}
                  className="bg-white rounded-xl p-8 border-2 border-purple-200"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{section.sectionTitle}</h3>
                  
                  {section.strengths && section.strengths.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        강점
                      </div>
                      <ul className="space-y-2">
                        {(section.strengths || []).map((strength: string, i: number) => (
                          <li key={i} className="text-gray-700 flex items-start gap-2">
                            <span className="text-success">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.weaknesses && section.weaknesses.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm font-semibold text-error mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        약점
                      </div>
                      <ul className="space-y-2">
                        {(section.weaknesses || []).map((weakness: string, i: number) => (
                          <li key={i} className="text-gray-700 flex items-start gap-2">
                            <span className="text-error">⚠</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.improvementPlan && (
                    <div className="bg-gradient-to-r from-theme-secondary/10 to-theme-accent/10 rounded-lg p-6 border border-theme-secondary/20">
                      <div className="text-sm font-semibold text-theme-secondary mb-4">개선 계획</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">집중 영역</div>
                          <div className="flex flex-wrap gap-2">
                            {(section.improvementPlan?.focusAreas || []).map((area: string, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-theme-secondary/20 text-theme-secondary rounded-lg text-sm font-medium"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">추천 연습 문제</div>
                            <div className="text-lg font-bold text-theme-secondary">
                              {section.improvementPlan.practiceQuestions}문제
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">예상 개선 시간</div>
                            <div className="text-lg font-bold text-theme-secondary">
                              {section.improvementPlan.estimatedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 종합 인사이트 탭 */}
          {activeFeedbackTab === "overall" && detailedFeedback && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-success to-success rounded-full"></div>
                종합 학습 인사이트
              </h2>

              {/* 학습 인사이트 */}
              <div className="bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 rounded-xl p-8 border border-theme-primary/20">
                <div className="text-lg font-semibold text-theme-primary mb-4">📊 학습 인사이트</div>
                <ul className="space-y-3">
                  {(detailedFeedback.detailedFeedback?.overall?.learningInsights || []).map(
                    (insight: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-theme-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{insight}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* 다음 단계 */}
              <div className="bg-gradient-to-r from-success/10 to-success/20 rounded-xl p-8 border border-success/20">
                <div className="text-lg font-semibold text-success mb-4">🎯 다음 학습 단계</div>
                <ul className="space-y-3">
                  {(detailedFeedback.detailedFeedback?.overall?.nextSteps || []).map(
                    (step: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{step}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* 축하 모달 */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="🎉 목표 달성!"
        message="정말 멋져요!"
        emoji="🏆"
        nextAction={{
          label: "다음 목표 설정하기",
          onClick: () => router.push("/analysis?tab=goals"),
        }}
      />

      {/* 배지 획득 축하 모달 */}
      {newBadges.length > 0 && (
        <CelebrationModal
          isOpen={showBadgeCelebration}
          onClose={() => {
            setShowBadgeCelebration(false);
            setNewBadges([]);
          }}
          title="🏆 배지 획득!"
          message={newBadges.length === 1 
            ? `${newBadges[0].name} 배지를 획득했습니다!`
            : `${newBadges.length}개의 배지를 획득했습니다!`}
          emoji={newBadges[0]?.icon || "🏆"}
          achievement={{
            type: "배지 획득",
            value: newBadges.map(b => b.name).join(", "),
          }}
          nextAction={{
            label: "배지 갤러리 보기",
            onClick: () => {
              setShowBadgeCelebration(false);
              setNewBadges([]);
              router.push("/badges");
            },
          }}
        />
      )}
    </>
  );
}
