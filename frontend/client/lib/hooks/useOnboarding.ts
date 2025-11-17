"use client";

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "exam-platform-onboarding-completed";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // localStorage에서 온보딩 완료 여부 확인
    const completed = localStorage.getItem(ONBOARDING_KEY);
    
    if (!completed) {
      // 첫 방문이면 온보딩 표시
      setShowOnboarding(true);
    }
    
    setIsChecking(false);
  }, []);

  const completeOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
      setShowOnboarding(false);
    }
  };

  const resetOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_KEY);
      setShowOnboarding(true);
    }
  };

  return {
    showOnboarding,
    isChecking,
    completeOnboarding,
    resetOnboarding,
  };
}

