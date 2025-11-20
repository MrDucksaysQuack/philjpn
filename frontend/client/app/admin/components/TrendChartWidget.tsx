"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { adminAPI } from "@/lib/api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { chartColors } from "@/lib/chart-colors";

export default function TrendChartWidget() {
  const [isMounted, setIsMounted] = useState(false);
  
  const { data: examResults, isLoading } = useQuery({
    queryKey: ["admin-exam-results-trend"],
    queryFn: async () => {
      const response = await adminAPI.getExamResults({ limit: 100 });
      return response.data.data || [];
    },
  });

  // 클라이언트에서만 마운트됨을 표시 (hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ⚠️ 중요: 모든 hooks는 early return 전에 호출되어야 함 (React Hooks 규칙)
  // 클라이언트에서만 날짜 계산 (hydration mismatch 방지)
  const { dailyAttempts, dailyScores } = useMemo(() => {
    if (!isMounted) {
      // 서버 렌더링 시 빈 배열 반환
      return { dailyAttempts: [], dailyScores: [] };
    }

    // 최근 30일간 일별 응시 수 계산
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const attempts = last30Days.map((date) => {
      const count = (examResults || []).filter((result: any) => {
        const startedAt = new Date(result.startedAt);
        startedAt.setHours(0, 0, 0, 0);
        return startedAt.getTime() === date.getTime();
      }).length;

      return {
        date: date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
        attempts: count,
        fullDate: date.toLocaleDateString("ko-KR"),
      };
    });

    // 최근 7일간 일별 평균 점수 계산
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const scores = last7Days.map((date) => {
      const dayResults = (examResults || []).filter((result: any) => {
        if (result.status !== "completed" || result.totalScore === null || result.maxScore === null) {
          return false;
        }
        const startedAt = new Date(result.startedAt);
        startedAt.setHours(0, 0, 0, 0);
        return startedAt.getTime() === date.getTime();
      });

      const avgScore = dayResults.length > 0
        ? dayResults.reduce((sum: number, r: any) => {
            const percentage = r.percentage
              ? parseFloat(r.percentage.toString())
              : (r.totalScore / r.maxScore) * 100;
            return sum + percentage;
          }, 0) / dayResults.length
        : 0;

      return {
        date: date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
        avgScore: Math.round(avgScore),
        count: dayResults.length,
        fullDate: date.toLocaleDateString("ko-KR"),
      };
    });

    return { dailyAttempts: attempts, dailyScores: scores };
  }, [isMounted, examResults]);

  // Early return은 모든 hooks 호출 후에 수행
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <LoadingSpinner message="트렌드 데이터를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 일별 응시 수 트렌드 */}
      <div className="bg-surface rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">일별 응시 수 (최근 30일)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyAttempts}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border()} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke={chartColors.textMuted()}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} stroke={chartColors.textMuted()} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface, #ffffff)",
                border: `1px solid ${chartColors.border()}`,
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="attempts" fill={chartColors.info()} name="응시 수" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 일별 평균 점수 트렌드 */}
      <div className="bg-surface rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">일별 평균 점수 (최근 7일)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyScores}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border()} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke={chartColors.textMuted()}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke={chartColors.textMuted()}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface, #ffffff)",
                border: `1px solid ${chartColors.border()}`,
                borderRadius: "8px",
              }}
              formatter={(value: any) => [`${value}%`, "평균 점수"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgScore"
              name="평균 점수"
              stroke={chartColors.success()}
              strokeWidth={2}
              dot={{ r: 4, fill: chartColors.success() }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-text-secondary">
          총 {dailyScores.reduce((sum, d) => sum + d.count, 0)}개의 완료된 시험이 있습니다.
        </div>
      </div>
    </div>
  );
}

