"use client";

import { useEffect, useState } from "react";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  emoji?: string;
  achievement?: {
    type: string;
    value: string;
  };
  nextAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function CelebrationModal({
  isOpen,
  onClose,
  title,
  message,
  emoji = "🎉",
  achievement,
  nextAction,
}: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Confetti 효과 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {["🎉", "🎊", "✨", "⭐", "🎈"][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="닫기"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이모지 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">{emoji}</div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{title}</h2>
          <p className="text-lg text-gray-600">{message}</p>
        </div>

        {/* 성취 정보 */}
        {achievement && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-700 mb-2">{achievement.type}</div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {achievement.value}
              </div>
            </div>
          </div>
        )}

        {/* 다음 액션 */}
        {nextAction && (
          <div className="space-y-3">
            <button
              onClick={() => {
                nextAction.onClick();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              type="button"
            >
              {nextAction.label}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              type="button"
            >
              나중에 하기
            </button>
          </div>
        )}

        {!nextAction && (
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            type="button"
          >
            확인
          </button>
        )}
      </div>
    </div>
  );
}

