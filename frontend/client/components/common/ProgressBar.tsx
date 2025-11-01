"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  message?: string;
  showPercentage?: boolean;
  color?: "blue" | "purple" | "green" | "red";
  size?: "sm" | "md" | "lg";
}

export default function ProgressBar({
  current,
  total,
  message,
  showPercentage = true,
  color = "blue",
  size = "md",
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const colorClasses = {
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600",
    green: "bg-gradient-to-r from-green-500 to-green-600",
    red: "bg-gradient-to-r from-red-500 to-red-600",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="w-full" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      {/* 메시지 및 진행률 텍스트 */}
      <div className="flex justify-between items-center mb-2">
        {message && (
          <span className={`font-medium text-gray-700 ${textSizeClasses[size]}`}>
            {message}
          </span>
        )}
        {showPercentage && (
          <span className={`font-semibold text-gray-600 ${textSizeClasses[size]}`}>
            {current} / {total} ({percentage}%)
          </span>
        )}
      </div>

      {/* 진행률 바 */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} h-full rounded-full transition-all duration-500 ease-out shadow-sm relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

