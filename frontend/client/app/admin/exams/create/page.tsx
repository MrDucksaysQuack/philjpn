"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { apiClient, examAPI, adminAPI, categoryAPI, ExamTemplate, QuestionPool, Category, Subcategory } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import AutocompleteSelect from "@/components/admin/AutocompleteSelect";

interface CreateExamFormData {
  title: string;
  description: string;
  examType: "mock" | "practice" | "official";
  subject: string;
  difficulty: "easy" | "medium" | "hard" | "";
  estimatedTime: string;
  passingScore: string;
  isPublic: boolean;
  categoryId?: string;
  subcategoryId?: string;
  templateId?: string;
  questionPoolIds?: string[];
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

type WizardStep = "basic" | "category" | "template" | "questionPool" | "settings";

export default function CreateExamPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>("basic");
  
  const steps: { id: WizardStep; label: string; description: string }[] = [
    { id: "basic", label: "기본 정보", description: "시험 제목과 유형을 설정합니다" },
    { id: "category", label: "카테고리", description: "카테고리를 선택합니다" },
    { id: "template", label: "템플릿", description: "템플릿을 선택합니다 (선택 사항)" },
    { id: "questionPool", label: "문제 풀", description: "문제 풀을 선택합니다 (선택 사항)" },
    { id: "settings", label: "시험 설정", description: "시험 옵션을 설정합니다" },
  ];

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

  const [formData, setFormData] = useState<CreateExamFormData>({
    title: "",
    description: "",
    examType: "mock",
    subject: "",
    difficulty: "",
    estimatedTime: "",
    passingScore: "",
    isPublic: false,
    categoryId: undefined,
    subcategoryId: undefined,
    templateId: undefined,
    questionPoolIds: [],
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

  // 카테고리 목록 조회
  const { data: categoriesResponse } = useQuery<{ data: Category[] }>({
    queryKey: ["categories-for-exam"],
    queryFn: async () => {
      const response = await categoryAPI.getCategories(true);
      return response.data;
    },
  });

  const categories = categoriesResponse?.data || [];

  // 서브카테고리 목록 조회
  const { data: subcategoriesResponse } = useQuery<{ data: Subcategory[] }>({
    queryKey: ["subcategories", formData.categoryId],
    queryFn: async () => {
      const response = await categoryAPI.getSubcategories(formData.categoryId);
      return response.data;
    },
    enabled: !!formData.categoryId,
  });

  const subcategories = subcategoriesResponse?.data || [];

  // 템플릿 목록 조회
  const { data: templatesResponse } = useQuery<{ data: ExamTemplate[] }>({
    queryKey: ["templates"],
    queryFn: async () => {
      const response = await adminAPI.getTemplates();
      return response.data;
    },
  });

  const templates = templatesResponse?.data || [];

  // 문제 풀 목록 조회
  const { data: questionPoolsResponse } = useQuery<{ data: QuestionPool[] }>({
    queryKey: ["question-pools"],
    queryFn: async () => {
      const response = await adminAPI.getQuestionPools();
      return response.data;
    },
  });

  const questionPools = questionPoolsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: CreateExamFormData) => {
      type CreateExamPayload = {
        title: string;
        examType: "mock" | "practice" | "official";
        description?: string;
        subject?: string;
        difficulty?: "easy" | "medium" | "hard";
        estimatedTime?: number;
        passingScore?: number;
        isPublic: boolean;
        categoryId?: string;
        subcategoryId?: string;
        templateId?: string;
        questionPoolIds?: string[];
        config: CreateExamFormData["config"];
      };

      const payload: CreateExamPayload = {
        title: data.title,
        examType: data.examType,
        description: data.description || undefined,
        subject: data.subject || undefined,
        difficulty: data.difficulty || undefined,
        estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime) : undefined,
        passingScore: data.passingScore ? parseInt(data.passingScore) : undefined,
        isPublic: data.isPublic,
        categoryId: data.categoryId || undefined,
        subcategoryId: data.subcategoryId || undefined,
        templateId: data.templateId || undefined,
        questionPoolIds: data.questionPoolIds && data.questionPoolIds.length > 0 ? data.questionPoolIds : undefined,
        config: data.config,
      };

      // undefined 값 제거
      Object.keys(payload).forEach((key) => {
        const typedKey = key as keyof CreateExamPayload;
        if (payload[typedKey] === undefined || payload[typedKey] === "") {
          delete payload[typedKey];
        }
      });

      const response = await apiClient.post("/exams", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      router.push("/admin/exams");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "시험 생성 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    },
  });

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  
  const canGoNext = () => {
    switch (currentStep) {
      case "basic":
        return formData.title.trim() !== "" && !!formData.examType;
      case "category":
        return true; // 선택 사항
      case "template":
        return true; // 선택 사항
      case "questionPool":
        return true; // 선택 사항
      case "settings":
        return true;
      default:
        return false;
    }
  };

