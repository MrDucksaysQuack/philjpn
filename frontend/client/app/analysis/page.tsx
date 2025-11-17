"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { emotionalToast } from "@/components/common/Toast";
import { contextualMessages } from "@/lib/messages";
import CreateGoalModal from "@/components/goals/CreateGoalModal";

export default function AnalysisPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"patterns" | "weakness" | "efficiency" | "goals">("patterns");
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievedGoal, setAchievedGoal] = useState<{ type: string; target: string } | null>(null);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);

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
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                자기 분석 대시보드
              </h1>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                학습 패턴과 약점을 분석하여 효과적인 학습 경로를 찾아보세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 탭 네비게이션 */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: "patterns", label: "학습 패턴", icon: "📊" },
                { id: "weakness", label: "약점 분석", icon: "🎯" },
                { id: "efficiency", label: "효율성 지표", icon: "⚡" },
                { id: "goals", label: "목표 진행", icon: "🏆" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-t-lg ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-label={`${tab.label} 탭으로 전환`}
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
                <LoadingSpinner message="학습 패턴을 분석하는 중..." />
              ) : patterns ? (
                <>
                  {/* 시간 패턴 */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                      시간대별 학습 패턴
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-theme-primary-light rounded-xl p-6 border border-theme-primary">
                        <div className="text-sm font-semibold text-theme-primary mb-2">가장 생산적인 시간대</div>
                        <div className="flex flex-wrap gap-2">
                          {patterns.timePatterns.mostProductiveHours.length > 0 ? (
                            patterns.timePatterns.mostProductiveHours.map((hour) => (
                              <span
                                key={hour}
                                className="px-3 py-1 bg-theme-primary text-white rounded-lg font-bold"
                              >
                                {hour}시
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">데이터 수집 중...</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-theme-secondary-light rounded-xl p-6 border border-theme-secondary">
                        <div className="text-sm font-semibold text-purple-700 mb-2">평균 세션 길이</div>
                        <div className="text-3xl font-extrabold text-purple-900">
                          {patterns.timePatterns.averageSessionDuration}분
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                        <div className="text-sm font-semibold text-green-700 mb-2">선호 학습 요일</div>
                        <div className="flex flex-wrap gap-2">
                          {patterns.timePatterns.preferredStudyDays.map((day) => (
                            <span
                              key={day}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg font-medium"
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">시간대별 학습 효율성</h3>
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
                      <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                      집중력 분석
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <div className="text-sm font-semibold text-purple-700 mb-2">최적 세션 길이</div>
                        <div className="text-3xl font-extrabold text-purple-900">
                          {patterns.attentionSpan.optimalSessionLength}분
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          집중력 하락 시점: {patterns.attentionSpan.focusDeclinePoint}분
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                        <div className="text-sm font-semibold text-indigo-700 mb-2">난이도 선호도</div>
                        <div className="text-xl font-bold text-indigo-900 mb-2">
                          {patterns.difficultyPreference.optimalDifficulty}
                        </div>
                        <div className="text-sm text-gray-600">
                          도전 수용도: {Math.round(patterns.difficultyPreference.challengeAcceptance * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">학습 데이터가 부족합니다. 시험을 응시하면 패턴 분석이 가능합니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 약점 분석 탭 */}
          {activeTab === "weakness" && (
            <div className="space-y-8">
              {weaknessLoading ? (
                <LoadingSpinner message="약점을 분석하는 중..." />
              ) : weakness ? (
                <>
                  {weakness.weaknessAreas.length > 0 ? (
                    <>
                      {/* 약점 영역 */}
                      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-orange-600 rounded-full"></div>
                          주요 약점 영역
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(weakness.weaknessAreas || []).map((area, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{area.tag}</h3>
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-lg font-bold">
                                  {area.correctRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">
                                  근본 원인: <span className="font-semibold">{area.rootCause}</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                  예상 개선 시간: {area.predictedImprovementTime}
                                </div>
                                {area.mistakePattern?.commonErrors && area.mistakePattern.commonErrors.length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    <div className="font-semibold mb-1">흔한 오류:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {(area.mistakePattern.commonErrors || []).map((error, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
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
                                  <div className="text-sm font-semibold text-gray-700 mb-2">개선 방안:</div>
                                  <ul className="space-y-1">
                                    {(area.improvementSuggestions || []).map((suggestion, i) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                        <span className="text-green-500">✓</span>
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
                            <div className="w-1 h-8 bg-gradient-to-b from-yellow-600 to-orange-600 rounded-full"></div>
                            지식 격차 분석
                          </h2>
                          <div className="space-y-4">
                            {weakness.knowledgeGaps.map((gap, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="font-semibold text-gray-900">{gap.concept}</h3>
                                  <span className="text-sm text-gray-600">
                                    이해도: {Math.round(gap.understandingLevel * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                                  <div
                                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                                    style={{ width: `${gap.understandingLevel * 100}%` }}
                                  />
                                </div>
                                <div className="text-sm text-gray-600">
                                  필요한 연습 문제: {gap.practiceNeeded}문제
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-2xl">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-2xl mb-6">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-gray-700 mb-2">약점이 발견되지 않았습니다!</p>
                      <p className="text-gray-500">현재 실력이 우수합니다. 계속해서 꾸준히 학습하세요.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">약점 분석을 위해 시험 결과가 필요합니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 효율성 지표 탭 */}
          {activeTab === "efficiency" && (
            <div className="space-y-8">
              {efficiencyLoading ? (
                <LoadingSpinner message="효율성 지표를 계산하는 중..." />
              ) : efficiency ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-theme-primary-light rounded-2xl shadow-lg p-8 border border-theme-primary">
                    <div className="text-sm font-semibold text-theme-primary mb-2">학습 속도</div>
                    <div className="text-4xl font-extrabold text-theme-primary mb-2">
                      {efficiency.learningVelocity > 0 ? "+" : ""}
                      {efficiency.learningVelocity.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">주당 점수 향상도</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg p-8 border border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-2">지식 보유율</div>
                    <div className="text-4xl font-extrabold text-green-900 mb-2">
                      {Math.round(efficiency.retentionRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">1주 후 기억 유지율</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl shadow-lg p-8 border border-purple-200">
                    <div className="text-sm font-semibold text-purple-700 mb-2">연습 효율성</div>
                    <div className="text-4xl font-extrabold text-purple-900 mb-2">
                      {efficiency.practiceEfficiency.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">시간당 점수 향상</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl shadow-lg p-8 border border-orange-200">
                    <div className="text-sm font-semibold text-orange-700 mb-2">약점 회복율</div>
                    <div className="text-4xl font-extrabold text-orange-900 mb-2">
                      {Math.round(efficiency.weaknessRecoveryRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">약점 개선 성공률</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">효율성 분석을 위해 충분한 시험 데이터가 필요합니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 목표 진행 탭 */}
          {activeTab === "goals" && (
            <div className="space-y-8">
              {goalProgressLoading ? (
                <LoadingSpinner message="목표 진행 상황을 불러오는 중..." />
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
                                {goal.type === "score_target" && "점수 목표"}
                                {goal.type === "exam_count" && "시험 횟수 목표"}
                                {goal.type === "word_count" && "단어 학습 목표"}
                              </h3>
                              <p className="text-sm text-gray-500">
                                목표: {goal.target} {goal.type === "score_target" ? "점" : goal.type === "exam_count" ? "회" : "개"}
                              </p>
                            </div>
                            <span
                              className={`px-4 py-2 rounded-lg font-semibold ${
                                goal.onTrack
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {goal.onTrack ? "✅ 진행 중" : "⚠️ 주의 필요"}
                            </span>
                          </div>
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                진행률: {Math.round(goal.progress * 100)}%
                              </span>
                              <span className="text-sm text-gray-600">
                                {goal.current} / {goal.target}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div
                                className={`h-4 rounded-full transition-all ${
                                  goal.progress >= 0.8
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                    : goal.progress >= 0.5
                                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                    : "bg-gradient-to-r from-red-500 to-pink-500"
                                }`}
                                style={{ width: `${Math.min(goal.progress * 100, 100)}%` }}
                              />
                            </div>
                            {/* 감정적 진행 상황 메시지 */}
                            {goal.progress >= 0.9 && goal.progress < 1 && (
                              <p className="text-sm text-center text-theme-primary font-semibold mt-2">
                                🎯 거의 다 왔어요! 화이팅!
                              </p>
                            )}
                            {goal.progress >= 0.7 && goal.progress < 0.9 && (
                              <p className="text-sm text-center text-theme-secondary font-semibold mt-2">
                                💪 좋아요! 계속 달려봐요!
                              </p>
                            )}
                            {goal.progress < 0.5 && (
                              <p className="text-sm text-center text-orange-600 font-semibold mt-2">
                                🚀 시작이 좋아요! 꾸준히 해봐요!
                              </p>
                            )}
                          </div>
                          {goal.estimatedCompletion && (
                            <div className="text-sm text-gray-600">
                              예상 완료 시점: {goal.estimatedCompletion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-2xl">
                      <p className="text-gray-500 mb-4">현재 활성화된 목표가 없습니다.</p>
                      <button
                        onClick={() => setShowCreateGoalModal(true)}
                        className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                      >
                        목표 설정하기
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <p className="text-gray-500">목표 진행 상황을 불러올 수 없습니다.</p>
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
        }}
      />

      {/* 목표 달성 축하 모달 */}
      {achievedGoal && (
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => {
            setShowCelebration(false);
            setAchievedGoal(null);
          }}
          title="🎉 목표 달성!"
          message={`${achievedGoal.target} 목표를 달성하셨어요! 정말 멋져요!`}
          emoji="🏆"
          achievement={{
            type: achievedGoal.type === "score_target" ? "점수 목표" :
                  achievedGoal.type === "exam_count" ? "시험 횟수 목표" :
                  "단어 학습 목표",
            value: achievedGoal.target,
          }}
          nextAction={{
            label: "다음 목표 설정하기",
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

