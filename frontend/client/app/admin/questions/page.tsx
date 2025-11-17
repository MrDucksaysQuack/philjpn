"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { adminAPI, questionAPI, examAPI, Question } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [examFilter, setExamFilter] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // 전체 문제 목록 조회
  const { data: questionsResponse, isLoading } = useQuery({
    queryKey: ["admin-questions", search, difficultyFilter, examFilter],
    queryFn: async () => {
      const response = await adminAPI.getQuestions({
        search: search || undefined,
        difficulty: difficultyFilter ? (difficultyFilter as "easy" | "medium" | "hard") : undefined,
        examId: examFilter || undefined,
        limit: 100,
      });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  // 시험 목록 조회 (필터용)
  const { data: examsResponse } = useQuery({
    queryKey: ["admin-exams-for-filter"],
    queryFn: async () => {
      const response = await examAPI.getExams({ limit: 1000 });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const questions = questionsResponse?.data || [];
  const exams = examsResponse?.data || [];

  // 문제 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await questionAPI.deleteQuestion(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast.success("문제가 삭제되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "문제 삭제에 실패했습니다.");
    },
  });

  const handleDelete = (question: any) => {
    if (typeof window !== 'undefined' && confirm(`이 문제를 삭제하시겠습니까?\n\n${question.content.substring(0, 50)}...`)) {
      deleteMutation.mutate(question.id);
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
            문제 관리
          </h1>
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
          >
            ← 대시보드
          </Link>
        </div>

        {/* 필터 */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="문제 내용 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md"
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">전체 난이도</option>
            <option value="easy">쉬움</option>
            <option value="medium">보통</option>
            <option value="hard">어려움</option>
          </select>
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">전체 시험</option>
            {exams.map((exam: any) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>

        {/* 문제 목록 */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {search || difficultyFilter || examFilter
              ? "검색 결과가 없습니다."
              : "등록된 문제가 없습니다."}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question: any) => (
              <div
                key={question.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {question.difficulty && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            question.difficulty === "easy"
                              ? "bg-green-100 text-green-700"
                              : question.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {question.difficulty === "easy"
                            ? "쉬움"
                            : question.difficulty === "medium"
                            ? "보통"
                            : "어려움"}
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {question.questionType === "multiple_choice"
                          ? "객관식"
                          : question.questionType === "fill_blank"
                          ? "빈칸 채우기"
                          : "주관식"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {question.points}점
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2 line-clamp-2">
                      {question.content}
                    </p>
                    {question.section && (
                      <div className="text-sm text-gray-500 mb-2">
                        <Link
                          href={`/admin/exams/${question.section.examId}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {question.section.exam?.title || "시험"}
                        </Link>
                        {" > "}
                        <Link
                          href={`/admin/exams/${question.section.examId}/sections/${question.section.id}/questions`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {question.section.title}
                        </Link>
                      </div>
                    )}
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {question.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {question.section && (
                      <Link
                        href={`/admin/exams/${question.section.examId}/sections/${question.section.id}/questions`}
                        className="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm border border-blue-600 rounded-md hover:bg-blue-50"
                      >
                        수정
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(question)}
                      className="text-red-600 hover:text-red-700 px-3 py-2 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 통계 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">문제 통계</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">전체 문제</div>
              <div className="text-2xl font-bold text-gray-900">
                {questions.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">객관식</div>
              <div className="text-2xl font-bold text-blue-600">
                {questions.filter((q: any) => q.questionType === "multiple_choice").length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">빈칸 채우기</div>
              <div className="text-2xl font-bold text-green-600">
                {questions.filter((q: any) => q.questionType === "fill_blank").length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">주관식</div>
              <div className="text-2xl font-bold text-purple-600">
                {questions.filter((q: any) => q.questionType === "essay").length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

