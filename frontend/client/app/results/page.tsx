"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { resultAPI, ExamResult } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ResultsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const response = await resultAPI.getResults();
      return response.data.data;
    },
    enabled: !!user,
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

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">결과를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-2xl mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-red-600 mb-2">결과를 불러오는데 실패했습니다</p>
              <p className="text-gray-500">잠시 후 다시 시도해주세요</p>
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
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                내 시험 결과
              </h1>
              <p className="text-xl text-green-100 max-w-2xl mx-auto">
                지난 시험 결과를 확인하고 학습 진척도를 파악하세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.map((result: ExamResult) => (
              <Link
                key={result.id}
                href={`/results/${result.id}`}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden card-hover"
              >
                <div className="relative">
                  {/* 그라데이션 헤더 */}
                  <div className={`h-2 ${
                    result.status === "completed"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600"
                      : result.status === "in_progress"
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                  }`}></div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-teal-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                          시험 #{result.id.slice(0, 8)}
                        </h2>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(result.startedAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg ${
                        result.status === "completed"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : result.status === "in_progress"
                            ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                      }`}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {result.totalScore !== null && result.maxScore !== null && (
                      <div className="mb-4 p-4 bg-theme-primary-light rounded-xl border border-theme-primary">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-3xl font-bold text-theme-primary">
                              {result.totalScore} <span className="text-lg text-gray-500">/ {result.maxScore}</span>
                            </div>
                            {result.percentage && (
                              <div className="text-sm font-semibold text-gray-600 mt-1">
                                {parseFloat(result.percentage.toString()).toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                              result.status === "completed"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : result.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {result.status === "completed"
                              ? "완료"
                              : result.status === "in_progress"
                                ? "진행중"
                                : result.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data?.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-6 shadow-lg">
                <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                아직 시험 결과가 없습니다
              </p>
              <p className="text-gray-500 mb-6">시험을 응시하면 결과가 여기에 표시됩니다</p>
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                시험 시작하기
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
