"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import {
  licenseKeyAPI,
  BatchStats,
  LicenseKeyDashboard,
  UsagePrediction,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/components/common/Toast";

export default function BatchManagementPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);

  // 대시보드 데이터 (배치 목록 포함)
  const { data: dashboard, isLoading: dashboardLoading } = useQuery<LicenseKeyDashboard>({
    queryKey: ["license-key-dashboard"],
    queryFn: async () => {
      const response = await licenseKeyAPI.getDashboard();
      return (response.data as unknown) as LicenseKeyDashboard;
    },
    enabled: user?.role === "admin",
  });

  // 만료 예정 배치
  const { data: expiringBatches } = useQuery({
    queryKey: ["expiring-batches"],
    queryFn: async () => {
      const response = await licenseKeyAPI.getExpiringBatches(7);
      const data = response.data || [];
      return Array.isArray(data) ? data : [];
    },
    enabled: user?.role === "admin",
  });

  // 선택된 배치의 통계
  const { data: batchStats, isLoading: statsLoading } = useQuery<BatchStats | null>({
    queryKey: ["batch-stats", selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return null;
      const response = await licenseKeyAPI.getBatchStats(selectedBatchId);
      return (response.data as unknown) as BatchStats;
    },
    enabled: !!selectedBatchId && showStatsModal,
  });

  // 사용량 예측
  const { data: usagePrediction } = useQuery<UsagePrediction | null>({
    queryKey: ["usage-prediction", selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return null;
      const response = await licenseKeyAPI.predictUsage(selectedBatchId, 30);
      return (response.data as unknown) as UsagePrediction;
    },
    enabled: !!selectedBatchId && showPredictionModal,
  });

  // CSV 내보내기
  const exportCSVMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const response = await licenseKeyAPI.exportBatchKeys(batchId);
      return { blob: response.data, batchId };
    },
    onSuccess: ({ blob, batchId }) => {
      // Blob을 다운로드
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `batch-${batchId}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV 파일이 다운로드되었습니다.");
    },
    onError: () => {
      toast.error("CSV 내보내기에 실패했습니다.");
    },
  });

  // 만료 알림 전송
  const notifyMutation = useMutation({
    mutationFn: async (batchId: string) => {
      await licenseKeyAPI.notifyExpiration(batchId);
    },
    onSuccess: () => {
      toast.success("만료 알림이 전송되었습니다.");
    },
    onError: () => {
      toast.error("만료 알림 전송에 실패했습니다.");
    },
  });

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

  const handleViewStats = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowStatsModal(true);
  };

  const handleViewPrediction = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowPredictionModal(true);
  };

  const handleExportCSV = (batchId: string) => {
    if (confirm("이 배치의 키를 CSV 파일로 내보내시겠습니까?")) {
      exportCSVMutation.mutate(batchId);
    }
  };

  const handleNotifyExpiration = (batchId: string) => {
    if (confirm("만료 알림을 전송하시겠습니까?")) {
      notifyMutation.mutate(batchId);
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            배치 관리
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin/license-keys"
              className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
            >
              ← 라이선스 키 관리
            </Link>
          </div>
        </div>

        {/* 대시보드 개요 */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">전체 배치</div>
              <div className="text-2xl font-bold">{dashboard.recentBatches?.length || 0}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">전체 키</div>
              <div className="text-2xl font-bold">{dashboard.overview?.totalKeys || 0}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">활성 키</div>
              <div className="text-2xl font-bold text-green-600">
                {dashboard.overview?.activeKeys || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">총 사용</div>
              <div className="text-2xl font-bold">{dashboard.overview?.totalUsage || 0}</div>
            </div>
          </div>
        )}

        {/* 만료 예정 배치 알림 */}
        {expiringBatches && Array.isArray(expiringBatches) && expiringBatches.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-800 mb-1">
                  ⚠️ 만료 예정 배치 ({expiringBatches.length}개)
                </h3>
                <p className="text-sm text-orange-700">
                  7일 이내에 만료 예정인 배치가 있습니다.
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {expiringBatches.slice(0, 3).map((batch: any) => (
                <div
                  key={batch.batchId || batch.id}
                  className="flex items-center justify-between bg-white rounded p-2"
                >
                  <div>
                    <span className="font-medium text-sm">{batch.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {batch.expiringCount || 0}개 키 만료 예정
                      {batch.daysUntilExpiry !== null && (
                        <span> ({batch.daysUntilExpiry}일 후)</span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNotifyExpiration(batch.batchId || batch.id)}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  >
                    알림 전송
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 배치 목록 */}
        {dashboardLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    배치 이름
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    키 개수
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    생성일
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    통계
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard?.recentBatches && dashboard.recentBatches.length > 0 ? (
                  dashboard.recentBatches.map((batch: any) => (
                    <tr key={batch.batchId || batch.id}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {batch.name}
                          </div>
                          {batch.description && (
                            <div className="text-sm text-gray-500">
                              {batch.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {batch.count || batch.keyCount || 0}개
                        </div>
                        {batch.stats && (
                          <div className="text-xs text-gray-500">
                            사용: {batch.stats.usedKeys || 0}개
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(batch.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {batch.stats && (
                          <div className="text-xs">
                            <div>활성: {batch.stats.activeKeys || 0}</div>
                            <div>사용률: {batch.stats.usageRate?.toFixed(1) || 0}%</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleViewStats(batch.batchId || batch.id)}
                            className="text-blue-600 hover:text-blue-700 text-left"
                          >
                            통계 보기
                          </button>
                          <button
                            onClick={() => handleViewPrediction(batch.batchId || batch.id)}
                            className="text-purple-600 hover:text-purple-700 text-left"
                          >
                            사용량 예측
                          </button>
                          <button
                            onClick={() => handleExportCSV(batch.batchId || batch.id)}
                            disabled={exportCSVMutation.isPending}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50 text-left"
                          >
                            {exportCSVMutation.isPending ? "내보내는 중..." : "CSV 내보내기"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                      배치가 없습니다. 먼저 배치를 생성해주세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 배치 통계 모달 */}
        {showStatsModal && selectedBatchId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">배치 통계</h2>
                  <button
                    onClick={() => {
                      setShowStatsModal(false);
                      setSelectedBatchId(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {statsLoading ? (
                  <div className="text-center py-8">통계를 불러오는 중...</div>
                ) : batchStats ? (
                  <div className="space-y-6">
                    {/* 요약 통계 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">전체 키</div>
                        <div className="text-2xl font-bold">{batchStats.totalKeys}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">활성 키</div>
                        <div className="text-2xl font-bold text-green-600">
                          {batchStats.activeKeys}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">사용된 키</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {batchStats.usedKeys}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">총 사용</div>
                        <div className="text-2xl font-bold">{batchStats.totalUsage}</div>
                      </div>
                    </div>

                    {/* 일별 사용량 차트 */}
                    {batchStats.dailyUsage && batchStats.dailyUsage.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">일별 사용량 (최근 30일)</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="space-y-2">
                            {batchStats.dailyUsage.slice(-7).map((day: any) => (
                              <div key={day.date} className="flex items-center gap-3">
                                <div className="w-24 text-sm text-gray-600">
                                  {new Date(day.date).toLocaleDateString("ko-KR", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                  <div
                                    className="bg-button-primary h-6 rounded-full flex items-center justify-end pr-2"
                                    style={{
                                      width: `${
                                        Math.max(
                                          (day.count / Math.max(...batchStats.dailyUsage.map((d: any) => d.count))) *
                                            100,
                                          5,
                                        )
                                      }%`,
                                    }}
                                  >
                                    <span className="text-xs text-white font-semibold">
                                      {day.count}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 사용량 분포 */}
                    {batchStats.usageDistribution && batchStats.usageDistribution.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">사용량 분포</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {batchStats.usageDistribution.map((dist: any) => (
                            <div key={dist.range} className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-600">{dist.range}</div>
                              <div className="text-xl font-bold">{dist.count}개</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    통계 데이터를 불러올 수 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 사용량 예측 모달 */}
        {showPredictionModal && selectedBatchId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">사용량 예측</h2>
                  <button
                    onClick={() => {
                      setShowPredictionModal(false);
                      setSelectedBatchId(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {usagePrediction ? (
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">
                        향후 {usagePrediction.predictedDays}일간 예상 사용량
                      </div>
                      <div className="text-3xl font-bold text-purple-600">
                        {usagePrediction.predictedUsage}회
                      </div>
                    </div>
                    <p className="text-gray-700">{usagePrediction.message}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    예측 데이터를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

