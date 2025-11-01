"use client";

import { useQuery } from "@tanstack/react-query";
import { resultAPI, statisticsAPI, goalAPI, wordBookAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function QuickStats() {
  const user = useAuthStore((state) => state.user);

  // 오늘 응시한 시험 수
  const { data: todayExams } = useQuery({
    queryKey: ["today-exams"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await resultAPI.getResults();
      const results = response.data.data || [];
      return results.filter((r: any) => {
        const startedAt = new Date(r.startedAt);
        startedAt.setHours(0, 0, 0, 0);
        return startedAt.getTime() === today.getTime();
      }).length;
    },
    enabled: !!user,
  });

  // 이번 주 목표 진행률
  const { data: goalProgress } = useQuery({
    queryKey: ["goal-progress"],
    queryFn: async () => {
      const response = await goalAPI.getGoalProgress();
      return response.data;
    },
    enabled: !!user,
  });

  // 최근 평균 점수
  const { data: recentAvg } = useQuery({
    queryKey: ["recent-average"],
    queryFn: async () => {
      const response = await resultAPI.getResults();
      const results = response.data.data || [];
      if (results.length === 0) return null;
      
      const recentResults = results.slice(0, 5); // 최근 5개
      const scores: number[] = [];
      
      for (const r of recentResults) {
        if (
          r.totalScore !== null &&
          r.totalScore !== undefined &&
          r.maxScore !== null &&
          r.maxScore !== undefined &&
          r.maxScore > 0
        ) {
          scores.push((r.totalScore / r.maxScore) * 100);
        } else if (r.percentage) {
          const score = parseFloat(r.percentage.toString());
          if (!isNaN(score)) {
            scores.push(score);
          }
        }
      }
      
      if (scores.length === 0) return null;
      const avg = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      return Math.round(avg);
    },
    enabled: !!user,
  });

  // 학습 중인 단어 수
  const { data: wordCount } = useQuery({
    queryKey: ["wordbook-count"],
    queryFn: async () => {
      try {
        const response = await wordBookAPI.getWords();
        const data = response.data?.data || [];
        return Array.isArray(data) ? data.length : 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user,
  });

  const isLoading = todayExams === undefined || goalProgress === undefined || recentAvg === undefined || wordCount === undefined;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} type="card" />
        ))}
      </div>
    );
  }

  // 이번 주 목표 진행률 계산
  const weeklyGoalProgress = goalProgress?.activeGoals.length > 0
    ? Math.round(
        goalProgress.activeGoals.reduce((sum: number, goal: any) => sum + goal.progress, 0) /
        goalProgress.activeGoals.length * 100
      )
    : 0;

  const stats = [
    {
      label: "오늘 응시한 시험",
      value: todayExams || 0,
      icon: "📝",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      label: "이번 주 목표 진행률",
      value: `${weeklyGoalProgress}%`,
      icon: "🎯",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
    },
    {
      label: "최근 평균 점수",
      value: recentAvg !== null ? `${recentAvg}점` : "-",
      icon: "📊",
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
    },
    {
      label: "학습 중인 단어",
      value: wordCount || 0,
      icon: "📖",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "from-indigo-50 to-indigo-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-gradient-to-br bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-md`}>
              {stat.icon}
            </div>
            <div className={`text-sm font-semibold px-3 py-1 rounded-lg bg-gradient-to-r ${stat.bgColor} border border-gray-200`}>
              {stat.label}
            </div>
          </div>
          <div className={`text-3xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

