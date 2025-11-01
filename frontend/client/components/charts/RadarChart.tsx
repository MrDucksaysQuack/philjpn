"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";

interface RadarChartData {
  subject: string;
  score: number;
  fullMark?: number;
}

interface CustomRadarChartProps {
  data: RadarChartData[];
  title?: string;
}

export default function CustomRadarChart({ data, title }: CustomRadarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.score), 100);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "#374151" }}
            tickLine={{ stroke: "#9ca3af" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, Math.max(maxValue, 100)]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <Radar
            name="점수"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold">{payload[0].payload.subject}</p>
                    <p className="text-sm text-indigo-600">
                      점수: {payload[0].value}점
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

