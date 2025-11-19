"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { categoryAPI, examAPI, Category, Exam, Subcategory, PaginatedResponse } from "@/lib/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | undefined>();

  // 카테고리 정보 조회 (slug 기반)
  const { data: categoryResponse, isLoading: categoryLoading } = useQuery({
    queryKey: ["category-by-slug", slug],
    queryFn: async () => {
      const response = await categoryAPI.getCategoryBySlug(slug);
      return response.data;
    },
    enabled: !!slug,
  });

  const category = categoryResponse?.data;

  // 서브카테고리 목록 조회
  const { data: subcategoriesResponse } = useQuery({
    queryKey: ["subcategories", category?.id],
    queryFn: async () => {
      const response = await categoryAPI.getSubcategories(category?.id);
      return response.data;
    },
    enabled: !!category?.id,
  });

  const subcategories = subcategoriesResponse?.data || [];

  // 시험 목록 조회 (카테고리 필터)
  const { data: examsResponse, isLoading: examsLoading } = useQuery<PaginatedResponse<Exam>>({
    queryKey: ["exams", category?.id, selectedSubcategoryId],
    queryFn: async () => {
      const params: { categoryId?: string; subcategoryId?: string } = { categoryId: category?.id };
      if (selectedSubcategoryId) {
        params.subcategoryId = selectedSubcategoryId;
      }
      const response = await examAPI.getExams(params);
      return response.data;
    },
    enabled: !!category?.id,
  });

  const exams = examsResponse?.data || [];

  if (categoryLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("common.loading")} />
          </div>
        </div>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">카테고리를 찾을 수 없습니다</h1>
              <p className="text-gray-600 mb-6">요청하신 카테고리가 존재하지 않거나 삭제되었습니다.</p>
              <Link
                href="/exams"
                className="inline-block px-6 py-3 bg-button-primary text-button-text rounded-lg hover:opacity-90 transition-colors"
              >
                시험 목록으로 돌아가기
              </Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 카테고리 헤더 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              {category.icon && (
                <div className="text-5xl">{category.icon}</div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
                {category.description && (
                  <p className="text-gray-600 text-lg">{category.description}</p>
                )}
                {category._count && (
                  <p className="text-sm text-gray-500 mt-2">
                    총 {category._count.exams || 0}개의 시험이 있습니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 서브카테고리 필터 */}
          {subcategories.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">서브카테고리</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubcategoryId(undefined)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedSubcategoryId
                      ? "bg-theme-secondary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  전체
                </button>
                {subcategories.map((subcategory: Subcategory) => (
                  <button
                    key={subcategory.id}
                    onClick={() => setSelectedSubcategoryId(subcategory.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedSubcategoryId === subcategory.id
                        ? "bg-theme-secondary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {subcategory.icon && <span>{subcategory.icon}</span>}
                    <span>{subcategory.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 시험 목록 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">시험 목록</h2>
            {examsLoading ? (
              <LoadingSpinner message="시험 목록을 불러오는 중..." />
            ) : exams.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">이 카테고리에 등록된 시험이 없습니다.</p>
                <Link
                  href="/exams"
                  className="inline-block px-4 py-2 bg-button-primary text-button-text rounded-lg hover:opacity-90"
                >
                  전체 시험 보기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam: Exam) => (
                  <Link
                    key={exam.id}
                    href={`/exams/${exam.id}`}
                    className="block bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-theme-primary hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 flex-1">{exam.title}</h3>
                      {exam.examType && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {exam.examType}
                        </span>
                      )}
                    </div>
                    {exam.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {exam.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {exam.estimatedTime}분
                        </span>
                      )}
                      {exam.totalQuestions && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {exam.totalQuestions}문제
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

