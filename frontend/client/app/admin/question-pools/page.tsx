"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { adminAPI, QuestionPool } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { emotionalToast } from "@/components/common/Toast";
import TagInput from "@/components/admin/TagInput";
import QuestionSelector from "@/components/admin/QuestionSelector";

export default function QuestionPoolsPage() {
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPool, setEditingPool] = useState<QuestionPool | null>(null);

  const { data: poolsResponse, isLoading } = useQuery({
    queryKey: ["admin-question-pools"],
    queryFn: async () => {
      const response = await adminAPI.getQuestionPools();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const pools = poolsResponse?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminAPI.deleteQuestionPool(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-question-pools"] });
      emotionalToast.success.saved();
    },
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                문제 풀 관리
              </h1>
              <p className="text-gray-600">
                태그, 난이도별로 문제를 그룹화하여 관리합니다
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-theme-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 문제 풀 생성
            </button>
          </div>

          {/* 문제 풀 목록 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {isLoading ? (
              <LoadingSpinner message="문제 풀 목록을 불러오는 중..." />
            ) : pools && pools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="bg-theme-primary-light rounded-xl p-6 border border-theme-primary hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {pool.name}
                        </h3>
                        {pool.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {pool.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingPool(pool)}
                          className="p-2 text-theme-primary hover:bg-theme-primary-light rounded-lg transition-colors"
                          aria-label="수정"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("정말 삭제하시겠습니까?")) {
                              deleteMutation.mutate(pool.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* 태그 */}
                      {pool.tags && pool.tags.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">
                            태그
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {pool.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-theme-primary-light text-theme-primary text-xs rounded-lg"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 난이도 */}
                      {pool.difficulty && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">
                            난이도
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                              pool.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : pool.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {pool.difficulty === "easy"
                              ? "쉬움"
                              : pool.difficulty === "medium"
                              ? "중급"
                              : "어려움"}
                          </span>
                        </div>
                      )}

                      {/* 문제 수 */}
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          포함된 문제 수
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {pool.questionIds?.length || 0}개
                        </div>
                      </div>

                      {/* 생성 정보 */}
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        생성일: {new Date(pool.createdAt).toLocaleDateString("ko-KR")}
                        {pool.creator && (
                          <div className="mt-1">생성자: {pool.creator.name}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">문제 풀이 없습니다.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold"
                >
                  첫 문제 풀 생성하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 생성/수정 모달 */}
        {(showCreateModal || editingPool) && (
          <QuestionPoolModal
            pool={editingPool}
            onClose={() => {
              setShowCreateModal(false);
              setEditingPool(null);
            }}
            onSuccess={() => {
              setShowCreateModal(false);
              setEditingPool(null);
              queryClient.invalidateQueries({ queryKey: ["admin-question-pools"] });
            }}
          />
        )}
      </div>
    </>
  );
}

// 문제 풀 생성/수정 모달
function QuestionPoolModal({
  pool,
  onClose,
  onSuccess,
}: {
  pool?: QuestionPool | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [isAutoSelect, setIsAutoSelect] = useState(pool?.isAutoSelect || false);
  const [autoSelectRules, setAutoSelectRules] = useState(
    pool?.autoSelectRules || {
      minDifficulty: undefined,
      maxDifficulty: undefined,
      tags: [],
      excludeTags: [],
      maxCount: 30,
      minCount: 0,
      questionBankId: undefined,
    }
  );
  const [preCheckResult, setPreCheckResult] = useState<{
    availableCount: number;
    requiredCount: number;
    isValid: boolean;
    message: string;
  } | null>(null);
  const [isPreChecking, setIsPreChecking] = useState(false);

  const [formData, setFormData] = useState({
    name: pool?.name || "",
    description: pool?.description || "",
    tags: pool?.tags || [],
    difficulty: pool?.difficulty || "",
    questionIds: pool?.questionIds || [],
  });

  const preCheckMutation = useMutation({
    mutationFn: async (rules: typeof autoSelectRules) => {
      const response = await adminAPI.preCheckPoolRules(rules);
      return response.data;
    },
    onSuccess: (data) => {
      setPreCheckResult(data.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = {
        name: data.name,
        description: data.description || undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        difficulty: data.difficulty || undefined,
        questionIds: Array.isArray(data.questionIds) ? data.questionIds : [],
        isAutoSelect,
        autoSelectRules: isAutoSelect ? autoSelectRules : undefined,
      };
      if (pool) {
        await adminAPI.updateQuestionPool(pool.id, payload);
      } else {
        await adminAPI.createQuestionPool(payload);
      }
    },
    onSuccess: () => {
      emotionalToast.success.saved();
      onSuccess();
    },
  });

  const handlePreCheck = () => {
    setIsPreChecking(true);
    preCheckMutation.mutate(autoSelectRules, {
      onSettled: () => setIsPreChecking(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">
            {pool ? "문제 풀 수정" : "새 문제 풀 생성"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
              placeholder="예: 문법 기초 문제 풀"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
              placeholder="문제 풀에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              태그
            </label>
            <TagInput
              tags={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
              suggestions={["문법", "어휘", "독해", "작문", "청해", "문법기초", "문법고급", "어휘기초", "어휘고급", "기초", "중급", "고급", "시제", "수동태", "가정법"]}
              placeholder="태그를 입력하고 Enter를 누르세요"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              난이도
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">선택 안함</option>
              <option value="easy">쉬움</option>
              <option value="medium">중급</option>
              <option value="hard">어려움</option>
            </select>
          </div>

          {/* 자동 선택 옵션 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="isAutoSelect"
                checked={isAutoSelect}
                onChange={(e) => {
                  setIsAutoSelect(e.target.checked);
                  if (!e.target.checked) {
                    setPreCheckResult(null);
                  }
                }}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isAutoSelect" className="text-sm font-semibold text-gray-700">
                규칙 기반 자동 문제 선택
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              활성화하면 규칙에 따라 자동으로 문제가 선택됩니다.
            </p>

            {isAutoSelect && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      최소 난이도
                    </label>
                    <select
                      value={autoSelectRules.minDifficulty || ""}
                      onChange={(e) =>
                        setAutoSelectRules({
                          ...autoSelectRules,
                          minDifficulty: (e.target.value || undefined) as "easy" | "medium" | "hard" | undefined,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">선택 안함</option>
                      <option value="easy">쉬움</option>
                      <option value="medium">중급</option>
                      <option value="hard">어려움</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      최대 난이도
                    </label>
                    <select
                      value={autoSelectRules.maxDifficulty || ""}
                      onChange={(e) =>
                        setAutoSelectRules({
                          ...autoSelectRules,
                          maxDifficulty: (e.target.value || undefined) as "easy" | "medium" | "hard" | undefined,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">선택 안함</option>
                      <option value="easy">쉬움</option>
                      <option value="medium">중급</option>
                      <option value="hard">어려움</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    포함 태그
                  </label>
                  <TagInput
                    tags={autoSelectRules.tags || []}
                    onChange={(tags) =>
                      setAutoSelectRules({ ...autoSelectRules, tags })
                    }
                    suggestions={["문법", "어휘", "독해", "작문", "청해"]}
                    placeholder="태그를 입력하고 Enter를 누르세요"
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      최대 문제 수
                    </label>
                    <input
                      type="number"
                      value={autoSelectRules.maxCount || ""}
                      onChange={(e) =>
                        setAutoSelectRules({
                          ...autoSelectRules,
                          maxCount: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="예: 30"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      최소 문제 수
                    </label>
                    <input
                      type="number"
                      value={autoSelectRules.minCount || ""}
                      onChange={(e) =>
                        setAutoSelectRules({
                          ...autoSelectRules,
                          minCount: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="예: 10"
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handlePreCheck}
                    disabled={isPreChecking}
                    isLoading={isPreChecking}
                    size="sm"
                  >
                    규칙 검증
                  </Button>
                  {preCheckResult && (
                    <div
                      className={`flex-1 px-4 py-2 rounded-md text-sm ${
                        preCheckResult.isValid
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {preCheckResult.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isAutoSelect && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  문제 선택
                </label>
                <QuestionSelector
                  selectedIds={formData.questionIds}
                  onChange={(ids) => setFormData({ ...formData, questionIds: ids })}
                  filters={{
                    tags: formData.tags.length > 0 ? formData.tags : undefined,
                    difficulty: (formData.difficulty === "easy" || formData.difficulty === "medium" || formData.difficulty === "hard") ? formData.difficulty : undefined,
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 태그와 난이도 필터를 설정하면 문제 선택 시 자동으로 필터링됩니다.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-theme-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending
                ? "저장 중..."
                : pool
                ? "수정하기"
                : "생성하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

