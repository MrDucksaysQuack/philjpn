"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { resultAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { chartColors } from "@/lib/chart-colors";

export default function ScoreTrendWidget() {
  const user = useAuthStore((state) => state.user);
  const [isMounted, setIsMounted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["results-for-chart"],
    queryFn: async () => {
      const response = await resultAPI.getResults({ limit: 50 });
      return response.data.data || [];
    },
    enabled: !!user,
  });

  // 클라이언트에서만 마운트됨을 표시 (hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ⚠️ 중요: 모든 hooks는 early return 전에 호출되어야 함 (React Hooks 규칙)
  // 성적 추이 데이터 준비 (hydration mismatch 방지)
  const chartData = useMemo(() => {
    if (!isMounted) {
      // 서버 렌더링 시 빈 배열 반환
      return [];
    }

    return (data || [])
    .filter((result: any) => result.status === "completed" && result.totalScore !== null && result.maxScore !== null)
    .map((result: any) => {
      const percentage = result.percentage
        ? parseFloat(result.percentage.toString())
        : (result.totalScore / result.maxScore) * 100;
      
      return {
        date: new Date(result.startedAt).toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        }),
        fullDate: new Date(result.startedAt).toLocaleDateString("ko-KR"),
        score: result.totalScore,
        maxScore: result.maxScore,
        percentage: Math.round(percentage),
      };
    })
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    .slice(-10); // 최근 10개만 표시
  }, [isMounted, data]);

  // Early return은 모든 hooks 호출 후에 수행
  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-accent rounded-full"></div>
            성적 추이
          </h2>
        </div>
        <div className="text-center py-12">
          <p className="text-text-muted">아직 완료된 시험이 없습니다.</p>
          <p className="text-sm text-text-muted mt-2">시험을 완료하면 성적 추이가 표시됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-accent rounded-full"></div>
          성적 추이
        </h2>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-info rounded-full"></div>
            <span className="text-text-secondary">점수</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="text-text-secondary">백분율</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border()} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke={chartColors.textMuted()}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke={chartColors.textMuted()}
            domain={[0, "dataMax"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface, #ffffff)",
              border: `1px solid ${chartColors.border()}`,
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: any, name: string) => {
              if (name === "percentage") {
                return [`${value}%`, "백분율"];
              }
              return [value, "점수"];
            }}
            labelFormatter={(label) => `날짜: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            name="점수"
            stroke={chartColors.info()}
            strokeWidth={2}
            dot={{ r: 4, fill: chartColors.info() }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="percentage"
            name="백분율"
            stroke={chartColors.success()}
            strokeWidth={2}
            dot={{ r: 4, fill: chartColors.success() }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-text-muted">최근 점수</div>
              <div className="text-lg font-semibold text-text-primary">
                {chartData[chartData.length - 1].score}점
              </div>
            </div>
            <div>
              <div className="text-sm text-text-muted">평균 점수</div>
              <div className="text-lg font-semibold text-text-primary">
                {Math.round(
                  chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length
                )}점
              </div>
            </div>
            <div>
              <div className="text-sm text-text-muted">최고 점수</div>
              <div className="text-lg font-semibold text-success">
                {Math.max(...chartData.map((d) => d.score))}점
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

