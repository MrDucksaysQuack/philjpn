"use client";

import { ReactNode } from "react";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export default function HeroSection({
  title,
  subtitle,
  children,
  className = "",
}: HeroSectionProps) {
  return (
    <section
      className={`relative py-20 md:py-32 overflow-hidden ${className}`}
    >
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-theme-gradient-diagonal opacity-90" />
      
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* 콘텐츠 */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>

      {/* 하단 그라데이션 페이드 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

