"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { adminAPI, apiClient, User } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface UserFormData {
  name: string;
  role: "admin" | "user";
  isActive: boolean;
  isEmailVerified: boolean;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 상세 조회
  const { data: userData, isLoading } = useQuery<User & {
    _count?: {
      examResults: number;
      licenseKeys: number;
    };
  }>({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const response = await adminAPI.getUser(userId);
      return response.data;
    },
    enabled: !!userId && user?.role === "admin",
  });

  // 사용자 시험 결과 조회
  const { data: examResults } = useQuery({
    queryKey: ["admin-user-exam-results", userId],
    queryFn: async () => {
      const response = await adminAPI.getUserExamResults(userId);
      return response.data;
    },
    enabled: !!userId && user?.role === "admin",
  });

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    role: "user",
    isActive: true,
    isEmailVerified: false,
  });

  // 사용자 데이터 로드 시 폼 데이터 설정
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        role: userData.role || "user",
        isActive: userData.isActive ?? true,
        isEmailVerified: userData.isEmailVerified ?? false,
      });
    }
  }, [userData]);

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiClient.patch(`/admin/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      router.push("/admin/users");
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message || "사용자 정보 수정 중 오류가 발생했습니다."
      );
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    updateMutation.mutate(formData);
  };

  if (!user || user.role !== "admin") {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">사용자를 찾을 수 없습니다.</p>
            <Link
              href="/admin/users"
              className="text-blue-600 hover:text-blue-700"
            >
              ← 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            사용자 상세 / 수정
          </h1>
          <Link
            href="/admin/users"
            className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md border border-blue-600"
          >
            ← 목록으로
          </Link>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 카드 */}
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              기본 정보
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={userData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="text"
                  value={userData.phone || "-"}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가입일
                </label>
                <input
                  type="text"
                  value={
                    userData.createdAt
                      ? new Date(userData.createdAt).toLocaleString("ko-KR")
                      : "-"
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  마지막 로그인
                </label>
                <input
                  type="text"
                  value={
                    userData.lastLoginAt
                      ? new Date(userData.lastLoginAt).toLocaleString("ko-KR")
                      : "로그인 기록 없음"
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* 통계 카드 */}
          {userData._count && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                활동 통계
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">시험 응시 횟수</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {userData._count.examResults}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">라이선스 키</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {userData._count.licenseKeys}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 수정 폼 */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-md p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              사용자 정보 수정
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="사용자 이름"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할 <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "user",
                    })
                  }
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    계정 활성화
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isEmailVerified}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isEmailVerified: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    이메일 인증 완료
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? "수정 중..." : "정보 수정"}
              </button>
              <Link
                href="/admin/users"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                취소
              </Link>
            </div>
          </form>

          {/* 시험 결과 목록 */}
          {examResults && examResults.data && examResults.data.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                최근 시험 결과
              </h2>
              <div className="space-y-4">
                {examResults.data.slice(0, 5).map((result: any) => (
                  <Link
                    key={result.id}
                    href={`/results/${result.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {result.exam?.title || "알 수 없음"}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {result.startedAt
                            ? new Date(result.startedAt).toLocaleString("ko-KR")
                            : "-"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {result.totalScore || 0}점
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.status === "completed" ? "완료" : "진행 중"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

