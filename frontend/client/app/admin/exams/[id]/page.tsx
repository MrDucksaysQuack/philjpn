"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { apiClient, Exam, examAPI, adminAPI, sectionAPI, Section } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import AutocompleteSelect from "@/components/admin/AutocompleteSelect";
import { toast } from "@/components/common/Toast";

interface ExamFormData {
  title: string;
  description: string;
  examType: "mock" | "practice" | "official";
  subject: string;
  difficulty: "easy" | "medium" | "hard" | "";
  estimatedTime: string;
  passingScore: string;
  isPublic: boolean;
  status: "draft" | "published" | "archived";
  config: {
    allowSectionNavigation: boolean;
    allowQuestionReview: boolean;
    showAnswerAfterSubmit: boolean;
    showScoreImmediately: boolean;
    timeLimitPerSection: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    preventTabSwitch: boolean;
  };
}

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDifficultyBalanceModal, setShowDifficultyBalanceModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [showSectionDetailModal, setShowSectionDetailModal] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);

  // 기존 시험 목록 조회 (과목 자동완성용)
  const { data: examsResponse } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const response = await examAPI.getExams({ limit: 1000 });
      return response.data;
    },
  });

  // 과목 목록 추출 (중복 제거)
  const subjectOptions = useMemo(() => {
    if (!examsResponse?.data) return [];
    const subjects = examsResponse.data
      .map((exam) => exam.subject)
      .filter((subject): subject is string => !!subject && subject.trim() !== "");
    return Array.from(new Set(subjects)).sort();
  }, [examsResponse]);

  // 시험 상세 조회
  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: ["exam", examId],
    queryFn: async (): Promise<Exam> => {
      const response = await apiClient.get(`/exams/${examId}`);
      return response.data;
    },
    enabled: !!examId && user?.role === "admin",
  });

  // 섹션 목록 조회
  const { data: sections, isLoading: isLoadingSections } = useQuery<Section[]>({
    queryKey: ["exam-sections", examId],
    queryFn: async (): Promise<Section[]> => {
      const response = await sectionAPI.getSectionsByExam(examId);
      return response.data;
    },
    enabled: !!examId && user?.role === "admin",
  });

  const [formData, setFormData] = useState<ExamFormData>({
    title: "",
    description: "",
    examType: "mock",
    subject: "",
    difficulty: "",
    estimatedTime: "",
    passingScore: "",
    isPublic: false,
    status: "draft",
    config: {
      allowSectionNavigation: true,
      allowQuestionReview: true,
      showAnswerAfterSubmit: true,
      showScoreImmediately: true,
      timeLimitPerSection: false,
      shuffleQuestions: false,
      shuffleOptions: false,
      preventTabSwitch: false,
    },
  });

  // 시험 데이터 로드 시 폼 데이터 설정
  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || "",
        description: exam.description || "",
        examType: (exam.examType as "mock" | "practice" | "official") || "mock",
        subject: exam.subject || "",
        difficulty: (exam.difficulty as "easy" | "medium" | "hard" | "") || "",
        estimatedTime: exam.estimatedTime?.toString() || "",
        passingScore: exam.passingScore?.toString() || "",
        isPublic: exam.isPublic ?? false,
        status: (exam.status as "draft" | "published" | "archived") || "draft",
        config: {
          allowSectionNavigation:
            exam.config?.allowSectionNavigation ?? true,
          allowQuestionReview: exam.config?.allowQuestionReview ?? true,
          showAnswerAfterSubmit: exam.config?.showAnswerAfterSubmit ?? true,
          showScoreImmediately: exam.config?.showScoreImmediately ?? true,
          timeLimitPerSection: exam.config?.timeLimitPerSection ?? false,
          shuffleQuestions: exam.config?.shuffleQuestions ?? false,
          shuffleOptions: exam.config?.shuffleOptions ?? false,
          preventTabSwitch: exam.config?.preventTabSwitch ?? false,
        },
      });
    }
  }, [exam]);

  const updateMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const payload: any = {
        title: data.title,
        examType: data.examType,
        description: data.description || undefined,
        subject: data.subject || undefined,
        difficulty: data.difficulty || undefined,
        estimatedTime: data.estimatedTime
          ? parseInt(data.estimatedTime)
          : undefined,
        passingScore: data.passingScore
          ? parseInt(data.passingScore)
          : undefined,
        isPublic: data.isPublic,
        status: data.status,
        config: data.config,
      };

      // published 상태로 변경 시 publishedAt 설정
      if (data.status === "published" && exam?.status !== "published") {
        payload.publishedAt = new Date().toISOString();
      }

      // undefined 값 제거
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === "") {
          delete payload[key];
        }
      });

      const response = await apiClient.patch(`/exams/${examId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      router.push("/admin/exams");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "시험 수정 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("시험 제목을 입력해주세요.");
      return;
    }

    if (!formData.examType) {
      setError("시험 유형을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    updateMutation.mutate(formData);
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

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">시험을 찾을 수 없습니다.</p>
            <Link
              href="/admin/exams"
              className="text-blue-600 hover:text-blue-700"
            >
              ← 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              시험 수정
            </h1>
            {/* 버전 정보 표시 */}
            {(exam.version || exam.versionNumber || exam.parentExamId) && (
              <div className="mt-2 flex items-center gap-3 text-sm">
                {exam.version && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                    버전 {exam.version}
                  </span>
                )}
                {exam.versionNumber && (
                  <span className="text-gray-600">
                    버전 번호: #{exam.versionNumber}
                  </span>
                )}
                {exam.parentExamId && (
                  <span className="text-gray-500">
                    (원본 시험의 버전)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowValidationModal(true)}
              className="text-purple-600 hover:text-purple-700 px-4 py-2 rounded-md border border-purple-600"
            >
              검증
            </button>
            <button
              onClick={() => setShowDifficultyBalanceModal(true)}
              className="text-green-600 hover:text-green-700 px-4 py-2 rounded-md border border-green-600"
            >
              난이도 균형
            </button>
            <button
              onClick={() => setShowWorkflowModal(true)}
              className="text-orange-600 hover:text-orange-700 px-4 py-2 rounded-md border border-orange-600"
            >
              워크플로우
            </button>
            <button
              onClick={() => setShowVersionHistoryModal(true)}
              className="text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-md border border-indigo-600"
            >
              버전 히스토리
            </button>
            <Link
              href="/admin/exams"
              className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
            >
              ← 목록으로
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 sm:p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* 필수 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 2024년 1차 토익 모의고사"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 유형 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.examType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    examType: e.target.value as "mock" | "practice" | "official",
                  })
                }
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mock">모의고사 (Mock)</option>
                <option value="practice">연습시험 (Practice)</option>
                <option value="official">정식 시험 (Official)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="시험에 대한 상세 설명을 입력하세요..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과목
                </label>
                <AutocompleteSelect
                  value={formData.subject}
                  onChange={(value) =>
                    setFormData({ ...formData, subject: value })
                  }
                  options={subjectOptions}
                  allowCustom={true}
                  placeholder="예: 토익, 토플 (입력하거나 선택하세요)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  난이도
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty: e.target.value as "easy" | "medium" | "hard" | "",
                    })
                  }
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택 안 함</option>
                  <option value="easy">쉬움 (Easy)</option>
                  <option value="medium">보통 (Medium)</option>
                  <option value="hard">어려움 (Hard)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예상 소요 시간 (분)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimatedTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  합격 점수
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passingScore: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 70"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  공개 시험
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 상태
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "draft" | "published" | "archived",
                  })
                }
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">초안 (Draft)</option>
                <option value="published">발행됨 (Published)</option>
                <option value="archived">보관됨 (Archived)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.status === "draft" && "작업 중인 시험입니다. 나중에 계속 편집할 수 있습니다."}
                {formData.status === "published" && "시험이 발행되었습니다. 사용자들이 볼 수 있습니다."}
                {formData.status === "archived" && "시험이 보관되었습니다. 더 이상 사용되지 않습니다."}
              </p>
            </div>

            {/* 시험 설정 */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                시험 설정
              </h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.allowSectionNavigation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          allowSectionNavigation: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">섹션 간 이동 허용</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.allowQuestionReview}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          allowQuestionReview: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">문제 복습 허용</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.showAnswerAfterSubmit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          showAnswerAfterSubmit: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    제출 후 정답 표시
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.showScoreImmediately}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          showScoreImmediately: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">즉시 점수 표시</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.timeLimitPerSection}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          timeLimitPerSection: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">섹션별 시간 제한</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.shuffleQuestions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          shuffleQuestions: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">문제 순서 섞기</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.shuffleOptions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          shuffleOptions: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">선택지 순서 섞기</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.config.preventTabSwitch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          preventTabSwitch: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    탭 전환 감지 (부정행위 방지)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              시험 수정
            </Button>
            <Link
              href="/admin/exams"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              취소
            </Link>
          </div>
        </form>

        {/* ExamVersion 정보 섹션 */}
        {exam && (exam.version || exam.versionNumber || exam.parentExamId) && (
          <div className="mt-8 bg-white rounded-lg shadow p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">버전 정보</h2>
            <ExamVersionInfo examId={examId} exam={exam} />
          </div>
        )}

        {/* 섹션 관리 섹션 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">섹션 관리</h2>
            <Button
              onClick={() => setShowCreateSectionModal(true)}
              variant="primary"
              size="sm"
            >
              섹션 추가
            </Button>
          </div>

          {isLoadingSections ? (
            <div className="text-center py-8">섹션 목록을 불러오는 중...</div>
          ) : sections && sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setShowSectionDetailModal(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{section.title}</h3>
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>순서: {section.order}</span>
                        {section.timeLimit && <span>시간 제한: {section.timeLimit}분</span>}
                        {section.questionCount !== undefined && (
                          <span>문제 수: {section.questionCount}개</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/exams/${examId}/sections/${section.id}/questions`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                      >
                        문제 관리
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              등록된 섹션이 없습니다. 섹션을 추가해주세요.
            </div>
          )}
        </div>

        {/* 검증 모달 */}
        {showValidationModal && examId && (
          <ExamValidationModal
            examId={examId}
            onClose={() => setShowValidationModal(false)}
          />
        )}

        {/* 난이도 균형 모달 */}
        {showDifficultyBalanceModal && examId && (
          <DifficultyBalanceModal
            examId={examId}
            onClose={() => setShowDifficultyBalanceModal(false)}
          />
        )}

              {/* 워크플로우 모달 */}
              {showWorkflowModal && examId && (
                <WorkflowModal
                  examId={examId}
                  onClose={() => setShowWorkflowModal(false)}
                />
              )}

              {/* 버전 히스토리 모달 */}
              {showVersionHistoryModal && examId && (
                <VersionHistoryModal
                  contentType="exam"
                  contentId={examId}
                  onClose={() => setShowVersionHistoryModal(false)}
                />
              )}

              {/* 섹션 상세 모달 */}
              {showSectionDetailModal && selectedSectionId && (
                <SectionDetailModal
                  sectionId={selectedSectionId}
                  examId={examId}
                  onClose={() => {
                    setShowSectionDetailModal(false);
                    setSelectedSectionId(null);
                  }}
                />
              )}

              {/* 섹션 생성 모달 */}
              {showCreateSectionModal && examId && (
                <CreateSectionModal
                  examId={examId}
                  onClose={() => setShowCreateSectionModal(false)}
                />
              )}
            </div>
          </>
        );
      }

