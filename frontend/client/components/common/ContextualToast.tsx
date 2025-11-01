"use client";

import { useEffect } from "react";
import { ContextualMessage } from "@/lib/messages";
import { toast as baseToast } from "./Toast";

interface ContextualToastProps {
  message: ContextualMessage;
  onClose: () => void;
  onAction?: () => void;
  onRetry?: () => void;
}

export function ContextualToast({ message, onClose, onAction, onRetry }: ContextualToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 액션이 있는 경우 조금 더 오래 표시

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = message.emoji?.includes('🎉') || message.emoji?.includes('✨') || message.emoji?.includes('🏆')
    ? "bg-green-500"
    : message.emoji?.includes('😓') || message.emoji?.includes('❌') || message.emoji?.includes('⚠️')
    ? "bg-red-500"
    : "bg-blue-500";

  return (
    <div
      className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in-right`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0 text-2xl">{message.emoji || "💬"}</div>
      <div className="flex-1">
        <p className="text-sm font-medium mb-2">{message.message}</p>
        {(message.action || message.retry) && (
          <div className="flex gap-2 mt-3">
            {message.action && (
              <button
                onClick={() => {
                  message.action?.onClick();
                  onAction?.();
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
                type="button"
              >
                {message.action.label}
              </button>
            )}
            {message.retry && onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
                type="button"
              >
                다시 시도
              </button>
            )}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="알림 닫기"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * 감정적 Toast 메시지 헬퍼
 */
export const contextualToast = {
  success: (message: ContextualMessage) => {
    baseToast.success(message.message);
  },
  error: (message: ContextualMessage, retry?: () => void) => {
    // ContextualToast를 직접 렌더링하도록 확장 필요
    baseToast.error(message.message);
  },
  info: (message: ContextualMessage) => {
    baseToast.info(message.message);
  },
};

