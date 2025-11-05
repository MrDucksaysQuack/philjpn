"use client";

import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode | null;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`
        group relative bg-white rounded-2xl p-6 md:p-8 
        shadow-lg border border-gray-100 
        hover:shadow-xl hover:-translate-y-2 
        transition-all duration-300
        ${className}
      `}
    >
      {/* 아이콘 */}
      {icon && (
        <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-xl bg-theme-gradient-primary text-white group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}

      {/* 제목 */}
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
        {title}
      </h3>

      {/* 설명 */}
      <p className="text-gray-600 leading-relaxed">{description}</p>

      {/* 호버 시 테마 색상 테두리 */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-theme-primary transition-colors duration-300 pointer-events-none" />
    </div>
  );
}

