'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { statisticsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function StatisticsPage() {
  const user = useAuthStore((state) => state.user);
  const [period, setPeriod] = useState<string>('month');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics', period],
    queryFn: async () => {
      const response = await statisticsAPI.getUserStatistics({ period });
      return response.data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">로그인이 필요합니다.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">학습 통계</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="week">최근 1주</option>
            <option value="month">최근 1개월</option>
            <option value="year">최근 1년</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : stats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-2">총 시험 수</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalExams}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-2">평균 점수</div>
                <div className="text-3xl font-bold text-blue-600">{stats.averageScore}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-2">최고 점수</div>
                <div className="text-3xl font-bold text-green-600">{stats.bestScore}</div>
              </div>
            </div>

            {stats.improvementTrend && stats.improvementTrend.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">개선 추이</h2>
                <div className="space-y-2">
                  {stats.improvementTrend.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">{item.date}</span>
                      <div className="flex items-center space-x-4">
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.score / 990) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold w-16 text-right">{item.score}점</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.sectionPerformance && stats.sectionPerformance.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">섹션별 성능</h2>
                <div className="space-y-4">
                  {stats.sectionPerformance.map((section: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{section.sectionTitle}</h3>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{section.averageScore}점</div>
                          {section.improvement !== 0 && (
                            <div
                              className={`text-sm ${
                                section.improvement > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {section.improvement > 0 ? '+' : ''}
                              {section.improvement}점
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            통계 데이터가 없습니다.
          </div>
        )}
      </div>
    </>
  );
}

