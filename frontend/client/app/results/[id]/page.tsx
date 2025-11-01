"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { resultAPI, wordExtractionAPI, DetailedFeedback } from "@/lib/api";
import { emotionalToast } from "@/components/common/Toast";
import CelebrationModal from "@/components/common/CelebrationModal";

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;
  const queryClient = useQueryClient();
  const [showWordExtraction, setShowWordExtraction] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["result", resultId],
    queryFn: async () => {
      const response = await resultAPI.getResult(resultId);
      return response.data;
    },
  });

  const { data: report } = useQuery({
    queryKey: ["result-report", resultId],
    queryFn: async () => {
      const response = await resultAPI.getReport(resultId);
      return response.data;
    },
    enabled: !!result && result.status === "completed",
  });

  const { data: detailedFeedback } = useQuery<DetailedFeedback>({
    queryKey: ["result-detailed-feedback", resultId],
    queryFn: async () => {
      const response = await resultAPI.getDetailedFeedback(resultId);
      return response.data;
    },
    enabled: !!result && result.status === "completed",
  });

  const [activeFeedbackTab, setActiveFeedbackTab] = useState<"summary" | "questions" | "sections" | "overall">("summary");

  const { data: extractedWords, refetch: refetchWords } = useQuery({
    queryKey: ["extracted-words", resultId],
    queryFn: async () => {
      const response = await wordExtractionAPI.extractFromResult(resultId);
      return response.data;
    },
    enabled: showWordExtraction && !!result && result.status === "completed",
  });

  const addWordsMutation = useMutation({
    mutationFn: async (words: any[]) => {
      await wordExtractionAPI.addExtractedWords(words);
    },
    onSuccess: (_, words) => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      emotionalToast.success.wordAdded(words.length);
      setShowWordExtraction(false);
    },
  });

  // 목표 달성 체크 (점수 개선 확인)
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
    // 결과가 로드되고 점수가 있을 때 축하 모달 표시 로직은 나중에 추가
    // 현재는 목표 달성 시에만 표시
  }, [result]);

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
          <div className="text-center text-red-600">
            결과를 찾을 수 없습니다.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                시험 결과 상세
              </h1>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                성적 분석과 학습 추천사항을 확인하세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              시험 결과
            </h1>

            {/* 피드백 탭 네비게이션 */}
            {detailedFeedback && (
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                  {[
                    { id: "summary", label: "요약", icon: "📊" },
                    { id: "questions", label: "문제별 분석", icon: "📝" },
                    { id: "sections", label: "섹션별 분석", icon: "📚" },
                    { id: "overall", label: "종합 인사이트", icon: "💡" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFeedbackTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeFeedbackTab === tab.id
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-blue-700">총점</div>
                </div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {result.totalScore ?? "-"} <span className="text-lg text-gray-500">/ {result.maxScore ?? "-"}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-green-700">정답률</div>
                </div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                  {result.percentage
                    ? `${parseFloat(result.percentage.toString()).toFixed(1)}%`
                    : "-"}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl border border-purple-200 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-purple-700">소요 시간</div>
                </div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {result.timeSpent
                    ? `${Math.floor(result.timeSpent / 60)}분 ${result.timeSpent % 60}초`
                    : "-"}
                </div>
              </div>
            </div>

          {/* 요약 탭 */}
          {activeFeedbackTab === "summary" && report && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                  섹션별 분석
                </h2>
                <div className="space-y-4">
                  {(report.sectionAnalysis || []).map(
                    (section: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {section.sectionTitle}
                          </h3>
                          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {section.score} / {section.maxScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-1000 shadow-sm"
                            style={{ width: `${section.correctRate}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-green-700 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            정답: {section.correctCount}
                          </span>
                          <span className="flex items-center gap-1.5 text-red-700 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            오답: {section.incorrectCount}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            미답: {section.unansweredCount}
                          </span>
                          <span className="flex items-center gap-1.5 text-purple-700 font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            정답률: {section.correctRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {report.weakPoints && report.weakPoints.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-orange-600 rounded-full"></div>
                    약점 분석
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(report.weakPoints || []).map((weak: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-200 shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="font-semibold text-red-900 text-lg">
                            {weak.tag}
                          </div>
                        </div>
                        <div className="ml-13">
                          <div className="text-sm font-medium text-red-700 mb-1">
                            정답률: {weak.correctRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-red-600">
                            {weak.questionCount}문제 출제
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recommendations && report.recommendations.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                    학습 추천사항
                  </h2>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-md">
                    <ul className="space-y-3">
                      {(report.recommendations || []).map(
                        (rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-700 leading-relaxed">{rec}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* 다음 단계 강조 */}
              {result && result.status === "completed" && (
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-blue-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    다음 단계로 계속 학습하기
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    결과를 분석하고 약점을 개선하여 더 높은 점수를 목표로 해보세요!
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/analysis" className="inline-block">
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                        내 학습 패턴 분석하기 →
                      </button>
                    </Link>
                    <Link href="/exams/recommended" className="inline-block">
                      <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                        추천 시험 보기 →
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* 단어 추출 기능 */}
              {result && result.status === "completed" && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-teal-600 to-cyan-600 rounded-full"></div>
                    단어 학습 연계
                  </h2>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 shadow-md">
                    <p className="text-gray-700 mb-4">
                      오답 문제에서 나온 단어를 단어장에 자동으로 추가하여 복습하세요.
                    </p>
                    {!showWordExtraction ? (
                      <button
                        onClick={() => {
                          setShowWordExtraction(true);
                          refetchWords();
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                      >
                        단어 추출하기
                      </button>
                    ) : extractedWords?.suggestedWords && extractedWords.suggestedWords.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                          {extractedWords.suggestedWords.length}개의 단어를 추출했습니다
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                          {(extractedWords.suggestedWords || []).map((word: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-bold text-lg text-gray-900 mb-1">{word.word}</div>
                                  <div className="text-sm text-gray-600 mb-2">{word.meaning}</div>
                                  {word.context && (
                                    <div className="text-xs text-gray-500 italic">"{word.context}"</div>
                                  )}
                                  <div className="text-xs text-teal-600 mt-2">{word.reason}</div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  word.difficulty === "hard" ? "bg-red-100 text-red-700" :
                                  word.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-green-100 text-green-700"
                                }`}>
                                  {word.difficulty === "hard" ? "어려움" : word.difficulty === "medium" ? "중급" : "쉬움"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`추출된 ${extractedWords.suggestedWords.length}개의 단어를 단어장에 추가하시겠습니까?`)) {
                              addWordsMutation.mutate(extractedWords.suggestedWords);
                            }
                          }}
                          disabled={addWordsMutation.isPending}
                          className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {addWordsMutation.isPending ? "추가 중..." : "전체 단어장에 추가"}
                        </button>
                        <button
                          onClick={() => setShowWordExtraction(false)}
                          className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          닫기
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">추출할 단어가 없습니다.</p>
                        <button
                          onClick={() => setShowWordExtraction(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          닫기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 문제별 분석 탭 */}
          {activeFeedbackTab === "questions" && detailedFeedback && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                문제별 상세 분석
              </h2>
              <div className="space-y-4">
                {(detailedFeedback.detailedFeedback?.questionLevel || []).map((question: any, index: number) => (
                  <div
                    key={question.questionId}
                    className={`bg-white rounded-xl p-6 border-2 ${
                      question.isCorrect
                        ? "border-green-200 bg-green-50/30"
                        : "border-red-200 bg-red-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-500">문제 {index + 1}</span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            question.isCorrect
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {question.isCorrect ? "정답" : "오답"}
                        </span>
                        {question.mistakeType && question.mistakeType !== "correct" && (
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              question.mistakeType === "conceptual"
                                ? "bg-purple-100 text-purple-800"
                                : question.mistakeType === "careless"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {question.mistakeType === "conceptual"
                              ? "개념 이해 부족"
                              : question.mistakeType === "careless"
                              ? "실수"
                              : "시간 부족"}
                          </span>
                        )}
                      </div>
                      {question.timeSpent && (
                        <span className="text-sm text-gray-500">
                          소요 시간: {question.timeSpent}초
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">내 답안:</span> {question.userAnswer}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">정답:</span> {question.correctAnswer}
                      </div>
                      {question.explanation && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-semibold text-blue-700 mb-2">설명</div>
                          <div className="text-sm text-gray-700">{question.explanation}</div>
                        </div>
                      )}
                    </div>

                    {question.relatedWords && question.relatedWords.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2">관련 단어</div>
                        <div className="flex flex-wrap gap-2">
                          {(question.relatedWords || []).map((word: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 섹션별 분석 탭 */}
          {activeFeedbackTab === "sections" && detailedFeedback && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                섹션별 분석 및 개선 계획
              </h2>
              {detailedFeedback.detailedFeedback?.sectionLevel?.map((section: any) => (
                <div
                  key={section.sectionId}
                  className="bg-white rounded-xl p-8 border-2 border-purple-200"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">{section.sectionTitle}</h3>
                  
                  {section.strengths && section.strengths.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        강점
                      </div>
                      <ul className="space-y-2">
                        {(section.strengths || []).map((strength: string, i: number) => (
                          <li key={i} className="text-gray-700 flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.weaknesses && section.weaknesses.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        약점
                      </div>
                      <ul className="space-y-2">
                        {(section.weaknesses || []).map((weakness: string, i: number) => (
                          <li key={i} className="text-gray-700 flex items-start gap-2">
                            <span className="text-red-500">⚠</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.improvementPlan && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                      <div className="text-sm font-semibold text-purple-700 mb-4">개선 계획</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">집중 영역</div>
                          <div className="flex flex-wrap gap-2">
                            {section.improvementPlan.focusAreas.map((area: string, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">추천 연습 문제</div>
                            <div className="text-lg font-bold text-purple-900">
                              {section.improvementPlan.practiceQuestions}문제
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">예상 개선 시간</div>
                            <div className="text-lg font-bold text-purple-900">
                              {section.improvementPlan.estimatedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 종합 인사이트 탭 */}
          {activeFeedbackTab === "overall" && detailedFeedback && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                종합 학습 인사이트
              </h2>

              {/* 학습 인사이트 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
                <div className="text-lg font-semibold text-blue-900 mb-4">📊 학습 인사이트</div>
                <ul className="space-y-3">
                  {(detailedFeedback.detailedFeedback?.overall?.learningInsights || []).map(
                    (insight: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{insight}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* 다음 단계 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
                <div className="text-lg font-semibold text-green-900 mb-4">🎯 다음 학습 단계</div>
                <ul className="space-y-3">
                  {(detailedFeedback.detailedFeedback?.overall?.nextSteps || []).map(
                    (step: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{step}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* 축하 모달 */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="🎉 목표 달성!"
        message="정말 멋져요!"
        emoji="🏆"
        nextAction={{
          label: "다음 목표 설정하기",
          onClick: () => router.push("/analysis?tab=goals"),
        }}
      />
    </>
  );
}
