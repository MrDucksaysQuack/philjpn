"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { goalAPI } from "@/lib/api";
import { emotionalToast } from "@/components/common/Toast";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateGoalModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGoalModalProps) {
  const queryClient = useQueryClient();
  const [goalType, setGoalType] = useState<
    "score_target" | "weakness_recovery" | "exam_count" | "word_count"
  >("score_target");
  const [targetValue, setTargetValue] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [milestones, setMilestones] = useState<
    Array<{ date: string; target: number }>
  >([]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      goalType: string;
      targetValue: number;
      deadline: string;
      milestones?: Array<{ date: string; target: number }>;
    }) => {
      const response = await goalAPI.createGoal(data as any);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-progress"] });
      emotionalToast.success.goalCreated();
      onSuccess?.();
      onClose();
      // 폼 초기화
      setTargetValue("");
      setDeadline("");
      setMilestones([]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetValue || !deadline) {
      emotionalToast.error({
        message: "목표값과 마감일을 모두 입력해주세요",
        emoji: "⚠️",
      } as any);
      return;
    }

    const targetNum = parseInt(targetValue);
    if (isNaN(targetNum) || targetNum <= 0) {
      emotionalToast.error({
        message: "올바른 목표값을 입력해주세요",
        emoji: "⚠️",
      } as any);
      return;
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    if (deadlineDate <= today) {
      emotionalToast.error({
        message: "마감일은 오늘 이후로 설정해주세요",
        emoji: "⚠️",
      } as any);
      return;
    }

    createMutation.mutate({
      goalType,
      targetValue: targetNum,
      deadline: deadlineDate.toISOString(),
      milestones: milestones.length > 0 ? milestones : undefined,
    });
  };

  const addMilestone = () => {
    setMilestones([...milestones, { date: "", target: 0 }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (
    index: number,
    field: "date" | "target",
    value: string | number,
  ) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            새 목표 설정하기
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 목표 타입 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              목표 유형
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGoalType("score_target")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  goalType === "score_target"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg font-semibold text-gray-900">점수 목표</div>
                <div className="text-sm text-gray-600">특정 점수 달성</div>
              </button>
              <button
                type="button"
                onClick={() => setGoalType("weakness_recovery")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  goalType === "weakness_recovery"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg font-semibold text-gray-900">약점 회복</div>
                <div className="text-sm text-gray-600">약점 정답률 향상</div>
              </button>
              <button
                type="button"
                onClick={() => setGoalType("exam_count")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  goalType === "exam_count"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg font-semibold text-gray-900">시험 횟수</div>
                <div className="text-sm text-gray-600">시험 응시 횟수</div>
              </button>
              <button
                type="button"
                onClick={() => setGoalType("word_count")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  goalType === "word_count"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg font-semibold text-gray-900">단어 학습</div>
                <div className="text-sm text-gray-600">단어 학습 개수</div>
              </button>
            </div>
          </div>

          {/* 목표값 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              목표값
              {goalType === "score_target" && " (점수)"}
              {goalType === "weakness_recovery" && " (정답률 %)"}
              {goalType === "exam_count" && " (회)"}
              {goalType === "word_count" && " (개)"}
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              min="1"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
              placeholder={
                goalType === "score_target"
                  ? "예: 900"
                  : goalType === "weakness_recovery"
                  ? "예: 80"
                  : goalType === "exam_count"
                  ? "예: 20"
                  : "예: 100"
              }
              required
            />
          </div>

          {/* 마감일 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              마감일
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
              required
            />
          </div>

          {/* 중간 마일스톤 (선택적) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                중간 마일스톤 (선택사항)
              </label>
              <button
                type="button"
                onClick={addMilestone}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + 마일스톤 추가
              </button>
            </div>
            {milestones.length > 0 && (
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-end p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">날짜</label>
                      <input
                        type="date"
                        value={milestone.date}
                        onChange={(e) =>
                          updateMilestone(index, "date", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">목표값</label>
                      <input
                        type="number"
                        value={milestone.target || ""}
                        onChange={(e) =>
                          updateMilestone(index, "target", parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700 transition-colors"
                      aria-label="삭제"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? "생성 중..." : "목표 설정하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

