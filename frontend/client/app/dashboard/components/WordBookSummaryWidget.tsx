"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { wordBookAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function WordBookSummaryWidget() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ["wordbook"],
    queryFn: async () => {
      const response = await wordBookAPI.getWords();
      const data = response.data?.data || [];
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  const words = data || [];
  const recentWords = words.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-amber-600 to-orange-600 rounded-full"></div>
          내 단어장 요약
        </h2>
        {words.length > 0 && (
          <Link
            href="/wordbook"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            단어장으로 가기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {words.length > 0 ? (
        <div className="space-y-4">
          {/* 통계 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1">
              {words.length}개
            </div>
            <div className="text-sm text-gray-700">학습 중인 단어</div>
          </div>

          {/* 최근 추가한 단어 */}
          {recentWords.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3">최근 추가한 단어</div>
              <div className="space-y-2">
                {recentWords.map((word: any, index: number) => (
                  <div
                    key={word.id || index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {word.word || word.term || "단어"}
                      </div>
                      {word.meaning && (
                        <div className="text-xs text-gray-600 mt-1">{word.meaning}</div>
                      )}
                    </div>
                    {word.extractedAt && (
                      <div className="text-xs text-gray-500">
                        {new Date(word.extractedAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
            <span className="text-4xl">📖</span>
          </div>
          <p className="text-gray-600 mb-6">아직 저장된 단어가 없습니다.</p>
          <p className="text-sm text-gray-500 mb-6">
            시험을 응시하면 오답 단어가 자동으로 추가됩니다
          </p>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            시험 시작하기
          </Link>
        </div>
      )}
    </div>
  );
}

