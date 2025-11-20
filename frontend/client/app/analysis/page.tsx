"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import {
  statisticsAPI,
  goalAPI,
  LearningPatterns,
  WeaknessAnalysis,
  EfficiencyMetrics,
  GoalProgress,
} from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import HeatmapChart from "@/components/charts/HeatmapChart";
import CustomRadarChart from "@/components/charts/RadarChart";
import CustomLineChart from "@/components/charts/LineChart";
import CelebrationModal from "@/components/common/CelebrationModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { emotionalToast, toast } from "@/components/common/Toast";
import { contextualMessages } from "@/lib/messages";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import { Button } from "@/components/common/Button";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export default function AnalysisPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"patterns" | "weakness" | "efficiency" | "goals">("patterns");
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievedGoal, setAchievedGoal] = useState<{ type: string; target: string } | null>(null);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const { data: patterns, isLoading: patternsLoading } = useQuery<LearningPatterns>({
    queryKey: ["learning-patterns"],
    queryFn: async () => {
      const response = await statisticsAPI.getLearningPatterns();
      return response.data;
    },
    enabled: !!user,
  });

  const { data: weakness, isLoading: weaknessLoading } = useQuery<WeaknessAnalysis>({
    queryKey: ["weakness-analysis"],
    queryFn: async () => {
      const response = await statisticsAPI.getWeaknessAnalysis();
      return response.data;
    },
    enabled: !!user,
  });

  const { data: efficiency, isLoading: efficiencyLoading } = useQuery<EfficiencyMetrics>({
    queryKey: ["efficiency-metrics"],
    queryFn: async () => {
      const response = await statisticsAPI.getEfficiencyMetrics();
      return response.data;
    },
    enabled: !!user,
  });

  const { data: goalProgress, isLoading: goalProgressLoading } = useQuery<GoalProgress>({
    queryKey: ["goal-progress"],
    queryFn: async () => {
      const response = await goalAPI.getGoalProgress();
      return response.data;
    },
    enabled: !!user,
  });

  // 목표 목록 조회
  const { data: goalsList } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const response = await goalAPI.getGoals();
      return response.data;
    },
    enabled: !!user,
  });

  // 목표 수정 mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await goalAPI.updateGoal(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-progress"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setEditingGoal(null);
      toast.success(t("analysis.goals.updated"));
    },
  });

  // 목표 삭제 mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      await goalAPI.deleteGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-progress"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDeletingGoalId(null);
      toast.success(t("analysis.goals.deleted"));
    },
  });

  // 목표 달성 체크 (한 번만 실행되도록 ref 사용)
  const hasCheckedGoals = useRef(false);
  useEffect(() => {
    if (goalProgress?.activeGoals && !hasCheckedGoals.current) {
      const justAchieved = goalProgress.activeGoals.find(
        (goal) => goal.progress >= 1 && goal.onTrack
      );
      if (justAchieved) {
        hasCheckedGoals.current = true;
        const targetText = 
          justAchieved.type === "score_target" ? `${justAchieved.target}점` :
          justAchieved.type === "exam_count" ? `${justAchieved.target}회` :
          `${justAchieved.target}개`;
        setAchievedGoal({ type: justAchieved.type, target: targetText });
        setShowCelebration(true);
        emotionalToast.success.goalAchieved(targetText);
      }
    }
    // goalProgress가 변경되어도 한 번만 체크하도록 ref 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalProgress]);

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="인증 확인 중..." />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                {t("analysis.title")}
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                {t("analysis.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 탭 네비게이션 */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: "patterns", label: t("analysis.tabs.patterns"), icon: "📊" },
                { id: "weakness", label: t("analysis.tabs.weakness"), icon: "🎯" },
                { id: "efficiency", label: t("analysis.tabs.efficiency"), icon: "⚡" },
                { id: "goals", label: t("analysis.tabs.goals"), icon: "🏆" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-t-lg ${
                    activeTab === tab.id
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-label={`${tab.label} 탭`}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                  type="button"
                >
                  <span className="mr-2" aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 학습 패턴 탭 */}
          {activeTab === "patterns" && (
            <div className="space-y-8">
              {patternsLoading ? (
                <LoadingSpinner message={t("analysis.patterns.loading")} />
              ) : patterns ? (
                <>
                  {/* 시간 패턴 */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-secondary rounded-full"></div>
                      {t("analysis.patterns.title")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-theme-primary-light rounded-xl p-6 border border-theme-primary">
                        <div className="text-sm font-semibold text-theme-primary mb-2">{t("analysis.patterns.mostProductiveHours")}</div>
                        <div className="flex flex-wrap gap-2">
                          {patterns.timePatterns.mostProductiveHours.length > 0 ? (
                            patterns.timePatterns.mostProductiveHours.map((hour) => (
                              <span
                                key={hour}
                                className="px-3 py-1 bg-theme-primary text-white rounded-lg font-bold"
                              >
                                {hour}{t("analysis.patterns.hour")}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">{t("analysis.patterns.collectingData")}</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-theme-secondary-light rounded-xl p-6 border border-theme-secondary">
                        <div className="text-sm font-semibold text-theme-secondary mb-2">{t("analysis.patterns.averageSessionDuration")}</div>
                        <div className="text-3xl font-extrabold text-theme-secondary">
                          {patterns.timePatterns.averageSessionDuration}{t("analysis.patterns.minutes")}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-success/10 to-success/20 rounded-xl p-6 border border-success/20">
                        <div className="text-sm font-semibold text-success mb-2">{t("analysis.patterns.preferredStudyDays")}</div>
                        <div className="flex flex-wrap gap-2">
                          {patterns.timePatterns.preferredStudyDays.map((day) => (
                            <span
                              key={day}
                              className="px-3 py-1 bg-success text-white rounded-lg font-medium"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 시간대별 성능 히트맵 차트 */}
                    {patterns.performanceByTimeOfDay.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("analysis.patterns.performanceByTimeOfDay")}</h3>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <HeatmapChart
                            data={patterns.performanceByTimeOfDay.map((item) => ({
                              hour: item.hour,
                              day: 0,
                              value: item.averageScore,
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 집중력 분석 */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-8 bg-gradient-to-b from-theme-secondary to-theme-accent rounded-full"></div>
                      {t("analysis.patterns.attentionAnalysis")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-theme-secondary/10 to-theme-accent/10 rounded-xl p-6 border border-theme-secondary/20">
                        <div className="text-sm font-semibold text-theme-secondary mb-2">{t("analysis.patterns.optimalSessionLength")}</div>
                        <div className="text-3xl font-extrabold text-theme-secondary">
                          {patterns.attentionSpan.optimalSessionLength}{t("analysis.patterns.minutes")}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {t("analysis.patterns.focusDeclinePoint")}: {patterns.attentionSpan.focusDeclinePoint}{t("analysis.patterns.minutes")}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-theme-primary/10 to-theme-accent/10 rounded-xl p-6 border border-theme-primary/20">
                        <div className="text-sm font-semibold text-theme-primary mb-2">{t("analysis.patterns.difficultyPreference")}</div>
                        <div className="text-xl font-bold text-theme-primary mb-2">
                          {patterns.difficultyPreference.optimalDifficulty}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t("analysis.patterns.challengeAcceptance")}: {Math.round(patterns.difficultyPreference.challengeAcceptance * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">{t("analysis.patterns.insufficientData")}</p>
                </div>
              )}
            </div>
          )}

          {/* 약점 분석 탭 */}
          {activeTab === "weakness" && (
            <div className="space-y-8">
              {weaknessLoading ? (
                <LoadingSpinner message={t("analysis.weakness.loading")} />
              ) : weakness ? (
                <>
                  {weakness.weaknessAreas.length > 0 ? (
                    <>
                      {/* 약점 영역 */}
                      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <div className="w-1 h-8 bg-gradient-to-b from-error to-warning rounded-full"></div>
                          {t("analysis.weakness.title")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(weakness.weaknessAreas || []).map((area, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-error/10 to-warning/10 rounded-xl p-6 border border-error/20 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{area.tag}</h3>
                                <span className="px-3 py-1 bg-error/20 text-error rounded-lg font-bold">
                                  {area.correctRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">
                                  {t("analysis.weakness.rootCause")}: <span className="font-semibold">{area.rootCause}</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                  {t("analysis.weakness.predictedImprovementTime")}: {area.predictedImprovementTime}
                                </div>
                                {area.mistakePattern?.commonErrors && area.mistakePattern.commonErrors.length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    <div className="font-semibold mb-1">{t("analysis.weakness.commonErrors")}:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {(area.mistakePattern.commonErrors || []).map((error, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-error/20 text-error rounded text-xs"
                                        >
                                          {error}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {area.improvementSuggestions && area.improvementSuggestions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-red-200">
                                  <div className="text-sm font-semibold text-gray-700 mb-2">{t("analysis.weakness.improvementSuggestions")}:</div>
                                  <ul className="space-y-1">
                                    {(area.improvementSuggestions || []).map((suggestion, i) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                        <span className="text-success">✓</span>
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 지식 격차 */}
                      {weakness.knowledgeGaps.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-1 h-8 bg-gradient-to-b from-warning to-warning rounded-full"></div>
                            {t("analysis.weakness.knowledgeGaps")}
                          </h2>
                          <div className="space-y-4">
                            {weakness.knowledgeGaps.map((gap, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-r from-warning/10 to-warning/20 rounded-xl p-6 border border-warning/20"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="font-semibold text-gray-900">{gap.concept}</h3>
                                  <span className="text-sm text-gray-600">
                                    {t("analysis.weakness.understandingLevel")}: {Math.round(gap.understandingLevel * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                                  <div
                                    className="bg-gradient-to-r from-warning to-warning h-3 rounded-full"
                                    style={{ width: `${gap.understandingLevel * 100}%` }}
                                  />
                                </div>
                                <div className="text-sm text-gray-600">
                                  {t("analysis.weakness.practiceNeeded")}: {gap.practiceNeeded}{t("analysis.weakness.problems")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-2xl">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-success/20 rounded-2xl mb-6">
                        <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-gray-700 mb-2">{t("analysis.weakness.noWeakness")}</p>
                      <p className="text-gray-500">{t("analysis.weakness.noWeaknessDesc")}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">{t("analysis.weakness.insufficientData")}</p>
                </div>
              )}
            </div>
          )}

          {/* 효율성 지표 탭 */}
          {activeTab === "efficiency" && (
            <div className="space-y-8">
              {efficiencyLoading ? (
                <LoadingSpinner message={t("analysis.efficiency.loading")} />
              ) : efficiency ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-theme-primary-light rounded-2xl shadow-lg p-8 border border-theme-primary">
                    <div className="text-sm font-semibold text-theme-primary mb-2">{t("analysis.efficiency.learningVelocity")}</div>
                    <div className="text-4xl font-extrabold text-theme-primary mb-2">
                      {efficiency.learningVelocity > 0 ? "+" : ""}
                      {efficiency.learningVelocity.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">{t("analysis.efficiency.weeklyImprovement")}</div>
                  </div>
                  <div className="bg-gradient-to-br from-success/10 to-success/20 rounded-2xl shadow-lg p-8 border border-success/20">
                    <div className="text-sm font-semibold text-success mb-2">{t("analysis.efficiency.retentionRate")}</div>
                    <div className="text-4xl font-extrabold text-success mb-2">
                      {Math.round(efficiency.retentionRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">{t("analysis.efficiency.oneWeekRetention")}</div>
                  </div>
                  <div className="bg-gradient-to-br from-theme-secondary/10 to-theme-accent/10 rounded-2xl shadow-lg p-8 border border-theme-secondary/20">
                    <div className="text-sm font-semibold text-theme-secondary mb-2">{t("analysis.efficiency.practiceEfficiency")}</div>
                    <div className="text-4xl font-extrabold text-theme-secondary mb-2">
                      {efficiency.practiceEfficiency.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">{t("analysis.efficiency.scorePerHour")}</div>
                  </div>
                  <div className="bg-gradient-to-br from-warning/10 to-error/10 rounded-2xl shadow-lg p-8 border border-warning/20">
                    <div className="text-sm font-semibold text-warning mb-2">{t("analysis.efficiency.weaknessRecoveryRate")}</div>
                    <div className="text-4xl font-extrabold text-warning mb-2">
                      {Math.round(efficiency.weaknessRecoveryRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">{t("analysis.efficiency.improvementSuccessRate")}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">{t("analysis.efficiency.insufficientData")}</p>
                </div>
              )}
            </div>
          )}

          {/* 목표 진행 탭 */}
          {activeTab === "goals" && (
            <div className="space-y-8">
              {goalProgressLoading ? (
                <LoadingSpinner message={t("analysis.goals.loading")} />
              ) : goalProgress ? (
                <>
                  {goalProgress.activeGoals.length > 0 ? (
                    <div className="space-y-6">
                      {goalProgress.activeGoals.map((goal) => (
                        <div
                          key={goal.goalId}
                          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {goal.type === "score_target" && t("analysis.goals.scoreTarget")}
                                {goal.type === "exam_count" && t("analysis.goals.examCountTarget")}
                                {goal.type === "word_count" && t("analysis.goals.wordCountTarget")}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {t("analysis.goals.target")}: {goal.target} {goal.type === "score_target" ? t("analysis.goals.points") : goal.type === "exam_count" ? t("analysis.goals.times") : t("analysis.goals.items")}
                              </p>
                            </div>
                            <span
                              className={`px-4 py-2 rounded-lg font-semibold ${
                                goal.onTrack
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {goal.onTrack ? t("analysis.goals.onTrack") : t("analysis.goals.needsAttention")}
                            </span>
                          </div>
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {t("analysis.goals.progress")}: {Math.round(goal.progress * 100)}%
                              </span>
                              <span className="text-sm text-gray-600">
                                {goal.current} / {goal.target}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div
                                className={`h-4 rounded-full transition-all ${
                                  goal.progress >= 0.8
                                    ? "bg-gradient-to-r from-success to-success"
                                    : goal.progress >= 0.5
                                    ? "bg-gradient-to-r from-warning to-warning"
                                    : "bg-gradient-to-r from-error to-error"
                                }`}
                                style={{ width: `${Math.min(goal.progress * 100, 100)}%` }}
                              />
                            </div>
                            {/* 감정적 진행 상황 메시지 */}
                            {goal.progress >= 0.9 && goal.progress < 1 && (
                              <p className="text-sm text-center text-theme-primary font-semibold mt-2">
                                {t("analysis.goals.almostThere")}
                              </p>
                            )}
                            {goal.progress >= 0.7 && goal.progress < 0.9 && (
                              <p className="text-sm text-center text-theme-secondary font-semibold mt-2">
                                {t("analysis.goals.keepGoing")}
                              </p>
                            )}
                            {goal.progress < 0.5 && (
                              <p className="text-sm text-center text-warning font-semibold mt-2">
                                {t("analysis.goals.goodStart")}
                              </p>
                            )}
                          </div>
                          {goal.estimatedCompletion && (
                            <div className="text-sm text-gray-600 mb-4">
                              {t("analysis.goals.estimatedCompletion")}: {goal.estimatedCompletion}
                            </div>
                          )}
                          
                          {/* 목표 수정/삭제 버튼 */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                            <Button
                              onClick={() => {
                                // 목표 상세 정보 가져오기
                                const goalDetail = goalsList?.data?.find((g: any) => g.id === goal.goalId);
                                if (goalDetail) {
                                  setEditingGoal(goalDetail);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              {t("analysis.goals.edit")}
                            </Button>
                            <Button
                              onClick={() => {
                                if (confirm(t("analysis.goals.confirmDelete"))) {
                                  setDeletingGoalId(goal.goalId);
                                  deleteGoalMutation.mutate(goal.goalId);
                                }
                              }}
                              variant="error"
                              size="sm"
                              className="flex-1"
                              isLoading={deleteGoalMutation.isPending && deletingGoalId === goal.goalId}
                            >
                              {t("analysis.goals.delete")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-2xl">
                      <p className="text-gray-500 mb-4">{t("analysis.goals.noActiveGoals")}</p>
                      <button
                        onClick={() => setShowCreateGoalModal(true)}
                        className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                      >
                        {t("analysis.goals.setGoal")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">{t("analysis.goals.cannotLoad")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 목표 생성 모달 */}
      <CreateGoalModal
        isOpen={showCreateGoalModal}
        onClose={() => setShowCreateGoalModal(false)}
        onSuccess={() => {
          // 목표 생성 성공 후 목표 진행 상황 새로고침
          queryClient.invalidateQueries({ queryKey: ["goal-progress"] });
          queryClient.invalidateQueries({ queryKey: ["goals"] });
        }}
      />

      {/* 목표 수정 모달 */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full animate-scale-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-theme-primary to-theme-accent rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              {t("analysis.goals.editGoal")}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const targetValue = formData.get("targetValue");
                const deadline = formData.get("deadline");
                const status = formData.get("status");

                updateGoalMutation.mutate({
                  id: editingGoal.id,
                  data: {
                    targetValue: targetValue ? Number(targetValue) : undefined,
                    deadline: deadline ? new Date(deadline as string).toISOString() : undefined,
                    status: status || undefined,
                  },
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("analysis.goals.targetValue")}
                  </label>
                  <input
                    type="number"
                    name="targetValue"
                    defaultValue={editingGoal.targetValue}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("analysis.goals.deadline")}
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={editingGoal.deadline ? new Date(editingGoal.deadline).toISOString().split("T")[0] : ""}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("analysis.goals.status")}
                  </label>
                  <select
                    name="status"
                    defaultValue={editingGoal.status}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-theme-primary transition-all"
                  >
                    <option value="active">{t("analysis.goals.statusActive")}</option>
                    <option value="paused">{t("analysis.goals.statusPaused")}</option>
                    <option value="achieved">{t("analysis.goals.statusAchieved")}</option>
                    <option value="failed">{t("analysis.goals.statusFailed")}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  variant="outline"
                  size="md"
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1"
                  isLoading={updateGoalMutation.isPending}
                >
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 목표 달성 축하 모달 */}
      {achievedGoal && (
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => {
            setShowCelebration(false);
            setAchievedGoal(null);
          }}
          title={t("analysis.goals.achievementTitle")}
          message={`${achievedGoal.target} ${t("analysis.goals.achievementMessage")}`}
          emoji="🏆"
          achievement={{
            type: achievedGoal.type === "score_target" ? t("analysis.goals.scoreTarget") :
                  achievedGoal.type === "exam_count" ? t("analysis.goals.examCountTarget") :
                  t("analysis.goals.wordCountTarget"),
            value: achievedGoal.target,
          }}
          nextAction={{
            label: t("analysis.goals.nextGoal"),
            onClick: () => {
              setShowCelebration(false);
              setAchievedGoal(null);
              setActiveTab("goals");
              setShowCreateGoalModal(true);
            },
          }}
        />
      )}
    </>
  );
}

