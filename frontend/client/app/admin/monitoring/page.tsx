"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface ActiveSession {
  sessionId: string;
  userId: string;
  examId: string;
  startTime: string;
  duration: number;
  tabSwitches: number;
}

export default function MonitoringPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 활성 세션 조회 (5초마다 자동 갱신)
  const { data, refetch } = useQuery<ActiveSession[]>({
    queryKey: ["admin-monitoring"],
    queryFn: async () => {
      const response = await apiClient.get<ActiveSession[]>("/admin/monitoring/active-sessions");
      return response.data;
    },
    enabled: user?.role === "admin",
    refetchInterval: autoRefresh ? 5000 : false,
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null;
  }

  const sessions = data?.data || [];

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              실시간 모니터링
            </h1>
            <p className="text-gray-600">
              현재 진행 중인 시험 세션을 실시간으로 모니터링합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
            >
              ← 대시보드
            </Link>
            <button
              onClick={() => {
                setAutoRefresh(!autoRefresh);
                if (autoRefresh) {
                  refetch();
                }
              }}
              className={`px-4 py-2 rounded-md border font-medium ${
                autoRefresh
                  ? "bg-green-50 border-green-600 text-green-700"
                  : "bg-gray-50 border-gray-300 text-gray-700"
              }`}
            >
              {autoRefresh ? "🟢 자동 새로고침" : "⏸️ 일시정지"}
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              🔄 새로고침
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-2">활성 세션</div>
            <div className="text-3xl font-bold text-blue-700">
              {sessions.length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-2">평균 진행 시간</div>
            <div className="text-3xl font-bold text-purple-700">
              {sessions.length > 0
                ? Math.round(
                    sessions.reduce((sum, s) => sum + s.duration, 0) /
                      sessions.length
                  )
                : 0}
              분
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-2">탭 전환 경고</div>
            <div className="text-3xl font-bold text-orange-700">
              {sessions.filter((s) => s.tabSwitches > 3).length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-2">정상 진행</div>
            <div className="text-3xl font-bold text-green-700">
              {sessions.filter(
                (s) => s.tabSwitches <= 3 && s.duration > 5
              ).length}
            </div>
          </div>
        </div>

        {/* 세션 목록 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              활성 세션 목록
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-lg mb-2">
                현재 진행 중인 시험이 없습니다.
              </div>
              <p className="text-gray-500 text-sm">
                사용자가 시험을 시작하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세션 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시험 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시작 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      진행 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      탭 전환
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const hasWarning =
                      session.tabSwitches > 3 || session.duration < 5;
                    return (
                      <tr
                        key={session.sessionId}
                        className={hasWarning ? "bg-yellow-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {session.sessionId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.userId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.examId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(session.startTime).toLocaleTimeString(
                            "ko-KR"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-medium">{session.duration}</span>
                          <span className="text-gray-500 ml-1">분</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              session.tabSwitches > 3
                                ? "bg-red-100 text-red-800"
                                : session.tabSwitches > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {session.tabSwitches}회
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              hasWarning
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {hasWarning ? "⚠️ 경고" : "✅ 정상"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-600 mr-3">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">모니터링 가이드:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>탭 전환 경고:</strong> 탭 전환이 3회 이상인 경우
                  부정행위 의심
                </li>
                <li>
                  <strong>빠른 제출 경고:</strong> 진행 시간이 5분 미만인 경우
                  의심
                </li>
                <li>
                  자동 새로고침이 활성화되어 있으면 5초마다 자동으로 갱신됩니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

