"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
  fullWidth?: boolean;
  isLoading?: boolean;
}

/**
 * 표준 버튼 컴포넌트
 * 테마 색상 시스템을 사용하여 일관된 버튼 스타일 제공
 */
export function Button({
  variant = "primary",
  size = "md",
  gradient = false,
  fullWidth = false,
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary: gradient
      ? "bg-theme-gradient-button text-white hover:opacity-90 focus:ring-theme-primary"
      : "bg-button-primary text-button-text hover:opacity-90 focus:ring-theme-primary",
    secondary:
      "bg-button-secondary text-button-text hover:opacity-90 focus:ring-theme-secondary",
    success:
      "bg-success text-white hover:opacity-90 focus:ring-success",
    error: "bg-error text-white hover:opacity-90 focus:ring-error",
    warning:
      "bg-warning text-white hover:opacity-90 focus:ring-warning",
    outline:
      "bg-transparent border-2 border-theme-primary text-theme-primary hover:bg-theme-primary-light focus:ring-theme-primary",
    ghost:
      "bg-transparent text-theme-primary hover:bg-theme-primary-light focus:ring-theme-primary",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        widthClass,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          로딩 중...
        </>
      ) : (
        children
      )}
    </button>
  );
}

