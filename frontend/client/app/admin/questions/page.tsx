"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { adminAPI, questionAPI, examAPI, Question, CreateQuestionDto } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";
import MediaUploader from "@/components/admin/MediaUploader";
import AudioPlayer from "@/components/common/AudioPlayer";

// Section 타입 정의
interface Section {
  id: string;
  examId: string;
  title: string;
  description?: string;
  order: number;
  questionCount: number;
  timeLimit?: number;
}

export default function AdminQuestionsPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState("");

  // 클라이언트에서만 마운트됨을 표시 (hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [examFilter, setExamFilter] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState<string>("");
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [statisticsQuestionId, setStatisticsQuestionId] = useState<string | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageQuestionId, setUsageQuestionId] = useState<string | null>(null);
  const [showDifficultyUpdateModal, setShowDifficultyUpdateModal] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // 전체 문제 목록 조회
  const { data: questionsResponse, isLoading } = useQuery({
    queryKey: ["admin-questions", search, difficultyFilter, examFilter],
    queryFn: async () => {
      const response = await adminAPI.getQuestions({
        search: search || undefined,
        difficulty: difficultyFilter ? (difficultyFilter as "easy" | "medium" | "hard") : undefined,
        examId: examFilter || undefined,
        limit: 100,
      });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  // 시험 목록 조회 (필터용)
  const { data: examsResponse } = useQuery({
    queryKey: ["admin-exams-for-filter"],
    queryFn: async () => {
      const response = await examAPI.getExams({ limit: 1000 });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const questions = questionsResponse?.data || [];
  const exams = examsResponse?.data || [];

  // 문제 은행 목록 조회 (Question 생성 시 선택용)
  const { data: questionBanksResponse } = useQuery({
    queryKey: ["admin-question-banks"],
    queryFn: async () => {
      const response = await adminAPI.getQuestionBanks({
        includeQuestions: false,
      });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const questionBanks = questionBanksResponse?.data || [];

  // 문제 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await questionAPI.deleteQuestion(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast.success(t("admin.questionManagement.deleteSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.questionManagement.deleteFailed"));
    },
  });

  const handleDelete = (question: any) => {
    if (typeof window !== 'undefined' && confirm(`${t("admin.questionManagement.confirmDelete")}\n\n${question.content.substring(0, 50)}...`)) {
      deleteMutation.mutate(question.id);
    }
  };

  // 클라이언트에서만 리다이렉트 (SSR 방지)
  useEffect(() => {
    if (typeof window !== 'undefined' && (!user || user.role !== "admin")) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // SSR 중에는 로딩 표시
  if (typeof window === 'undefined' || !user || user.role !== "admin") {
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("admin.questionManagement.loading")} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {t("admin.questionManagement.title")}
          </h1>
          <div className="flex gap-2 flex-wrap">
            {selectedQuestionIds.size > 0 && (
              <Button
                onClick={() => setShowDifficultyUpdateModal(true)}
                variant="secondary"
                size="sm"
              >
                {t("admin.questionManagement.autoUpdateDifficulty")} ({selectedQuestionIds.size})
              </Button>
            )}
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
            >
              + {t("admin.questionManagement.createNew")}
            </Button>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
            >
              ← 대시보드
            </Link>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder={t("admin.questionManagement.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md"
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">{t("admin.questionManagement.allDifficulty")}</option>
            <option value="easy">{t("admin.questionManagement.difficulty.easy")}</option>
            <option value="medium">{t("admin.questionManagement.difficulty.medium")}</option>
            <option value="hard">{t("admin.questionManagement.difficulty.hard")}</option>
          </select>
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">{t("admin.questionManagement.allExams")}</option>
            {exams.map((exam: any) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>

        {/* 문제 목록 */}
        {questions.length === 0 ? (
          <div className="bg-surface rounded-lg shadow p-8 text-center text-text-muted">
            {search || difficultyFilter || examFilter
              ? t("admin.questionManagement.noResults")
              : t("admin.questionManagement.noQuestions")}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question: any) => (
              <div
                key={question.id}
                className="bg-surface rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {question.difficulty && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            question.difficulty === "easy"
                              ? "bg-green-100 text-green-700"
                              : question.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {question.difficulty === "easy"
                            ? t("admin.questionManagement.difficulty.easy")
                            : question.difficulty === "medium"
                            ? t("admin.questionManagement.difficulty.medium")
                            : t("admin.questionManagement.difficulty.hard")}
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {question.questionType === "multiple_choice"
                          ? t("admin.questionManagement.questionType.multipleChoice")
                          : question.questionType === "fill_blank"
                          ? t("admin.questionManagement.questionType.fillBlank")
                          : t("admin.questionManagement.questionType.subjective")}
                      </span>
                      <span className="text-sm text-text-muted">
                        {question.points}{t("admin.questionManagement.points")}
                      </span>
                    </div>
                    <p className="text-text-primary mb-2 line-clamp-2">
                      {question.content}
                    </p>
                    {question.section && (
                      <div className="text-sm text-text-muted mb-2">
                        <Link
                          href={`/admin/exams/${question.section.examId}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {question.section.exam?.title || t("exam.title")}
                        </Link>
                        {" > "}
                        <Link
                          href={`/admin/exams/${question.section.examId}/sections/${question.section.id}/questions`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {question.section.title}
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
                      {question.usageCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">사용 횟수:</span>
                          <span className="text-link font-semibold">{question.usageCount}</span>
                        </span>
                      )}
                      {question.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">마지막 사용:</span>
                          <span>{isMounted ? new Date(question.lastUsedAt).toLocaleDateString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US") : new Date(question.lastUsedAt).toISOString().split('T')[0]}</span>
                        </span>
                      )}
                      {question.createdAt && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">생성일:</span>
                          <span>{isMounted ? new Date(question.createdAt).toLocaleDateString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US") : new Date(question.createdAt).toISOString().split('T')[0]}</span>
                        </span>
                      )}
                    </div>
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {question.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-surface-hover text-text-primary rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setUsageQuestionId(question.id);
                        setShowUsageModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 px-3 py-2 text-sm border border-indigo-600 rounded-md hover:bg-indigo-50"
                      title={t("admin.questionManagement.usageTracking.title")}
                    >
                      {t("admin.questionManagement.usageTracking.track")}
                    </button>
                    <button
                      onClick={() => {
                        setStatisticsQuestionId(question.id);
                        setShowStatisticsModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-700 px-3 py-2 text-sm border border-purple-600 rounded-md hover:bg-purple-50"
                      title={t("admin.questionManagement.statistics")}
                    >
                      {t("admin.questionManagement.statistics")}
                    </button>
                    <button
                      onClick={() => {
                        setPreviewQuestion(question);
                        setShowPreviewModal(true);
                      }}
                      className="text-green-600 hover:text-green-700 px-3 py-2 text-sm border border-green-600 rounded-md hover:bg-green-50"
                      title={t("admin.questionManagement.preview")}
                    >
                      {t("admin.questionManagement.preview")}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedQuestion(question);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm border border-blue-600 rounded-md hover:bg-blue-50"
                    >
                      {t("admin.questionManagement.edit")}
                    </button>
                    <button
                      onClick={() => handleDelete(question)}
                      className="text-red-600 hover:text-red-700 px-3 py-2 text-sm"
                    >
                      {t("admin.questionManagement.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 통계 */}
        <div className="mt-8 bg-surface rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">문제 통계</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-text-muted">전체 문제</div>
              <div className="text-2xl font-bold text-text-primary">
                {questions.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-muted">객관식</div>
              <div className="text-2xl font-bold text-blue-600">
                {questions.filter((q: any) => q.questionType === "multiple_choice").length}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-muted">빈칸 채우기</div>
              <div className="text-2xl font-bold text-green-600">
                {questions.filter((q: any) => q.questionType === "fill_blank").length}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-muted">주관식</div>
              <div className="text-2xl font-bold text-purple-600">
                {questions.filter((q: any) => q.questionType === "essay").length}
              </div>
            </div>
          </div>
        </div>

        {/* 문제 생성 모달 (독립적인 생성) */}
        {showCreateModal && !selectedQuestion && (
          <QuestionModal
            questionBankId={selectedQuestionBankId || undefined}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedQuestionBankId("");
            }}
            onSuccess={() => {
              setShowCreateModal(false);
              setSelectedQuestionBankId("");
              queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
            }}
          />
        )}

        {/* 문제 수정 모달 */}
        {showEditModal && selectedQuestion && (
          <QuestionModal
            question={selectedQuestion}
            onClose={() => {
              setShowEditModal(false);
              setSelectedQuestion(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedQuestion(null);
              queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
            }}
          />
        )}

        {/* 문제 미리보기 모달 */}
        {showPreviewModal && previewQuestion && (
          <QuestionPreviewModal
            question={previewQuestion}
            onClose={() => {
              setShowPreviewModal(false);
              setPreviewQuestion(null);
            }}
          />
        )}

        {/* 문제 통계 모달 */}
        {showStatisticsModal && statisticsQuestionId && (
          <QuestionStatisticsModal
            questionId={statisticsQuestionId}
            onClose={() => {
              setShowStatisticsModal(false);
              setStatisticsQuestionId(null);
            }}
          />
        )}

        {/* 문제 사용 추적 모달 */}
        {showUsageModal && usageQuestionId && (
          <QuestionUsageModal
            questionId={usageQuestionId}
            onClose={() => {
              setShowUsageModal(false);
              setUsageQuestionId(null);
            }}
          />
        )}

        {/* 난이도 자동 업데이트 모달 */}
        {showDifficultyUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-surface rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">난이도 자동 업데이트</h2>
              <p className="text-text-secondary mb-4">
                선택한 {selectedQuestionIds.size}개의 문제의 난이도를 통계 기반으로 자동 업데이트합니다.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowDifficultyUpdateModal(false);
                    setSelectedQuestionIds(new Set());
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  취소
                </button>
                <Button
                  onClick={async () => {
                    // TODO: 난이도 자동 업데이트 기능 구현
                    toast.info("난이도 자동 업데이트 기능은 준비 중입니다.");
                    setShowDifficultyUpdateModal(false);
                    setSelectedQuestionIds(new Set());
                  }}
                  size="sm"
                >
                  업데이트
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// 문제 통계 모달 컴포넌트
function QuestionStatisticsModal({
  questionId,
  onClose,
}: {
  questionId: string;
  onClose: () => void;
}) {
  const { locale } = useLocaleStore();
  const [isMounted, setIsMounted] = useState(false);
  const queryClient = useQueryClient();

  // 클라이언트에서만 마운트됨을 표시 (hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { data: statisticsResponse, isLoading } = useQuery({
    queryKey: ["question-statistics", questionId],
    queryFn: async () => {
      const response = await adminAPI.getQuestionStatistics(questionId);
      return response.data;
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await adminAPI.calculateQuestionStatistics(questionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-statistics", questionId] });
      toast.success("통계가 재계산되었습니다.");
    },
  });

  const statistics = statisticsResponse?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary">문제 통계</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner message="통계를 불러오는 중..." />
            </div>
          ) : statistics ? (
            <div className="space-y-6">
              {/* 요약 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 font-medium mb-1">총 시도</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {statistics.totalAttempts}
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700 font-medium mb-1">정답</div>
                  <div className="text-2xl font-bold text-green-900">
                    {statistics.correctCount}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-error font-medium mb-1">오답</div>
                  <div className="text-2xl font-bold text-error">
                    {statistics.incorrectCount}
                  </div>
                </div>
                <div className="bg-surface-hover border border-border rounded-lg p-4">
                  <div className="text-sm text-text-primary font-medium mb-1">미답변</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {statistics.unansweredCount}
                  </div>
                </div>
              </div>

              {/* 정답률 및 난이도 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-700 font-medium mb-1">정답률</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {statistics.correctRate !== null && statistics.correctRate !== undefined
                      ? `${Number(statistics.correctRate).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm text-orange-700 font-medium mb-1">계산된 난이도</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {statistics.calculatedDifficulty !== null &&
                    statistics.calculatedDifficulty !== undefined
                      ? Number(statistics.calculatedDifficulty).toFixed(2)
                      : "N/A"}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    (0.00=쉬움, 1.00=어려움)
                  </div>
                </div>
              </div>

              {/* 평균 소요 시간 */}
              {statistics.averageTimeSpent !== null &&
                statistics.averageTimeSpent !== undefined && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-yellow-700 font-medium mb-1">
                      평균 소요 시간
                    </div>
                    <div className="text-xl font-bold text-yellow-900">
                      {statistics.averageTimeSpent}초
                    </div>
                  </div>
                )}

              {/* 오답 패턴 */}
              {statistics.commonMistakes &&
                Object.keys(statistics.commonMistakes).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">
                      주요 오답 패턴
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(statistics.commonMistakes)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([answer, count]) => (
                          <div
                            key={answer}
                            className="flex items-center justify-between p-3 bg-surface-hover rounded-lg border border-border"
                          >
                            <span className="text-text-primary font-medium">{answer}</span>
                            <span className="text-error font-semibold">{count as number}회</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* 마지막 계산 일시 */}
              {statistics.lastCalculatedAt && (
                <div className="text-sm text-text-muted text-center">
                  마지막 계산:{" "}
                  {isMounted ? new Date(statistics.lastCalculatedAt).toLocaleString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US") : new Date(statistics.lastCalculatedAt).toISOString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              통계 데이터가 없습니다.
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-surface border-t border-border p-6 flex justify-between">
          <button
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            className="px-4 py-2 bg-button-primary text-button-text rounded-md hover:bg-button-primary disabled:opacity-50"
          >
            {recalculateMutation.isPending ? "재계산 중..." : "통계 재계산"}
          </button>
          <Button
            onClick={onClose}
            variant="outline"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}

// 문제 미리보기 모달 컴포넌트
function QuestionPreviewModal({
  question,
  onClose,
}: {
  question: Question;
  onClose: () => void;
}) {
  // 옵션 형식 변환
  const options = question.options
    ? Array.isArray(question.options)
      ? question.options
      : Object.entries(question.options).map(([id, text]) => ({ id, text: String(text) }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">문제 미리보기</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {/* 문제 메타 정보 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
              {question.questionType === "multiple_choice"
                ? "객관식"
                : question.questionType === "fill_blank"
                ? "빈칸 채우기"
                : "주관식"}
            </span>
            {question.difficulty && (
              <span
                className={`px-2 py-1 text-xs rounded ${
                  question.difficulty === "easy"
                    ? "bg-green-100 text-green-700"
                    : question.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {question.difficulty === "easy"
                  ? "쉬움"
                  : question.difficulty === "medium"
                  ? "보통"
                  : "어려움"}
              </span>
            )}
            <span className="text-sm text-gray-500">{question.points}점</span>
          </div>

          {/* 오디오 재생 (Part 4: Listening) */}
          {question.audioUrl && (
            <div className="mb-4">
              <AudioPlayer
                src={question.audioUrl}
                playLimit={question.audioPlayLimit || 2}
              />
            </div>
          )}

          {/* 이미지 표시 (Part 1: Vocabulary & Grammar) */}
          {question.imageUrl && (
            <div className="mb-4 flex justify-center">
              <img
                src={question.imageUrl}
                alt="문제 이미지"
                className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                style={{ maxHeight: "400px" }}
              />
            </div>
          )}

          {/* 문제 내용 */}
          <div className="text-lg font-semibold mb-6 text-gray-900">
            {question.content}
          </div>

          {/* 선택지 (객관식인 경우) */}
          {question.questionType === "multiple_choice" && options.length > 0 && (
            <div className="space-y-2 mb-6">
              {options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-not-allowed bg-gray-50"
                >
                  <input
                    type="radio"
                    name={`preview-question-${question.id}`}
                    value={option.id}
                    disabled
                    className="mr-3 cursor-not-allowed"
                  />
                  <span className="text-gray-700">{option.text}</span>
                  {option.id === question.correctAnswer && (
                    <span className="ml-auto px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      정답
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {/* 빈칸 채우기 또는 주관식 */}
          {(question.questionType === "fill_blank" ||
            question.questionType === "essay") && (
            <div className="mb-6">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500 text-center">
                  {question.questionType === "fill_blank"
                    ? "빈칸 채우기 문제입니다."
                    : "주관식 문제입니다."}
                </p>
                {question.correctAnswer && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-semibold text-green-700 mb-1">
                      정답:
                    </div>
                    <div className="text-sm text-gray-700">
                      {question.correctAnswer}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 해설 */}
          {question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-700 mb-2">
                해설:
              </div>
              <div className="text-sm text-gray-700">{question.explanation}</div>
            </div>
          )}

          {/* 태그 */}
          {question.tags && question.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {question.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end">
          <Button
            onClick={onClose}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}


// 문제 생성/수정 모달
function QuestionModal({
  questionBankId,
  question,
  onClose,
  onSuccess,
}: {
  questionBankId?: string;
  question?: Question | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  // 문제 은행 목록 조회
  const { data: questionBanksResponse } = useQuery({
    queryKey: ["admin-question-banks"],
    queryFn: async () => {
      const response = await adminAPI.getQuestionBanks({
        includeQuestions: false,
      });
      return response.data;
    },
  });

  const questionBanks = questionBanksResponse?.data || [];

  const [formData, setFormData] = useState<CreateQuestionDto>({
    questionNumber: question?.questionNumber || 1,
    questionType: question?.questionType || 'multiple_choice',
    content: question?.content || '',
    options: question?.options
      ? (Array.isArray(question.options)
          ? question.options
          : Object.entries(question.options).map(([id, text]) => ({ id, text })))
      : [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
    correctAnswer: question?.correctAnswer || '',
    explanation: question?.explanation || '',
    points: question?.points || 1,
    difficulty: question?.difficulty,
    tags: question?.tags || [],
    imageUrl: question?.imageUrl,
    audioUrl: question?.audioUrl,
    audioPlayLimit: question?.audioPlayLimit || 2,
    questionBankId: questionBankId || question?.questionBankId,
  });

  const [newTag, setNewTag] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: CreateQuestionDto) => {
      if (question) {
        await questionAPI.updateQuestion(question.id, data);
      } else {
        // 독립적인 Question 생성 (sectionId 없이)
        await questionAPI.createQuestion(data);
      }
    },
    onSuccess: () => {
      toast.success(question ? "문제가 수정되었습니다." : "문제가 생성되었습니다.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (question ? "문제 수정에 실패했습니다." : "문제 생성에 실패했습니다."));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addOption = () => {
    const nextId = String.fromCharCode(65 + (formData.options?.length || 0));
    setFormData({
      ...formData,
      options: [...(formData.options || []), { id: nextId, text: '' }],
    });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], text };
    setFormData({ ...formData, options: newOptions });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {question ? "문제 수정" : "새 문제 추가"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            {question?.sectionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문제 번호 *
                </label>
                <input
                  type="number"
                  required
                  value={formData.questionNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, questionNumber: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={1}
                />
              </div>
            )}

            <div className={question?.sectionId ? "" : "col-span-2"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제 유형 *
              </label>
              <select
                required
                value={formData.questionType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    questionType: e.target.value as 'multiple_choice' | 'fill_blank' | 'essay',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="multiple_choice">객관식</option>
                <option value="fill_blank">빈칸 채우기</option>
                <option value="essay">주관식</option>
              </select>
            </div>
          </div>

          {/* 문제 은행 선택 (선택적) */}
          {!question && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제 은행 (선택사항)
              </label>
              <select
                value={formData.questionBankId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, questionBankId: e.target.value || undefined })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">문제 은행 선택 안 함</option>
                {questionBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                    {bank.category && ` (${bank.category})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 문제 은행에 속하면 카테고리별로 관리할 수 있습니다.
              </p>
            </div>
          )}

          {/* 문제 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 내용 *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="문제 내용을 입력하세요"
            />
          </div>

          {/* 미디어 첨부 */}
          <div className="grid grid-cols-2 gap-4">
            <MediaUploader
              type="image"
              currentUrl={formData.imageUrl}
              onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
              onRemove={() => setFormData({ ...formData, imageUrl: undefined })}
            />
            <MediaUploader
              type="audio"
              currentUrl={formData.audioUrl}
              onUploadComplete={(url) => setFormData({ ...formData, audioUrl: url })}
              onRemove={() => setFormData({ ...formData, audioUrl: undefined })}
            />
          </div>

          {/* 오디오 재생 제한 */}
          {formData.audioUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                오디오 재생 횟수 제한
              </label>
              <input
                type="number"
                value={formData.audioPlayLimit || 2}
                onChange={(e) =>
                  setFormData({ ...formData, audioPlayLimit: parseInt(e.target.value) || 2 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min={1}
                max={10}
              />
            </div>
          )}

          {/* 선택지 (객관식일 때) */}
          {formData.questionType === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택지 *
              </label>
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-8 text-sm font-semibold text-gray-600">
                      {option.id}
                    </span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`선택지 ${option.id} 내용`}
                    />
                    {formData.options && formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  + 선택지 추가
                </button>
              </div>
            </div>
          )}

          {/* 정답 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정답 *
            </label>
            {formData.questionType === 'multiple_choice' ? (
              <select
                required
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {formData.options?.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="정답을 입력하세요"
              />
            )}
          </div>

          {/* 해설 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해설
            </label>
            <textarea
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="해설을 입력하세요"
            />
          </div>

          {/* 기타 설정 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배점
              </label>
              <input
                type="number"
                value={formData.points || 1}
                onChange={(e) =>
                  setFormData({ ...formData, points: parseInt(e.target.value) || 1 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                난이도
              </label>
              <select
                value={formData.difficulty || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty: (e.target.value || undefined) as 'easy' | 'medium' | 'hard' | undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택 안 함</option>
                <option value="easy">쉬움</option>
                <option value="medium">중급</option>
                <option value="hard">어려움</option>
              </select>
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="태그 입력 후 Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                추가
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              {createMutation.isPending
                ? question
                  ? "수정 중..."
                  : "생성 중..."
                : question
                ? "수정"
                : "생성"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 문제 사용 추적 모달 컴포넌트
function QuestionUsageModal({
  questionId,
  onClose,
}: {
  questionId: string;
  onClose: () => void;
}) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트에서만 마운트됨을 표시 (hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: usageResponse, isLoading } = useQuery({
    queryKey: ["question-usage", questionId],
    queryFn: async () => {
      const response = await adminAPI.getQuestionUsage(questionId);
      return response.data;
    },
  });

  const trace = usageResponse?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t("admin.questionManagement.usageTracking.modalTitle")}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner message={t("admin.questionManagement.usageTracking.loading")} />
            </div>
          ) : trace ? (
            <div className="space-y-6">
              {/* 문제 정보 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t("admin.questionManagement.usageTracking.questionInfo")}</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{t("admin.questionManagement.usageTracking.content")}:</span> {trace.question.content.substring(0, 100)}
                    {trace.question.content.length > 100 && "..."}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <span className="font-medium">{t("admin.questionManagement.usageTracking.type")}:</span>{" "}
                      {trace.question.questionType === "multiple_choice"
                        ? t("admin.questionManagement.multipleChoice")
                        : trace.question.questionType === "fill_blank"
                        ? t("admin.questionManagement.fillBlank")
                        : t("admin.questionManagement.subjective")}
                    </span>
                    {trace.question.difficulty && (
                      <span className="text-gray-600">
                        <span className="font-medium">{t("admin.questionManagement.usageTracking.difficulty")}:</span>{" "}
                        {trace.question.difficulty === "easy"
                          ? t("admin.questionManagement.easy")
                          : trace.question.difficulty === "medium"
                          ? t("admin.questionManagement.medium")
                          : t("admin.questionManagement.hard")}
                      </span>
                    )}
                    {trace.question.questionBank && (
                      <span className="text-gray-600">
                        <span className="font-medium">{t("admin.questionManagement.usageTracking.questionBank")}:</span> {trace.question.questionBank.name}
                      </span>
                    )}
                  </div>
                  {trace.question.tags && trace.question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {trace.question.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 현재 사용 중인 시험 */}
              {trace.currentUsage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">{t("admin.questionManagement.usageTracking.currentlyInUse")}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/exams/${trace.currentUsage.exam.id}`}
                        className="text-blue-700 hover:text-blue-900 font-semibold"
                      >
                        {trace.currentUsage.exam.title}
                      </Link>
                    </div>
                    <div className="text-sm text-blue-700">
                      {t("admin.questionManagement.usageTracking.section")}: {trace.currentUsage.section.title} - {t("admin.questionManagement.usageTracking.questionNumber", { number: trace.currentUsage.questionNumber })}
                    </div>
                  </div>
                </div>
              )}

              {/* 사용 이력 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t("admin.questionManagement.usageTracking.usageHistory")} ({trace.totalUsages}{t("common.count") || "개"})
                </h3>
                {trace.usageHistory.length > 0 ? (
                  <div className="space-y-3">
                    {trace.usageHistory.map((usage, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Link
                                href={`/admin/exams/${usage.exam.id}`}
                                className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                              >
                                {usage.exam.title}
                              </Link>
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                {usage.exam.examType}
                              </span>
                              {usage.exam.status && (
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    usage.exam.status === "published"
                                      ? "bg-green-100 text-green-700"
                                      : usage.exam.status === "draft"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {usage.exam.status === "published"
                                    ? t("admin.questionManagement.usageTracking.status.published")
                                    : usage.exam.status === "draft"
                                    ? t("admin.questionManagement.usageTracking.status.draft")
                                    : t("admin.questionManagement.usageTracking.status.archived")}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {t("admin.questionManagement.usageTracking.section")}: {usage.section.title} ({t("admin.questionManagement.usageTracking.order")}: {usage.section.order}) - {t("admin.questionManagement.usageTracking.questionNumber", { number: usage.questionNumber })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t("admin.questionManagement.usageTracking.usedAt")}: {isMounted ? new Date(usage.usedAt).toLocaleString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US") : new Date(usage.usedAt).toISOString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t("admin.questionManagement.usageTracking.noUsageHistory")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {t("admin.questionManagement.usageTracking.failedToLoad")}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}

