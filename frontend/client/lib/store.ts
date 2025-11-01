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
