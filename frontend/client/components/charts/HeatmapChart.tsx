"use client";

import { Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

interface HeatmapChartProps {
  data: Array<{ hour: number; day: number; value: number }>;
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  
  // 시간대별 평균값 계산
  const hourData = Array.from({ length: 24 }, (_, hour) => {
    const hourItems = data.filter((d) => d.hour === hour);
    const avg = hourItems.length > 0
      ? hourItems.reduce((sum, d) => sum + d.value, 0) / hourItems.length
      : 0;
    return {
      hour: `${hour}시`,
      value: Math.round(avg),
      count: hourItems.length,
    };
  });

  // 최대값 찾기 (색상 강도 조절)
  const maxValue = Math.max(...hourData.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={hourData}>
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold">{data.hour}</p>
                    <p className="text-sm text-gray-600">
                      평균 점수: {data.value}점
                    </p>
                    <p className="text-sm text-gray-600">
                      시험 횟수: {data.count}회
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            fill="url(#colorGradient)"
            radius={[8, 8, 0, 0]}
          >
            {hourData.map((entry, index) => {
              const intensity = entry.value / maxValue;
              const opacity = 0.4 + intensity * 0.6;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={`rgba(99, 102, 241, ${opacity})`}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* 그라데이션 정의 */}
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 1)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 1)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

