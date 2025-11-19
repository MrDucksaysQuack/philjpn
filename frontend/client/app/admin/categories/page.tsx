"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { categoryAPI, Category, Subcategory } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";
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

export default function AdminCategoriesPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
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
  const [sortedCategories, setSortedCategories] = useState<Category[]>([]);

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
  const [sortedSubcategoriesByCategory, setSortedSubcategoriesByCategory] = useState<Record<string, Subcategory[]>>({});

  // 카테고리 정렬 상태 초기화
  useEffect(() => {
    if (categories.length > 0) {
      setSortedCategories([...categories].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  }, [categories]);

  // 서브카테고리 정렬 상태 초기화
  useEffect(() => {
    const grouped = allSubcategories.reduce((acc, sub) => {
    if (!acc[sub.categoryId]) {
      acc[sub.categoryId] = [];
    }
    acc[sub.categoryId].push(sub);
    return acc;
  }, {} as Record<string, Subcategory[]>);

    const sorted = Object.keys(grouped).reduce((acc, categoryId) => {
      acc[categoryId] = [...grouped[categoryId]].sort((a, b) => (a.order || 0) - (b.order || 0));
      return acc;
    }, {} as Record<string, Subcategory[]>);

    setSortedSubcategoriesByCategory(sorted);
  }, [allSubcategories]);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 카테고리 순서 업데이트 Mutation
  const updateCategoryOrdersMutation = useMutation({
    mutationFn: async (orders: { id: string; order: number }[]) => {
      await categoryAPI.updateCategoryOrders(orders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-public"] });
      toast.success(t("admin.categoryManagement.orderUpdated"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.categoryManagement.orderUpdateFailed"));
      // 실패 시 원래 순서로 복구
      setSortedCategories([...categories].sort((a, b) => (a.order || 0) - (b.order || 0)));
    },
  });

  // 서브카테고리 순서 업데이트 Mutation
  const updateSubcategoryOrdersMutation = useMutation({
    mutationFn: async (orders: { id: string; order: number }[]) => {
      await categoryAPI.updateSubcategoryOrders(orders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success(t("admin.categoryManagement.subcategoryOrderUpdated"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.categoryManagement.orderUpdateFailed"));
      // 실패 시 원래 순서로 복구
      const grouped = allSubcategories.reduce((acc, sub) => {
        if (!acc[sub.categoryId]) {
          acc[sub.categoryId] = [];
        }
        acc[sub.categoryId].push(sub);
        return acc;
      }, {} as Record<string, Subcategory[]>);
      const sorted = Object.keys(grouped).reduce((acc, categoryId) => {
        acc[categoryId] = [...grouped[categoryId]].sort((a, b) => (a.order || 0) - (b.order || 0));
        return acc;
      }, {} as Record<string, Subcategory[]>);
      setSortedSubcategoriesByCategory(sorted);
    },
  });

  // 카테고리 드래그 종료 핸들러
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = sortedCategories.findIndex((cat) => cat.id === over.id);

      const newCategories = arrayMove(sortedCategories, oldIndex, newIndex);
      setSortedCategories(newCategories);

      // 순서 업데이트
      const orders = newCategories.map((cat, index) => ({
        id: cat.id,
        order: index,
      }));

      updateCategoryOrdersMutation.mutate(orders);
    }
  };

  // 서브카테고리 드래그 종료 핸들러
  const handleSubcategoryDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const subcategories = sortedSubcategoriesByCategory[categoryId] || [];
      const oldIndex = subcategories.findIndex((sub) => sub.id === active.id);
      const newIndex = subcategories.findIndex((sub) => sub.id === over.id);

      const newSubcategories = arrayMove(subcategories, oldIndex, newIndex);
      setSortedSubcategoriesByCategory({
        ...sortedSubcategoriesByCategory,
        [categoryId]: newSubcategories,
      });

      // 순서 업데이트
      const orders = newSubcategories.map((sub, index) => ({
        id: sub.id,
        order: index,
      }));

      updateSubcategoryOrdersMutation.mutate(orders);
    }
  };

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
      toast.success(editingCategory ? t("admin.categoryManagement.categoryUpdated") : t("admin.categoryManagement.categoryCreated"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.categoryManagement.error"));
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
      toast.success(editingSubcategory ? t("admin.categoryManagement.subcategoryUpdated") : t("admin.categoryManagement.subcategoryCreated"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.categoryManagement.error"));
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
      toast.success(t("admin.categoryManagement.categoryDeleted"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.categoryManagement.error"));
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
      toast.success(t("admin.categoryManagement.subcategoryDeleted"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.categoryManagement.error"));
    },
  });

  const handleDeleteCategory = (id: string, name: string) => {
    if (typeof window !== 'undefined' && confirm(`"${name}" ${t("admin.categoryManagement.confirmDeleteCategory")}`)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleDeleteSubcategory = (id: string, name: string) => {
    if (typeof window !== 'undefined' && confirm(`"${name}" ${t("admin.categoryManagement.confirmDeleteSubcategory")}`)) {
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
            {t("admin.categoryManagement.title")}
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={sortedCategories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
        <div className="space-y-4">
              {sortedCategories.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              카테고리가 없습니다. 새 카테고리를 생성해주세요.
            </div>
          ) : (
                sortedCategories.map((category) => {
                  const subcategories = sortedSubcategoriesByCategory[category.id] || [];
                const isExpanded = expandedCategories.has(category.id);

                return (
                    <SortableCategoryItem
                    key={category.id}
                      category={category}
                      subcategories={subcategories}
                      isExpanded={isExpanded}
                      onToggle={() => toggleCategory(category.id)}
                      onEdit={() => {
                            setEditingCategory(category);
                            setShowCategoryModal(true);
                          }}
                      onAddSubcategory={() => {
                            setSelectedCategoryId(category.id);
                            setEditingSubcategory(null);
                            setShowSubcategoryModal(true);
                          }}
                      onDelete={() => handleDeleteCategory(category.id, category.name)}
                      onSubcategoryEdit={(subcategory: Subcategory) => {
                                        setEditingSubcategory(subcategory);
                                        setSelectedCategoryId(subcategory.categoryId);
                                        setShowSubcategoryModal(true);
                                      }}
                      onSubcategoryDelete={(id: string, name: string) => handleDeleteSubcategory(id, name)}
                      categoryId={category.id}
                      sensors={sensors}
                      onSubcategoryDragEnd={(event: DragEndEvent) => handleSubcategoryDragEnd(event, category.id)}
                    />
                );
              })
          )}
        </div>
          </SortableContext>
        </DndContext>

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

// Sortable Category Item Component
function SortableCategoryItem({
  category,
  subcategories,
  isExpanded,
  onToggle,
  onEdit,
  onAddSubcategory,
  onDelete,
  onSubcategoryEdit,
  onSubcategoryDelete,
  categoryId,
  sensors,
  onSubcategoryDragEnd,
}: {
  category: Category;
  subcategories: Subcategory[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onAddSubcategory: () => void;
  onDelete: () => void;
  onSubcategoryEdit: (subcategory: Subcategory) => void;
  onSubcategoryDelete: (id: string, name: string) => void;
  categoryId: string;
  sensors: any;
  onSubcategoryDragEnd: (event: DragEndEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow ${!category.isActive ? 'opacity-60' : ''}`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            title="드래그하여 순서 변경"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
          <button
            onClick={onToggle}
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
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm"
          >
            수정
          </button>
          <button
            onClick={onAddSubcategory}
            className="text-green-600 hover:text-green-700 px-3 py-1 text-sm"
          >
            + 서브카테고리
          </button>
          <button
            onClick={onDelete}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onSubcategoryDragEnd}
            >
              <SortableContext
                items={subcategories.map((sub) => sub.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {subcategories.map((subcategory) => (
                    <SortableSubcategoryItem
                      key={subcategory.id}
                      subcategory={subcategory}
                      onEdit={() => onSubcategoryEdit(subcategory)}
                      onDelete={() => onSubcategoryDelete(subcategory.id, subcategory.name)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

// Sortable Subcategory Item Component
function SortableSubcategoryItem({
  subcategory,
  onEdit,
  onDelete,
}: {
  subcategory: Subcategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subcategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded p-3 flex items-center justify-between border"
    >
      <div className="flex items-center gap-2 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          title="드래그하여 순서 변경"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
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
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
      setIcon(category.icon || "");
      setIsActive(category.isActive ?? true);
    } else {
      setName("");
      setDescription("");
      setIcon("");
      setIsActive(true);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description: description || undefined,
      icon: icon || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {category ? "카테고리 수정" : "새 카테고리"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                아이콘 (이모지)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="예: 📚"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
              <input
                type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
              />
                <span className="text-sm font-semibold text-gray-700">활성화</span>
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
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (subcategory) {
      setSelectedCategoryId(subcategory.categoryId);
      setName(subcategory.name || "");
      setDescription(subcategory.description || "");
      setIcon(subcategory.icon || "");
      setIsActive(subcategory.isActive ?? true);
    } else {
      setSelectedCategoryId(categoryId);
      setName("");
      setDescription("");
      setIcon("");
      setIsActive(true);
    }
  }, [subcategory, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    onSave({
      categoryId: selectedCategoryId,
      name,
      description: description || undefined,
      icon: icon || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {subcategory ? "서브카테고리 수정" : "새 서브카테고리"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리 *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                아이콘 (이모지)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="예: 📚"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
              <input
                type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
              />
                <span className="text-sm font-semibold text-gray-700">활성화</span>
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
