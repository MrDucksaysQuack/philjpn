"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { apiClient, examAPI } from "@/lib/api";
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

export default function CreateExamPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const createMutation = useMutation({
    mutationFn: async (data: CreateExamFormData) => {
      const payload: any = {
        title: data.title,
        examType: data.examType,
        description: data.description || undefined,
        subject: data.subject || undefined,
        difficulty: data.difficulty || undefined,
        estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime) : undefined,
        passingScore: data.passingScore ? parseInt(data.passingScore) : undefined,
        isPublic: data.isPublic,
        config: data.config,
      };

      // undefined 값 제거
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === "") {
          delete payload[key];
        }
      });

      const response = await apiClient.post("/exams", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      router.push("/admin/exams");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "시험 생성 중 오류가 발생했습니다.");
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
    createMutation.mutate(formData);
  };

  if (!user || user.role !== "admin") {
    router.push("/login");
    return null;
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 sm:p-8">
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
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "생성 중..." : "시험 생성"}
            </button>
            <Link
              href="/admin/exams"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

