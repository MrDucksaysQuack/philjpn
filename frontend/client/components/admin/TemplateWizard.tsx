"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminAPI, CreateTemplateData } from "@/lib/api";
import TagInput from "./TagInput";

interface TemplateWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

type WizardStep = 1 | 2 | 3;

export default function TemplateWizard({
  onClose,
  onSuccess,
}: TemplateWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: "",
    description: "",
    structure: {
      sections: [{ type: "reading", questionCount: 20, tags: [], difficulty: "medium" }],
    },
  });

  // Question Pool 목록 조회
  const { data: poolsResponse } = useQuery({
    queryKey: ["admin-question-pools"],
    queryFn: async () => {
      const response = await adminAPI.getQuestionPools();
      return response.data;
    },
  });

  const pools = poolsResponse?.data || [];

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

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        alert("템플릿 이름을 입력해주세요.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formData.structure.sections.length === 0) {
        alert("최소 1개 이상의 섹션을 추가해주세요.");
        return;
      }
      // 섹션 유효성 검사
      for (const section of formData.structure.sections) {
        if (!section.type) {
          alert("모든 섹션의 타입을 선택해주세요.");
          return;
        }
        if (!section.questionCount || section.questionCount < 1) {
          alert("모든 섹션의 문제 개수를 입력해주세요.");
          return;
        }
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const totalQuestions = formData.structure.sections.reduce(
    (sum, section) => sum + (section.questionCount || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">템플릿 생성 마법사</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 진행 단계 표시 */}
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step
                      ? "bg-theme-primary text-white"
                      : currentStep > step
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step ? "✓" : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      currentStep > step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
            <div className="ml-4 text-sm text-gray-600">
              {currentStep === 1 && "기본 정보"}
              {currentStep === 2 && "섹션 구성"}
              {currentStep === 3 && "검토 및 생성"}
            </div>
          </div>
        </div>

        {/* 단계별 콘텐츠 */}
        <div className="p-6">
          {/* Step 1: 기본 정보 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  템플릿 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  rows={4}
                  placeholder="템플릿에 대한 설명을 입력하세요"
                />
              </div>
            </div>
          )}

          {/* Step 2: 섹션 구성 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
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
                      
                      {/* Question Pool 선택 */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          문제 풀 선택 (우선순위 1) <span className="text-gray-400 text-xs">(선택사항)</span>
                        </label>
                        <select
                          value={section.questionPoolId || ""}
                          onChange={(e) => {
                            updateSection(index, { questionPoolId: e.target.value || undefined });
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
                      </div>

                      {/* 태그/난이도 필터 */}
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
          )}

          {/* Step 3: 검토 및 생성 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">템플릿 요약</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>이름:</strong> {formData.name}</p>
                  {formData.description && <p><strong>설명:</strong> {formData.description}</p>}
                  <p><strong>섹션 수:</strong> {formData.structure.sections.length}개</p>
                  <p><strong>총 문제 수:</strong> {totalQuestions}개</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">섹션 상세</h3>
                {formData.structure.sections.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">섹션 {index + 1}: {section.type}</h4>
                      <span className="text-sm text-gray-600">{section.questionCount}개 문제</span>
                    </div>
                    {section.questionPoolId && (
                      <p className="text-xs text-gray-600">
                        문제 풀: {pools.find((p) => p.id === section.questionPoolId)?.name || "알 수 없음"}
                      </p>
                    )}
                    {!section.questionPoolId && (
                      <div className="text-xs text-gray-600 space-y-1">
                        {section.difficulty && <p>난이도: {section.difficulty}</p>}
                        {section.tags && section.tags.length > 0 && (
                          <p>태그: {section.tags.join(", ")}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {currentStep === 1 ? "취소" : "이전"}
          </button>
          <div className="flex gap-4">
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="px-6 py-2 bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending ? "생성 중..." : "템플릿 생성"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

