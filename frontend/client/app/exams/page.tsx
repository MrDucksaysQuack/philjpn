"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { examAPI, Exam } from "@/lib/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function ExamsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const response = await examAPI.getExams();
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="시험 목록을 불러오는 중..." />
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
                시험 목록
              </h1>
              <p className="text-xl text-theme-primary-light max-w-2xl mx-auto">
                다양한 시험을 선택하여 실전 연습을 시작하세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 추천 시험 링크 */}
          <div className="mb-8 text-center">
            <Link
              href="/exams/recommended"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              개인 맞춤형 추천 시험 보기
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.map((exam: Exam) => (
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
                          {exam.estimatedTime}분
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

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
                등록된 시험이 없습니다
              </p>
              <p className="text-gray-500">새로운 시험이 추가되면 여기에 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
