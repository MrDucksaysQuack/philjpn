"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { adminAPI, Badge, BadgeStatistics, categoryAPI, Category } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { badgeRarityColors, chartColors } from "@/lib/chart-colors";

export default function AdminBadgesPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const BADGE_TYPES = useMemo(() => [
    { value: 'exam_completed', label: t("admin.badgeManagement.types.examCompleted") },
    { value: 'perfect_score', label: t("admin.badgeManagement.types.perfectScore") },
    { value: 'streak_days', label: t("admin.badgeManagement.types.streakDays") },
    { value: 'word_master', label: t("admin.badgeManagement.types.wordMaster") },
    { value: 'improvement', label: t("admin.badgeManagement.types.improvement") },
    { value: 'category_master', label: t("admin.badgeManagement.types.categoryMaster") },
    { value: 'speed_demon', label: t("admin.badgeManagement.types.speedDemon") },
    { value: 'consistency', label: t("admin.badgeManagement.types.consistency") },
  ], [t]);

  const RARITY_OPTIONS = useMemo(() => [
    { value: 'common', label: t("admin.badgeManagement.rarity.common"), color: 'bg-gray-200 text-gray-800' },
    { value: 'rare', label: t("admin.badgeManagement.rarity.rare"), color: 'bg-blue-200 text-blue-800' },
    { value: 'epic', label: t("admin.badgeManagement.rarity.epic"), color: 'bg-purple-200 text-purple-800' },
    { value: 'legendary', label: t("admin.badgeManagement.rarity.legendary"), color: 'bg-yellow-200 text-yellow-800' },
  ], [t]);

  // 배지 목록 가져오기
  const { data: badgesResponse, isLoading } = useQuery({
    queryKey: ["admin-badges", includeInactive],
    queryFn: async () => {
      const response = await adminAPI.getBadges(includeInactive);
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  // 배지 통계 가져오기
  const { data: statisticsResponse, isLoading: statisticsLoading } = useQuery({
    queryKey: ["badge-statistics"],
    queryFn: async () => {
      const response = await adminAPI.getBadgeStatistics();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const badges = badgesResponse?.data || [];
  const statistics = statisticsResponse?.data;

  // 배지 생성/수정 Mutation
  const badgeMutation = useMutation({
    mutationFn: async (data: {
      badgeType: string;
      name: string;
      description?: string;
      icon?: string;
      rarity?: string;
      condition?: any;
      isActive?: boolean;
    }) => {
      if (editingBadge) {
        return await adminAPI.updateBadge(editingBadge.id, data);
      } else {
        return await adminAPI.createBadge(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
      setShowModal(false);
      setEditingBadge(null);
      toast.success(editingBadge ? t("admin.badgeManagement.badgeUpdated") : t("admin.badgeManagement.badgeCreated"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 배지 삭제 Mutation
  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminAPI.deleteBadge(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
      toast.success(t("admin.badgeManagement.badgeDeleted"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (typeof window !== 'undefined' && confirm(`"${name}" ${t("admin.badgeManagement.confirmDelete")}`)) {
      deleteBadgeMutation.mutate(id);
    }
  };

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("admin.badgeManagement.loading")} />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  // 배지 타입별 그룹화
  const badgesByType = badges.reduce((acc, badge) => {
    if (!acc[badge.badgeType]) {
      acc[badge.badgeType] = [];
    }
    acc[badge.badgeType].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  // 차트 데이터 준비 - 테마 색상 사용
  const rarityColors = {
    common: badgeRarityColors.common(),
    rare: badgeRarityColors.rare(),
    epic: badgeRarityColors.epic(),
    legendary: badgeRarityColors.legendary(),
  };

  const rarityLabels = useMemo(() => ({
    common: t("admin.badgeManagement.rarity.common"),
    rare: t("admin.badgeManagement.rarity.rare"),
    epic: t("admin.badgeManagement.rarity.epic"),
    legendary: t("admin.badgeManagement.rarity.legendary"),
  }), [t]);

  const typeLabels: Record<string, string> = useMemo(() => ({
    exam_completed: t("admin.badgeManagement.types.examCompleted"),
    perfect_score: t("admin.badgeManagement.types.perfectScore"),
    streak_days: t("admin.badgeManagement.types.streakDays"),
    word_master: t("admin.badgeManagement.types.wordMaster"),
    improvement: t("admin.badgeManagement.types.improvement"),
    category_master: t("admin.badgeManagement.types.categoryMaster"),
    speed_demon: t("admin.badgeManagement.types.speedDemon"),
    consistency: t("admin.badgeManagement.types.consistency"),
  }), [t]);

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {t("admin.badgeManagement.title")}
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
            >
              ← 대시보드
            </Link>
            <button
              onClick={() => {
                setEditingBadge(null);
                setShowModal(true);
              }}
              className="bg-button-primary text-button-text px-4 py-2 rounded-md hover:bg-button-primary"
            >
              + {t("admin.badgeManagement.createNew")}
            </button>
          </div>
        </div>

        {/* 배지 통계 섹션 */}
        {statistics && !statisticsLoading && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 전체 통계 카드 */}
            <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
              <h2 className="text-xl font-bold text-text-primary mb-4">{t("admin.badgeManagement.statistics.overall")}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">{t("admin.badgeManagement.statistics.totalBadges")}</p>
                  <p className="text-2xl font-bold text-text-primary">{statistics.totalBadges}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{t("admin.badgeManagement.statistics.totalUsers")}</p>
                  <p className="text-2xl font-bold text-text-primary">{statistics.totalUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{t("admin.badgeManagement.statistics.totalEarned")}</p>
                  <p className="text-2xl font-bold text-info">{statistics.totalEarned}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{t("admin.badgeManagement.statistics.overallEarnedRate")}</p>
                  <p className="text-2xl font-bold text-success">{statistics.overallEarnedRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* 희귀도별 분포 파이 차트 */}
            <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
              <h2 className="text-xl font-bold text-text-primary mb-4">{t("admin.badgeManagement.statistics.rarityDistribution")}</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statistics.rarityDistribution}
                    dataKey="count"
                    nameKey="rarity"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ rarity, count }) => `${rarityLabels[rarity as keyof typeof rarityLabels] || rarity}: ${count}`}
                  >
                    {statistics.rarityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={rarityColors[entry.rarity as keyof typeof rarityColors] || '#9CA3AF'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 희귀도별 획득률 바 차트 */}
            <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
              <h2 className="text-xl font-bold text-text-primary mb-4">{t("admin.badgeManagement.statistics.rarityEarnedRate")}</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statistics.rarityDistribution.map(r => ({
                  ...r,
                  rarity: rarityLabels[r.rarity as keyof typeof rarityLabels] || r.rarity,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rarity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="earnedRate" fill={chartColors.info()} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 타입별 분포 바 차트 */}
            <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
              <h2 className="text-xl font-bold text-text-primary mb-4">{t("admin.badgeManagement.statistics.typeDistribution")}</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statistics.typeDistribution.map(t => ({
                  ...t,
                  type: typeLabels[t.type] || t.type,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={chartColors.secondary()} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 최근 획득 추이 라인 차트 */}
            {statistics.dailyEarned.length > 0 && (
              <div className="bg-surface rounded-lg shadow-md p-6 border border-border lg:col-span-2">
                <h2 className="text-xl font-bold text-text-primary mb-4">{t("admin.badgeManagement.statistics.dailyTrend")}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={statistics.dailyEarned}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('ko-KR');
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke={chartColors.success()} strokeWidth={2} name={t("admin.badgeManagement.statistics.totalEarned")} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* 필터 */}
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-text-primary">{t("admin.badgeManagement.includeInactive")}</span>
          </label>
        </div>

        {/* 배지 목록 */}
        {badges.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {t("admin.badgeManagement.noBadges")}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(badgesByType).map(([badgeType, typeBadges]) => {
              const typeLabel = BADGE_TYPES.find(t => t.value === badgeType)?.label || badgeType;
              return (
                <div key={badgeType} className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">{typeLabel}</h2>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeBadges.map((badge) => {
                      const rarityOption = RARITY_OPTIONS.find(r => r.value === badge.rarity);
                      return (
                        <div
                          key={badge.id}
                          className={`border rounded-lg p-4 ${!badge.isActive ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {badge.icon && <span className="text-2xl">{badge.icon}</span>}
                              <div>
                                <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${rarityOption?.color || ''}`}>
                                  {rarityOption?.label || badge.rarity}
                                </span>
                              </div>
                            </div>
                            {!badge.isActive && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                {t("admin.badgeManagement.inactive")}
                              </span>
                            )}
                          </div>
                          {badge.description && (
                            <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                          )}
                          {badge.condition && (
                            <div className="text-xs text-gray-500 mb-2">
                              조건: {JSON.stringify(badge.condition)}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                setEditingBadge(badge);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1"
                            >
                              {t("admin.badgeManagement.edit")}
                            </button>
                            <button
                              onClick={() => handleDelete(badge.id, badge.name)}
                              className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                            >
                              {t("admin.badgeManagement.delete")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 배지 생성/수정 모달 */}
        {showModal && (
          <BadgeModal
            badge={editingBadge}
            onClose={() => {
              setShowModal(false);
              setEditingBadge(null);
            }}
            onSave={(data) => badgeMutation.mutate(data)}
            isSaving={badgeMutation.isPending}
          />
        )}
      </div>
    </>
  );
}

// 배지 모달 컴포넌트
function BadgeModal({
  badge,
  onClose,
  onSave,
  isSaving,
}: {
  badge: Badge | null;
  onClose: () => void;
  onSave: (data: {
    badgeType: string;
    name: string;
    description?: string;
    icon?: string;
    rarity?: string;
    condition?: any;
    isActive?: boolean;
  }) => void;
  isSaving: boolean;
}) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  
  const BADGE_TYPES = useMemo(() => [
    { value: 'exam_completed', label: t("admin.badgeManagement.types.examCompleted") },
    { value: 'perfect_score', label: t("admin.badgeManagement.types.perfectScore") },
    { value: 'streak_days', label: t("admin.badgeManagement.types.streakDays") },
    { value: 'word_master', label: t("admin.badgeManagement.types.wordMaster") },
    { value: 'improvement', label: t("admin.badgeManagement.types.improvement") },
    { value: 'category_master', label: t("admin.badgeManagement.types.categoryMaster") },
    { value: 'speed_demon', label: t("admin.badgeManagement.types.speedDemon") },
    { value: 'consistency', label: t("admin.badgeManagement.types.consistency") },
  ], [t]);

  const RARITY_OPTIONS = useMemo(() => [
    { value: 'common', label: t("admin.badgeManagement.rarity.common"), color: 'bg-gray-200 text-gray-800' },
    { value: 'rare', label: t("admin.badgeManagement.rarity.rare"), color: 'bg-blue-200 text-blue-800' },
    { value: 'epic', label: t("admin.badgeManagement.rarity.epic"), color: 'bg-purple-200 text-purple-800' },
    { value: 'legendary', label: t("admin.badgeManagement.rarity.legendary"), color: 'bg-yellow-200 text-yellow-800' },
  ], [t]);

  const [formData, setFormData] = useState({
    badgeType: badge?.badgeType || 'exam_completed',
    name: badge?.name || "",
    description: badge?.description || "",
    icon: badge?.icon || "",
    rarity: badge?.rarity || 'common',
    isActive: badge?.isActive ?? true,
  });

  // 조건 필드 (타입별로 다름)
  const [conditionData, setConditionData] = useState<{
    examCount?: number;
    streakDays?: number;
    wordCount?: number;
    improvementRate?: number;
    categoryId?: string;
    timeLimit?: number;
  }>(() => {
    if (badge?.condition) {
      const cond = typeof badge.condition === 'string' 
        ? JSON.parse(badge.condition) 
        : badge.condition;
      return {
        examCount: cond.examCount,
        streakDays: cond.streakDays,
        wordCount: cond.wordCount,
        improvementRate: cond.improvementRate,
        categoryId: cond.categoryId,
        timeLimit: cond.timeLimit,
      };
    }
    return {};
  });

  // 카테고리 목록 가져오기 (category_master용)
  const { data: categoriesResponse } = useQuery({
    queryKey: ["categories-for-badge"],
    queryFn: async () => {
      const response = await categoryAPI.getCategories(true);
      return response.data;
    },
  });

  const categories = categoriesResponse?.data || [];

  // 배지 타입 변경 시 조건 초기화
  useEffect(() => {
    if (!badge) {
      setConditionData({});
    }
  }, [formData.badgeType, badge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("admin.badgeManagement.form.nameRequired"));
      return;
    }
    
    // 배지 타입별 조건 구성
    let condition: any = undefined;

    switch (formData.badgeType) {
      case 'exam_completed':
        if (conditionData.examCount) {
          condition = { examCount: conditionData.examCount };
        }
        break;
      case 'perfect_score':
        // 자동 (만점 달성) - 조건 없음
        condition = {};
        break;
      case 'streak_days':
      case 'consistency':
        if (conditionData.streakDays) {
          condition = { streakDays: conditionData.streakDays };
        }
        break;
      case 'word_master':
        if (conditionData.wordCount) {
          condition = { wordCount: conditionData.wordCount };
        }
        break;
      case 'improvement':
        if (conditionData.improvementRate) {
          condition = { improvementRate: conditionData.improvementRate };
        }
        break;
      case 'category_master':
        if (conditionData.categoryId && conditionData.examCount) {
          condition = {
            categoryId: conditionData.categoryId,
            examCount: conditionData.examCount,
          };
        }
        break;
      case 'speed_demon':
        if (conditionData.timeLimit) {
          condition = { timeLimit: conditionData.timeLimit };
      }
        break;
    }

    onSave({
      badgeType: formData.badgeType,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      icon: formData.icon.trim() || undefined,
      rarity: formData.rarity,
      condition,
      isActive: formData.isActive,
    });
  };

  // 조건 입력 폼 렌더링
  const renderConditionForm = () => {
    switch (formData.badgeType) {
      case 'exam_completed':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시험 완료 횟수 *
            </label>
            <input
              type="number"
              min="1"
              value={conditionData.examCount || ""}
              onChange={(e) => setConditionData({ ...conditionData, examCount: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="예: 10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">이 횟수만큼 시험을 완료하면 배지를 획득합니다.</p>
          </div>
        );

      case 'perfect_score':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              💡 이 배지는 만점을 달성하면 자동으로 획득됩니다. 별도의 조건 설정이 필요하지 않습니다.
            </p>
          </div>
        );

      case 'streak_days':
      case 'consistency':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연속 학습 일수 *
            </label>
            <input
              type="number"
              min="1"
              value={conditionData.streakDays || ""}
              onChange={(e) => setConditionData({ ...conditionData, streakDays: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="예: 7"
              required
            />
            <p className="text-xs text-gray-500 mt-1">이 일수만큼 연속으로 학습하면 배지를 획득합니다.</p>
          </div>
        );

      case 'word_master':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              단어장 단어 수 *
            </label>
            <input
              type="number"
              min="1"
              value={conditionData.wordCount || ""}
              onChange={(e) => setConditionData({ ...conditionData, wordCount: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="예: 100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">단어장에 이 개수만큼 단어를 추가하면 배지를 획득합니다.</p>
          </div>
        );

      case 'improvement':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              성적 향상률 (%) *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={conditionData.improvementRate || ""}
              onChange={(e) => setConditionData({ ...conditionData, improvementRate: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="예: 20"
              required
            />
            <p className="text-xs text-gray-500 mt-1">이 비율만큼 성적이 향상되면 배지를 획득합니다.</p>
          </div>
        );

      case 'category_master':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 *
              </label>
              <select
                value={conditionData.categoryId || ""}
                onChange={(e) => setConditionData({ ...conditionData, categoryId: e.target.value || undefined })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">선택하세요</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시험 완료 횟수 *
              </label>
              <input
                type="number"
                min="1"
                value={conditionData.examCount || ""}
                onChange={(e) => setConditionData({ ...conditionData, examCount: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="예: 5"
                required
              />
              <p className="text-xs text-gray-500 mt-1">선택한 카테고리에서 이 횟수만큼 시험을 완료하면 배지를 획득합니다.</p>
            </div>
          </div>
        );

      case 'speed_demon':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시간 제한 (초) *
            </label>
            <input
              type="number"
              min="1"
              value={conditionData.timeLimit || ""}
              onChange={(e) => setConditionData({ ...conditionData, timeLimit: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="예: 300"
              required
            />
            <p className="text-xs text-gray-500 mt-1">이 시간(초) 이내에 시험을 완료하면 배지를 획득합니다.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {badge ? t("admin.badgeManagement.editBadge") : t("admin.badgeManagement.createBadge")}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.badgeManagement.form.badgeType")} *
              </label>
              <select
                value={formData.badgeType}
                onChange={(e) => setFormData({ ...formData, badgeType: e.target.value as typeof formData.badgeType })}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={!!badge}
              >
                {BADGE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.badgeManagement.form.name")} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.badgeManagement.form.description")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.badgeManagement.form.icon")}
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="예: 🎯, 🏆, 💯"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.badgeManagement.form.rarity")} *
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value as typeof formData.rarity })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {RARITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 배지 미리보기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.badgeManagement.form.preview")}
              </label>
              <BadgePreview
                name={formData.name || t("admin.badgeManagement.form.name")}
                icon={formData.icon || "🏆"}
                rarity={formData.rarity}
                description={formData.description}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.badgeManagement.form.condition")} *
              </label>
              <div className="border rounded-md p-4 bg-gray-50">
                {renderConditionForm()}
              </div>
              {/* 조건 미리보기 (JSON) */}
              {(() => {
                let preview: any = {};
                switch (formData.badgeType) {
                  case 'exam_completed':
                    if (conditionData.examCount) preview = { examCount: conditionData.examCount };
                    break;
                  case 'perfect_score':
                    preview = {};
                    break;
                  case 'streak_days':
                  case 'consistency':
                    if (conditionData.streakDays) preview = { streakDays: conditionData.streakDays };
                    break;
                  case 'word_master':
                    if (conditionData.wordCount) preview = { wordCount: conditionData.wordCount };
                    break;
                  case 'improvement':
                    if (conditionData.improvementRate) preview = { improvementRate: conditionData.improvementRate };
                    break;
                  case 'category_master':
                    if (conditionData.categoryId && conditionData.examCount) {
                      preview = {
                        categoryId: conditionData.categoryId,
                        examCount: conditionData.examCount,
                      };
                    }
                    break;
                  case 'speed_demon':
                    if (conditionData.timeLimit) preview = { timeLimit: conditionData.timeLimit };
                    break;
                }
                return Object.keys(preview).length > 0 || formData.badgeType === 'perfect_score' ? (
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono">
                    <p className="text-gray-600 mb-1">{t("admin.badgeManagement.form.conditionPreview")}:</p>
                    <pre className="text-gray-800">{JSON.stringify(preview, null, 2)}</pre>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                {t("admin.badgeManagement.form.isActive")}
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              {t("common.cancel")}
            </button>
            <Button
              type="submit"
              disabled={isSaving}
              isLoading={isSaving}
              className="flex-1"
            >
              {t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 배지 미리보기 컴포넌트
function BadgePreview({
  name,
  icon,
  rarity,
  description,
}: {
  name: string;
  icon?: string;
  rarity: string;
  description?: string;
}) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  
  const RARITY_OPTIONS = useMemo(() => [
    { value: 'common', label: t("admin.badgeManagement.rarity.common"), color: 'bg-gray-200 text-gray-800' },
    { value: 'rare', label: t("admin.badgeManagement.rarity.rare"), color: 'bg-blue-200 text-blue-800' },
    { value: 'epic', label: t("admin.badgeManagement.rarity.epic"), color: 'bg-purple-200 text-purple-800' },
    { value: 'legendary', label: t("admin.badgeManagement.rarity.legendary"), color: 'bg-yellow-200 text-yellow-800' },
  ], [t]);
  
  const rarityOption = RARITY_OPTIONS.find(r => r.value === rarity);
  
  // 희귀도별 배경 그라데이션
  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gradient-to-br from-text-muted/20 to-text-muted/30 border-text-muted/30';
      case 'rare':
        return 'bg-gradient-to-br from-info/20 to-info/30 border-info/30';
      case 'epic':
        return 'bg-gradient-to-br from-theme-secondary/20 to-theme-secondary/30 border-theme-secondary/30';
      case 'legendary':
        return 'bg-gradient-to-br from-warning/20 via-warning/30 to-warning/40 border-warning/40';
      default:
        return 'bg-gradient-to-br from-text-muted/20 to-text-muted/30 border-text-muted/30';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getRarityGradient(rarity)}`}>
      <div className="flex items-start gap-4">
        {/* 아이콘 */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center text-3xl shadow-md">
            {icon || "🏆"}
          </div>
        </div>
        
        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
            {rarityOption && (
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${rarityOption.color}`}>
                {rarityOption.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-700 mt-1">{description}</p>
          )}
          {!description && (
            <p className="text-xs text-gray-500 italic mt-1">설명을 입력하세요</p>
          )}
        </div>
      </div>
      
      {/* 희귀도별 장식 효과 */}
      {rarity === 'legendary' && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-yellow-600 text-xs">✨ 전설 등급 배지</span>
        </div>
      )}
      {rarity === 'epic' && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-purple-600 text-xs">💜 영웅 등급 배지</span>
        </div>
      )}
    </div>
  );
}

