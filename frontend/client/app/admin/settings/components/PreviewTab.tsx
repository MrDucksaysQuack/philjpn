"use client";

import { UpdateSiteSettingsDto } from "@/lib/api";
import SettingsPreview from "@/components/admin/SettingsPreview";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface PreviewTabProps {
  formData: UpdateSiteSettingsDto;
  contentLocale: "ko" | "en" | "ja";
  setContentLocale: (locale: "ko" | "en" | "ja") => void;
  previewType: "home" | "about";
  setPreviewType: (type: "home" | "about") => void;
}

export default function PreviewTab({
  formData,
  contentLocale,
  setContentLocale,
  previewType,
  setPreviewType,
}: PreviewTabProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  const getLanguageLabel = (loc: "ko" | "en" | "ja") => {
    return loc === "ko" ? t("common.languages.ko") : loc === "en" ? t("common.languages.en") : t("common.languages.ja");
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light">
      <h2 className="text-2xl font-bold text-text-primary mb-6">{t("admin.siteSettings.tabs.preview")}</h2>
      
      {/* 미리보기 타입 및 언어 선택 */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setContentLocale("ko")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              contentLocale === "ko"
                ? "bg-button-primary text-button-text"
                : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {getLanguageLabel("ko")}
          </button>
          <button
            onClick={() => setContentLocale("en")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              contentLocale === "en"
                ? "bg-button-primary text-button-text"
                : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {getLanguageLabel("en")}
          </button>
          <button
            onClick={() => setContentLocale("ja")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              contentLocale === "ja"
                ? "bg-button-primary text-button-text"
                : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {getLanguageLabel("ja")}
          </button>
        </div>
        <div className="flex gap-2">
          <span className="px-4 py-2 bg-surface-hover text-text-secondary rounded-lg text-sm flex items-center">
            {t("admin.siteSettings.content.pageSelection")}
          </span>
          <select
            value={previewType}
            onChange={(e) => setPreviewType(e.target.value as "home" | "about")}
            className="px-4 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary"
          >
            <option value="home">{t("admin.siteSettings.content.homePageOption")}</option>
            <option value="about">{t("admin.siteSettings.content.aboutPageOption")}</option>
          </select>
        </div>
      </div>

      {/* 미리보기 컴포넌트 */}
      <SettingsPreview
        formData={formData}
        previewLocale={contentLocale}
        previewType={previewType}
      />
    </div>
  );
}

