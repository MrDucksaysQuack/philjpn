"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import React from "react";
import { goalAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ProgressBar from "@/components/common/ProgressBar";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import CelebrationModal from "@/components/common/CelebrationModal";
import { emotionalToast } from "@/components/common/Toast";

export default function GoalProgressWidget() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievedGoal, setAchievedGoal] = useState<{ type: string; target: string } | null>(null);

  const { data: goalProgress, isLoading } = useQuery({
    queryKey: ["goal-progress"],
    queryFn: async () => {
      const response = await goalAPI.getGoalProgress();
      return response.data;
    },
    enabled: !!user,
  });

  // 목표 달성 체크
  if (goalProgress?.activeGoals) {
    const justAchieved = goalProgress.activeGoals.find(
      (goal: any) => goal.progress >= 1 && goal.onTrack && !achievedGoal
    );
    if (justAchieved) {
      const targetText = 
        justAchieved.type === "score_target" ? `${justAchieved.target}점` :
        justAchieved.type === "exam_count" ? `${justAchieved.target}회` :
        `${justAchieved.target}개`;
      setAchievedGoal({ type: justAchieved.type, target: targetText });
      setShowCelebration(true);
      emotionalToast.success.goalAchieved(targetText);
    }
  }

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  const mainGoal = goalProgress?.activeGoals?.[0] || null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-yellow-600 to-orange-600 rounded-full"></div>
            목표 진행 상황
          </h2>
          {mainGoal && (
            <Link
              href="/analysis?tab=goals"
              className="text-sm text-theme-primary hover:opacity-80 font-medium flex items-center gap-1"
            >
              자세히 보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {mainGoal ? (
          <div className="space-y-6">
            {/* 목표 정보 */}
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {mainGoal.type === "score_target" && "점수 목표"}
                    {mainGoal.type === "exam_count" && "시험 횟수 목표"}
                    {mainGoal.type === "word_count" && "단어 학습 목표"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    목표: {mainGoal.target} {mainGoal.type === "score_target" ? "점" : mainGoal.type === "exam_count" ? "회" : "개"}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    mainGoal.onTrack
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {mainGoal.onTrack ? "✅ 진행 중" : "⚠️ 주의 필요"}
                </span>
              </div>

              {/* 진행률 바 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    진행률: {Math.round(mainGoal.progress * 100)}%
                  </span>
                  <span className="text-sm text-gray-600">
                    {mainGoal.current} / {mainGoal.target}
                  </span>
                </div>
                <ProgressBar
                  current={mainGoal.current}
                  total={mainGoal.target}
                  message={
                    mainGoal.progress >= 0.9 && mainGoal.progress < 1
                      ? "🎯 거의 다 왔어요! 화이팅!"
                      : mainGoal.progress >= 0.7 && mainGoal.progress < 0.9
                      ? "💪 좋아요! 계속 달려봐요!"
                      : mainGoal.progress < 0.5
                      ? "🚀 시작이 좋아요! 꾸준히 해봐요!"
                      : undefined
                  }
                  size="lg"
                />
              </div>

              {/* 예상 완료 시점 */}
              {mainGoal.estimatedCompletion && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  예상 완료 시점: {mainGoal.estimatedCompletion}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4">
              <span className="text-4xl">🎯</span>
            </div>
            <p className="text-gray-600 mb-6">설정된 목표가 없습니다.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              목표 설정하기
            </button>
          </div>
        )}

        {/* 추가 목표가 있을 때 간단 표시 */}
        {goalProgress?.activeGoals && goalProgress.activeGoals.length > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              다른 활성 목표 {goalProgress.activeGoals.length - 1}개 더 있음
            </p>
            <Link
              href="/analysis?tab=goals"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              모두 보기 →
            </Link>
          </div>
        )}
      </div>

      {/* 목표 생성 모달 */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
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
              setShowCreateModal(true);
            },
          }}
        />
      )}
    </>
  );
}

