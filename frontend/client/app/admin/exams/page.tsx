'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { examAPI, apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function AdminExamsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exams', page, search],
    queryFn: async () => {
      const response = await examAPI.getExams({ page, limit: 20, examType: search || undefined });
      return response.data;
    },
    enabled: user?.role === 'admin',
  });

  const deleteMutation = useMutation({
    mutationFn: async (examId: string) => {
      await apiClient.delete(`/exams/${examId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    },
  });

  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">시험 관리</h1>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
            >
              ← 대시보드
            </Link>
            <Link
              href="/admin/exams/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + 새 시험 생성
            </Link>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="시험 제목 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-64 px-4 py-2 border rounded-md"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((exam: any) => (
              <div key={exam.id} className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{exam.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      exam.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {exam.isActive ? '활성' : '비활성'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{exam.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{exam.examType}</span>
                  {exam.subject && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">{exam.subject}</span>
                  )}
                  {exam.difficulty && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">{exam.difficulty}</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  <div>문제 수: {exam.totalQuestions}</div>
                  <div>섹션 수: {exam.totalSections}</div>
                  {exam.estimatedTime && <div>예상 시간: {exam.estimatedTime}분</div>}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/exams/${exam.id}`}
                    className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    상세/수정
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        deleteMutation.mutate(exam.id);
                      }
                    }}
                    className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이징 */}
        {data && data.meta && data.meta.totalPages > 1 && (
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-4 py-2">
              {page} / {data.meta.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
              disabled={page === data.meta.totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </>
  );
}

