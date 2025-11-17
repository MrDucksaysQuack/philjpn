"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { categoryAPI, Category, Subcategory } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 카테고리 목록 가져오기 (비활성 포함)
  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await categoryAPI.getCategories(true);
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const categories = categoriesResponse?.data || [];

  // 서브카테고리 목록 가져오기
  const { data: subcategoriesResponse } = useQuery({
    queryKey: ["admin-subcategories"],
    queryFn: async () => {
      const response = await categoryAPI.getSubcategories();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const allSubcategories = subcategoriesResponse?.data || [];

  // 카테고리별 서브카테고리 그룹화
  const subcategoriesByCategory = allSubcategories.reduce((acc, sub) => {
    if (!acc[sub.categoryId]) {
      acc[sub.categoryId] = [];
    }
    acc[sub.categoryId].push(sub);
    return acc;
  }, {} as Record<string, Subcategory[]>);

  // 카테고리 생성/수정 Mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      icon?: string;
      order?: number;
      isActive?: boolean;
    }) => {
      if (editingCategory) {
        return await categoryAPI.updateCategory(editingCategory.id, data);
      } else {
        return await categoryAPI.createCategory(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-public"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowCategoryModal(false);
      setEditingCategory(null);
      toast.success(editingCategory ? "카테고리가 수정되었습니다." : "카테고리가 생성되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 서브카테고리 생성/수정 Mutation
  const subcategoryMutation = useMutation({
    mutationFn: async (data: {
      categoryId: string;
      name: string;
      description?: string;
      icon?: string;
      order?: number;
      isActive?: boolean;
    }) => {
      if (editingSubcategory) {
        return await categoryAPI.updateSubcategory(editingSubcategory.id, data);
      } else {
        return await categoryAPI.createSubcategory(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      setShowSubcategoryModal(false);
      setEditingSubcategory(null);
      setSelectedCategoryId(null);
      toast.success(editingSubcategory ? "서브카테고리가 수정되었습니다." : "서브카테고리가 생성되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 카테고리 삭제 Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await categoryAPI.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-public"] });
      toast.success("카테고리가 삭제되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 서브카테고리 삭제 Mutation
  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await categoryAPI.deleteSubcategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("서브카테고리가 삭제되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  const handleDeleteCategory = (id: string, name: string) => {
    if (typeof window !== 'undefined' && confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleDeleteSubcategory = (id: string, name: string) => {
    if (typeof window !== 'undefined' && confirm(`"${name}" 서브카테고리를 삭제하시겠습니까?`)) {
      deleteSubcategoryMutation.mutate(id);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            카테고리 관리
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
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + 새 카테고리
            </button>
          </div>
        </div>

        {/* 카테고리 목록 */}
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              카테고리가 없습니다. 새 카테고리를 생성해주세요.
            </div>
          ) : (
            categories
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((category) => {
                const subcategories = subcategoriesByCategory[category.id] || [];
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div
                    key={category.id}
                    className={`bg-white rounded-lg shadow ${!category.isActive ? 'opacity-60' : ''}`}
                  >
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        {category.icon && <span className="text-2xl">{category.icon}</span>}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                            {!category.isActive && (
                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                비활성
                              </span>
                            )}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-gray-500">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setShowCategoryModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setEditingSubcategory(null);
                            setShowSubcategoryModal(true);
                          }}
                          className="text-green-600 hover:text-green-700 px-3 py-1 text-sm"
                        >
                          + 서브카테고리
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="text-red-600 hover:text-red-700 px-3 py-1 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 서브카테고리 목록 */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-50">
                        {subcategories.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            서브카테고리가 없습니다.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {subcategories
                              .sort((a, b) => (a.order || 0) - (b.order || 0))
                              .map((subcategory) => (
                                <div
                                  key={subcategory.id}
                                  className="bg-white rounded p-3 flex items-center justify-between border"
                                >
                                  <div className="flex items-center gap-2">
                                    {subcategory.icon && <span>{subcategory.icon}</span>}
                                    <span className="font-medium">{subcategory.name}</span>
                                    {!subcategory.isActive && (
                                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                        비활성
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingSubcategory(subcategory);
                                        setSelectedCategoryId(subcategory.categoryId);
                                        setShowSubcategoryModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 text-sm"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* 카테고리 생성/수정 모달 */}
        {showCategoryModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            onSave={(data) => categoryMutation.mutate(data)}
            isSaving={categoryMutation.isPending}
          />
        )}

        {/* 서브카테고리 생성/수정 모달 */}
        {showSubcategoryModal && (
          <SubcategoryModal
            subcategory={editingSubcategory}
            categoryId={selectedCategoryId || editingSubcategory?.categoryId || ''}
            categories={categories}
            onClose={() => {
              setShowSubcategoryModal(false);
              setEditingSubcategory(null);
              setSelectedCategoryId(null);
            }}
            onSave={(data) => subcategoryMutation.mutate(data)}
            isSaving={subcategoryMutation.isPending}
          />
        )}
      </div>
    </>
  );
}

// 카테고리 모달 컴포넌트
function CategoryModal({
  category,
  onClose,
  onSave,
  isSaving,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    icon: category?.icon || "",
    order: category?.order?.toString() || "0",
    isActive: category?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("카테고리 이름을 입력해주세요.");
      return;
    }
    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      icon: formData.icon.trim() || undefined,
      order: parseInt(formData.order) || 0,
      isActive: formData.isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {category ? "카테고리 수정" : "새 카테고리 생성"}
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
                아이콘 (이모지)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="예: 📚, 🎯, 📝"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                순서
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
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

// 서브카테고리 모달 컴포넌트
function SubcategoryModal({
  subcategory,
  categoryId,
  categories,
  onClose,
  onSave,
  isSaving,
}: {
  subcategory: Subcategory | null;
  categoryId: string;
  categories: Category[];
  onClose: () => void;
  onSave: (data: {
    categoryId: string;
    name: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    categoryId: subcategory?.categoryId || categoryId || "",
    name: subcategory?.name || "",
    description: subcategory?.description || "",
    icon: subcategory?.icon || "",
    order: subcategory?.order?.toString() || "0",
    isActive: subcategory?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("서브카테고리 이름을 입력해주세요.");
      return;
    }
    if (!formData.categoryId) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }
    onSave({
      categoryId: formData.categoryId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      icon: formData.icon.trim() || undefined,
      order: parseInt(formData.order) || 0,
      isActive: formData.isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {subcategory ? "서브카테고리 수정" : "새 서브카테고리 생성"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
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
                placeholder="예: 📚, 🎯, 📝"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                순서
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
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

