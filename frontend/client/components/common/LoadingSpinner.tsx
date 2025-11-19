"use client";

import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = "md", 
  message, 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const displayMessage = message || t("common.loading");
  const sizeClasses = {
    sm: "w-8 h-8 border-2",
    md: "w-16 h-16 border-4",
    lg: "w-24 h-24 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin mb-4`}
        role="status"
        aria-label="로딩 중"
      >
        <span className="sr-only">로딩 중...</span>
      </div>
      {displayMessage && (
        <p className="text-gray-600 font-medium text-sm">{displayMessage}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}

