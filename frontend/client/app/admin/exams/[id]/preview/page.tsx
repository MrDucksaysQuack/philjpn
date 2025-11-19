"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { examAPI, questionAPI, Exam, Question } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AudioPlayer from "@/components/common/AudioPlayer";
import Link from "next/link";

export default function ExamPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // 시험 정보 조회
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const response = await examAPI.getExam(examId);
      return response.data;
    },
    enabled: !!examId && user?.role === "admin",
  });

  // 시험 섹션 조회
  const { data: sectionsResponse, isLoading: sectionsLoading } = useQuery({
    queryKey: ["exam-sections", examId],
    queryFn: async () => {
      const response = await examAPI.getExamSections(examId);
      return response.data;
    },
    enabled: !!examId && user?.role === "admin",
  });

  const sections = sectionsResponse?.data || [];

  // 현재 섹션의 문제 조회
  const currentSection = sections[currentSectionIndex];
  const { data: questionsResponse, isLoading: questionsLoading } = useQuery({
    queryKey: ["section-questions", currentSection?.id],
    queryFn: async () => {
      if (!currentSection?.id) return { data: [] };
      const response = await questionAPI.getQuestionsBySection(currentSection.id);
      return response.data;
    },
    enabled: !!currentSection?.id && user?.role === "admin",
  });

  const questions = questionsResponse?.data || [];
  const currentQuestion = questions[currentQuestionIndex];

  // 섹션이 변경되면 첫 번째 문제로 이동
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [currentSectionIndex]);

  if (authLoading || examLoading || sectionsLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="로딩 중..." />
          </div>
        </div>
      </>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  if (!exam) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center text-red-600">시험을 찾을 수 없습니다.</div>
          </div>
        </div>
      </>
    );
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      // 이전 섹션의 마지막 문제로 이동하려면 해당 섹션의 문제를 먼저 로드해야 함
      // 간단하게 이전 섹션의 첫 번째 문제로 이동
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handleSectionChange = (index: number) => {
    setCurrentSectionIndex(index);
  };

  const getTotalQuestions = () => {
    return sections.reduce((total: number, section: any) => total + (section.questionCount || 0), 0);
  };

  const getCurrentQuestionNumber = () => {
    let number = 1;
    for (let i = 0; i < currentSectionIndex; i++) {
      number += sections[i].questionCount || 0;
    }
    return number + currentQuestionIndex;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link
                  href="/admin/exams"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← 시험 목록
                </Link>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-semibold">
                  미리보기 모드
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{exam.title}</h1>
              {exam.description && (
                <p className="text-gray-600 mt-2">{exam.description}</p>
              )}
            </div>
            <Link
              href={`/admin/exams/${examId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              시험 수정
            </Link>
          </div>

          {/* 섹션 선택 */}
          {sections.length > 1 && (
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <div className="flex flex-wrap gap-2">
                {sections.map((section: any, index: number) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(index)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentSectionIndex === index
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {section.title} ({section.questionCount || 0}문제)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 문제 표시 영역 */}
          {questionsLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <LoadingSpinner message="문제 로딩 중..." />
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              {currentSection ? `${currentSection.title}에 문제가 없습니다.` : "섹션을 선택해주세요."}
            </div>
          ) : currentQuestion ? (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              {/* 문제 헤더 */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    {currentSection?.title} - 문제 {currentQuestion.questionNumber || currentQuestionIndex + 1}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    전체 {getTotalQuestions()}문제 중 {getCurrentQuestionNumber()}번째
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentQuestion.difficulty && (
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        currentQuestion.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : currentQuestion.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {currentQuestion.difficulty === "easy"
                        ? "쉬움"
                        : currentQuestion.difficulty === "medium"
                        ? "보통"
                        : "어려움"}
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {currentQuestion.points}점
                  </span>
                </div>
              </div>

              {/* 오디오 재생 */}
              {currentQuestion.audioUrl && (
                <div className="mb-4">
                  <AudioPlayer
                    src={currentQuestion.audioUrl}
                    playLimit={currentQuestion.audioPlayLimit || 2}
                  />
                </div>
              )}

              {/* 이미지 표시 */}
              {currentQuestion.imageUrl && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="문제 이미지"
                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              )}

              {/* 문제 내용 */}
              <div className="text-lg font-semibold mb-6 text-gray-900">
                {currentQuestion.content}
              </div>

              {/* 선택지 (객관식) */}
              {currentQuestion.questionType === "multiple_choice" &&
                currentQuestion.options && (
                  <div className="space-y-2 mb-6">
                    {(() => {
                      // options 형식 변환 (객체 또는 배열)
                      const options = Array.isArray(currentQuestion.options)
                        ? currentQuestion.options
                        : Object.entries(currentQuestion.options).map(([id, text]) => ({ id, text: String(text) }));
                      
                      return options.map((option: any) => {
                        const optionId = option.id || option;
                        const optionText = option.text || option;
                        const isSelected = selectedAnswers[currentQuestion.id] === optionId;
                        const isCorrect = currentQuestion.correctAnswer === optionId;
                        return (
                          <label
                            key={optionId}
                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? isCorrect
                                  ? "bg-green-50 border-green-300"
                                  : "bg-red-50 border-red-300"
                                : isCorrect
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`preview-question-${currentQuestion.id}`}
                              value={optionId}
                              checked={isSelected}
                              onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                              className="mr-3"
                            />
                            <span className="flex-1 text-gray-700">{optionText}</span>
                            {isCorrect && (
                              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                정답
                              </span>
                            )}
                          </label>
                        );
                      });
                    })()}
                  </div>
                )}

              {/* 빈칸 채우기 또는 주관식 */}
              {(currentQuestion.questionType === "fill_blank" ||
                currentQuestion.questionType === "essay") && (
                <div className="mb-6">
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 text-center mb-4">
                      {currentQuestion.questionType === "fill_blank"
                        ? "빈칸 채우기 문제입니다."
                        : "주관식 문제입니다."}
                    </p>
                    {currentQuestion.correctAnswer && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm font-semibold text-green-700 mb-1">정답:</div>
                        <div className="text-sm text-gray-700">{currentQuestion.correctAnswer}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 해설 */}
              {currentQuestion.explanation && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-semibold text-blue-700 mb-2">해설:</div>
                  <div className="text-sm text-gray-700">{currentQuestion.explanation}</div>
                </div>
              )}

              {/* 네비게이션 버튼 */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 이전 문제
                </button>
                <div className="text-sm text-gray-500">
                  {getCurrentQuestionNumber()} / {getTotalQuestions()}
                </div>
                <button
                  onClick={handleNextQuestion}
                  disabled={
                    currentSectionIndex === sections.length - 1 &&
                    currentQuestionIndex === questions.length - 1
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 문제 →
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

