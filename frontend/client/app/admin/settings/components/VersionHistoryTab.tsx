"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI, SiteSettingsVersion } from "@/lib/api";
import { Button } from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export default function VersionHistoryTab() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [rollbackingVersionId, setRollbackingVersionId] = useState<string | null>(null);

  // 버전 목록 조회
  const { data: versionsResponse, isLoading } = useQuery({
    queryKey: ["site-settings-versions"],
    queryFn: async () => {
      const response = await adminAPI.getSiteSettingsVersions();
      return response.data;
    },
  });

  const versions = versionsResponse?.data || [];

  // 버전 생성 Mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: { label?: string; description?: string }) => {
      return await adminAPI.createSiteSettingsVersion(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings-versions"] });
      setShowCreateModal(false);
      setCreateLabel("");
      setCreateDescription("");
      toast.success(t("admin.siteSettings.versionHistory.createNew"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.siteSettings.versionHistory.createNew"));
    },
  });

  // 롤백 Mutation
  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      return await adminAPI.rollbackSiteSettingsVersion(versionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings-versions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setRollbackingVersionId(null);
      toast.success(t("admin.siteSettings.versionHistory.rollback"));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("admin.siteSettings.versionHistory.rollback"));
      setRollbackingVersionId(null);
    },
  });

  const handleCreateVersion = () => {
    createVersionMutation.mutate({
      label: createLabel || undefined,
      description: createDescription || undefined,
    });
  };

  const handleRollback = (versionId: string, version: number) => {
    if (typeof window !== "undefined" && confirm(t("admin.siteSettings.versionHistory.confirmRollback").replace("{version}", version.toString()))) {
      setRollbackingVersionId(versionId);
      rollbackMutation.mutate(versionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t("admin.siteSettings.versionHistory.title")}</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
        >
          {t("admin.siteSettings.versionHistory.createNew")}
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner message={t("admin.siteSettings.versionHistory.loading")} />
      ) : versions.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="mb-4">{t("admin.siteSettings.versionHistory.noVersions")}</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
          >
            {t("admin.siteSettings.versionHistory.createFirst")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version: SiteSettingsVersion) => (
            <div
              key={version.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-surface"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-text-primary">
                      v{version.version}
                    </span>
                    {version.label && (
                      <span className="px-2 py-1 bg-info/20 text-info rounded text-sm">
                        {version.label}
                      </span>
                    )}
                  </div>
                  {version.description && (
                    <p className="text-text-secondary mb-2">{version.description}</p>
                  )}
                  <div className="text-sm text-text-muted">
                    <p>
                      {t("admin.siteSettings.versionHistory.createdAt")} {formatDate(version.createdAt)}
                      {version.creator && ` • ${version.creator.name || version.creator.email}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRollback(version.id, version.version)}
                    disabled={rollbackingVersionId === version.id || rollbackMutation.isPending}
                    className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {rollbackingVersionId === version.id ? t("admin.siteSettings.versionHistory.rollingBack") : t("admin.siteSettings.versionHistory.rollback")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 버전 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-xl font-bold text-text-primary mb-4">{t("admin.siteSettings.versionHistory.createModalTitle")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t("admin.siteSettings.versionHistory.label")}
                </label>
                <input
                  type="text"
                  value={createLabel}
                  onChange={(e) => setCreateLabel(e.target.value)}
                  placeholder={t("admin.siteSettings.versionHistory.labelPlaceholder")}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-theme-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t("admin.siteSettings.versionHistory.description")}
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder={t("admin.siteSettings.versionHistory.descriptionPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-theme-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateLabel("");
                  setCreateDescription("");
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-text-primary"
              >
                {t("admin.siteSettings.versionHistory.cancel")}
              </button>
              <Button
                onClick={handleCreateVersion}
                disabled={createVersionMutation.isPending}
                isLoading={createVersionMutation.isPending}
                className="flex-1"
              >
                {t("admin.siteSettings.versionHistory.create")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

