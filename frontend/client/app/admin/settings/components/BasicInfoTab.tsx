"use client";

import { UpdateSiteSettingsDto } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import FileUploader from "@/components/admin/FileUploader";
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-text-primary">
            {t("admin.siteSettings.basicInfo.logo")}
          </label>
          {formData.logoUrl && (
            <button
              type="button"
              onClick={onAnalyzeColors}
              disabled={isAnalyzing || uploadingLogo}
              className="px-3 py-1.5 bg-theme-gradient-secondary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium whitespace-nowrap"
              title={t("admin.siteSettings.colorAnalysis")}
            >
              {isAnalyzing ? t("admin.siteSettings.analyzing") : t("admin.siteSettings.colorAnalysis")}
            </button>
          )}
        </div>
        <FileUploader
          type="image"
          currentUrl={formData.logoUrl}
          onUploadComplete={(url) => {
            setFormData({ ...formData, logoUrl: url });
          }}
          onRemove={() => {
            setFormData({ ...formData, logoUrl: "" });
          }}
          maxSize={5}
          accept="image/*"
          aspectRatio="auto"
        />
      </div>

      <div>
        <FileUploader
          type="image"
          currentUrl={formData.faviconUrl}
          onUploadComplete={(url) => {
            setFormData({ ...formData, faviconUrl: url });
          }}
          onRemove={() => {
            setFormData({ ...formData, faviconUrl: "" });
          }}
          label={t("admin.siteSettings.basicInfo.favicon")}
          maxSize={5}
          accept="image/*,.ico"
          aspectRatio="square"
        />
      </div>
    </div>
  );
}

