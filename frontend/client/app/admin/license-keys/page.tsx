"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Header from "@/components/layout/Header";
import {
  adminAPI,
  apiClient,
  CreateLicenseKeyPayload,
  UpdateLicenseKeyPayload,
  LicenseKey,
  Exam,
  PaginatedResponse,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminLicenseKeysPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState({
    keyType: "TEST_KEY",
    userId: "",
    examIds: [] as string[],
    usageLimit: "",
    validFrom: "",
    validUntil: "",
  });

  const { data, isLoading } = useQuery<PaginatedResponse<LicenseKey>>({
    queryKey: ["admin-license-keys", page],
    queryFn: async (): Promise<PaginatedResponse<LicenseKey>> => {
      const response = await apiClient.get<PaginatedResponse<LicenseKey>>(
        "/license-keys",
        {
          params: { page, limit: 20 },
        },
      );
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-key-stats"],
    queryFn: async () => {
      const response = await adminAPI.getLicenseKeyStatistics();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["exams-list"],
    queryFn: async (): Promise<Exam[]> => {
      const response = await apiClient.get<PaginatedResponse<Exam>>("/exams", {
        params: { limit: 100 },
      });
      return response.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateLicenseKeyPayload) => {
      await apiClient.post("/license-keys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-license-keys"] });
      setIsCreating(false);
      setNewKey({
        keyType: "TEST_KEY",
        userId: "",
        examIds: [],
        usageLimit: "",
        validFrom: "",
        validUntil: "",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLicenseKeyPayload;
    }) => {
      await apiClient.patch(`/license-keys/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-license-keys"] });
    },
  });

  if (!user || user.role !== "admin") {
    router.push("/login");
    return null;
  }

  const handleCreate = () => {
    const payload: CreateLicenseKeyPayload = {
      keyType: newKey.keyType,
      examIds: newKey.examIds,
    };
    if (newKey.userId) payload.userId = newKey.userId;
    if (newKey.usageLimit) payload.usageLimit = parseInt(newKey.usageLimit);
    if (newKey.validFrom) payload.validFrom = newKey.validFrom;
    if (newKey.validUntil) payload.validUntil = newKey.validUntil;
    createMutation.mutate(payload);
  };

  const toggleKeyStatus = (key: LicenseKey) => {
    updateMutation.mutate({
      id: key.id,
      data: { isActive: !key.isActive },
    });
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            라이선스 키 관리
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
            >
              ← 대시보드
            </Link>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {isCreating ? "취소" : "+ 새 키 생성"}
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">전체 키</div>
              <div className="text-2xl font-bold">{stats.totalKeys}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">활성 키</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeKeys}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">총 사용</div>
              <div className="text-2xl font-bold">{stats.totalUsage}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">만료 예정</div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.expiringSoon}
              </div>
            </div>
          </div>
        )}

        {/* 생성 폼 */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">새 라이선스 키 생성</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  키 유형
                </label>
                <select
                  value={newKey.keyType}
                  onChange={(e) =>
                    setNewKey({ ...newKey, keyType: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="TEST_KEY">시험 키</option>
                  <option value="ACCESS_KEY">접근 키</option>
                  <option value="ADMIN_KEY">관리자 키</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사용자 ID (선택)
                </label>
                <input
                  type="text"
                  value={newKey.userId}
                  onChange={(e) =>
                    setNewKey({ ...newKey, userId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="UUID (비워두면 일반 키)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  적용 시험
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border p-2 rounded">
                  {exams?.map((exam) => (
                    <label
                      key={exam.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={newKey.examIds.includes(exam.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKey({
                              ...newKey,
                              examIds: [...newKey.examIds, exam.id],
                            });
                          } else {
                            setNewKey({
                              ...newKey,
                              examIds: newKey.examIds.filter(
                                (id) => id !== exam.id,
                              ),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{exam.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사용 제한 (선택)
                  </label>
                  <input
                    type="number"
                    value={newKey.usageLimit}
                    onChange={(e) =>
                      setNewKey({ ...newKey, usageLimit: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="비워두면 무제한"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    유효 기간 시작
                  </label>
                  <input
                    type="date"
                    value={newKey.validFrom}
                    onChange={(e) =>
                      setNewKey({ ...newKey, validFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    유효 기간 종료
                  </label>
                  <input
                    type="date"
                    value={newKey.validUntil}
                    onChange={(e) =>
                      setNewKey({ ...newKey, validUntil: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "생성 중..." : "키 생성"}
              </button>
            </div>
          </div>
        )}

        {/* 키 목록 */}
        {isLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    키
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    유형
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    사용 횟수
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    유효 기간
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.data?.map((key) => (
                  <tr key={key.id}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {key.key}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded bg-gray-100">
                        {key.keyType}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {key.usageLimit
                        ? `${key.usedCount}/${key.usageLimit}`
                        : key.usedCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      {key.validFrom
                        ? key.validUntil
                          ? `${new Date(key.validFrom).toLocaleDateString("ko-KR")} ~ ${new Date(key.validUntil).toLocaleDateString("ko-KR")}`
                          : `${new Date(key.validFrom).toLocaleDateString("ko-KR")} ~ 무제한`
                        : "-"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          key.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {key.isActive ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleKeyStatus(key)}
                        className={`text-sm px-3 py-1 rounded ${
                          key.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {key.isActive ? "비활성화" : "활성화"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이징 */}
        {data && data.meta && data.meta.totalPages > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-4 py-2">
              {page} / {data.meta.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
              disabled={page === data.meta.totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </>
  );
}
