"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { adminAPI, apiClient, PaginatedResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  status: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  startedAt: string;
  submittedAt: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  exam?: {
    id: string;
    title: string;
  };
}

export default function AdminExamResultsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading, error } = useQuery<PaginatedResponse<ExamResult>>({
    queryKey: ["admin-exam-results", page, statusFilter],
    queryFn: async (): Promise<PaginatedResponse<ExamResult>> => {
      const params: any = { page, limit: 20 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await apiClient.get("/admin/exam-results", { params });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  if (!user || user.role !== "admin") {
    router.push("/login");
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                시험 결과 모니터링
              </h1>
              <p className="text-xl text-violet-100 max-w-2xl mx-auto">
                전체 시험 결과를 조회하고 분석하세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 필터 */}
          <div className="mb-6 flex gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-purple-300 focus:outline-none focus:border-purple-500 transition-all shadow-md"
            >
              <option value="">전체 상태</option>
              <option value="completed">완료</option>
              <option value="in_progress">진행중</option>
              <option value="abandoned">중단</option>
              <option value="graded">채점완료</option>
            </select>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              ← 대시보드로
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">결과를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-2xl mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-red-600 mb-2">결과를 불러오는데 실패했습니다</p>
              <p className="text-gray-500">잠시 후 다시 시도해주세요</p>
            </div>
          ) : (
            <>
              {/* 결과 테이블 */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-violet-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          사용자
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          시험
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          점수
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          시작 시간
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          제출 시간
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          액션
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data?.data.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {result.user?.name || "알 수 없음"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.user?.email || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {result.exam?.title || "알 수 없음"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.totalScore !== null && result.maxScore !== null ? (
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {result.totalScore} / {result.maxScore}
                                </div>
                                {result.percentage && (
                                  <div className="text-xs text-gray-500">
                                    {parseFloat(result.percentage.toString()).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                result.status === "completed"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : result.status === "in_progress"
                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                    : result.status === "abandoned"
                                      ? "bg-red-100 text-red-700 border border-red-200"
                                      : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {result.status === "completed"
                                ? "완료"
                                : result.status === "in_progress"
                                  ? "진행중"
                                  : result.status === "abandoned"
                                    ? "중단"
                                    : "채점완료"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(result.startedAt).toLocaleString("ko-KR")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.submittedAt
                              ? new Date(result.submittedAt).toLocaleString("ko-KR")
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/results/${result.id}`}
                              className="text-violet-600 hover:text-violet-900 font-semibold"
                            >
                              상세보기
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 페이징 */}
              {data && data.meta && data.meta.totalPages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-medium hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    이전
                  </button>
                  <span className="px-4 py-2 flex items-center text-gray-700 font-medium">
                    {page} / {data.meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                    disabled={page === data.meta.totalPages}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-medium hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    다음
                  </button>
                </div>
              )}

              {data?.data.length === 0 && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl mb-6 shadow-lg">
                    <svg className="w-12 h-12 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    시험 결과가 없습니다
                  </p>
                  <p className="text-gray-500">시험이 응시되면 결과가 여기에 표시됩니다</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

