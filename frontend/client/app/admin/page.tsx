"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await adminAPI.getDashboard();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const { data: examStats } = useQuery({
    queryKey: ["admin-exam-stats"],
    queryFn: async () => {
      const response = await adminAPI.getExamStatistics();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const { data: keyStats } = useQuery({
    queryKey: ["admin-key-stats"],
    queryFn: async () => {
      const response = await adminAPI.getLicenseKeyStatistics();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  if (!user || user.role !== "admin") {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          관리자 대시보드
        </h1>

        {/* 요약 통계 */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">전체 사용자</div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboard.summary.totalUsers}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">활성 사용자</div>
              <div className="text-3xl font-bold text-blue-600">
                {dashboard.summary.activeUsers}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">전체 시험</div>
              <div className="text-3xl font-bold text-green-600">
                {dashboard.summary.totalExams}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">전체 응시</div>
              <div className="text-3xl font-bold text-purple-600">
                {dashboard.summary.totalAttempts}
              </div>
            </div>
          </div>
        )}

        {/* 시험 통계 */}
        {examStats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">시험 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-gray-500">활성 시험</div>
                <div className="text-lg font-semibold">
                  {examStats.activeExams}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">전체 응시</div>
                <div className="text-lg font-semibold">
                  {examStats.totalAttempts}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">평균 점수</div>
                <div className="text-lg font-semibold">
                  {examStats.averageScore}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">완료율</div>
                <div className="text-lg font-semibold">
                  {examStats.completionRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 라이선스 키 통계 */}
        {keyStats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">라이선스 키 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">전체 키</div>
                <div className="text-lg font-semibold">
                  {keyStats.totalKeys}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">활성 키</div>
                <div className="text-lg font-semibold">
                  {keyStats.activeKeys}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">총 사용</div>
                <div className="text-lg font-semibold">
                  {keyStats.totalUsage}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">만료 예정</div>
                <div className="text-lg font-semibold text-orange-600">
                  {keyStats.expiringSoon}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 빠른 링크 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">사용자 관리</h3>
            <p className="text-gray-600 text-sm">사용자 목록 조회 및 관리</p>
          </Link>
          <Link
            href="/admin/exams"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">시험 관리</h3>
            <p className="text-gray-600 text-sm">시험 생성, 수정, 삭제</p>
          </Link>
          <Link
            href="/admin/exam-results"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">시험 결과 모니터링</h3>
            <p className="text-gray-600 text-sm">전체 시험 결과 조회 및 분석</p>
          </Link>
          <Link
            href="/admin/license-keys"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">라이선스 키 관리</h3>
            <p className="text-gray-600 text-sm">키 발급 및 관리</p>
          </Link>
        </div>

        {/* 최근 활동 */}
        {dashboard &&
          dashboard.recentActivity &&
          dashboard.recentActivity.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
              <div className="space-y-2">
                {dashboard.recentActivity
                  .slice(0, 5)
                  .map((activity: { user?: { name: string }; exam?: { title: string }; timestamp: string }, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div>
                        <span className="font-medium">
                          {activity.user?.name || "Unknown"}
                        </span>
                        <span className="text-gray-600 ml-2">
                          - {activity.exam?.title || "Unknown"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString("ko-KR")}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>
    </>
  );
}
