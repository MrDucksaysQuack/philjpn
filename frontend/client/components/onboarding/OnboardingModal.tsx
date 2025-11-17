"use client";

import { useState, useEffect } from "react";

interface OnboardingStep {
  title: string;
  content: string;
  image?: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "환영합니다! 🎉",
    content: "시험 플랫폼에 오신 것을 환영합니다. 이 가이드를 통해 주요 기능을 빠르게 익혀보세요.",
  },
  {
    title: "시험 응시하기",
    content: "1. '시험 목록'에서 원하는 시험을 선택하세요.\n2. 라이선스 키를 입력하세요.\n3. 시험을 시작하고 문제를 풀어보세요.\n4. 완료 후 결과를 확인할 수 있습니다.",
  },
  {
    title: "결과 확인하기",
    content: "시험 완료 후 '내 결과' 페이지에서 상세한 피드백을 확인할 수 있습니다. AI 해설과 약점 진단 기능도 활용해보세요!",
  },
  {
    title: "대시보드 활용하기",
    content: "대시보드에서 학습 통계, 목표 진행 상황, 추천 시험 등을 한눈에 확인할 수 있습니다. 성적 추이 차트로 자신의 성장을 확인해보세요!",
  },
  {
    title: "단어장 관리하기",
    content: "시험 중 모르는 단어를 단어장에 저장하고, 나중에 복습할 수 있습니다. 학습 효율을 높이는 데 도움이 됩니다.",
  },
  {
    title: "준비 완료! 🚀",
    content: "이제 모든 기능을 사용할 준비가 되었습니다. 첫 시험을 시작해보세요!",
  },
];

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="건너뛰기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* 진행 표시 */}
          <div className="mt-4 flex gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all ${
                  index <= currentStep ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-8">
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="text-center w-full">
              <div className="text-6xl mb-6">
                {currentStep === 0 && "👋"}
                {currentStep === 1 && "📝"}
                {currentStep === 2 && "📊"}
                {currentStep === 3 && "📈"}
                {currentStep === 4 && "📖"}
                {currentStep === 5 && "🎯"}
              </div>
              <p className="text-lg text-gray-700 whitespace-pre-line leading-relaxed">
                {step.content}
              </p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFirstStep
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              이전
            </button>
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {onboardingSteps.length}
            </span>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              {isLastStep ? "시작하기" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

