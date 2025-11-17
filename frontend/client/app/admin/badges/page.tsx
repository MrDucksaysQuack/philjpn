"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { adminAPI, Badge } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";

const BADGE_TYPES = [
  { value: 'exam_completed', label: '시험 완료' },
  { value: 'perfect_score', label: '만점 달성' },
  { value: 'streak_days', label: '연속 학습' },
  { value: 'word_master', label: '단어장 마스터' },
  { value: 'improvement', label: '성적 향상' },
  { value: 'category_master', label: '카테고리 마스터' },
  { value: 'speed_demon', label: '빠른 완료' },
  { value: 'consistency', label: '꾸준함' },
] as const;

const RARITY_OPTIONS = [
  { value: 'common', label: '일반', color: 'bg-gray-200 text-gray-800' },
  { value: 'rare', label: '희귀', color: 'bg-blue-200 text-blue-800' },
  { value: 'epic', label: '영웅', color: 'bg-purple-200 text-purple-800' },
  { value: 'legendary', label: '전설', color: 'bg-yellow-200 text-yellow-800' },
] as const;

export default function AdminBadgesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  // 배지 목록 가져오기
  const { data: badgesResponse, isLoading } = useQuery({
    queryKey: ["admin-badges", includeInactive],
    queryFn: async () => {
      const response = await adminAPI.getBadges(includeInactive);
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const badges = badgesResponse?.data || [];

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
      toast.success(editingBadge ? "배지가 수정되었습니다." : "배지가 생성되었습니다.");
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
      toast.success("배지가 삭제되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (typeof window !== 'undefined' && confirm(`"${name}" 배지를 삭제하시겠습니까?`)) {
      deleteBadgeMutation.mutate(id);
    }
  };

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="로딩 중..." />
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

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            배지 관리
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + 새 배지
            </button>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">비활성 배지 포함</span>
          </label>
        </div>

        {/* 배지 목록 */}
        {badges.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            배지가 없습니다. 새 배지를 생성해주세요.
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
                                비활성
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
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(badge.id, badge.name)}
                              className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                            >
                              삭제
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
  const [formData, setFormData] = useState({
    badgeType: badge?.badgeType || 'exam_completed',
    name: badge?.name || "",
    description: badge?.description || "",
    icon: badge?.icon || "",
    rarity: badge?.rarity || 'common',
    condition: badge?.condition ? JSON.stringify(badge.condition, null, 2) : "",
    isActive: badge?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("배지 이름을 입력해주세요.");
      return;
    }
    
    let condition = undefined;
    if (formData.condition.trim()) {
      try {
        condition = JSON.parse(formData.condition);
      } catch {
        toast.error("조건 JSON 형식이 올바르지 않습니다.");
        return;
      }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {badge ? "배지 수정" : "새 배지 생성"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                배지 유형 *
              </label>
              <select
                value={formData.badgeType}
                onChange={(e) => setFormData({ ...formData, badgeType: e.target.value })}
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
                이름 *
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
                설명
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
                아이콘 (이모지)
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
                희귀도 *
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                조건 (JSON)
              </label>
              <textarea
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                rows={6}
                placeholder='예: {"examCount": 10, "streakDays": 7}'
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON 형식으로 입력하세요. 예: {"examCount": 10}, {"streakDays": 7}, {"wordCount": 100}
              </p>
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
                활성화
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

