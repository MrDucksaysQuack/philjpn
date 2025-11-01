'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { resultAPI, ExamResult } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function ResultsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, error } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const response = await resultAPI.getResults();
      return response.data.data;
    },
    enabled: !!user,
  });

  if (!user) {
    router.push('/login');
    return null;
  }

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
          <div className="text-center text-red-600">결과를 불러오는데 실패했습니다.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">내 시험 결과</h1>

        <div className="space-y-4">
          {data?.map((result: ExamResult) => (
            <Link
              key={result.id}
              href={`/results/${result.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">시험 #{result.id.slice(0, 8)}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(result.startedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  {result.totalScore !== null && result.maxScore !== null && (
                    <>
                      <div className="text-2xl font-bold text-gray-900">
                        {result.totalScore} / {result.maxScore}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.percentage ? `${parseFloat(result.percentage.toString()).toFixed(1)}%` : '-'}
                      </div>
                    </>
                  )}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {data?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            아직 시험 결과가 없습니다.
          </div>
        )}
      </div>
    </>
  );
}