  const canGoPrev = () => currentStepIndex > 0;

  const handleNext = () => {
    if (canGoNext() && currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (canGoPrev()) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: WizardStep) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    // 이전 단계는 자유롭게 이동 가능
    if (stepIndex <= currentStepIndex) {
      setCurrentStep(stepId);
    }
  };

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
    createMutation.mutate(formData);
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

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            새 시험 생성
          </h1>
          <Link
            href="/admin/exams"
            className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
          >
            ← 목록으로
          </Link>
        </div>

        {/* 진행 상태 표시 */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={index > currentStepIndex}
                  className={`flex flex-col items-center flex-1 ${
                    index <= currentStepIndex
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                      index < currentStepIndex
                        ? "bg-success text-white"
                        : index === currentStepIndex
                        ? "bg-button-primary text-button-text ring-4 ring-theme-primary-light"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index < currentStepIndex ? "✓" : index + 1}
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-sm font-medium ${
                        index === currentStepIndex
                          ? "text-blue-600"
                          : index < currentStepIndex
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 mb-6 ${
                      index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* 단계별 컨텐츠 */}
            {currentStep === "basic" && (
              <>
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
                    setFormData({ ...formData, estimatedTime: e.target.value })
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
                    setFormData({ ...formData, passingScore: e.target.value })
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
                <span className="text-sm font-medium text-gray-700">공개 시험</span>
              </label>
            </div>
              </>
            )}

            {currentStep === "category" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 (선택 사항)
                  </label>
                  <select
                    value={formData.categoryId || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        categoryId: e.target.value || undefined,
                        subcategoryId: undefined, // 카테고리 변경 시 서브카테고리 초기화
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">카테고리 선택 안 함</option>
                    {categories.map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon && `${category.icon} `}
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.categoryId && subcategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      서브카테고리 (선택 사항)
                    </label>
                    <select
                      value={formData.subcategoryId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subcategoryId: e.target.value || undefined,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">서브카테고리 선택 안 함</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.icon && `${subcategory.icon} `}
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.categoryId && subcategories.length === 0 && (
                  <div className="text-sm text-gray-500">
                    선택한 카테고리에 서브카테고리가 없습니다.
                  </div>
                )}
              </div>
            )}

            {currentStep === "template" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 선택 (선택 사항)
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    템플릿을 선택하면 시험 구조가 자동으로 설정됩니다.
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <label className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="template"
                        value=""
                        checked={!formData.templateId}
                        onChange={() => setFormData({ ...formData, templateId: undefined })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">템플릿 사용 안 함</div>
                        <div className="text-sm text-gray-500">직접 시험을 구성합니다</div>
                      </div>
                    </label>
                    {templates.map((template: ExamTemplate) => (
                      <label
                        key={template.id}
                        className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="template"
                          value={template.id}
                          checked={formData.templateId === template.id}
                          onChange={() => setFormData({ ...formData, templateId: template.id })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            섹션: {template.structure?.sections?.length || 0}개
                          </div>
                        </div>
                      </label>
                    ))}
                    {templates.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-8">
                        템플릿이 없습니다. 먼저 템플릿을 생성해주세요.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === "questionPool" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문제 풀 선택 (선택 사항)
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    여러 문제 풀을 선택할 수 있습니다. 템플릿을 사용하는 경우 템플릿의 문제 풀이 우선됩니다.
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {questionPools.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-8">
                        문제 풀이 없습니다. 먼저 문제 풀을 생성해주세요.
                      </div>
                    ) : (
                      questionPools.map((pool: QuestionPool) => (
                        <label
                          key={pool.id}
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.questionPoolIds?.includes(pool.id) || false}
                            onChange={(e) => {
                              const currentIds = formData.questionPoolIds || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  questionPoolIds: [...currentIds, pool.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  questionPoolIds: currentIds.filter((id) => id !== pool.id),
                                });
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{pool.name}</div>
                            {pool.description && (
                              <div className="text-sm text-gray-500 mt-1">{pool.description}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-2 flex gap-4">
                              <span>문제 수: {pool.questionIds?.length || 0}개</span>
                              {pool.difficulty && <span>난이도: {pool.difficulty}</span>}
                              {pool.tags && pool.tags.length > 0 && (
                                <span>태그: {pool.tags.join(", ")}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === "settings" && (
              <>
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
                  <span className="text-sm text-gray-700">
                    섹션 간 이동 허용
                  </span>
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
                  <span className="text-sm text-gray-700">
                    섹션별 시간 제한
                  </span>
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
              </>
            )}

          <div className="mt-8 flex gap-4">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                ← 이전
              </button>
            )}
            <div className="flex-1" />
            {currentStepIndex < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
              >
                다음 →
              </Button>
            ) : (
              <>
                <Link
                  href="/admin/exams"
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  취소
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  시험 생성
                </Button>
              </>
            )}
          </div>
          </div>
        </form>
      </div>
    </>
  );
}

