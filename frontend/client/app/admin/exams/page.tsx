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
import { examAPI, apiClient, PaginatedResponse, Exam } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/components/common/Toast";
import ContextMenu, { ContextMenuItem } from "@/components/admin/ContextMenu";

export default function AdminExamsPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [cloneTitle, setCloneTitle] = useState("");
  const [createVersion, setCreateVersion] = useState(false);
  const [version, setVersion] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [versionsExamId, setVersionsExamId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Exam>>({
    queryKey: ["admin-exams", page, search, statusFilter],
    queryFn: async (): Promise<PaginatedResponse<Exam>> => {
      const response = await examAPI.getExams({
        page,
        limit: 20,
        examType: search || undefined,
      });
      return response.data; // { data: Exam[], meta: {...} }
    },
    enabled: user?.role === "admin",
  });

  // 상태 필터 적용 (클라이언트 사이드)
  const filteredExams = data?.data?.filter((exam) => {
    if (!statusFilter) return true;
    return exam.status === statusFilter;
  }) || [];

  const deleteMutation = useMutation({
    mutationFn: async (examId: string) => {
      await apiClient.delete(`/exams/${examId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      toast.success(t("admin.examManagement.messages.deleteSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.examManagement.messages.deleteFailed"));
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async ({ 
      examId, 
      title, 
      createVersion, 
      version, 
      shuffleQuestions 
    }: { 
      examId: string; 
      title?: string;
      createVersion?: boolean;
      version?: string;
      shuffleQuestions?: boolean;
    }) => {
      const response = await examAPI.cloneExam(examId, {
        title,
        createVersion,
        version: version || undefined,
        shuffleQuestions,
      });
      return response.data;
    },
    onSuccess: (clonedExam) => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      toast.success(createVersion ? t("admin.examManagement.messages.versionCreated") : t("admin.examManagement.messages.cloneSuccess"));
      setShowCloneModal(false);
      setSelectedExam(null);
      setCloneTitle("");
      setCreateVersion(false);
      setVersion("");
      setShuffleQuestions(false);
      // 복제된 시험 상세 페이지로 이동
      router.push(`/admin/exams/${clonedExam.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.examManagement.messages.cloneFailed"));
    },
  });

  // 버전 목록 조회
  const { data: versionsData } = useQuery({
    queryKey: ["exam-versions", versionsExamId],
    queryFn: async () => {
      if (!versionsExamId) return [];
      const response = await examAPI.getExamVersions(versionsExamId);
      return response.data;
    },
    enabled: !!versionsExamId && showVersionsModal,
  });

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

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {t("admin.examManagement.title")}
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="text-theme-primary hover:text-theme-primary/80 px-4 py-2 rounded-md border border-theme-primary"
            >
              ← {t("admin.dashboard")}
            </Link>
            <Link
              href="/admin/exams/create"
              className="bg-button-primary text-button-text px-4 py-2 rounded-md hover:opacity-90 inline-flex items-center justify-center"
            >
              + {t("admin.examManagement.createNew")}
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder={t("admin.examManagement.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:w-64 px-4 py-2 border rounded-md"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">{t("admin.examManagement.allStatus")}</option>
            <option value="draft">{t("admin.examManagement.draft")}</option>
            <option value="published">{t("admin.examManagement.published")}</option>
            <option value="archived">{t("admin.examManagement.archived")}</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">{t("common.loading")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => {
              const contextMenuItems: ContextMenuItem[] = [
                {
                  label: t("admin.examManagement.actions.preview"),
                  icon: "👁️",
                  onClick: () => router.push(`/admin/exams/${exam.id}/preview`),
                },
                {
                  label: t("admin.examManagement.actions.edit"),
                  icon: "✏️",
                  onClick: () => router.push(`/admin/exams/${exam.id}`),
                },
                {
                  label: t("admin.examManagement.actions.saveAsTemplate"),
                  icon: "📋",
                  onClick: () => {
                    // TODO: 템플릿으로 저장 기능 구현
                    toast.info(t("common.loading"));
                  },
                },
                {
                  label: t("admin.examManagement.actions.selectQuestions"),
                  icon: "🏊",
                  onClick: () => {
                    // TODO: 문제 풀 선택 기능 구현
                    toast.info(t("common.loading"));
                  },
                },
                { divider: true },
                {
                  label: t("admin.examManagement.actions.clone"),
                  icon: "📋",
                  onClick: () => {
                    setSelectedExam(exam);
                    setCloneTitle(`${exam.title} (${t("common.loading")})`);
                    setShowCloneModal(true);
                  },
                },
                {
                  label: t("admin.examManagement.actions.versionManagement"),
                  icon: "📚",
                  onClick: () => {
                    setVersionsExamId(exam.id);
                    setShowVersionsModal(true);
                  },
                },
                { divider: true },
                {
                  label: t("admin.examManagement.actions.delete"),
                  icon: "🗑️",
                  onClick: () => {
                    if (confirm(`"${exam.title}" ${t("common.delete")}?`)) {
                      deleteMutation.mutate(exam.id);
                    }
                  },
                  danger: true,
                },
              ];

              return (
                <div
                  key={exam.id}
                  className="bg-surface rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1 items-end">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            exam.status === "published"
                              ? "bg-info/20 text-info"
                              : exam.status === "draft"
                              ? "bg-warning/20 text-warning"
                              : "bg-surface-hover text-text-primary"
                          }`}
                        >
                          {exam.status === "published"
                            ? t("admin.examManagement.published")
                            : exam.status === "draft"
                            ? t("admin.examManagement.draft")
                            : exam.status === "archived"
                            ? t("admin.examManagement.archived")
                            : t("admin.examManagement.draft")}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            exam.isActive
                              ? "bg-success/20 text-success"
                              : "bg-surface-hover text-text-primary"
                          }`}
                        >
                          {exam.isActive ? t("admin.examManagement.status.active") : t("admin.examManagement.status.inactive")}
                        </span>
                      </div>
                      <ContextMenu items={contextMenuItems}>
                        <svg
                          className="w-5 h-5 text-text-secondary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </ContextMenu>
                    </div>
                  </div>
                <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                  {exam.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-xs bg-info/20 text-info rounded">
                    {exam.examType}
                  </span> 
                  {exam.subject && (
                    <span className="px-2 py-1 text-xs bg-theme-secondary/20 text-theme-secondary rounded">
                      {exam.subject}
                    </span>
                  )}
                  {exam.difficulty && (
                    <span className="px-2 py-1 text-xs bg-warning/20 text-warning rounded">
                      {exam.difficulty}
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-muted mb-4">
                  <div>{t("admin.examManagement.details.questionCount")}: {exam.totalQuestions}</div>
                  <div>{t("admin.examManagement.details.sectionCount")}: {exam.totalSections}</div>
                  {exam.estimatedTime && (
                    <div>{t("admin.examManagement.details.estimatedTime")}: {exam.estimatedTime}{t("admin.examManagement.details.minutes")}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/exams/${exam.id}`}
                    className="flex-1 text-center bg-button-primary text-button-text px-3 py-2 rounded-md hover:opacity-90 text-sm inline-flex items-center justify-center"
                  >
                    {exam.status === "draft" ? t("admin.examManagement.details.continueEditing") : t("admin.examManagement.details.viewEdit")}
                  </Link>
                </div>
              </div>
            );
            })}
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
              {t("common.previous")}
            </button>
            <span className="px-4 py-2">
              {page} / {data.meta.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
              disabled={page === data.meta.totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              {t("common.next")}
            </button>
          </div>
        )}

        {/* 시험 복제 모달 */}
        {showCloneModal && selectedExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl max-w-md w-full m-4">
              <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-bold text-text-primary">시험 복제</h2>
                <p className="text-sm text-text-secondary mt-1">
                  시험의 구조, 섹션, 문제를 그대로 복사합니다.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    원본 시험
                  </label>
                  <div className="px-4 py-2 bg-surface-hover rounded-lg text-text-primary">
                    {selectedExam.title}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    새 시험 제목 *
                  </label>
                  <input
                    type="text"
                    value={cloneTitle}
                    onChange={(e) => setCloneTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary"
                    placeholder="복제된 시험 제목을 입력하세요"
                    required
                  />
                </div>

                {/* 버전 생성 옵션 */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="createVersion"
                      checked={createVersion}
                      onChange={(e) => {
                        setCreateVersion(e.target.checked);
                        if (!e.target.checked) {
                          setVersion("");
                        }
                      }}
                      className="w-5 h-5 text-theme-primary rounded focus:ring-theme-primary"
                    />
                    <label htmlFor="createVersion" className="text-sm font-semibold text-text-primary">
                      버전으로 생성 (A/B/C 버전 관리)
                    </label>
                  </div>

                  {createVersion && (
                    <div className="space-y-3 ml-8">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          버전 식별자 (선택사항)
                        </label>
                        <input
                          type="text"
                          value={version}
                          onChange={(e) => setVersion(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary"
                          placeholder="예: A, B, C (자동 생성 시 비워두세요)"
                          maxLength={10}
                        />
                        <p className="text-xs text-text-muted mt-1">
                          비워두면 자동으로 A, B, C 순서로 생성됩니다.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-4">
                    <input
                      type="checkbox"
                      id="shuffleQuestions"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="w-5 h-5 text-theme-primary rounded focus:ring-theme-primary"
                    />
                    <label htmlFor="shuffleQuestions" className="text-sm font-medium text-text-secondary">
                      문제 순서 섞기 (버전별로 다른 순서)
                    </label>
                  </div>
                </div>

                <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                  <p className="text-sm text-info">
                    <strong>복제되는 내용:</strong>
                  </p>
                  <ul className="text-sm text-info/80 mt-2 space-y-1 list-disc list-inside">
                    <li>시험 기본 정보 (설명, 유형, 과목 등)</li>
                    <li>시험 설정 (ExamConfig)</li>
                    <li>모든 섹션</li>
                    <li>모든 문제 (새 ID로 복제)</li>
                    {createVersion && (
                      <li className="font-semibold text-theme-secondary">
                        버전 관리: 원본 시험과 연결되어 버전으로 관리됩니다.
                      </li>
                    )}
                    {shuffleQuestions && (
                      <li className="font-semibold text-warning">
                        문제 순서가 섞여서 생성됩니다.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-4 p-6 border-t">
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setSelectedExam(null);
                    setCloneTitle("");
                  }}
                  className="px-6 py-2 border border-border text-text-primary rounded-lg hover:bg-surface-hover"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (!cloneTitle.trim()) {
                      toast.error("시험 제목을 입력해주세요.");
                      return;
                    }
                    cloneMutation.mutate({
                      examId: selectedExam.id,
                      title: cloneTitle.trim(),
                      createVersion,
                      version: version.trim() || undefined,
                      shuffleQuestions,
                    });
                  }}
                  disabled={cloneMutation.isPending || !cloneTitle.trim()}
                  className="px-6 py-2 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cloneMutation.isPending 
                    ? (createVersion ? "버전 생성 중..." : "복제 중...") 
                    : (createVersion ? "버전 생성" : "복제")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 버전 목록 모달 */}
        {showVersionsModal && versionsExamId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border-light">
              <div className="sticky top-0 bg-surface border-b border-border p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">시험 버전 관리</h2>
                <button
                  onClick={() => {
                    setShowVersionsModal(false);
                    setVersionsExamId(null);
                  }}
                  className="text-text-muted hover:text-text-primary text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                {versionsData && versionsData.length > 0 ? (
                  <div className="space-y-3">
                    {versionsData.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-hover"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-text-primary">
                              {v.title}
                            </span>
                            {v.version && (
                              <span className="px-2 py-1 text-xs bg-theme-secondary/20 text-theme-secondary rounded font-semibold">
                                버전 {v.version}
                              </span>
                            )}
                            {!v.version && (
                              <span className="px-2 py-1 text-xs bg-surface-hover text-text-secondary rounded">
                                원본
                              </span>
                            )}
                            {v.status && (
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  v.status === "published"
                                    ? "bg-info/20 text-info"
                                    : v.status === "draft"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-surface-hover text-text-primary"
                                }`}
                              >
                                {v.status === "published"
                                  ? "발행됨"
                                  : v.status === "draft"
                                  ? "초안"
                                  : "보관됨"}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-text-muted mt-1">
                            생성일: {new Date(v.createdAt).toLocaleDateString("ko-KR")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/exams/${v.id}`}
                            className="px-4 py-2 bg-button-primary text-button-text rounded-md hover:opacity-90 text-sm inline-flex items-center justify-center"
                          >
                            상세
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-muted">
                    버전이 없습니다. 시험을 복제할 때 "버전으로 생성" 옵션을 선택하세요.
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-surface border-t border-border p-6 flex justify-end">
                <Button
                  onClick={() => {
                    setShowVersionsModal(false);
                    setVersionsExamId(null);
                  }}
                  variant="outline"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
