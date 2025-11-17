"use client";

import { create } from "zustand";

interface AuthState {
  user: { id: string; email: string; name: string; role: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (
    user: { id: string; email: string; name: string; role: string } | null,
    accessToken: string,
    refreshToken: string,
  ) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken });
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  },
  clearAuth: () => {
    set({ user: null, accessToken: null, refreshToken: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
}));

// 언어 선택 Store
export type Locale = "ko" | "en" | "ja";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => {
  // localStorage에서 초기값 가져오기
  let initialLocale: Locale = "ko";
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("locale");
    if (saved === "ko" || saved === "en" || saved === "ja") {
      initialLocale = saved;
    }
  }

  return {
    locale: initialLocale,
    setLocale: (locale) => {
      set({ locale });
      if (typeof window !== "undefined") {
        localStorage.setItem("locale", locale);
      }
    },
  };
});
