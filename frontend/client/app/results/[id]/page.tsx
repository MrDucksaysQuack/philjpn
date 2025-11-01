'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { resultAPI } from '@/lib/api';

export default function ResultDetailPage() {
  const params = useParams();
  const resultId = params.id as string;

  const { data: result, isLoading } = useQuery({
    queryKey: ['result', resultId],
    queryFn: async () => {
      const response = await resultAPI.getResult(resultId);
      return response.data;
    },
  });

  const { data: report } = useQuery({
    queryKey: ['result-report', resultId],
    queryFn: async () => {
      const response = await resultAPI.getReport(resultId);
      return response.data;
    },
    enabled: !!result && result.status === 'completed',
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

  if (!result) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">결과를 찾을 수 없습니다.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">시험 결과</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-sm text-blue-600 mb-2">총점</div>
              <div className="text-3xl font-bold text-blue-900">
                {result.totalScore ?? '-'} / {result.maxScore ?? '-'}
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-sm text-green-600 mb-2">정답률</div>
              <div className="text-3xl font-bold text-green-900">
                {result.percentage ? `${parseFloat(result.percentage.toString()).toFixed(1)}%` : '-'}
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-sm text-purple-600 mb-2">소요 시간</div>
              <div className="text-3xl font-bold text-purple-900">
                {result.timeSpent ? `${Math.floor(result.timeSpent / 60)}분` : '-'}
              </div>
            </div>
          </div>

          {report && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">섹션별 분석</h2>
                <div className="space-y-3">
                  {report.sectionAnalysis?.map((section: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{section.sectionTitle}</h3>
                        <span className="text-lg font-semibold">
                          {section.score} / {section.maxScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${section.correctRate}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        정답률: {section.correctRate.toFixed(1)}% | 
                        정답: {section.correctCount} | 
                        오답: {section.incorrectCount} | 
                        미답: {section.unansweredCount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {report.weakPoints && report.weakPoints.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">약점 분석</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.weakPoints.map((weak: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-red-50">
                        <div className="font-medium text-red-900">{weak.tag}</div>
                        <div className="text-sm text-red-700 mt-1">
                          정답률: {weak.correctRate.toFixed(1)}% ({weak.questionCount}문제)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recommendations && report.recommendations.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">학습 추천사항</h2>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