// ExamVersion 정보 컴포넌트
function ExamVersionInfo({ examId, exam }: { examId: string; exam: Exam }) {
  if (!exam.version && !exam.versionNumber && !exam.parentExamId) {
    return null;
  }

  const examVersion = exam.examVersion;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exam.version && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-700 font-medium mb-1">버전 식별자</div>
            <div className="text-2xl font-bold text-purple-900">{exam.version}</div>
          </div>
        )}
        {exam.versionNumber && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700 font-medium mb-1">버전 번호</div>
            <div className="text-2xl font-bold text-blue-900">#{exam.versionNumber}</div>
          </div>
        )}
        {exam.parentExamId && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-700 font-medium mb-1">원본 시험 ID</div>
            <div className="text-sm font-mono text-gray-900 break-all">{exam.parentExamId}</div>
          </div>
        )}
      </div>

      {examVersion && examVersion.questionOrder && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">버전별 문제 순서</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">
              {Object.keys(examVersion.questionOrder).length}개의 섹션에 대한 문제 순서가 저장되어 있습니다.
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                상세 정보 보기
              </summary>
              <div className="mt-2 space-y-2">
                {Object.entries(examVersion.questionOrder as Record<string, string[]>).map(([sectionId, questionIds]) => (
                  <div key={sectionId} className="text-xs font-mono bg-white p-2 rounded border">
                    <div className="font-semibold mb-1">섹션: {sectionId.substring(0, 8)}...</div>
                    <div className="text-gray-600">
                      문제 수: {questionIds.length}개
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {examVersion && (
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex gap-4">
            <span>생성일: {new Date(examVersion.createdAt).toLocaleString('ko-KR')}</span>
            <span>수정일: {new Date(examVersion.updatedAt).toLocaleString('ko-KR')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 시험 검증 모달 컴포넌트
function ExamValidationModal({
  examId,
  onClose,
}: {
  examId: string;
  onClose: () => void;
}) {
  const { data: validationResult, isLoading } = useQuery({
    queryKey: ["exam-validation", examId],
    queryFn: async () => {
      const response = await examAPI.validateExam(examId);
      return response.data;
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">시험 검증 결과</h2>
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
              <div className="text-gray-500">검증 중...</div>
            </div>
          ) : validationResult ? (
            <div className="space-y-6">
              {/* 검증 상태 요약 */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  validationResult.isValid
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {validationResult.isValid ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <div>
                        <div className="text-lg font-semibold text-green-800">
                          검증 통과
                        </div>
                        <div className="text-sm text-green-700">
                          시험이 정상적으로 구성되었습니다.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">❌</span>
                      <div>
                        <div className="text-lg font-semibold text-red-800">
                          검증 실패
                        </div>
                        <div className="text-sm text-red-700">
                          {validationResult.issues.filter((i) => i.type === "error").length}개의 오류가 발견되었습니다.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 통계 요약 */}
              {validationResult.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-700 font-medium mb-1">
                      총 문제
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {validationResult.summary.totalQuestions}
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-purple-700 font-medium mb-1">
                      총 섹션
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {validationResult.summary.totalSections}
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-sm text-orange-700 font-medium mb-1">
                      중복 문제
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {validationResult.summary.duplicateQuestions}
                    </div>
                  </div>
                  {validationResult.summary.averageDifficulty !== undefined && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-700 font-medium mb-1">
                        평균 난이도
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {validationResult.summary.averageDifficulty.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 난이도 분포 */}
              {validationResult.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    난이도 분포
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-xs text-green-700 font-medium mb-1">
                        쉬움
                      </div>
                      <div className="text-xl font-bold text-green-900">
                        {validationResult.summary.difficultyDistribution.easy}
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-xs text-yellow-700 font-medium mb-1">
                        보통
                      </div>
                      <div className="text-xl font-bold text-yellow-900">
                        {validationResult.summary.difficultyDistribution.medium}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-xs text-red-700 font-medium mb-1">
                        어려움
                      </div>
                      <div className="text-xl font-bold text-red-900">
                        {validationResult.summary.difficultyDistribution.hard}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-700 font-medium mb-1">
                        미설정
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {validationResult.summary.difficultyDistribution.unknown}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 검증 이슈 */}
              {validationResult.issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    발견된 이슈 ({validationResult.issues.length}개)
                  </h3>
                  <div className="space-y-2">
                    {validationResult.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          issue.type === "error"
                            ? "bg-red-50 border-red-200"
                            : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">
                            {issue.type === "error" ? "❌" : "⚠️"}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-1 text-xs rounded font-semibold ${
                                  issue.type === "error"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {issue.type === "error" ? "오류" : "경고"}
                              </span>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {issue.category === "duplicate"
                                  ? "중복"
                                  : issue.category === "difficulty"
                                  ? "난이도"
                                  : issue.category === "section"
                                  ? "섹션"
                                  : issue.category === "question_pool"
                                  ? "문제 풀"
                                  : "구조"}
                              </span>
                            </div>
                            <div
                              className={`text-sm font-medium ${
                                issue.type === "error"
                                  ? "text-red-800"
                                  : "text-yellow-800"
                              }`}
                            >
                              {issue.message}
                            </div>
                            {issue.details && (
                              <div className="mt-2 text-xs text-gray-600">
                                <pre className="bg-white/50 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(issue.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 이슈가 없는 경우 */}
              {validationResult.issues.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  발견된 이슈가 없습니다. 시험이 정상적으로 구성되었습니다.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              검증 결과를 불러올 수 없습니다.
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

// 섹션 난이도 균형 모달 컴포넌트
function DifficultyBalanceModal({
  examId,
  onClose,
}: {
  examId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations'>('analysis');

  // 섹션 난이도 분석
  const { data: analysisResponse, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ['section-difficulty-analysis', examId],
    queryFn: async () => {
      const response = await adminAPI.analyzeSectionDifficulty(examId);
      return response.data;
    },
  });
  const analysisData = analysisResponse?.data;

  // 균형 조정 제안
  const { data: recommendationsResponse, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ['section-balance-recommendations', examId],
    queryFn: async () => {
      const response = await adminAPI.getBalanceRecommendations(examId);
      return response.data;
    },
  });
  const recommendationsData = recommendationsResponse?.data;

  // 문제 이동 mutation
  const moveQuestionMutation = useMutation({
    mutationFn: async ({ questionId, targetSectionId }: { questionId: string; targetSectionId: string }) => {
      const response = await adminAPI.moveQuestionToSection(examId, { questionId, targetSectionId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('문제가 성공적으로 이동되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['section-difficulty-analysis', examId] });
      queryClient.invalidateQueries({ queryKey: ['section-balance-recommendations', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '문제 이동에 실패했습니다.');
    },
  });

  const handleMoveQuestion = (questionId: string, targetSectionId: string) => {
    if (confirm('이 문제를 선택한 섹션으로 이동하시겠습니까?')) {
      moveQuestionMutation.mutate({ questionId, targetSectionId });
    }
  };

  const getDifficultyColor = (score: number) => {
    if (score < 0.33) return 'text-green-600 bg-green-50 border-green-200';
    if (score < 0.67) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getDifficultyLabel = (score: number) => {
    if (score < 0.33) return '쉬움';
    if (score < 0.67) return '보통';
    return '어려움';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">섹션 난이도 균형</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 탭 */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              난이도 분석
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'recommendations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              균형 조정 제안
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'analysis' && (
            <>
              {isLoadingAnalysis ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">분석 중...</div>
                </div>
              ) : analysisData ? (
                <div className="space-y-6">
                  {/* 전체 요약 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">전체 요약</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-blue-700 font-medium mb-1">총 섹션</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {analysisData.totalSections}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-blue-700 font-medium mb-1">총 문제</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {analysisData.totalQuestions}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-blue-700 font-medium mb-1">평균 난이도</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {analysisData.overallAverageDifficulty.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-blue-700 font-medium mb-1">평균 난이도 점수</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {analysisData.overallAverageDifficulty.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 불균형 이슈 */}
                  {analysisData.imbalanceIssues && analysisData.imbalanceIssues.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">불균형 이슈</h3>
                      <div className="space-y-2">
                        {analysisData.imbalanceIssues.map((issue, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${
                              issue.severity === 'high'
                                ? 'bg-red-50 border-red-200'
                                : issue.severity === 'medium'
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">
                                {issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵'}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-1 text-xs rounded font-semibold ${
                                      issue.severity === 'high'
                                        ? 'bg-red-100 text-red-700'
                                        : issue.severity === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '중간' : '낮음'}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-800">
                                  {issue.message}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 섹션별 상세 분석 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">섹션별 상세 분석</h3>
                    <div className="space-y-4">
                      {analysisData.sections.map((section) => (
                        <div
                          key={section.sectionId}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {section.sectionTitle}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {section.totalQuestions}개 문제
                              </p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg border ${getDifficultyColor(section.difficultyScore)}`}>
                              <div className="text-xs font-medium mb-1">난이도 점수</div>
                              <div className="text-lg font-bold">
                                {section.difficultyScore.toFixed(2)} ({getDifficultyLabel(section.difficultyScore)})
                              </div>
                            </div>
                          </div>

                          {/* 난이도 분포 */}
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">난이도 분포</div>
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <div className="text-xs text-green-700 font-medium mb-1">쉬움</div>
                                <div className="text-lg font-bold text-green-900">
                                  {section.difficultyDistribution.easy}
                                </div>
                              </div>
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                <div className="text-xs text-yellow-700 font-medium mb-1">보통</div>
                                <div className="text-lg font-bold text-yellow-900">
                                  {section.difficultyDistribution.medium}
                                </div>
                              </div>
                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                <div className="text-xs text-red-700 font-medium mb-1">어려움</div>
                                <div className="text-lg font-bold text-red-900">
                                  {section.difficultyDistribution.hard}
                                </div>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded p-2">
                                <div className="text-xs text-gray-700 font-medium mb-1">미설정</div>
                                <div className="text-lg font-bold text-gray-900">
                                  {section.difficultyDistribution.unknown}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 평균 난이도 */}
                          <div className="text-sm text-gray-600">
                            평균 난이도: <span className="font-semibold">{section.averageDifficulty.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  분석 결과를 불러올 수 없습니다.
                </div>
              )}
            </>
          )}

          {activeTab === 'recommendations' && (
            <>
              {isLoadingRecommendations ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">제안 로딩 중...</div>
                </div>
              ) : recommendationsData && recommendationsData.length > 0 ? (
                <div className="space-y-6">
                  {recommendationsData.map((section) => (
                    <div key={section.sectionId} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {section.sectionTitle}
                        </h3>
                        <div className="text-sm text-gray-600">
                          현재 난이도: <span className="font-semibold">{section.currentDifficulty.toFixed(2)}</span> → 목표 난이도: <span className="font-semibold">{section.targetDifficulty.toFixed(2)}</span>
                        </div>
                      </div>

                      {section.recommendations.length > 0 ? (
                        <div className="space-y-3">
                          {section.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-semibold">
                                      {rec.action === 'move_question' ? '이동' : rec.action === 'add_question' ? '추가' : rec.action === 'remove_question' ? '제거' : '교체'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800 mb-2">{rec.reason}</p>
                                  {rec.questionContent && (
                                    <p className="text-xs text-gray-600 mb-2">
                                      문제: {rec.questionContent}
                                    </p>
                                  )}
                                  {rec.fromSectionId && rec.toSectionId && (
                                    <p className="text-xs text-gray-600">
                                      {rec.fromSectionId} → {rec.toSectionId}
                                    </p>
                                  )}
                                </div>
                                {rec.action === 'move_question' && rec.questionId && rec.toSectionId && (
                                  <Button
                                    onClick={() => handleMoveQuestion(rec.questionId!, rec.toSectionId!)}
                                    disabled={moveQuestionMutation.isPending}
                                    isLoading={moveQuestionMutation.isPending}
                                    size="sm"
                                  >
                                    이동하기
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          이 섹션에 대한 조정 제안이 없습니다.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  조정 제안이 없습니다. 시험이 균형 잡혀 있습니다.
                </div>
              )}
            </>
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


// 워크플로우 모달 컴포넌트
function WorkflowModal({
  examId,
  onClose,
}: {
  examId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [actionType, setActionType] = useState<'submit' | 'approve' | 'reject' | 'assign-reviewer' | null>(null);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>('');

  // 워크플로우 상태 조회
  const { data: workflowStatus, isLoading, refetch } = useQuery({
    queryKey: ['exam-workflow', examId],
    queryFn: async () => {
      const response = await examAPI.getWorkflowStatus(examId);
      return response.data;
    },
  });

  // 검수 요청
  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await examAPI.submitForReview(examId, comment ? { comment } : undefined);
      return response.data;
    },
    onSuccess: () => {
      toast.success('검수 요청이 완료되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-workflow', examId] });
      refetch();
      setActionType(null);
      setComment('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '검수 요청에 실패했습니다.');
    },
  });

  // 승인
  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await examAPI.approve(examId, comment ? { comment } : undefined);
      return response.data;
    },
    onSuccess: () => {
      toast.success('시험이 승인되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-workflow', examId] });
      refetch();
      setActionType(null);
      setComment('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '승인에 실패했습니다.');
    },
  });

  // 거부
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await examAPI.reject(examId, reason);
      return response.data;
    },
    onSuccess: () => {
      toast.success('시험이 거부되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-workflow', examId] });
      refetch();
      setActionType(null);
      setReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '거부에 실패했습니다.');
    },
  });

  // 발행
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await examAPI.publish(examId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('시험이 발행되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-workflow', examId] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '발행에 실패했습니다.');
    },
  });

  // 보관
  const archiveMutation = useMutation({
    mutationFn: async () => {
      const response = await examAPI.archive(examId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('시험이 보관되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-workflow', examId] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '보관에 실패했습니다.');
    },
  });

  // 초안 복귀
  const returnToDraftMutation = useMutation({
    mutationFn: async () => {
      const response = await examAPI.returnToDraft(examId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('시험이 초안으로 복귀되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-workflow', examId] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '초안 복귀에 실패했습니다.');
    },
  });

  // 역할 기반 권한 체크
  const userRole = user?.role || '';
  const isAdmin = userRole === 'admin';
  const isCreator = userRole === 'creator';
  const isReviewer = userRole === 'reviewer';
  const isApprover = userRole === 'approver';

  // 검수자 목록 조회 (reviewer 역할을 가진 사용자)
  const { data: reviewersList } = useQuery({
    queryKey: ['reviewers'],
    queryFn: async () => {
      const response = await adminAPI.getUsers({ role: 'reviewer', isActive: true, limit: 100 });
      return response.data;
    },
    enabled: isAdmin && workflowStatus?.status === 'review',
  });

  // 검수자 할당
  const assignReviewerMutation = useMutation({
    mutationFn: async (reviewerId: string) => {
      const response = await examAPI.assignReviewer(examId, reviewerId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('검수자가 할당되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-workflow', examId] });
      refetch();
      setActionType(null);
      setSelectedReviewerId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '검수자 할당에 실패했습니다.');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'published':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '초안';
      case 'review':
        return '검수 중';
      case 'approved':
        return '승인됨';
      case 'published':
        return '발행됨';
      case 'rejected':
        return '거부됨';
      case 'archived':
        return '보관됨';
      default:
        return status;
    }
  };

  // 상태 및 역할 기반 권한 체크
  const canSubmitForReview = workflowStatus?.status === 'draft' && (isAdmin || isCreator);
  const canAssignReviewer = workflowStatus?.status === 'review' && isAdmin && !workflowStatus.reviewerId;
  const canApprove = workflowStatus?.status === 'review' && (isAdmin || isApprover);
  const canReject = workflowStatus?.status === 'review' && (isAdmin || isReviewer);
  const canPublish = workflowStatus?.status === 'approved' && (isAdmin || isApprover);
  const canArchive = workflowStatus?.status === 'published' && isAdmin;
  const canReturnToDraft = workflowStatus?.status === 'rejected' && (isAdmin || isCreator);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">시험 워크플로우</h2>
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
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : workflowStatus ? (
            <div className="space-y-6">
              {/* 현재 상태 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">현재 상태</h3>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(workflowStatus.status)}`}>
                    {getStatusLabel(workflowStatus.status)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {workflowStatus.title}
                  </span>
                </div>
              </div>

              {/* 워크플로우 정보 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">워크플로우 정보</h3>
                <div className="space-y-3">
                  {workflowStatus.creator && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">작성자</span>
                      <span className="text-sm font-medium text-gray-900">
                        {workflowStatus.creator.name} ({workflowStatus.creator.email})
                      </span>
                    </div>
                  )}
                  {workflowStatus.reviewer && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">검수자</span>
                      <span className="text-sm font-medium text-gray-900">
                        {workflowStatus.reviewer.name} ({workflowStatus.reviewer.email})
                      </span>
                    </div>
                  )}
                  {workflowStatus.reviewedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">검수 일시</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(workflowStatus.reviewedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {workflowStatus.approver && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">승인자</span>
                      <span className="text-sm font-medium text-gray-900">
                        {workflowStatus.approver.name} ({workflowStatus.approver.email})
                      </span>
                    </div>
                  )}
                  {workflowStatus.approvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">승인 일시</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(workflowStatus.approvedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {workflowStatus.publishedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">발행 일시</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(workflowStatus.publishedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {workflowStatus.reviewComment && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-600">검수 코멘트</span>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                        {workflowStatus.reviewComment}
                      </div>
                    </div>
                  )}
                  {workflowStatus.rejectionReason && (
                    <div className="mt-4">
                      <span className="text-sm text-red-600">거부 사유</span>
                      <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm text-red-900">
                        {workflowStatus.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">작업</h3>
                <div className="space-y-3">
                  {canSubmitForReview && (
                    <Button
                      onClick={() => setActionType('submit')}
                      fullWidth
                      className="text-left"
                    >
                      검수 요청
                    </Button>
                  )}
                  {canAssignReviewer && (
                    <Button
                      onClick={() => setActionType('assign-reviewer')}
                      variant="secondary"
                      fullWidth
                      className="text-left"
                    >
                      검수자 할당
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      onClick={() => setActionType('approve')}
                      variant="success"
                      fullWidth
                      className="text-left"
                    >
                      승인
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      onClick={() => setActionType('reject')}
                      variant="error"
                      fullWidth
                      className="text-left"
                    >
                      거부
                    </Button>
                  )}
                  {canPublish && (
                    <Button
                      onClick={() => publishMutation.mutate()}
                      disabled={publishMutation.isPending}
                      isLoading={publishMutation.isPending}
                      variant="secondary"
                      fullWidth
                      className="text-left"
                    >
                      발행
                    </Button>
                  )}
                  {canArchive && (
                    <Button
                      onClick={() => archiveMutation.mutate()}
                      disabled={archiveMutation.isPending}
                      isLoading={archiveMutation.isPending}
                      variant="warning"
                      fullWidth
                      className="text-left"
                    >
                      보관
                    </Button>
                  )}
                  {canReturnToDraft && (
                    <Button
                      onClick={() => returnToDraftMutation.mutate()}
                      disabled={returnToDraftMutation.isPending}
                      isLoading={returnToDraftMutation.isPending}
                      variant="outline"
                      fullWidth
                      className="text-left"
                    >
                      초안으로 복귀
                    </Button>
                  )}
                </div>
              </div>

              {/* 액션 폼 */}
              {actionType === 'submit' && (
                <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">검수 요청</h4>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="검수 요청 코멘트 (선택사항)"
                    className="w-full px-4 py-2 border rounded-md mb-4"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => submitForReviewMutation.mutate()}
                      disabled={submitForReviewMutation.isPending}
                      isLoading={submitForReviewMutation.isPending}
                    >
                      요청
                    </Button>
                    <button
                      onClick={() => {
                        setActionType(null);
                        setComment('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {actionType === 'approve' && (
                <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                  <h4 className="text-lg font-semibold text-green-900 mb-4">승인</h4>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="승인 코멘트 (선택사항)"
                    className="w-full px-4 py-2 border rounded-md mb-4"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {approveMutation.isPending ? '승인 중...' : '승인'}
                    </button>
                    <button
                      onClick={() => {
                        setActionType(null);
                        setComment('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {actionType === 'assign-reviewer' && (
                <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4">검수자 할당</h4>
                  {reviewersList?.data && reviewersList.data.length > 0 ? (
                    <>
                      <select
                        value={selectedReviewerId}
                        onChange={(e) => setSelectedReviewerId(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md mb-4"
                      >
                        <option value="">검수자를 선택하세요</option>
                        {reviewersList.data.map((reviewer: any) => (
                          <option key={reviewer.id} value={reviewer.id}>
                            {reviewer.name} ({reviewer.email})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (selectedReviewerId) {
                              assignReviewerMutation.mutate(selectedReviewerId);
                            }
                          }}
                          disabled={assignReviewerMutation.isPending || !selectedReviewerId}
                          isLoading={assignReviewerMutation.isPending}
                          variant="secondary"
                        >
                          할당
                        </Button>
                        <button
                          onClick={() => {
                            setActionType(null);
                            setSelectedReviewerId('');
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600 mb-4">
                      검수자 역할을 가진 사용자가 없습니다.
                    </div>
                  )}
                </div>
              )}

              {actionType === 'reject' && (
                <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <h4 className="text-lg font-semibold text-red-900 mb-4">거부</h4>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="거부 사유 (필수)"
                    className="w-full px-4 py-2 border rounded-md mb-4"
                    rows={3}
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending || !reason.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? '거부 중...' : '거부'}
                    </button>
                    <button
                      onClick={() => {
                        setActionType(null);
                        setReason('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              워크플로우 상태를 불러올 수 없습니다.
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

// 버전 히스토리 모달 컴포넌트
function VersionHistoryModal({
  contentType,
  contentId,
  onClose,
}: {
  contentType: 'exam' | 'question' | 'template';
  contentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedVersion1, setSelectedVersion1] = useState<string | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // 버전 목록 조회
  const { data: versionsResponse, isLoading } = useQuery({
    queryKey: ['content-versions', contentType, contentId],
    queryFn: async () => {
      const response = await adminAPI.getContentVersions(contentType, contentId);
      return response.data;
    },
  });

  // 버전 비교 조회
  const { data: comparisonResponse, isLoading: isComparing } = useQuery({
    queryKey: ['content-versions-compare', selectedVersion1, selectedVersion2],
    queryFn: async () => {
      if (!selectedVersion1 || !selectedVersion2) return null;
      const response = await adminAPI.compareContentVersions(selectedVersion1, selectedVersion2);
      return response.data;
    },
    enabled: !!selectedVersion1 && !!selectedVersion2 && showComparison,
  });

  // 버전 생성
  const createVersionMutation = useMutation({
    mutationFn: async (data: { versionLabel?: string; changeDescription?: string }) => {
      const response = await adminAPI.createContentVersion({
        contentType,
        contentId,
        versionLabel: data.versionLabel,
        changeDescription: data.changeDescription,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('버전이 생성되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['content-versions', contentType, contentId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '버전 생성에 실패했습니다.');
    },
  });

  // 롤백
  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const response = await adminAPI.rollbackToVersion(versionId);
      return response.data;
    },
    onSuccess: () => {
      if (contentType === 'exam') {
        toast.success('롤백이 완료되었습니다. 시험 기본 정보만 롤백되었으며, 섹션과 문제는 유지되었습니다.');
      } else {
        toast.success('롤백이 완료되었습니다.');
      }
      queryClient.invalidateQueries({ queryKey: ['content-versions', contentType, contentId] });
      queryClient.invalidateQueries({ queryKey: ['exam', contentId] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '롤백에 실패했습니다.');
    },
  });

  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [showCreateVersionForm, setShowCreateVersionForm] = useState(false);

  const handleCompare = () => {
    if (selectedVersion1 && selectedVersion2) {
      setShowComparison(true);
    } else {
      toast.error('비교할 두 버전을 선택해주세요.');
    }
  };

  const versions = versionsResponse?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">버전 히스토리</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 버전 생성 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">새 버전 생성</h3>
              <Button
                onClick={() => setShowCreateVersionForm(!showCreateVersionForm)}
                size="sm"
              >
                {showCreateVersionForm ? '취소' : '버전 생성'}
              </Button>
            </div>
            {showCreateVersionForm && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    버전 라벨 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={newVersionLabel}
                    onChange={(e) => setNewVersionLabel(e.target.value)}
                    placeholder="예: v1.0, 2024-01-03"
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    변경 사유 (선택사항)
                  </label>
                  <textarea
                    value={newVersionDescription}
                    onChange={(e) => setNewVersionDescription(e.target.value)}
                    placeholder="변경 사유를 입력하세요"
                    rows={3}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>
                <Button
                  onClick={() => {
                    createVersionMutation.mutate({
                      versionLabel: newVersionLabel || undefined,
                      changeDescription: newVersionDescription || undefined,
                    });
                    setNewVersionLabel('');
                    setNewVersionDescription('');
                    setShowCreateVersionForm(false);
                  }}
                  disabled={createVersionMutation.isPending}
                  isLoading={createVersionMutation.isPending}
                  variant="success"
                >
                  버전 생성
                </Button>
              </div>
            )}
          </div>

          {/* 버전 목록 */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              버전 히스토리가 없습니다.
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">버전 목록</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVersion1 === version.id || selectedVersion2 === version.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (!selectedVersion1) {
                          setSelectedVersion1(version.id);
                        } else if (!selectedVersion2 && selectedVersion1 !== version.id) {
                          setSelectedVersion2(version.id);
                        } else if (selectedVersion1 === version.id) {
                          setSelectedVersion1(null);
                        } else if (selectedVersion2 === version.id) {
                          setSelectedVersion2(null);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {version.versionLabel || `v${version.versionNumber}`}
                            </span>
                            <span className="text-sm text-gray-500">
                              (#{version.versionNumber})
                            </span>
                            {(selectedVersion1 === version.id || selectedVersion2 === version.id) && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                선택됨
                              </span>
                            )}
                          </div>
                          {version.changeDescription && (
                            <p className="text-sm text-gray-600 mb-2">{version.changeDescription}</p>
                          )}
                          <div className="text-xs text-gray-500">
                            {version.changedByUser && (
                              <span>변경자: {version.changedByUser.name || version.changedByUser.email}</span>
                            )}
                            <span className="ml-4">
                              {new Date(version.createdAt).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isExam = contentType === 'exam';
                            const confirmMessage = isExam
                              ? '이 버전으로 롤백하시겠습니까?\n\n⚠️ 주의: 시험의 경우 기본 정보(제목, 설명, 설정 등)만 롤백되며, 섹션과 문제는 유지됩니다. 섹션/문제 변경사항은 수동으로 확인이 필요합니다.'
                              : '이 버전으로 롤백하시겠습니까?';
                            if (confirm(confirmMessage)) {
                              rollbackMutation.mutate(version.id);
                            }
                          }}
                          disabled={rollbackMutation.isPending}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                          title={contentType === 'exam' ? '시험 기본 정보만 롤백됩니다 (섹션/문제는 유지)' : '이 버전으로 롤백'}
                        >
                          롤백
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 버전 비교 */}
              {selectedVersion1 && selectedVersion2 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">버전 비교</h3>
                    <Button
                      onClick={handleCompare}
                      disabled={isComparing}
                      isLoading={isComparing}
                      variant="secondary"
                    >
                      비교하기
                    </Button>
                  </div>
                  {showComparison && comparisonResponse && (
                    <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                      {comparisonResponse.data.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">변경사항이 없습니다.</p>
                      ) : (
                        comparisonResponse.data.map((diff, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-md">
                            <div className="font-semibold text-gray-900 mb-2">{diff.field}</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-red-600 font-medium mb-1">이전 값:</div>
                                <div className="text-gray-700 break-words">
                                  {typeof diff.oldValue === 'object'
                                    ? JSON.stringify(diff.oldValue, null, 2)
                                    : String(diff.oldValue ?? 'null')}
                                </div>
                              </div>
                              <div>
                                <div className="text-green-600 font-medium mb-1">새 값:</div>
                                <div className="text-gray-700 break-words">
                                  {typeof diff.newValue === 'object'
                                    ? JSON.stringify(diff.newValue, null, 2)
                                    : String(diff.newValue ?? 'null')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
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

// 섹션 상세 모달 컴포넌트
function SectionDetailModal({
  sectionId,
  examId,
  onClose,
}: {
  sectionId: string;
  examId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{ title: string; description: string; timeLimit?: number }>({
    title: "",
    description: "",
    timeLimit: undefined,
  });

  const { data: section, isLoading } = useQuery<Section>({
    queryKey: ["section", sectionId],
    queryFn: async (): Promise<Section> => {
      const response = await sectionAPI.getSection(sectionId);
      return response.data;
    },
  });

  useEffect(() => {
    if (section) {
      setEditData({
        title: section.title,
        description: section.description || "",
        timeLimit: section.timeLimit,
      });
    }
  }, [section]);

  const updateMutation = useMutation({
    mutationFn: async (data: { title?: string; description?: string; timeLimit?: number }) => {
      await sectionAPI.updateSection(sectionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["exam-sections", examId] });
      toast.success("섹션이 수정되었습니다.");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "섹션 수정에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await sectionAPI.deleteSection(sectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-sections", examId] });
      toast.success("섹션이 삭제되었습니다.");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "섹션 삭제에 실패했습니다.");
    },
  });

  const handleUpdate = () => {
    updateMutation.mutate(editData);
  };

  const handleDelete = () => {
    if (confirm("이 섹션을 삭제하시겠습니까? 섹션 내의 모든 문제도 함께 삭제됩니다.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
          <div className="text-center py-8">섹션 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">섹션을 찾을 수 없습니다.</p>
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">섹션 상세 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                섹션 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시간 제한 (분)
              </label>
              <input
                type="number"
                value={editData.timeLimit || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    timeLimit: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdate}
                variant="primary"
                isLoading={updateMutation.isPending}
                className="flex-1"
              >
                저장
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  if (section) {
                    setEditData({
                      title: section.title,
                      description: section.description || "",
                      timeLimit: section.timeLimit,
                    });
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">섹션 제목</h3>
              <p className="text-lg text-gray-900 font-medium">{section.title}</p>
            </div>
            {section.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">설명</h3>
                <p className="text-gray-700">{section.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">순서</h3>
                <p className="text-gray-700">{section.order}</p>
              </div>
              {section.timeLimit && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">시간 제한</h3>
                  <p className="text-gray-700">{section.timeLimit}분</p>
                </div>
              )}
              {section.questionCount !== undefined && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">문제 수</h3>
                  <p className="text-gray-700">{section.questionCount}개</p>
                </div>
              )}
              {section.createdAt && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">생성일</h3>
                  <p className="text-gray-700">
                    {new Date(section.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link
                href={`/admin/exams/${examId}/sections/${sectionId}/questions`}
                className="flex-1"
              >
                <Button variant="primary" className="w-full">
                  문제 관리
                </Button>
              </Link>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex-1"
              >
                수정
              </Button>
              <Button
                onClick={handleDelete}
                variant="error"
                isLoading={deleteMutation.isPending}
                className="flex-1"
              >
                삭제
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 섹션 생성 모달 컴포넌트
function CreateSectionModal({
  examId,
  onClose,
}: {
  examId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{ title: string; description: string; timeLimit?: number; order?: number }>({
    title: "",
    description: "",
    timeLimit: undefined,
    order: undefined,
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: ["exam-sections", examId],
    queryFn: async (): Promise<Section[]> => {
      const response = await sectionAPI.getSectionsByExam(examId);
      return response.data;
    },
  });

  // 다음 순서 자동 계산
  useEffect(() => {
    if (sections && sections.length > 0) {
      const maxOrder = Math.max(...sections.map(s => s.order));
      setFormData(prev => ({ ...prev, order: maxOrder + 1 }));
    } else {
      setFormData(prev => ({ ...prev, order: 1 }));
    }
  }, [sections]);

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; timeLimit?: number; order?: number }) => {
      await sectionAPI.createSection(examId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-sections", examId] });
      toast.success("섹션이 생성되었습니다.");
      onClose();
      setFormData({ title: "", description: "", timeLimit: undefined, order: undefined });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "섹션 생성에 실패했습니다.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("섹션 제목을 입력해주세요.");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">새 섹션 생성</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              섹션 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="예: 듣기, 읽기, 문법"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="섹션에 대한 설명을 입력하세요 (선택사항)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                순서
              </label>
              <input
                type="number"
                value={formData.order || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시간 제한 (분)
              </label>
              <input
                type="number"
                value={formData.timeLimit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeLimit: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                placeholder="선택사항"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
              className="flex-1"
            >
              생성
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
