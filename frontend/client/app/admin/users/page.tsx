"use client";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminUsersPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      const response = await adminAPI.getUsers({ page, limit: 10, search });
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await adminAPI.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">{t("admin.userManagement.title")}</h1>
          <Link href="/admin" className="text-link hover:text-link-hover">
            {t("admin.userManagement.backToDashboard")}
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder={t("admin.userManagement.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-64 px-4 py-2 border rounded-md"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">{t("admin.userManagement.loading")}</div>
        ) : (
          <>
            <div className="bg-surface rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      {t("admin.userManagement.name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      {t("admin.userManagement.email")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      {t("admin.userManagement.role")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      {t("admin.userManagement.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      {t("admin.userManagement.lastLogin")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      {t("admin.userManagement.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {data?.data.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            user.role === "admin"
                              ? "bg-theme-secondary/20 text-theme-secondary"
                              : "bg-surface-hover text-text-primary"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? t("admin.userManagement.active") : t("admin.userManagement.inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString(
                              "ko-KR",
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          {t("admin.userManagement.detail")}
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("정말 삭제하시겠습니까?")) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이징 */}
            {data && data.meta.totalPages > 1 && (
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
                  onClick={() =>
                    setPage(Math.min(data.meta.totalPages, page + 1))
                  }
                  disabled={page === data.meta.totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
