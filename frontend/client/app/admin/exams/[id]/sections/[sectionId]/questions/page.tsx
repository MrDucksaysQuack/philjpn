"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { questionAPI, CreateQuestionDto, Question } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";
import MediaUploader from "@/components/admin/MediaUploader";

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.sectionId as string;
  const examId = params.id as string;
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { data: questionsResponse, isLoading } = useQuery({
    queryKey: ["questions", sectionId],
    queryFn: async () => {
      const response = await questionAPI.getQuestionsBySection(sectionId);
      return response.data;
    },
    enabled: !!sectionId && user?.role === "admin",
  });

  const questions = questionsResponse?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await questionAPI.deleteQuestion(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", sectionId] });
      toast.success("문제가 삭제되었습니다.");
    },
  });

  if (authLoading || isLoading) {
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

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push(`/admin/exams/${examId}`)}
                className="text-blue-600 hover:text-blue-700 mb-2"
              >
                ← 시험으로 돌아가기
              </button>
              <h1 className="text-3xl font-bold text-gray-900">문제 관리</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold hover:opacity-90"
            >
              + 문제 추가
            </button>
          </div>

          {questions.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-600">
                            문제 {question.questionNumber}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {question.questionType === 'multiple_choice' ? '객관식' :
                             question.questionType === 'fill_blank' ? '빈칸 채우기' : '주관식'}
                          </span>
                          {question.difficulty && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              question.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {question.difficulty === 'hard' ? '어려움' :
                               question.difficulty === 'medium' ? '중급' : '쉬움'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 mb-2">{question.content}</p>
                        {question.imageUrl && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">이미지 첨부됨</span>
                          </div>
                        )}
                        {question.audioUrl && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">
                              오디오 첨부됨 (재생 제한: {question.audioPlayLimit || 2}회)
                            </span>
                          </div>
                        )}
                        {question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {question.tags.map((tag) => (
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
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => setEditingQuestion(question)}
                          size="sm"
                        >
                          수정
                        </Button>
                        <button
                          onClick={() => {
                            if (confirm("정말 삭제하시겠습니까?")) {
                              deleteMutation.mutate(question.id);
                            }
                          }}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500 mb-4">등록된 문제가 없습니다.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg font-semibold"
              >
                첫 문제 추가하기
              </button>
            </div>
          )}

          {/* 생성/수정 모달 */}
          {(showCreateModal || editingQuestion) && (
            <QuestionModal
              sectionId={sectionId}
              question={editingQuestion}
              onClose={() => {
                setShowCreateModal(false);
                setEditingQuestion(null);
              }}
              onSuccess={() => {
                setShowCreateModal(false);
                setEditingQuestion(null);
                queryClient.invalidateQueries({ queryKey: ["questions", sectionId] });
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

// 문제 생성/수정 모달
function QuestionModal({
  sectionId,
  question,
  onClose,
  onSuccess,
}: {
  sectionId: string;
  question?: Question | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
  });

  const [newTag, setNewTag] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: CreateQuestionDto) => {
      if (question) {
        await questionAPI.updateQuestion(question.id, data);
      } else {
        await questionAPI.createQuestionInSection(sectionId, data);
      }
    },
    onSuccess: () => {
      toast.success(question ? "문제가 수정되었습니다." : "문제가 생성되었습니다.");
      onSuccess();
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

            <div>
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
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending
                ? question
                  ? "수정 중..."
                  : "생성 중..."
                : question
                ? "수정"
                : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

