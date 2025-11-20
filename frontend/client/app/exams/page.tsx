"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { examAPI, Exam, categoryAPI, type Category, type Subcategory } from "@/lib/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

function ExamsPageContent() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get("categoryId") || undefined;
  const subcategoryId = searchParams.get("subcategoryId") || undefined;

  const [filters, setFilters] = useState({
    search: "",
    examType: "",
    minTime: "",
    maxTime: "",
    isAdaptive: "" as "" | "true" | "false",
  });
  const [showFilters, setShowFilters] = useState(false);

  // 카테고리 목록 가져오기
  const { data: categoriesResponse } = useQuery({
    queryKey: ["categories-public", locale],
    queryFn: async () => {
      const response = await categoryAPI.getPublicCategories(locale);
      return response.data;
    },
  });

  const categoriesData = (categoriesResponse as any)?.data || categoriesResponse || [];

  // 선택된 카테고리 정보
  const selectedCategory = Array.isArray(categoriesData)
    ? categoriesData.find((cat: Category) => cat.id === categoryId)
    : undefined;

  // 서브카테고리 목록 가져오기 (카테고리가 선택된 경우)
  const { data: subcategoriesResponse } = useQuery({
    queryKey: ["subcategories", categoryId, locale],
    queryFn: async () => {
      const response = await categoryAPI.getSubcategories(categoryId, locale);
      return response.data;
    },
    enabled: !!categoryId,
  });

  const subcategoriesData = (subcategoriesResponse as any)?.data || subcategoriesResponse || [];

  // 시험 목록 가져오기 (카테고리/서브카테고리 필터 적용)
  const { data, isLoading, error } = useQuery({
    queryKey: ["exams", categoryId, subcategoryId],
    queryFn: async () => {
      const response = await examAPI.getExams({
        categoryId,
        subcategoryId,
      });
      return response.data.data;
    },
  });

  // 카테고리 선택 핸들러
  const handleCategorySelect = (catId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId) {
      params.set("categoryId", catId);
      params.delete("subcategoryId"); // 카테고리 변경 시 서브카테고리 초기화
    } else {
      params.delete("categoryId");
      params.delete("subcategoryId");
    }
    router.push(`/exams?${params.toString()}`);
  };

  // 서브카테고리 선택 핸들러
  const handleSubcategorySelect = (subId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subId) {
      params.set("subcategoryId", subId);
    } else {
      params.delete("subcategoryId");
    }
    router.push(`/exams?${params.toString()}`);
  };

  // 필터링된 시험 목록 (컴포넌트 최상위에서 useMemo 호출)
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter((exam: Exam) => {
      // 검색 필터
      if (filters.search && !exam.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !exam.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // 시험 유형 필터
      if (filters.examType && exam.examType !== filters.examType) {
        return false;
      }
      
      // 시간 필터
      if (exam.estimatedTime) {
        if (filters.minTime && exam.estimatedTime < parseFloat(filters.minTime)) {
          return false;
        }
        if (filters.maxTime && exam.estimatedTime > parseFloat(filters.maxTime)) {
          return false;
        }
      }
      
      // 적응형 시험 필터
      if (filters.isAdaptive !== "") {
        const isAdaptive = (exam as any).isAdaptive === true;
        if (filters.isAdaptive === "true" && !isAdaptive) {
          return false;
        }
        if (filters.isAdaptive === "false" && isAdaptive) {
          return false;
        }
      }
      
      return true;
    });
  }, [data, filters]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("exam.loadingList")} />
            <div className="mt-8">
              <LoadingSkeleton type="card" count={3} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        {/* 헤더 섹션 */}
        <div className="relative bg-theme-gradient-diagonal overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                {t("exam.list.title")}
              </h1>
              <p className="text-xl text-theme-primary-light max-w-2xl mx-auto">
                {t("exam.list.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 카테고리/서브카테고리 선택 섹션 */}
          {categoriesData && categoriesData.length > 0 && (
            <div className="mb-6 bg-surface rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t("exam.list.categorySelect")}</h2>
              
              
              {/* 중분류 (Subcategory) 선택 - 카테고리가 선택된 경우 표시 */}
              {categoryId && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">{t("exam.list.subcategory")}</label>
                  {subcategoriesData && subcategoriesData.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSubcategorySelect(null)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !subcategoryId
                            ? "bg-theme-secondary text-white"
                            : "bg-surface-hover text-text-primary hover:bg-surface-hover"
                        }`}
                      >
                        {t("exam.list.all")}
                      </button>
                      {subcategoriesData.map((subcategory: Subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategorySelect(subcategory.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            subcategoryId === subcategory.id
                              ? "bg-theme-secondary text-white"
                              : "bg-surface-hover text-text-primary hover:bg-surface-hover"
                          }`}
                        >
                          {subcategory.icon && <span>{subcategory.icon}</span>}
                          <span>{subcategory.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-surface-hover rounded-lg border border-border">
                      <p className="text-sm text-text-secondary">
                        {t("exam.list.noSubcategory")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 선택된 카테고리 정보 표시 */}
              {(categoryId || subcategoryId) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>{t("exam.list.currentSelection")}:</span>
                    {selectedCategory && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-theme-primary-light text-theme-primary rounded">
                        {selectedCategory.icon && <span>{selectedCategory.icon}</span>}
                        <span>{selectedCategory.name}</span>
                      </span>
                    )}
                    {subcategoryId && subcategoriesData && (
                      <>
                        <span>→</span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-theme-secondary-light text-theme-secondary rounded">
                          {subcategoriesData.find((s: Subcategory) => s.id === subcategoryId)?.icon && (
                            <span>{subcategoriesData.find((s: Subcategory) => s.id === subcategoryId)?.icon}</span>
                          )}
                          <span>{subcategoriesData.find((s: Subcategory) => s.id === subcategoryId)?.name}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 필터 섹션 */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">{t("common.filter")}</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                {showFilters ? t("exam.list.hideFilters") : t("exam.list.showFilters")}
              </button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t("common.search")}</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder={t("exam.list.searchPlaceholder")}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t("exam.filterByType")}</label>
                  <select
                    value={filters.examType}
                    onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">{t("exam.list.all")}</option>
                    <option value="MOCK">{t("exam.list.examTypeMOCK")}</option>
                    <option value="PRACTICE">{t("exam.list.examTypePRACTICE")}</option>
                    <option value="FINAL">{t("exam.list.examTypeFINAL")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t("exam.list.minTime")}</label>
                  <input
                    type="number"
                    value={filters.minTime}
                    onChange={(e) => setFilters({ ...filters, minTime: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t("exam.list.maxTime")}</label>
                  <input
                    type="number"
                    value={filters.maxTime}
                    onChange={(e) => setFilters({ ...filters, maxTime: e.target.value })}
                    placeholder="300"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t("exam.list.adaptiveExam")}</label>
                  <select
                    value={filters.isAdaptive}
                    onChange={(e) => setFilters({ ...filters, isAdaptive: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">{t("exam.list.all")}</option>
                    <option value="true">{t("exam.list.adaptiveOnly")}</option>
                    <option value="false">{t("exam.list.regularOnly")}</option>
                  </select>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFilters({
                  search: "",
                  examType: "",
                  minTime: "",
                  maxTime: "",
                  isAdaptive: "",
                })}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                {t("exam.list.resetFilters")}
              </button>
            </div>
          </div>

          {/* 추천 시험 링크 */}
          <div className="mb-8 text-center">
            <Link
              href="/exams/recommended"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-theme-secondary via-theme-accent to-theme-primary text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {t("exam.list.viewRecommended")}
            </Link>
          </div>

          {/* 필터링된 시험 목록 */}
          <>
            <div className="mb-4 text-sm text-gray-600">
              {t("exam.list.showingExams", { count: filteredData.length })}
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredData.map((exam: Exam) => (
              <Link
                key={exam.id}
                href={`/exams/${exam.id}`}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden card-hover"
              >
                <div className="relative">
                  {/* 그라데이션 헤더 */}
                  <div className="h-2 bg-theme-gradient-diagonal"></div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-theme-primary transition-all">
                          {exam.title}
                        </h2>
                        {exam.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                            {exam.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="w-14 h-14 bg-theme-gradient-primary rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-theme-primary-light text-theme-primary border border-theme-primary">
                        {exam.examType}
                      </span>
                      {exam.estimatedTime && (
                        <span className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <svg
                            className="w-4 h-4 mr-1.5 text-purple-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {exam.estimatedTime}{t("exam.minutes")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
                
                {filteredData.length === 0 && data && data.length > 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t("exam.list.noFilteredExams")}</p>
                  </div>
                )}
          </>

          {data?.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-theme-primary-light rounded-2xl mb-6 shadow-lg">
                <svg
                  className="w-12 h-12 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {t("exam.list.noExams")}
              </p>
              <p className="text-gray-500">{t("exam.list.noExamsDesc")}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ExamsPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="로딩 중..." />
          </div>
        </div>
      </>
    }>
      <ExamsPageContent />
    </Suspense>
  );
}
