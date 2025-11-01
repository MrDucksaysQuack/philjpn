"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import { sessionAPI } from "@/lib/api";
import { socketClient } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";

export default function TakeExamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;
  const sessionId = searchParams.get("sessionId") || "";
  const user = useAuthStore((state) => state.user);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
      router.push(`/results/${data.examResultId}`);
    },
  });

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
    saveAnswerMutation.mutate({ questionId, answer });
  };

  const handleSubmit = () => {
    if (confirm("시험을 제출하시겠습니까?")) {
      submitMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">시험 정보를 불러오는 중...</div>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">
            시험 세션을 찾을 수 없습니다.
          </div>
        </div>
      </>
    );
  }

  // TODO: 실제 문제 데이터를 가져와서 표시
  // 현재는 구조만 구현

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{session.exam?.title}</h1>
            <div className="text-sm text-gray-600">
              남은 시간: {session.expiresAt ? "계산 필요" : "-"}
            </div>
          </div>

          <div className="mb-8">
            <div className="text-center text-gray-500 mb-2">
              문제 {currentQuestionNumber} / {session.totalQuestions || "-"}
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{
                  width: `${(currentQuestionNumber / (session.totalQuestions || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-lg mb-4">문제가 여기에 표시됩니다.</p>
              <p className="text-sm text-gray-500">
                실제 문제 데이터는 백엔드 API에서 가져와야 합니다.
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() =>
                setCurrentQuestionNumber(Math.max(1, currentQuestionNumber - 1))
              }
              disabled={currentQuestionNumber === 1}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() =>
                setCurrentQuestionNumber(currentQuestionNumber + 1)
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              다음
            </button>
          </div>

          <div className="mt-8 pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {submitMutation.isPending ? "제출 중..." : "시험 제출"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
