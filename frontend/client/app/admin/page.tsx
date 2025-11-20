"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { adminAPI, aiAPI } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import TrendChartWidget from "./components/TrendChartWidget";
import DashboardTabs from "@/components/admin/DashboardTabs";
import SortableGroup from "@/components/admin/SortableGroup";
import {
  useFavoriteStore,
  useRecentMenuStore,
  useGroupOrderStore,
} from "@/lib/store";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 재분류된 메뉴 구조 (인지 패턴 기반) - 컴포넌트 외부로 이동하여 hydration mismatch 방지
const ALL_MENU_GROUPS = [
    {
      id: "content",
      title: "📝 콘텐츠 관리",
      description: "시험과 문제 콘텐츠를 생성하고 관리합니다",
      color: "blue",
      items: [
        {
          href: "/admin/exams",
          title: "시험 관리",
          description: "시험 생성, 수정, 삭제",
          icon: "📝",
          priority: "high",
        },
        {
          href: "/admin/questions",
          title: "문제 관리",
          description: "전체 문제 조회, 검색 및 관리",
          icon: "❓",
          priority: "high",
        },
        {
          href: "/admin/question-banks",
          title: "문제 은행",
          description: "카테고리별 문제 은행 생성 및 관리",
          icon: "🏦",
          priority: "medium",
        },
        {
          href: "/admin/question-pools",
          title: "문제 풀",
          description: "태그/난이도별 문제 그룹화 및 관리",
          icon: "🏊",
          priority: "medium",
        },
        {
          href: "/admin/templates",
          title: "시험 템플릿",
          description: "템플릿 생성 및 관리로 빠른 시험 생성",
          icon: "📋",
          priority: "medium",
        },
      ],
    },
    {
      id: "users",
      title: "👥 사용자 및 접근 관리",
      description: "사용자와 라이선스 키를 관리합니다",
      color: "green",
      items: [
        {
          href: "/admin/users",
          title: "사용자 관리",
          description: "사용자 목록 조회 및 관리",
          icon: "👤",
          priority: "high",
        },
        {
          href: "/admin/license-keys",
          title: "라이선스 키",
          description: "키 발급 및 관리",
          icon: "🔑",
          priority: "high",
        },
      ],
    },
    {
      id: "analytics",
      title: "📈 분석 및 모니터링",
      description: "시험 결과와 실시간 활동을 모니터링합니다",
      color: "purple",
      items: [
        {
          href: "/admin/exam-results",
          title: "시험 결과",
          description: "전체 시험 결과 조회 및 분석",
          icon: "📊",
          priority: "high",
        },
        {
          href: "/admin/monitoring",
          title: "실시간 모니터링",
          description: "진행 중인 시험 세션 모니터링",
          icon: "👁️",
          priority: "medium",
        },
      ],
    },
    {
      id: "settings",
      title: "⚙️ 시스템 설정",
      description: "플랫폼 전반의 설정을 관리합니다",
      color: "gray",
      items: [
        {
          href: "/admin/settings",
          title: "사이트 설정",
          description: "회사 정보, 로고, 색상 테마 및 콘텐츠 관리",
          icon: "⚙️",
          priority: "low",
        },
        {
          href: "/admin/categories",
          title: "카테고리 관리",
          description: "시험 카테고리 및 서브카테고리 관리",
          icon: "📁",
          priority: "medium",
        },
        {
          href: "/admin/badges",
          title: "배지 관리",
          description: "게이미피케이션 배지 생성 및 관리",
          icon: "🏆",
          priority: "low",
        },
      ],
    },
  ];

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const [activeTab, setActiveTab] = useState("overview");
  const [isMounted, setIsMounted] = useState(false);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // 개인화 기능 스토어
  const { favorites, toggleFavorite, isFavorite } = useFavoriteStore();
  const { recentMenus, addRecentMenu, clearRecentMenus } = useRecentMenuStore();
  const { groupOrder, setGroupOrder, resetGroupOrder } = useGroupOrderStore();

  // 클라이언트에서만 마운트됨을 표시 (hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 드래그 앤 드롭 센서
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await adminAPI.getDashboard();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const { data: examStats } = useQuery({
    queryKey: ["admin-exam-stats"],
    queryFn: async () => {
      const response = await adminAPI.getExamStatistics();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const { data: keyStats } = useQuery({
    queryKey: ["admin-key-stats"],
    queryFn: async () => {
      const response = await adminAPI.getLicenseKeyStatistics();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  // AI 큐 통계 조회
  const { data: aiQueueStats } = useQuery({
    queryKey: ["ai-queue-stats"],
    queryFn: async () => {
      const response = await aiAPI.getQueueStats();
      return response.data;
    },
    enabled: user?.role === "admin",
    refetchInterval: 10000, // 10초마다 자동 갱신
  });

  // AI 가용성 확인
  const { data: aiAvailability } = useQuery({
    queryKey: ["ai-availability"],
    queryFn: async () => {
      const response = await aiAPI.checkAvailability();
      return response.data;
    },
    enabled: user?.role === "admin",
    refetchInterval: 30000, // 30초마다 자동 갱신
  });

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="인증 확인 중..." />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </>
    );
  }

  // tabs 배열을 useMemo로 메모이제이션 (hydration mismatch 방지)
  const tabs = useMemo(() => [
    { id: "overview", label: "대시보드", icon: "📊", groupId: "overview-section" },
    { id: "content", label: "콘텐츠", icon: "📝", groupId: "content-group" },
    { id: "users", label: "사용자", icon: "👥", groupId: "users-group" },
    { id: "analytics", label: "분석", icon: "📈", groupId: "analytics-group" },
    { id: "settings", label: "설정", icon: "⚙️", groupId: "settings-group" },
  ], []);

  const handleScrollToGroup = useCallback((groupId: string) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(groupId);
    if (element) {
      const offset = 100; // 탭 높이 고려
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  // 그룹 순서에 따라 정렬된 메뉴 그룹
  // 클라이언트에서만 실행하여 hydration mismatch 방지
  const menuGroups = useMemo(() => {
    if (!isMounted) {
      // 서버 렌더링 시 기본 순서 사용
      return ALL_MENU_GROUPS;
    }
    
    const groupMap = new Map(ALL_MENU_GROUPS.map((g) => [g.id, g]));
    const orderedGroups: typeof ALL_MENU_GROUPS = [];
    
    // 저장된 순서대로 그룹 추가
    groupOrder.forEach((id) => {
      const group = groupMap.get(id);
      if (group) {
        orderedGroups.push(group);
        groupMap.delete(id);
      }
    });
    
    // 순서에 없는 그룹 추가 (새 그룹이 추가된 경우)
    groupMap.forEach((group) => {
      orderedGroups.push(group);
    });
    
    return orderedGroups;
  }, [isMounted, groupOrder]); // isMounted를 의존성에 추가하여 클라이언트에서만 실행

  // 즐겨찾기 메뉴 추출
  // 클라이언트에서만 실행하여 hydration mismatch 방지
  const favoriteMenus = useMemo(() => {
    if (!isMounted) {
      // 서버 렌더링 시 빈 배열 반환
      return [];
    }
    const allItems = ALL_MENU_GROUPS.flatMap((group) => group.items);
    return allItems.filter((item) => favorites.includes(item.href));
  }, [isMounted, favorites]);

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = groupOrder.indexOf(active.id as string);
      const newIndex = groupOrder.indexOf(over.id as string);
      const newOrder = arrayMove(groupOrder, oldIndex, newIndex);
      setGroupOrder(newOrder);
    }
  };

  // getColorClasses와 getPriorityBadge를 useCallback으로 메모이제이션하여 불필요한 재생성 방지
  const getColorClasses = useCallback((color: string) => {
    const colors: Record<string, string> = {
      blue: "border-blue-200 bg-blue-50 hover:bg-blue-100",
      green: "border-green-200 bg-green-50 hover:bg-green-100",
      purple: "border-purple-200 bg-purple-50 hover:bg-purple-100",
      gray: "border-border bg-surface-hover hover:bg-surface-hover",
    };
    return colors[color] || colors.gray;
  }, []);

  const getPriorityBadge = useCallback((priority: string) => {
    if (priority === "high") {
      return (
        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-error/20 text-error rounded-full">
          자주 사용
        </span>
      );
    }
    return null;
  }, []);

  return (
    <>
      <Header />
      <DashboardTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onScrollToGroup={handleScrollToGroup}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            관리자 대시보드
          </h1>
          <p className="text-text-secondary">
            플랫폼 관리 및 모니터링을 위한 통합 대시보드
          </p>
        </div>

        {/* 빠른 액션 섹션 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">빠른 액션</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/exams/create"
              className="group relative bg-gradient-to-br from-info/10 to-info/20 rounded-xl border-2 border-info/20 p-6 hover:shadow-lg hover:border-info/40 transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">➕</div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary group-hover:text-link transition-colors">
                      새 시험 생성
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">템플릿 또는 직접 생성</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-5 h-5 text-link"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/questions"
              className="group relative bg-gradient-to-br from-success/10 to-success/20 rounded-xl border-2 border-success/20 p-6 hover:shadow-lg hover:border-success/40 transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">❓</div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary group-hover:text-success transition-colors">
                      새 문제 추가
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">문제 은행에 문제 추가</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-5 h-5 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/license-keys"
              className="group relative bg-gradient-to-br from-theme-secondary/10 to-theme-secondary/20 rounded-xl border-2 border-theme-secondary/20 p-6 hover:shadow-lg hover:border-theme-secondary/40 transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🔑</div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary group-hover:text-theme-secondary transition-colors">
                      라이선스 키 발급
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">새 라이선스 키 생성</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-5 h-5 text-theme-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 요약 통계 */}
        <div id="overview-section" className="scroll-mt-24">
          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface rounded-lg shadow p-6 border-l-4 border-info">
              <div className="text-sm text-text-muted mb-2">전체 사용자</div>
              <div className="text-3xl font-bold text-text-primary">
                {dashboard.summary.totalUsers}
              </div>
            </div>
            <div className="bg-surface rounded-lg shadow p-6 border-l-4 border-success">
              <div className="text-sm text-text-muted mb-2">활성 사용자</div>
              <div className="text-3xl font-bold text-info">
                {dashboard.summary.activeUsers}
              </div>
            </div>
            <div className="bg-surface rounded-lg shadow p-6 border-l-4 border-theme-secondary">
              <div className="text-sm text-text-muted mb-2">전체 시험</div>
              <div className="text-3xl font-bold text-success">
                {dashboard.summary.totalExams}
              </div>
            </div>
            <div className="bg-surface rounded-lg shadow p-6 border-l-4 border-warning">
              <div className="text-sm text-text-muted mb-2">전체 응시</div>
              <div className="text-3xl font-bold text-theme-secondary">
                {dashboard.summary.totalAttempts}
              </div>
            </div>
          </div>
        )}

        {/* 시험 통계 */}
        {examStats && (
          <div className="bg-surface rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">시험 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-text-muted">활성 시험</div>
                <div className="text-lg font-semibold">
                  {examStats.activeExams}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">전체 응시</div>
                <div className="text-lg font-semibold">
                  {examStats.totalAttempts}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">평균 점수</div>
                <div className="text-lg font-semibold">
                  {examStats.averageScore}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">완료율</div>
                <div className="text-lg font-semibold">
                  {examStats.completionRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 라이선스 키 통계 */}
        {keyStats && (
          <div className="bg-surface rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">라이선스 키 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-text-muted">전체 키</div>
                <div className="text-lg font-semibold">
                  {keyStats.totalKeys}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">활성 키</div>
                <div className="text-lg font-semibold">
                  {keyStats.activeKeys}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">총 사용</div>
                <div className="text-lg font-semibold">
                  {keyStats.totalUsage}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">만료 예정</div>
                <div className="text-lg font-semibold text-orange-600">
                  {keyStats.expiringSoon}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI 큐 통계 */}
        <div className="bg-surface rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">AI 큐 통계</h2>
          {aiQueueStats ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <div className="text-sm text-text-muted">대기 중</div>
                <div className="text-lg font-semibold text-blue-600">
                  {aiQueueStats.waiting || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">처리 중</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {aiQueueStats.active || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">완료</div>
                <div className="text-lg font-semibold text-green-600">
                  {aiQueueStats.completed || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">실패</div>
                <div className="text-lg font-semibold text-red-600">
                  {aiQueueStats.failed || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">지연</div>
                <div className="text-lg font-semibold text-orange-600">
                  {aiQueueStats.delayed || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">전체</div>
                <div className="text-lg font-semibold">
                  {aiQueueStats.total || 0}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-text-muted">로딩 중...</div>
          )}
          {aiAvailability && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${aiAvailability.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-text-muted">
                  AI 기능 상태: {aiAvailability.available ? '활성화' : '비활성화'}
                </span>
              </div>
              {aiAvailability.message && (
                <div className="text-xs text-text-muted mt-1 ml-5">
                  {aiAvailability.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 트렌드 차트 */}
        <TrendChartWidget />
        </div>

        {/* 즐겨찾기 섹션 */}
        {favoriteMenus.length > 0 && (
          <div className="mt-12 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span>⭐</span>
                <span>즐겨찾기</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteMenus.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => addRecentMenu(item.href, item.title, item.icon)}
                  className="group relative bg-gradient-to-br from-warning/10 to-warning/20 rounded-lg border-2 border-warning/20 p-5 hover:shadow-lg hover:border-warning/40 transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{item.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-warning transition-colors flex items-center">
                          {item.title}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(item.href);
                            }}
                            className="ml-2 text-warning hover:text-warning"
                            title="즐겨찾기 제거"
                          >
                            ⭐
                          </button>
                        </h3>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary ml-11">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 최근 사용 메뉴 섹션 */}
        {recentMenus.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span>🕒</span>
                <span>최근 사용</span>
              </h2>
              <button
                onClick={clearRecentMenus}
                className="text-sm text-text-muted hover:text-text-primary"
              >
                모두 지우기
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMenus.map((menu) => (
                <Link
                  key={menu.href}
                  href={menu.href}
                  onClick={() => addRecentMenu(menu.href, menu.title, menu.icon)}
                  className="group relative bg-gradient-to-br from-surface to-surface-hover rounded-lg border-2 border-border p-5 hover:shadow-lg hover:border-border-dark transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{menu.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-text-secondary transition-colors">
                          {menu.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 재분류된 메뉴 그룹 */}
        <div className="space-y-8 mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">메뉴 그룹</h2>
            <button
              onClick={resetGroupOrder}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="그룹 순서 초기화"
            >
              순서 초기화
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groupOrder}
              strategy={verticalListSortingStrategy}
            >
              {menuGroups.map((group) => {
                const groupIdMap: Record<string, string> = {
                  content: "content-group",
                  users: "users-group",
                  analytics: "analytics-group",
                  settings: "settings-group",
                };
                const groupId = groupIdMap[group.id] || `${group.id}-group`;

                return (
                  <SortableGroup
                    key={group.id}
                    id={group.id}
                    group={group}
                    groupId={groupId}
                    getColorClasses={getColorClasses}
                    getPriorityBadge={getPriorityBadge}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    addRecentMenu={addRecentMenu}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {/* 최근 활동 */}
        {dashboard &&
          dashboard.recentActivity &&
          dashboard.recentActivity.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
              <div className="space-y-2">
                {dashboard.recentActivity
                  .slice(0, 5)
                  .map((activity: { user?: { name: string }; exam?: { title: string }; timestamp: string }, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-border-light last:border-0"
                    >
                      <div>
                        <span className="font-medium">
                          {activity.user?.name || "Unknown"}
                        </span>
                        <span className="text-text-secondary ml-2">
                          - {activity.exam?.title || "Unknown"}
                        </span>
                      </div>
                      <div className="text-sm text-text-muted">
                        {isMounted ? new Date(activity.timestamp).toLocaleString("ko-KR") : activity.timestamp}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>
    </>
  );
}
