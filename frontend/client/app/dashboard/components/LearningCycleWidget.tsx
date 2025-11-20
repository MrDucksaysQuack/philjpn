"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { learningCycleAPI } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/common/Button";
import { toast } from "@/components/common/Toast";
import Link from "next/link";

export default function LearningCycleWidget() {
  const { user } = useRequireAuth();
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const queryClient = useQueryClient();

  const { data: cycleData, isLoading } = useQuery({
    queryKey: ["learning-cycle"],
    queryFn: async () => {
      const response = await learningCycleAPI.getLearningCycle();
      return response.data;
    },
    enabled: !!user,
  });

  const updateStageMutation = useMutation({
    mutationFn: async (stage: string) => {
      await learningCycleAPI.updateCycleStage(stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-cycle"] });
      toast.success(t("dashboard.learningCycle.stageUpdated"));
    },
  });

  const completeCycleMutation = useMutation({
    mutationFn: async () => {
      await learningCycleAPI.completeCycle();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-cycle"] });
      toast.success(t("dashboard.learningCycle.cycleCompleted"));
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!cycleData?.currentCycle) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          {t("dashboard.learningCycle.title")}
        </h3>
        <p className="text-gray-600 mb-4">{t("dashboard.learningCycle.noActiveCycle")}</p>
        <p className="text-sm text-gray-500">
          {t("dashboard.learningCycle.startCycleHint")}
        </p>
      </div>
    );
  }

  const currentCycle = cycleData.currentCycle;
  const stageLabels: Record<string, string> = {
    identify: t("dashboard.learningCycle.stages.identify"),
    practice: t("dashboard.learningCycle.stages.practice"),
    review: t("dashboard.learningCycle.stages.review"),
    test: t("dashboard.learningCycle.stages.test"),
  };

  const stageDescriptions: Record<string, string> = {
    identify: t("dashboard.learningCycle.stageDescriptions.identify"),
    practice: t("dashboard.learningCycle.stageDescriptions.practice"),
    review: t("dashboard.learningCycle.stageDescriptions.review"),
    test: t("dashboard.learningCycle.stageDescriptions.test"),
  };

  const stages = ["identify", "practice", "review", "test"];
  const currentStageIndex = stages.indexOf(currentCycle.stage);

  const getNextStage = () => {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex < stages.length) {
      return stages[nextIndex];
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          {t("dashboard.learningCycle.title")}
        </h3>
        {currentCycle.cycleType && (
          <span className="px-3 py-1 bg-theme-primary/10 text-theme-primary rounded-full text-sm font-semibold">
            {currentCycle.cycleType === "weakness_focused"
              ? t("dashboard.learningCycle.types.weaknessFocused")
              : t("dashboard.learningCycle.types.general")}
          </span>
        )}
      </div>

      {/* 진행 단계 표시 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {t("dashboard.learningCycle.currentStage")}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(currentCycle.startDate).toLocaleDateString(locale)}
          </span>
        </div>
        
        {/* 단계 진행 바 */}
        <div className="relative mb-4">
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => (
              <div key={stage} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${
                    index <= currentStageIndex
                      ? "bg-theme-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="text-xs text-center text-gray-600 max-w-[60px]">
                  {stageLabels[stage]}
                </div>
              </div>
            ))}
          </div>
          {/* 진행 바 */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
            <div
              className="h-1 bg-theme-primary transition-all duration-300"
              style={{
                width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 현재 단계 정보 */}
        <div className="bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 rounded-lg p-4 mb-4">
          <div className="font-semibold text-gray-900 mb-1">
            {stageLabels[currentCycle.stage]}
          </div>
          <div className="text-sm text-gray-600">
            {stageDescriptions[currentCycle.stage]}
          </div>
        </div>

        {/* 단계별 데이터 표시 */}
        {currentCycle.weakWords && currentCycle.weakWords.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              {t("dashboard.learningCycle.weakWords")} ({currentCycle.weakWords.length})
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {currentCycle.weakWords.slice(0, 5).map((word: any, idx: number) => (
                <div
                  key={word.wordId || idx}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <span className="font-medium text-gray-900">{word.word}</span>
                  <span className="text-gray-500">
                    {word.masteryLevel !== undefined
                      ? `${Math.round(word.masteryLevel)}%`
                      : word.reviewStatus === "pending"
                      ? t("dashboard.learningCycle.reviewPending")
                      : t("dashboard.learningCycle.reviewScheduled")}
                  </span>
                </div>
              ))}
            </div>
            {currentCycle.weakWords.length > 5 && (
              <Link
                href="/wordbook"
                className="text-sm text-theme-primary hover:underline mt-2 inline-block"
              >
                {t("dashboard.learningCycle.viewAll")} →
              </Link>
            )}
          </div>
        )}

        {currentCycle.recommendedExams && currentCycle.recommendedExams.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              {t("dashboard.learningCycle.recommendedExams")}
            </div>
            <div className="space-y-2">
              {currentCycle.recommendedExams.slice(0, 3).map((exam: any, idx: number) => (
                <Link
                  key={exam.examId || idx}
                  href={`/exams/${exam.examId}`}
                  className="block p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  <div className="font-medium text-gray-900">{exam.title}</div>
                  <div className="text-xs text-gray-500">
                    {t("dashboard.learningCycle.previousScore")}: {exam.previousScore}%
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {getNextStage() && (
          <Button
            onClick={() => updateStageMutation.mutate(getNextStage()!)}
            variant="primary"
            size="sm"
            isLoading={updateStageMutation.isPending}
            className="flex-1"
          >
            {t("dashboard.learningCycle.nextStage")}
          </Button>
        )}
        <Button
          onClick={() => {
            if (confirm(t("dashboard.learningCycle.confirmComplete"))) {
              completeCycleMutation.mutate();
            }
          }}
          variant="secondary"
          size="sm"
          isLoading={completeCycleMutation.isPending}
          className="flex-1"
        >
          {t("dashboard.learningCycle.completeCycle")}
        </Button>
      </div>

      {/* 사이클 히스토리 */}
      {cycleData.cycleHistory && cycleData.cycleHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            {t("dashboard.learningCycle.history")}
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {cycleData.cycleHistory.slice(0, 3).map((cycle: any, idx: number) => (
              <div
                key={cycle.cycleId || idx}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div>
                  <div className="text-gray-900">
                    {new Date(cycle.startedAt).toLocaleDateString(locale)} -{" "}
                    {cycle.completedAt
                      ? new Date(cycle.completedAt).toLocaleDateString(locale)
                      : t("dashboard.learningCycle.ongoing")}
                  </div>
                  {cycle.wordsLearned && (
                    <div className="text-xs text-gray-500">
                      {t("dashboard.learningCycle.wordsLearned")}: {cycle.wordsLearned}
                    </div>
                  )}
                </div>
                {cycle.improvement && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      cycle.improvement.startsWith("+")
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}
                  >
                    {cycle.improvement}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

