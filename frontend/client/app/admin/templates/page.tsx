"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { adminAPI, ExamTemplate, CreateTemplateData, QuestionPool } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import TagInput from "@/components/admin/TagInput";
import TemplateWizard from "@/components/admin/TemplateWizard";

export default function TemplatesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: async () => {
      const response = await adminAPI.getTemplates();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const templates = templatesResponse?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminAPI.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
  });

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="인증 확인 중..." />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        <div className="relative bg-theme-gradient-diagonal overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                시험 템플릿 관리
              </h1>
              <p className="text-xl text-theme-primary-light max-w-2xl mx-auto">
                템플릿을 생성하고 관리하여 빠르게 시험을 만들 수 있습니다
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">템플릿 목록</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              + 새 템플릿 생성
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">로딩 중...</div>
          ) : templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                      {template.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/templates/${template.id}`)}
                        className="p-2 text-theme-primary hover:bg-theme-primary-light rounded-lg"
                        title="수정"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("이 템플릿을 삭제하시겠습니까?")) {
                            deleteMutation.mutate(template.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      섹션: {(template.structure.sections || []).length}개
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      생성일: {new Date(template.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                    {template._count && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        사용된 시험: {template._count.exams}개
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedTemplate(template.id)}
                    className="w-full px-4 py-2 bg-theme-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-all"
                  >
                    이 템플릿으로 시험 생성
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-4">템플릿이 없습니다.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold"
              >
                첫 템플릿 생성하기
              </button>
            </div>
          )}
        </div>

        {/* 템플릿 생성 마법사 */}
        {showCreateModal && (
          <TemplateWizard
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
            }}
          />
        )}

        {/* 시험 생성 모달 */}
        {selectedTemplate && (
          <CreateExamFromTemplateModal
            templateId={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onSuccess={() => {
              setSelectedTemplate(null);
              router.push("/admin/exams");
            }}
          />
        )}
      </div>
    </>
  );
}

// 템플릿 생성 모달 (더 이상 사용하지 않음 - TemplateWizard로 대체됨)
// function CreateTemplateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Question Pool 목록 조회
  const { data: poolsResponse } = useQuery({
    queryKey: ["admin-question-pools"],
    queryFn: async () => {
      const response = await adminAPI.getQuestionPools();
      return response.data;
    },
  });

  const pools = poolsResponse?.data || [];

  const [formData, setFormData] = useState<CreateTemplateData>({
    name: "",
    description: "",
    structure: {
      sections: [{ type: "reading", questionCount: 20, tags: [], difficulty: "medium" }],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      await adminAPI.createTemplate(data);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const addSection = () => {
    setFormData({
      ...formData,
      structure: {
        sections: [
          ...formData.structure.sections,
          { type: "", questionCount: 10, tags: [], difficulty: "medium" },
        ],
      },
    });
  };

  const removeSection = (index: number) => {
    setFormData({
      ...formData,
      structure: {
        sections: formData.structure.sections.filter((_, i) => i !== index),
      },
    });
  };

  const updateSection = (index: number, updates: any) => {
    const newSections = [...formData.structure.sections];
    newSections[index] = { ...newSections[index], ...updates };
    setFormData({
      ...formData,
      structure: { sections: newSections },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">새 템플릿 생성</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: TOEIC 실전 모의고사 템플릿"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="템플릿에 대한 설명을 입력하세요"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">섹션 구성</label>
              <button
                onClick={addSection}
                className="px-4 py-2 bg-theme-primary text-white rounded-lg text-sm hover:opacity-90"
              >
                + 섹션 추가
              </button>
            </div>
            <div className="space-y-4">
              {formData.structure.sections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900">섹션 {index + 1}</h4>
                    {formData.structure.sections.length > 1 && (
                      <button
                        onClick={() => removeSection(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">타입 *</label>
                        <select
                          value={section.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            if (newType === "custom") {
                              // 사용자 정의 선택 시 입력 필드 표시
                              updateSection(index, { type: "", isCustomType: true });
                            } else {
                              updateSection(index, { type: newType, isCustomType: false });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        >
                          <option value="">선택하세요</option>
                          <option value="reading">독해 (Reading)</option>
                          <option value="listening">청해 (Listening)</option>
                          <option value="grammar">문법 (Grammar)</option>
                          <option value="vocabulary">어휘 (Vocabulary)</option>
                          <option value="writing">작문 (Writing)</option>
                          <option value="speaking">회화 (Speaking)</option>
                          <option value="custom">사용자 정의</option>
                        </select>
                        {(section as any).isCustomType && (
                          <input
                            type="text"
                            value={section.type}
                            onChange={(e) => updateSection(index, { type: e.target.value, isCustomType: true })}
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="사용자 정의 타입 입력"
                            autoFocus
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">문제 개수 *</label>
                        <input
                          type="number"
                          value={section.questionCount}
                          onChange={(e) =>
                            updateSection(index, { questionCount: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          min={1}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Question Pool 선택 (우선순위 1) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        문제 풀 선택 (우선순위 1) <span className="text-gray-400 text-xs">(선택사항)</span>
                      </label>
                      <select
                        value={section.questionPoolId || ""}
                        onChange={(e) => {
                          const updates: any = { questionPoolId: e.target.value || undefined };
                          // Pool을 선택하면 태그/난이도 필터는 비활성화 (하지만 값은 유지)
                          updateSection(index, updates);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      >
                        <option value="">문제 풀 선택 안 함 (태그/난이도 필터 사용)</option>
                        {pools.map((pool) => (
                          <option key={pool.id} value={pool.id}>
                            {pool.name} ({pool.questionIds?.length || 0}개 문제)
                          </option>
                        ))}
                      </select>
                      {section.questionPoolId && (
                        <p className="mt-1 text-xs text-gray-500">
                          ✓ 문제 풀을 선택하면 태그/난이도 필터는 무시됩니다.
                        </p>
                      )}
                    </div>

                    {/* 태그/난이도 필터 (questionPoolId가 없을 때만 사용) */}
                    {!section.questionPoolId && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">난이도 (선택)</label>
                          <select
                            value={section.difficulty || ""}
                            onChange={(e) => updateSection(index, { difficulty: e.target.value || undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          >
                            <option value="">전체</option>
                            <option value="easy">쉬움</option>
                            <option value="medium">중급</option>
                            <option value="hard">어려움</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">태그 (선택)</label>
                          <TagInput
                            tags={section.tags || []}
                            onChange={(tags) => updateSection(index, { tags })}
                            suggestions={["문법", "어휘", "독해", "작문", "청해", "문법기초", "문법고급", "어휘기초", "어휘고급"]}
                            placeholder="태그를 입력하고 Enter를 누르세요"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || createMutation.isPending}
            className="px-6 py-2 bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? "생성 중..." : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 템플릿으로 시험 생성 모달
function CreateExamFromTemplateModal({
  templateId,
  onClose,
  onSuccess,
}: {
  templateId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    examType: "mock",
    subject: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await adminAPI.createExamFromTemplate({
        templateId,
        ...formData,
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">템플릿으로 시험 생성</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시험 제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="예: 2024년 11월 모의고사"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 유형
              </label>
              <select
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="mock">모의고사</option>
                <option value="practice">연습</option>
                <option value="official">정식</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                과목
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="예: 영어"
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!formData.title || createMutation.isPending}
            className="px-6 py-2 bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? "생성 중..." : "시험 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

