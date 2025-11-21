"use client";

import { UpdateSiteSettingsDto } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface BasicInfoTabProps {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
  uploadingLogo: boolean;
  uploadingFavicon: boolean;
  isAnalyzing: boolean;
  onFileUpload: (file: File, type: 'logo' | 'favicon') => void;
  onAnalyzeColors: () => void;
  t: (key: string) => string;
}

export default function BasicInfoTab({
  formData,
  setFormData,
  uploadingLogo,
  uploadingFavicon,
  isAnalyzing,
  onFileUpload,
  onAnalyzeColors,
  t: tProp,
}: BasicInfoTabProps) {
  const { locale } = useLocaleStore();
  const { t: tHook } = useTranslation(locale);
  const t = tHook || tProp;

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-6">
      <h2 className="text-2xl font-bold text-text-primary mb-6">{t("admin.siteSettings.basicInfo.title")}</h2>

      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {t("admin.siteSettings.basicInfo.companyName")}
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) =>
            setFormData({ ...formData, companyName: e.target.value })
          }
          className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
          placeholder={t("admin.siteSettings.basicInfo.companyNamePlaceholder")}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {t("admin.siteSettings.basicInfo.logo")}
        </label>
        <div className="space-y-3">
          {/* 파일 업로드 버튼 */}
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onFileUpload(file, 'logo');
                  }
                }}
                disabled={uploadingLogo}
              />
              <div className="px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-theme-primary transition-colors text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-surface-hover">
                {uploadingLogo ? (
                  <span className="text-theme-primary">{t("admin.siteSettings.basicInfo.uploading")}</span>
                ) : (
                  <span className="text-text-secondary">{t("admin.siteSettings.basicInfo.logoUpload")}</span>
                )}
              </div>
            </label>
            <button
              type="button"
              onClick={onAnalyzeColors}
              disabled={!formData.logoUrl || isAnalyzing || uploadingLogo}
              className="px-4 py-2 bg-theme-gradient-secondary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
              title={t("admin.siteSettings.colorAnalysis")}
            >
              {isAnalyzing ? t("admin.siteSettings.analyzing") : t("admin.siteSettings.colorAnalysis")}
            </button>
          </div>
          
          {/* URL 직접 입력 (또는) */}
          <div className="text-center text-xs text-text-muted">{t("admin.siteSettings.basicInfo.or")}</div>
          
          {/* URL 입력 필드 */}
          <input
            type="url"
            value={formData.logoUrl}
            onChange={(e) =>
              setFormData({ ...formData, logoUrl: e.target.value })
            }
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder={t("admin.siteSettings.basicInfo.logoUrlPlaceholder")}
            disabled={uploadingLogo}
          />
          
          {/* 미리보기 */}
          {formData.logoUrl && (
            <div className="mt-2 p-3 bg-surface-hover rounded-lg border border-border">
              <div className="text-xs text-text-secondary mb-2">{t("admin.siteSettings.preview")}:</div>
              <img
                src={formData.logoUrl}
                alt={t("admin.siteSettings.logoPreview")}
                className="h-20 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {t("admin.siteSettings.basicInfo.favicon")}
        </label>
        <div className="space-y-3">
          {/* 파일 업로드 버튼 */}
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*,.ico"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileUpload(file, 'favicon');
                }
              }}
              disabled={uploadingFavicon}
            />
            <div className="px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-theme-primary transition-colors text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-surface-hover">
              {uploadingFavicon ? (
                <span className="text-theme-primary">{t("admin.siteSettings.basicInfo.uploading")}</span>
              ) : (
                <span className="text-text-secondary">{t("admin.siteSettings.basicInfo.faviconUpload")}</span>
              )}
            </div>
          </label>
          
          {/* URL 직접 입력 (또는) */}
          <div className="text-center text-xs text-text-muted">{t("admin.siteSettings.basicInfo.or")}</div>
          
          {/* URL 입력 필드 */}
          <input
            type="url"
            value={formData.faviconUrl}
            onChange={(e) =>
              setFormData({ ...formData, faviconUrl: e.target.value })
            }
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder={t("admin.siteSettings.basicInfo.faviconUrlPlaceholder")}
            disabled={uploadingFavicon}
          />
          
          {/* 미리보기 */}
          {formData.faviconUrl && (
            <div className="mt-2 p-3 bg-surface-hover rounded-lg border border-border">
              <div className="text-xs text-text-secondary mb-2">{t("admin.siteSettings.preview")}:</div>
              <img
                src={formData.faviconUrl}
                alt={t("admin.siteSettings.faviconPreview")}
                className="h-16 w-16 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

