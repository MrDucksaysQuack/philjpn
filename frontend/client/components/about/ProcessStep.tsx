"use client";

import { ReactNode } from "react";

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  icon?: ReactNode;
  isLast?: boolean;
}

export default function ProcessStep({
  step,
  title,
  description,
  icon,
  isLast = false,
}: ProcessStepProps) {
  return (
    <div className="relative">
      {/* 연결선 (마지막 단계가 아닐 때) */}
      {!isLast && (
        <div className="hidden md:block absolute top-12 left-12 w-full h-0.5 bg-gradient-to-r from-theme-primary to-theme-secondary -z-10" />
      )}

      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
        {/* 단계 번호 */}
        <div className="flex-shrink-0 relative">
          <div className="w-24 h-24 rounded-full bg-theme-gradient-primary text-white flex items-center justify-center font-extrabold text-2xl shadow-lg">
            {icon || step}
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

