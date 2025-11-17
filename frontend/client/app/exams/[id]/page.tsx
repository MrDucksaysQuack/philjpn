"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { examAPI, sessionAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { emotionalToast, toast } from "@/components/common/Toast";
import { getContextualError } from "@/lib/messages";

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 라이선스 키 자동 포맷팅 (XXXX-XXXX-XXXX-XXXX)
  const formatLicenseKey = (value: string) => {
    // 하이픈 제거
    const cleaned = value.replace(/-/g, '');
    // 4자리씩 그룹화하여 하이픈 추가
    const formatted = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
    // 최대 19자 (XXXX-XXXX-XXXX-XXXX)
    return formatted.slice(0, 19);
  };

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const response = await examAPI.getExam(examId);
      return response.data;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["exam-sections", examId],
    queryFn: async () => {
      const response = await examAPI.getExamSections(examId);
      return response.data;
    },
    enabled: !!examId,
  });

  const handleStartExam = async () => {
    if (!licenseKey.trim()) {
      setError("라이선스 키를 입력해주세요.");
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await sessionAPI.startExam(examId, { licenseKey });
      router.push(`/exams/${examId}/take?sessionId=${response.data.sessionId}`);
    } catch (err) {
      const contextualError = getContextualError(err, () => handleStartExam());
      setError(contextualError.message);
      // Toast로도 표시
      toast.error(contextualError.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">
            시험을 찾을 수 없습니다.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {exam.title}
          </h1>

          {exam.description && (
            <p className="text-gray-600 mb-6">{exam.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">시험 유형</div>
              <div className="text-lg font-semibold">{exam.examType}</div>
            </div>
            {exam.estimatedTime && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">예상 소요 시간</div>
                <div className="text-lg font-semibold">
                  {exam.estimatedTime}분
                </div>
              </div>
            )}
            {exam.passingScore && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">합격 점수</div>
                <div className="text-lg font-semibold">
                  {exam.passingScore}점
                </div>
              </div>
            )}
          </div>

          {sections && sections.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">섹션 구성</h2>
              <div className="space-y-2">
                {sections.map((section: { id: string; title: string; description?: string; questionCount?: number }) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">{section.title}</span>
                      {section.description && (
                        <span className="text-sm text-gray-500 ml-2">
                          - {section.description}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {section.questionCount}문제
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">시험 시작</h2>
            {!user ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                시험을 시작하려면 로그인이 필요합니다.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="licenseKey"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    라이선스 키 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="licenseKey"
                    type="text"
                    value={licenseKey}
                    onChange={(e) => {
                      const formatted = formatLicenseKey(e.target.value);
                      setLicenseKey(formatted);
                      // 입력 중이면 에러 메시지 제거
                      if (error) setError("");
                    }}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    maxLength={19}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      error
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <span>💡</span>
                    <span>라이선스 키는 관리자에게 문의하거나 이메일로 발급받을 수 있습니다.</span>
                  </p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleStartExam}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "시험 시작 중..." : "시험 시작"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
