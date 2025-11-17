"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/Header";
import {
  adminAPI,
  apiClient,
  licenseKeyAPI,
  CreateLicenseKeyPayload,
  CreateBatchLicenseKeyPayload,
  UpdateLicenseKeyPayload,
  LicenseKey,
  Exam,
  PaginatedResponse,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/components/common/Toast";

export default function AdminLicenseKeysPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<"single" | "batch">("single");
  const [filters, setFilters] = useState({
    search: "",
    keyType: "",
    isActive: "" as "" | "true" | "false",
    minUsage: "",
    maxUsage: "",
    dateFrom: "",
    dateTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [newKey, setNewKey] = useState({
    keyType: "TEST_KEY",
    userId: "",
    examIds: [] as string[],
    usageLimit: "",
    validFrom: "",
    validUntil: "",
  });
  const [newBatch, setNewBatch] = useState({
    name: "",
    description: "",
    count: "10",
    keyType: "TEST_KEY",
    examIds: [] as string[],
    usageLimit: "",
    validDays: "",
    prefix: "",
  });
  const [errors, setErrors] = useState<{
    batchName?: string;
    batchCount?: string;
    [key: string]: string | undefined;
  }>({});

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
      queryClient.invalidateQueries({ queryKey: ["admin-key-stats"] });
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

  const createBatchMutation = useMutation({
    mutationFn: async (data: CreateBatchLicenseKeyPayload) => {
      const response = await licenseKeyAPI.createBatch(data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-license-keys"] });
      queryClient.invalidateQueries({ queryKey: ["admin-key-stats"] });
      setIsCreating(false);
      setNewBatch({
        name: "",
        description: "",
        count: "10",
        keyType: "TEST_KEY",
        examIds: [],
        usageLimit: "",
        validDays: "",
        prefix: "",
      });
      toast.success(`배치 생성 완료! 배치 ID: ${data.batch.id}, 생성된 키 개수: ${data.count}개`);
      setErrors({});
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

  const validateBatchForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!newBatch.name.trim()) {
      newErrors.batchName = "배치 이름을 입력해주세요.";
    }
    
    if (!newBatch.count || parseInt(newBatch.count) < 1 || parseInt(newBatch.count) > 10000) {
      newErrors.batchCount = "키 개수는 1~10000 사이여야 합니다.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateBatch = () => {
    if (!validateBatchForm()) {
      return;
    }

    const payload: CreateBatchLicenseKeyPayload = {
      name: newBatch.name,
      count: parseInt(newBatch.count),
      keyType: newBatch.keyType,
    };
    if (newBatch.description) payload.description = newBatch.description;
    if (newBatch.examIds.length > 0) payload.examIds = newBatch.examIds;
    if (newBatch.usageLimit) payload.usageLimit = parseInt(newBatch.usageLimit);
    if (newBatch.validDays) payload.validDays = parseInt(newBatch.validDays);
    if (newBatch.prefix) payload.prefix = newBatch.prefix;

    if (typeof window !== 'undefined' && confirm(`${newBatch.count}개의 라이선스 키를 생성하시겠습니까?`)) {
      createBatchMutation.mutate(payload);
    }
  };

  const toggleKeyStatus = (key: LicenseKey) => {
    updateMutation.mutate({
      id: key.id,
      data: { isActive: !key.isActive },
    });
  };

  const toggleKeySelection = (keyId: string) => {
    setSelectedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  // 필터링된 데이터 계산
  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    
    return data.data.filter((key: LicenseKey) => {
      // 검색 필터
      if (filters.search && !key.key.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // 키 유형 필터
      if (filters.keyType && key.keyType !== filters.keyType) {
        return false;
      }
      
      // 상태 필터
      if (filters.isActive !== "") {
        const isActive = key.isActive === true;
        if (filters.isActive === "true" && !isActive) {
          return false;
        }
        if (filters.isActive === "false" && isActive) {
          return false;
        }
      }
      
      // 사용 횟수 필터
      if (filters.minUsage && key.usageCount < parseFloat(filters.minUsage)) {
        return false;
      }
      if (filters.maxUsage && key.usageCount > parseFloat(filters.maxUsage)) {
        return false;
      }
      
      // 날짜 필터
      if (key.validFrom) {
        const validFrom = new Date(key.validFrom);
        if (filters.dateFrom && validFrom < new Date(filters.dateFrom)) {
          return false;
        }
      }
      if (key.validUntil) {
        const validUntil = new Date(key.validUntil);
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (validUntil > toDate) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [data, filters]);

  const selectAllKeys = () => {
    if (filteredData.length === 0) return;
    if (selectedKeys.size === filteredData.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredData.map((key: LicenseKey) => key.id)));
    }
  };

  const handleBulkActivate = () => {
    if (selectedKeys.size === 0) return;
    if (typeof window !== 'undefined' && confirm(`${selectedKeys.size}개의 키를 활성화하시겠습니까?`)) {
      Array.from(selectedKeys).forEach((keyId) => {
        const key = data?.data?.find((k: LicenseKey) => k.id === keyId);
        if (key && !key.isActive) {
          updateMutation.mutate({
            id: keyId,
            data: { isActive: true },
          });
        }
      });
      setSelectedKeys(new Set());
    }
  };

  const handleBulkDeactivate = () => {
    if (selectedKeys.size === 0) return;
    if (typeof window !== 'undefined' && confirm(`${selectedKeys.size}개의 키를 비활성화하시겠습니까?`)) {
      Array.from(selectedKeys).forEach((keyId) => {
        const key = data?.data?.find((k: LicenseKey) => k.id === keyId);
        if (key && key.isActive) {
          updateMutation.mutate({
            id: keyId,
            data: { isActive: false },
          });
        }
      });
      setSelectedKeys(new Set());
    }
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
            <Link
              href="/admin/license-keys/batches"
              className="text-purple-600 hover:text-purple-700 px-4 py-2 rounded-md border border-purple-600"
            >
              📊 배치 관리
            </Link>
            <button
              onClick={() => {
                setIsCreating(!isCreating);
                if (!isCreating) setCreateMode("single");
              }}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">새 라이선스 키 생성</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateMode("single")}
                  className={`px-4 py-2 rounded-md text-sm ${
                    createMode === "single"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  단일 생성
                </button>
                <button
                  onClick={() => setCreateMode("batch")}
                  className={`px-4 py-2 rounded-md text-sm ${
                    createMode === "batch"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  배치 생성
                </button>
              </div>
            </div>

            {/* 단일 키 생성 폼 */}
            {createMode === "single" && (
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
            )}

            {/* 배치 생성 폼 */}
            {createMode === "batch" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배치 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBatch.name}
                  onChange={(e) => {
                    setNewBatch({ ...newBatch, name: e.target.value });
                    if (errors.batchName) {
                      setErrors({ ...errors, batchName: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.batchName ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                  placeholder="예: 2024년 1월 배치"
                  required
                />
                {errors.batchName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{errors.batchName}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배치 설명 (선택)
                </label>
                <textarea
                  value={newBatch.description}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="배치에 대한 설명을 입력하세요"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    생성할 키 개수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newBatch.count}
                    onChange={(e) => {
                      setNewBatch({ ...newBatch, count: e.target.value });
                      if (errors.batchCount) {
                        setErrors({ ...errors, batchCount: undefined });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.batchCount ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                    placeholder="1~10000"
                    min={1}
                    max={10000}
                    required
                  />
                  {errors.batchCount ? (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{errors.batchCount}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      최대 10,000개까지 생성 가능합니다
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    키 유형 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBatch.keyType}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, keyType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="TEST_KEY">시험 키</option>
                    <option value="ACCESS_KEY">접근 키</option>
                    <option value="ADMIN_KEY">관리자 키</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  적용 시험 (선택)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border p-2 rounded">
                  {exams?.map((exam) => (
                    <label
                      key={exam.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={newBatch.examIds.includes(exam.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewBatch({
                              ...newBatch,
                              examIds: [...newBatch.examIds, exam.id],
                            });
                          } else {
                            setNewBatch({
                              ...newBatch,
                              examIds: newBatch.examIds.filter(
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사용 제한 (각 키당, 선택)
                  </label>
                  <input
                    type="number"
                    value={newBatch.usageLimit}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, usageLimit: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="비워두면 무제한"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    유효 기간 (일, 선택)
                  </label>
                  <input
                    type="number"
                    value={newBatch.validDays}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, validDays: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="예: 30"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    키 접두사 (선택)
                  </label>
                  <input
                    type="text"
                    value={newBatch.prefix}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, prefix: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="예: BATCH2024"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>배치 생성 안내:</strong> 대량의 라이선스 키를 한 번에 생성할 수 있습니다.
                  생성된 키들은 동일한 설정을 공유하며, 배치 단위로 관리할 수 있습니다.
                </p>
              </div>
              <button
                onClick={handleCreateBatch}
                disabled={createBatchMutation.isPending}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
              >
                {createBatchMutation.isPending
                  ? `생성 중... (${newBatch.count}개)`
                  : `배치 생성 (${newBatch.count}개)`}
              </button>
            </div>
            )}
          </div>
        )}

        {/* 필터 섹션 */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">필터</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {showFilters ? "필터 숨기기" : "필터 보기"}
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="키 검색..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">키 유형</label>
                <select
                  value={filters.keyType}
                  onChange={(e) => setFilters({ ...filters, keyType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">전체</option>
                  <option value="TEST_KEY">시험 키</option>
                  <option value="ACCESS_KEY">접근 키</option>
                  <option value="ADMIN_KEY">관리자 키</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">전체</option>
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최소 사용 횟수</label>
                <input
                  type="number"
                  value={filters.minUsage}
                  onChange={(e) => setFilters({ ...filters, minUsage: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최대 사용 횟수</label>
                <input
                  type="number"
                  value={filters.maxUsage}
                  onChange={(e) => setFilters({ ...filters, maxUsage: e.target.value })}
                  placeholder="100"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유효 시작일</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유효 종료일</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilters({
                search: "",
                keyType: "",
                isActive: "",
                minUsage: "",
                maxUsage: "",
                dateFrom: "",
                dateTo: "",
              })}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 키 목록 */}
        {isLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                총 {filteredData.length}개의 키가 표시됩니다
              </div>
              {selectedKeys.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {selectedKeys.size}개 선택됨
                  </span>
                  <button
                    onClick={handleBulkActivate}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    선택 항목 활성화
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    선택 항목 비활성화
                  </button>
                  <button
                    onClick={() => setSelectedKeys(new Set())}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    선택 해제
                  </button>
                </div>
              )}
            </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 sm:px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={filteredData.length > 0 && selectedKeys.size === filteredData.length}
                        onChange={selectAllKeys}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label="전체 선택"
                      />
                    </th>
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
                  {filteredData.map((key: LicenseKey) => (
                    <tr key={key.id} className={selectedKeys.has(key.id) ? "bg-blue-50" : ""}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(key.id)}
                          onChange={() => toggleKeySelection(key.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`${key.key} 선택`}
                        />
                      </td>
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
                        ? `${key.usageCount}/${key.usageLimit}`
                        : key.usageCount}
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
            
            {filteredData.length === 0 && data && data.data && data.data.length > 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow mt-4">
                <p className="text-gray-500">필터 조건에 맞는 키가 없습니다.</p>
              </div>
            )}
          </>
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
