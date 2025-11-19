"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { sessionAPI, NextQuestionResponse, questionAPI, Question } from "@/lib/api";
import { socketClient } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";
import { emotionalToast } from "@/components/common/Toast";
import ProgressBar from "@/components/common/ProgressBar";
import AudioPlayer from "@/components/common/AudioPlayer";

export default function TakeExamPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;
  const sessionId = searchParams.get("sessionId") || "";
  const user = useAuthStore((state) => state.user);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState<NextQuestionResponse | null>(null);
  const [currentRegularQuestion, setCurrentRegularQuestion] = useState<Question | null>(null);
  const [sectionQuestions, setSectionQuestions] = useState<Question[]>([]);
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [ability, setAbility] = useState<number | null>(null);
  const [targetDifficulty, setTargetDifficulty] = useState<string | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [showQuestionList, setShowQuestionList] = useState(false);
  const socketConnectedRef = useRef(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const response = await sessionAPI.getSession(sessionId);
      return response.data;
    },
    enabled: !!sessionId,
    refetchInterval: 30000, // 30초마다 세션 상태 갱신
  });

  // 적응형 시험 여부 확인 및 일반 시험 문제 로드
  useEffect(() => {
    if (session?.exam?.isAdaptive) {
      setIsAdaptive(true);
    } else if (session && !session.exam?.isAdaptive) {
      setIsAdaptive(false);
      // 일반 시험: 현재 섹션의 문제 로드
      if (session.currentSectionId) {
        loadSectionQuestions(session.currentSectionId);
      }
    }
    // loadSectionQuestions는 함수이므로 의존성에서 제외 (무한 루프 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // 일반 시험: 섹션의 문제 목록 로드
  const loadSectionQuestions = async (sectionId: string) => {
    try {
      const response = await questionAPI.getQuestionsBySection(sectionId);
      const questions = response.data.data || [];
      setSectionQuestions(questions);
      
      // 현재 문제 번호에 해당하는 문제 설정
      if (session?.currentQuestionNumber && questions.length > 0) {
        const question = questions.find(
          (q) => q.questionNumber === session.currentQuestionNumber
        ) || questions[0];
        setCurrentRegularQuestion(question);
        setCurrentQuestionNumber(question.questionNumber);
      } else if (questions.length > 0) {
        setCurrentRegularQuestion(questions[0]);
        setCurrentQuestionNumber(questions[0].questionNumber);
      }
    } catch (error) {
      console.error("섹션 문제 로드 실패:", error);
    }
  };

  // 적응형 시험: 다음 문제 가져오기
  const loadNextQuestion = useRef(async (currentAnswer?: string) => {
    if (!sessionId) return;
    
    try {
      const response = await sessionAPI.getNextQuestion(sessionId, currentAnswer);
      setCurrentQuestion(response.data);
      setAbility(response.data.ability);
      setTargetDifficulty(response.data.targetDifficulty);
      setCurrentQuestionNumber(response.data.order);
    } catch (error: any) {
      console.error("다음 문제 가져오기 실패:", error);
      if (error.response?.status === 400) {
        // 적응형 시험이 아니거나 오류
        setIsAdaptive(false);
      }
    }
  });

  // 컴포넌트 마운트 시 적응형 시험 확인
  useEffect(() => {
    if (session?.exam?.isAdaptive && !currentQuestion && isAdaptive) {
      loadNextQuestion.current();
    }
    // currentQuestion을 의존성에서 제거하면 무한 루프가 발생할 수 있지만,
    // 조건에 !currentQuestion이 있어서 한 번만 실행되어야 함
    // 하지만 안전을 위해 useRef로 한 번만 실행되도록 보장
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isAdaptive]);

  // WebSocket 연결 및 모니터링 설정
  useEffect(() => {
    if (!sessionId || !user || !examId || socketConnectedRef.current) return;

    const token = localStorage.getItem("accessToken");
    const socket = socketClient.connect(token);

    // 시험 시작 알림
    socketClient.emitExamStart(sessionId, user.id, examId);
    socketConnectedRef.current = true;

    // 탭 전환 감지
    const handleVisibilityChange = () => {
      if (document.hidden) {
        socketClient.emitTabSwitch(sessionId, user.id, examId);
      } else {
        socketClient.emitActivity(sessionId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 주기적 활동 업데이트
    const activityInterval = setInterval(() => {
      socketClient.emitActivity(sessionId);
    }, 30000); // 30초마다

    // 복사/붙여넣기 방지
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      clearInterval(activityInterval);
      socketClient.emitExamEnd(sessionId);
      socketClient.disconnect();
      socketConnectedRef.current = false;
    };
  }, [sessionId, user, examId]);

  const saveAnswerMutation = useMutation({
    mutationFn: async ({
      questionId,
      answer,
    }: {
      questionId: string;
      answer: string;
    }) => {
      await sessionAPI.saveAnswer(sessionId, { questionId, answer });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await sessionAPI.submitExam(sessionId);
      return response.data;
    },
    onSuccess: (data) => {
      emotionalToast.success.examSubmitted();
      router.push(`/results/${data.examResultId}`);
    },
  });

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
    // 적응형 시험이 아닌 경우에만 자동 저장
    if (!isAdaptive && sessionId) {
    saveAnswerMutation.mutate({ questionId, answer });
    }
  };

  // 다음 문제로 이동 (적응형/일반 시험 모두 처리)
  const handleNextQuestion = () => {
    if (isAdaptive) {
      // 적응형 시험: 다음 문제 가져오기
      if (currentQuestion) {
        const currentAnswer = answers[currentQuestion.question.id] || "";
        loadNextQuestion.current(currentAnswer);
      }
      return;
    }
    
    // 일반 시험: 다음 문제로 이동
    if (!currentRegularQuestion) return;
    
    const currentIndex = sectionQuestions.findIndex(
      (q) => q.questionNumber === currentQuestionNumber
    );
    if (currentIndex < sectionQuestions.length - 1) {
      const nextQuestion = sectionQuestions[currentIndex + 1];
      goToQuestion(nextQuestion.questionNumber);
    }
  };

  // 일반 시험: 이전 문제로 이동
  const handlePrevQuestion = () => {
    if (isAdaptive || !currentRegularQuestion) return;
    
    const currentIndex = sectionQuestions.findIndex(
      (q) => q.questionNumber === currentQuestionNumber
    );
    if (currentIndex > 0) {
      const prevQuestion = sectionQuestions[currentIndex - 1];
      goToQuestion(prevQuestion.questionNumber);
    }
  };

  const toggleBookmark = (questionId: string) => {
    setBookmarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const goToQuestion = (questionNumber: number) => {
    if (isAdaptive) return; // 적응형 시험에서는 이동 불가
    
    setCurrentQuestionNumber(questionNumber);
    setShowQuestionList(false);
    // 해당 문제 데이터 찾기
    const question = sectionQuestions.find((q) => q.questionNumber === questionNumber);
    if (question) {
      setCurrentRegularQuestion(question);
    }
  };


  const handleSubmit = () => {
    if (confirm(t("exam.confirmSubmit"))) {
      submitMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">{t("common.loading")}</div>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-error">
            {t("common.error")}
          </div>
        </div>
      </>
    );
  }

  // 진행률 계산 (세션이 로드된 후)
  const answeredCount = Object.keys(answers).length;
  const estimatedTotal = session?.totalQuestions || session?.exam?.totalQuestions || 50;
  const currentTotal = isAdaptive 
    ? estimatedTotal 
    : sectionQuestions.length || estimatedTotal;
  
  // 문제 목록 생성 (일반 시험용)
  const questionList = isAdaptive
    ? Array.from({ length: currentTotal }, (_, i) => i + 1)
    : sectionQuestions.map((q) => q.questionNumber).sort((a, b) => a - b);

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-6">
          {/* 메인 콘텐츠 */}
          <div className="flex-1 bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{session.exam?.title}</h1>
            <div className="flex items-center gap-4">
              {!isAdaptive && (
                <button
                  onClick={() => setShowQuestionList(!showQuestionList)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                  aria-label="문제 목록 토글"
                >
                  {showQuestionList ? t("common.close") : t("exam.questionList")}
                </button>
              )}
            <div className="text-sm text-gray-600">
              {t("exam.timeRemaining")}: {session.expiresAt ? t("common.loading") : "-"}
              </div>
            </div>
          </div>

          {/* 적응형 시험 정보 */}
          {isAdaptive && (
            <div className="mb-4 p-4 bg-gradient-to-r from-theme-secondary/10 to-theme-primary/10 rounded-lg border border-theme-secondary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-theme-secondary">🎯 {t("exam.adaptive")}</span>
                  {ability !== null && (
                    <span className="text-sm text-gray-600">
                      능력 추정: <span className="font-semibold">{ability.toFixed(2)}</span>
                    </span>
                  )}
                  {targetDifficulty && (
                    <span className="text-sm text-gray-600">
                      현재 난이도: <span className="font-semibold">{targetDifficulty}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 진행률 바 */}
          <div className="mb-8">
            <ProgressBar
              current={currentQuestionNumber}
              total={currentTotal}
              message={`${t("exam.question")} ${currentQuestionNumber} ${t("exam.of")} ${currentTotal}`}
              color="blue"
              size="md"
            />
            {/* 진행 상황 격려 메시지 */}
            {answeredCount > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                ✅ {answeredCount}개 문제 답변 완료
                {answeredCount >= currentTotal * 0.8 && " 💪 거의 다 했어요!"}
              </p>
            )}
          </div>

          {/* 문제 표시 */}
          <div className="mb-8">
            {isAdaptive && currentQuestion ? (
              <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">문제 {currentQuestion.order}</div>
                    {currentQuestion.question.difficulty && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        currentQuestion.question.difficulty === 'hard' ? 'bg-error/20 text-error' :
                        currentQuestion.question.difficulty === 'medium' ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      }`}>
                        {currentQuestion.question.difficulty === 'hard' ? '어려움' :
                         currentQuestion.question.difficulty === 'medium' ? '중급' : '쉬움'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleBookmark(currentQuestion.question.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      bookmarkedQuestions.has(currentQuestion.question.id)
                        ? "bg-warning/20 text-warning"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                    aria-label="북마크 토글"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  </button>
                </div>
                
                {/* 오디오 재생 (Part 4: Listening) */}
                {currentQuestion.question.audioUrl && (
                  <div className="mb-4">
                    <AudioPlayer
                      src={currentQuestion.question.audioUrl}
                      playLimit={currentQuestion.question.audioPlayLimit || 2}
                    />
                  </div>
                )}
                
                {/* 이미지 표시 (Part 1: Vocabulary & Grammar) */}
                {currentQuestion.question.imageUrl && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={currentQuestion.question.imageUrl}
                      alt="문제 이미지"
                      className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                )}
                
                <div className="text-lg font-semibold mb-4">{currentQuestion.question.content}</div>
                
                {currentQuestion.question.questionType === 'multiple_choice' && currentQuestion.question.options && (
                  <div className="space-y-2">
                    {Object.entries(currentQuestion.question.options).map(([key, value]: [string, any]) => (
                      <label key={key} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.question.id}`}
                          value={key}
                          checked={answers[currentQuestion.question.id] === key}
                          onChange={(e) => handleAnswerChange(currentQuestion.question.id, e.target.value)}
                          className="mr-3"
                        />
                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              currentRegularQuestion ? (
                <div className="bg-white border-2 border-theme-primary/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-500">문제 {currentRegularQuestion.questionNumber}</div>
                      {currentRegularQuestion.difficulty && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          currentRegularQuestion.difficulty === 'hard' ? 'bg-error/20 text-error' :
                          currentRegularQuestion.difficulty === 'medium' ? 'bg-warning/20 text-warning' :
                          'bg-success/20 text-success'
                        }`}>
                          {currentRegularQuestion.difficulty === 'hard' ? '어려움' :
                           currentRegularQuestion.difficulty === 'medium' ? '중급' : '쉬움'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleBookmark(currentRegularQuestion.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        bookmarkedQuestions.has(currentRegularQuestion.id)
                          ? "bg-warning/20 text-warning"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      aria-label="북마크 토글"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 오디오 재생 (Part 4: Listening) */}
                  {currentRegularQuestion.audioUrl && (
                    <div className="mb-4">
                      <AudioPlayer
                        src={currentRegularQuestion.audioUrl}
                        playLimit={currentRegularQuestion.audioPlayLimit || 2}
                      />
                    </div>
                  )}
                  
                  {/* 이미지 표시 (Part 1: Vocabulary & Grammar) */}
                  {currentRegularQuestion.imageUrl && (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={currentRegularQuestion.imageUrl}
                        alt="문제 이미지"
                        className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                        style={{ maxHeight: "400px" }}
                      />
                    </div>
                  )}
                  
                  <div className="text-lg font-semibold mb-4">{currentRegularQuestion.content}</div>
                  
                  {currentRegularQuestion.questionType === 'multiple_choice' && currentRegularQuestion.options && (
                    <div className="space-y-2">
                      {(() => {
                        const options = Array.isArray(currentRegularQuestion.options)
                          ? currentRegularQuestion.options
                          : Object.entries(currentRegularQuestion.options).map(([id, text]) => ({ id, text }));
                        return options.map((option: any) => (
                          <label key={option.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${currentRegularQuestion.id}`}
                              value={option.id}
                              checked={answers[currentRegularQuestion.id] === option.id}
                              onChange={(e) => handleAnswerChange(currentRegularQuestion.id, e.target.value)}
                              className="mr-3"
                            />
                            <span>{option.text || option}</span>
                          </label>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              ) : (
            <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-center text-gray-500">
                    문제를 불러오는 중...
                  </div>
            </div>
              )
            )}
          </div>

          <div className="flex justify-between">
            {!isAdaptive && (
            <Button
                onClick={handlePrevQuestion}
                disabled={currentQuestionNumber === (sectionQuestions[0]?.questionNumber || 1)}
                variant="outline"
            >
              {t("common.previous")}
            </Button>
            )}
            {isAdaptive && <div />}
            <button
              onClick={handleNextQuestion}
              disabled={
                isAdaptive 
                  ? !currentQuestion 
                  : currentQuestionNumber === (sectionQuestions[sectionQuestions.length - 1]?.questionNumber || currentTotal)
              }
              className="px-6 py-3 bg-button-primary text-button-text rounded-lg hover:bg-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdaptive ? t("exam.nextQuestion") : t("common.next")}
            </button>
            {isAdaptive && <div />}
          </div>

          <div className="mt-8 pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="w-full bg-error text-white px-6 py-3 rounded-md font-medium hover:bg-error disabled:opacity-50"
            >
              {submitMutation.isPending ? t("exam.submitting") : t("exam.submitExam")}
            </button>
          </div>
          </div>

        {/* 문제 목록 사이드바 (일반 시험만) */}
        {!isAdaptive && showQuestionList && (
          <div className="w-80 bg-white rounded-lg shadow-lg p-4 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t("exam.questionList")}</h3>
              <button
                onClick={() => setShowQuestionList(false)}
                className="p-1 rounded hover:bg-gray-100"
                aria-label="목록 닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {questionList.map((num) => {
                const questionId = `question-${num}`;
                const hasAnswer = answers[questionId] !== undefined;
                const isBookmarked = bookmarkedQuestions.has(questionId);
                const isCurrent = num === currentQuestionNumber;
                
                return (
                  <button
                    key={num}
                    onClick={() => goToQuestion(num)}
                    className={`p-2 rounded text-sm font-medium transition-all ${
                      isCurrent
                        ? "bg-button-primary text-button-text ring-2 ring-theme-primary/30"
                        : hasAnswer
                        ? "bg-success/20 text-success hover:bg-success/30"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${isBookmarked ? "ring-2 ring-warning/40" : ""}`}
                    title={`문제 ${num}${isBookmarked ? " (북마크됨)" : ""}${hasAnswer ? " (답변 완료)" : ""}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{num}</span>
                      {isBookmarked && (
                        <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {bookmarkedQuestions.size > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">
                  북마크된 문제: {bookmarkedQuestions.size}개
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
