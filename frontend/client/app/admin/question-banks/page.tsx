"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { adminAPI, QuestionBank, Question } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";

export default function AdminQuestionBanksPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // 문제 은행 목록 가져오기
  const { data: banksResponse, isLoading } = useQuery({
    queryKey: ["admin-question-banks", search, categoryFilter],
    queryFn: async () => {
      const response = await adminAPI.getQuestionBanks({
        search: search || undefined,
        category: categoryFilter || undefined,
        includeQuestions: false,
      });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  // 카테고리 목록 가져오기
  const { data: categoriesResponse } = useQuery({
    queryKey: ["question-bank-categories"],
    queryFn: async () => {
      const response = await adminAPI.getQuestionBankCategories();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const banks = banksResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // 문제 은행 생성/수정 Mutation
  const bankMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category?: string;
    }) => {
      if (editingBank) {
        return await adminAPI.updateQuestionBank(editingBank.id, data);
      } else {
        return await adminAPI.createQuestionBank(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-question-banks"] });
      setShowModal(false);
      setEditingBank(null);
      toast.success(editingBank ? "문제 은행이 수정되었습니다." : "문제 은행이 생성되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 문제 은행 삭제 Mutation
  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminAPI.deleteQuestionBank(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-question-banks"] });
      toast.success("문제 은행이 삭제되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (typeof window !== 'undefined' && confirm(`"${name}" 문제 은행을 삭제하시겠습니까?`)) {
      deleteBankMutation.mutate(id);
    }
  };

  // 클라이언트에서만 리다이렉트 (SSR 방지)
  useEffect(() => {
    if (typeof window !== 'undefined' && (!user || user.role !== "admin")) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // SSR 중에는 로딩 표시
  if (typeof window === 'undefined' || !user || user.role !== "admin") {
    return null;
  }

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

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            문제 은행 관리
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
                setEditingBank(null);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + 새 문제 은행
            </button>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="문제 은행 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="flex-1 px-4 py-2 border rounded-md"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">전체 카테고리</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 문제 은행 목록 */}
        {banks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            문제 은행이 없습니다. 새 문제 은행을 생성해주세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {bank.name}
                    </h3>
                    {bank.category && (
                      <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mb-2">
                        {bank.category}
                      </span>
                    )}
                    {bank.description && (
                      <p className="text-sm text-gray-600 mt-2">{bank.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    문제: {bank._count?.questions || 0}개
                  </span>
                  {bank.createdAt && (
                    <span>
                      {new Date(bank.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedBank(bank);
                      setShowQuestionModal(true);
                    }}
                    className="flex-1 text-blue-600 hover:text-blue-700 px-3 py-2 text-sm border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    문제 관리
                  </button>
                  <button
                    onClick={() => {
                      setEditingBank(bank);
                      setShowModal(true);
                    }}
                    className="text-gray-600 hover:text-gray-700 px-3 py-2 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(bank.id, bank.name)}
                    className="text-red-600 hover:text-red-700 px-3 py-2 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 문제 은행 생성/수정 모달 */}
        {showModal && (
          <QuestionBankModal
            bank={editingBank}
            categories={categories}
            onClose={() => {
              setShowModal(false);
              setEditingBank(null);
            }}
            onSave={(data) => bankMutation.mutate(data)}
            isSaving={bankMutation.isPending}
          />
        )}

        {/* 문제 관리 모달 */}
        {showQuestionModal && selectedBank && (
          <QuestionManagementModal
            bank={selectedBank}
            onClose={() => {
              setShowQuestionModal(false);
              setSelectedBank(null);
            }}
          />
        )}
      </div>
    </>
  );
}

// 문제 은행 모달 컴포넌트
function QuestionBankModal({
  bank,
  categories,
  onClose,
  onSave,
  isSaving,
}: {
  bank: QuestionBank | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    category?: string;
  }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: bank?.name || "",
    description: bank?.description || "",
    category: bank?.category || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("문제 은행 이름을 입력해주세요.");
      return;
    }
    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {bank ? "문제 은행 수정" : "새 문제 은행 생성"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                카테고리
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="예: JFT-Basic, JLPT, 문법"
                list="categories"
              />
              {categories.length > 0 && (
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              )}
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

// 문제 관리 모달 컴포넌트
function QuestionManagementModal({
  bank,
  onClose,
}: {
  bank: QuestionBank;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // 문제 은행 상세 조회 (문제 포함)
  const { data: bankDetailResponse, isLoading } = useQuery({
    queryKey: ["admin-question-bank", bank.id],
    queryFn: async () => {
      const response = await adminAPI.getQuestionBank(bank.id, true);
      return response.data;
    },
  });

  // 전체 문제 목록 (문제 은행에 추가할 문제 검색용)
  const { data: allQuestionsResponse } = useQuery({
    queryKey: ["admin-questions", search],
    queryFn: async () => {
      const response = await adminAPI.getQuestions({
        search: search || undefined,
        limit: 50,
      });
      return response.data;
    },
    enabled: search.length > 0,
  });

  const bankDetail = bankDetailResponse?.data;
  const bankQuestions = bankDetail?.questions || [];
  const allQuestions = allQuestionsResponse?.data || [];

  // 문제 추가 Mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await adminAPI.addQuestionToBank(bank.id, questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-question-bank", bank.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-question-banks"] });
      toast.success("문제가 추가되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 문제 제거 Mutation
  const removeQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await adminAPI.removeQuestionFromBank(bank.id, questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-question-bank", bank.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-question-banks"] });
      toast.success("문제가 제거되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 모든 문제 제거 Mutation
  const removeAllMutation = useMutation({
    mutationFn: async () => {
      await adminAPI.removeAllQuestionsFromBank(bank.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-question-bank", bank.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-question-banks"] });
      toast.success("모든 문제가 제거되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  const handleRemoveAll = () => {
    if (typeof window !== 'undefined' && confirm("모든 문제를 제거하시겠습니까?")) {
      removeAllMutation.mutate();
    }
  };

  const bankQuestionIds = new Set(bankQuestions.map((q: any) => q.id));
  const availableQuestions = allQuestions.filter((q: any) => !bankQuestionIds.has(q.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {bank.name} - 문제 관리
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner message="로딩 중..." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 현재 문제 목록 */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">
                  현재 문제 ({bankQuestions.length}개)
                </h3>
                {bankQuestions.length > 0 && (
                  <button
                    onClick={handleRemoveAll}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    전체 제거
                  </button>
                )}
              </div>
              {bankQuestions.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">등록된 문제가 없습니다.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bankQuestions.map((question: any) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {question.content.substring(0, 100)}
                          {question.content.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {question.difficulty && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                              {question.difficulty}
                            </span>
                          )}
                          {question.tags && question.tags.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {question.tags.slice(0, 3).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeQuestionMutation.mutate(question.id)}
                        className="text-red-600 hover:text-red-700 text-sm px-3 py-1"
                      >
                        제거
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 문제 추가 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">문제 추가</h3>
              <input
                type="text"
                placeholder="문제 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-3"
              />
              {search && availableQuestions.length === 0 && (
                <p className="text-sm text-gray-500 py-4">검색 결과가 없습니다.</p>
              )}
              {search && availableQuestions.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableQuestions.map((question: any) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {question.content.substring(0, 100)}
                          {question.content.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {question.difficulty && (
                            <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded">
                              {question.difficulty}
                            </span>
                          )}
                          {question.section && (
                            <span className="text-xs text-gray-500">
                              {question.section.exam?.title || question.section.title}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addQuestionMutation.mutate(question.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm px-3 py-1"
                      >
                        추가
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

