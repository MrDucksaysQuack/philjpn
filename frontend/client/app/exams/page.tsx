"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { examAPI, Exam } from "@/lib/api";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">
            시험 목록을 불러오는데 실패했습니다.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">시험 목록</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((exam: Exam) => (
            <Link
              key={exam.id}
              href={`/exams/${exam.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {exam.title}
              </h2>
              {exam.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {exam.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>유형: {exam.examType}</span>
                {exam.estimatedTime && (
                  <span>소요시간: {exam.estimatedTime}분</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {data?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            등록된 시험이 없습니다.
          </div>
        )}
      </div>
    </>
  );
}
