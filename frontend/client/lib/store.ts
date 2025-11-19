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

// 즐겨찾기 Store
interface FavoriteState {
  favorites: string[]; // 메뉴 href 배열
  addFavorite: (href: string) => void;
  removeFavorite: (href: string) => void;
  toggleFavorite: (href: string) => void;
  isFavorite: (href: string) => boolean;
}

const FAVORITES_KEY = "admin-dashboard-favorites";

export const useFavoriteStore = create<FavoriteState>((set, get) => {
  // localStorage에서 초기값 가져오기
  let initialFavorites: string[] = [];
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        initialFavorites = JSON.parse(saved);
      } catch {
        initialFavorites = [];
      }
    }
  }

  return {
    favorites: initialFavorites,
    addFavorite: (href) => {
      const current = get().favorites;
      if (!current.includes(href)) {
        const updated = [...current, href];
        set({ favorites: updated });
        if (typeof window !== "undefined") {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        }
      }
    },
    removeFavorite: (href) => {
      const current = get().favorites;
      const updated = current.filter((f) => f !== href);
      set({ favorites: updated });
      if (typeof window !== "undefined") {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      }
    },
    toggleFavorite: (href) => {
      const current = get().favorites;
      if (current.includes(href)) {
        get().removeFavorite(href);
      } else {
        get().addFavorite(href);
      }
    },
    isFavorite: (href) => {
      return get().favorites.includes(href);
    },
  };
});

// 최근 사용 메뉴 Store
interface RecentMenu {
  href: string;
  title: string;
  icon: string;
  timestamp: number;
}

interface RecentMenuState {
  recentMenus: RecentMenu[];
  addRecentMenu: (href: string, title: string, icon: string) => void;
  clearRecentMenus: () => void;
}

const RECENT_MENUS_KEY = "admin-dashboard-recent-menus";
const MAX_RECENT_MENUS = 5;

export const useRecentMenuStore = create<RecentMenuState>((set, get) => {
  // localStorage에서 초기값 가져오기
  let initialRecentMenus: RecentMenu[] = [];
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(RECENT_MENUS_KEY);
    if (saved) {
      try {
        initialRecentMenus = JSON.parse(saved);
      } catch {
        initialRecentMenus = [];
      }
    }
  }

  return {
    recentMenus: initialRecentMenus,
    addRecentMenu: (href, title, icon) => {
      const current = get().recentMenus;
      // 이미 존재하는 항목 제거
      const filtered = current.filter((m) => m.href !== href);
      // 새 항목을 맨 앞에 추가
      const updated = [
        { href, title, icon, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_MENUS);
      set({ recentMenus: updated });
      if (typeof window !== "undefined") {
        localStorage.setItem(RECENT_MENUS_KEY, JSON.stringify(updated));
      }
    },
    clearRecentMenus: () => {
      set({ recentMenus: [] });
      if (typeof window !== "undefined") {
        localStorage.removeItem(RECENT_MENUS_KEY);
      }
    },
  };
});

// 그룹 순서 Store
interface GroupOrderState {
  groupOrder: string[]; // 그룹 ID 배열
  setGroupOrder: (order: string[]) => void;
  resetGroupOrder: () => void;
}

const GROUP_ORDER_KEY = "admin-dashboard-group-order";
const DEFAULT_GROUP_ORDER = ["content", "users", "analytics", "settings"];

export const useGroupOrderStore = create<GroupOrderState>((set, get) => {
  // localStorage에서 초기값 가져오기
  let initialGroupOrder: string[] = DEFAULT_GROUP_ORDER;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(GROUP_ORDER_KEY);
    if (saved) {
      try {
        initialGroupOrder = JSON.parse(saved);
      } catch {
        initialGroupOrder = DEFAULT_GROUP_ORDER;
      }
    }
  }

  return {
    groupOrder: initialGroupOrder,
    setGroupOrder: (order) => {
      set({ groupOrder: order });
      if (typeof window !== "undefined") {
        localStorage.setItem(GROUP_ORDER_KEY, JSON.stringify(order));
      }
    },
    resetGroupOrder: () => {
      set({ groupOrder: DEFAULT_GROUP_ORDER });
      if (typeof window !== "undefined") {
        localStorage.setItem(GROUP_ORDER_KEY, JSON.stringify(DEFAULT_GROUP_ORDER));
      }
    },
  };
});
