"use client";

import { ReactNode, useEffect, useState } from "react";

interface StatCardProps {
  icon: ReactNode | null;
  value: number | string;
  label: string;
  suffix?: string;
  animate?: boolean;
  className?: string;
}

export default function StatCard({
  icon,
  value,
  label,
  suffix = "",
  animate = true,
  className = "",
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(animate && typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (!animate || typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    const duration = 2000; // 2초
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, animate]);

  return (
    <div
      className={`
        bg-white rounded-2xl p-6 md:p-8 
        shadow-lg border border-gray-100 
        hover:shadow-xl hover:-translate-y-1 
        transition-all duration-300
        text-center
        ${className}
      `}
    >
      {/* 아이콘 */}
      {icon && (
        <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-xl bg-theme-primary-light text-theme-primary mx-auto">
          {icon}
        </div>
      )}

      {/* 숫자 */}
      <div className="mb-2">
        <span className="text-4xl md:text-5xl font-extrabold text-theme-primary">
          {displayValue}
        </span>
        {suffix && (
          <span className="text-2xl md:text-3xl font-bold text-gray-600 ml-1">
            {suffix}
          </span>
        )}
      </div>

      {/* 라벨 */}
      <p className="text-gray-600 font-medium">{label}</p>
    </div>
  );
}

