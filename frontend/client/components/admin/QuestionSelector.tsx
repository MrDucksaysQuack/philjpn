"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "@/lib/api";

interface QuestionSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  filters?: {
    tags?: string[];
    difficulty?: "easy" | "medium" | "hard" | null;
    examId?: string | null;
  };
  className?: string;
}

export default function QuestionSelector({
  selectedIds,
  onChange,
  filters = {},
  className = "",
}: QuestionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  // 선택된 문제 목록 조회
  const { data: selectedQuestionsResponse } = useQuery({
    queryKey: ["admin-questions", "selected", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return { data: [] };
      // 선택된 문제들의 상세 정보를 가져오기 위해 각각 조회
      // (실제로는 백엔드에 bulk 조회 API가 있으면 더 좋음)
      const questions = await Promise.all(
        selectedIds.map(async (id) => {
          try {
            // 일단 검색으로 찾기 (임시 방법)
            const response = await adminAPI.getQuestions({ limit: 1000 });
            return response.data.data.find((q) => q.id === id);
          } catch {
            return null;
          }
        })
      );
      return { data: questions.filter(Boolean) };
    },
    enabled: selectedIds.length > 0,
  });

  const selectedQuestions = selectedQuestionsResponse?.data || [];

  // 문제 목록 조회 (검색 및 필터링)
  const { data: questionsResponse, isLoading } = useQuery({
    queryKey: [
      "admin-questions",
      searchQuery,
      filters.tags,
      filters.difficulty,
      filters.examId,
    ],
    queryFn: async () => {
      const response = await adminAPI.getQuestions({
        search: searchQuery || undefined,
        tags: filters.tags,
        difficulty: filters.difficulty || undefined,
        examId: filters.examId || undefined,
        limit: 100,
      });
      return response.data;
    },
    enabled: showModal,
  });

  const questions = questionsResponse?.data || [];

  // 선택된 문제 ID 업데이트
  useEffect(() => {
    setLocalSelectedIds(selectedIds);
  }, [selectedIds]);

  const toggleQuestion = (questionId: string) => {
    const newSelected = localSelectedIds.includes(questionId)
      ? localSelectedIds.filter((id) => id !== questionId)
      : [...localSelectedIds, questionId];
    setLocalSelectedIds(newSelected);
  };

  const handleApply = () => {
    onChange(localSelectedIds);
    setShowModal(false);
  };

  const handleRemove = (questionId: string) => {
    onChange(selectedIds.filter((id) => id !== questionId));
  };

  // 검색 필터링
  const filteredQuestions = useMemo(() => {
    if (!searchQuery) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.content.toLowerCase().includes(query) ||
        q.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        q.section.exam.title.toLowerCase().includes(query)
    );
  }, [questions, searchQuery]);

  return (
    <div className={className}>
      {/* 선택된 문제 목록 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          선택된 문제 ({selectedIds.length}개)
        </label>
        {selectedQuestions.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {selectedQuestions.filter((q): q is NonNullable<typeof q> => q !== null && q !== undefined).map((question) => (
              <div
                key={question.id}
                className="flex items-start justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {question.content.substring(0, 60)}
                    {question.content.length > 60 ? "..." : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {question.section.exam.title} - {question.section.title}
                    {question.difficulty && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded">
                        {question.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(question.id)}
                  className="ml-2 text-red-600 hover:text-red-700"
                  aria-label="제거"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">선택된 문제가 없습니다.</p>
        )}
      </div>

      {/* 문제 선택 버튼 */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-3 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-theme-primary hover:text-theme-primary transition-colors"
      >
        + 문제 추가하기
      </button>

      {/* 문제 선택 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-extrabold text-gray-900">
                문제 선택 ({localSelectedIds.length}개 선택됨)
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setLocalSelectedIds(selectedIds);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 검색 및 필터 */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="문제 내용, 태그, 시험 제목으로 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
              <div className="flex gap-2 text-sm text-gray-600">
                {filters.difficulty && (
                  <span className="px-3 py-1 bg-gray-100 rounded-lg">
                    난이도: {filters.difficulty}
                  </span>
                )}
                {filters.tags && filters.tags.length > 0 && (
                  <span className="px-3 py-1 bg-gray-100 rounded-lg">
                    태그: {filters.tags.join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* 문제 목록 */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">로딩 중...</div>
              ) : filteredQuestions.length > 0 ? (
                <div className="space-y-3">
                  {filteredQuestions.map((question) => (
                    <label
                      key={question.id}
                      className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-theme-primary hover:bg-theme-primary-light cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={localSelectedIds.includes(question.id)}
                        onChange={() => toggleQuestion(question.id)}
                        className="mt-1 w-5 h-5 text-theme-primary border-gray-300 rounded focus:ring-theme-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {question.content.substring(0, 200)}
                          {question.content.length > 200 ? "..." : ""}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-xs text-gray-500">
                            {question.section.exam.title} - {question.section.title}
                          </span>
                          {question.difficulty && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                question.difficulty === "easy"
                                  ? "bg-green-100 text-green-800"
                                  : question.difficulty === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {question.difficulty === "easy"
                                ? "쉬움"
                                : question.difficulty === "medium"
                                ? "중급"
                                : "어려움"}
                            </span>
                          )}
                          {question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {question.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-theme-primary-light text-theme-primary rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {searchQuery ? "검색 결과가 없습니다." : "문제가 없습니다."}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {localSelectedIds.length}개 문제 선택됨
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setLocalSelectedIds(selectedIds);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-6 py-2 bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 transition-all"
                >
                  적용 ({localSelectedIds.length}개)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

