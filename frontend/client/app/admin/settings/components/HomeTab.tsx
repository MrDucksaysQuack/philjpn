"use client";

import { UpdateSiteSettingsDto } from "@/lib/api";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface HomeTabProps {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
  contentLocale: "ko" | "en" | "ja";
  setContentLocale: (locale: "ko" | "en" | "ja") => void;
}

export default function HomeTab({
  formData,
  setFormData,
  contentLocale,
  setContentLocale,
}: HomeTabProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  const getLanguageLabel = (loc: "ko" | "en" | "ja") => {
    return loc === "ko" ? t("common.languages.ko") : loc === "en" ? t("common.languages.en") : t("common.languages.ja");
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">{t("admin.siteSettings.home.title")}</h2>
        <p className="text-text-secondary">
          {t("admin.siteSettings.home.description")}
        </p>
      </div>

      {/* 언어 선택 */}
      <div className="border-b border-border pb-4">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.home.selectLanguage")}</label>
        <div className="flex gap-2">
          {(["ko", "en", "ja"] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setContentLocale(loc)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                contentLocale === loc
                  ? "bg-theme-primary text-button-text"
                  : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {getLanguageLabel(loc)}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 페이지 콘텐츠 */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-text-primary">{t("admin.siteSettings.home.homePage")}</h3>
        
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.home.heroTitle")}</label>
          <input
            type="text"
            value={formData.homeContent?.[contentLocale]?.hero?.title || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                homeContent: {
                  ...formData.homeContent,
                  [contentLocale]: {
                    ...formData.homeContent?.[contentLocale],
                    hero: {
                      ...formData.homeContent?.[contentLocale]?.hero,
                      title: e.target.value,
                    },
                  },
                },
              })
            }
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder={t("admin.siteSettings.home.heroTitle")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.home.heroSubtitle")}</label>
          <input
            type="text"
            value={formData.homeContent?.[contentLocale]?.hero?.subtitle || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                homeContent: {
                  ...formData.homeContent,
                  [contentLocale]: {
                    ...formData.homeContent?.[contentLocale],
                    hero: {
                      ...formData.homeContent?.[contentLocale]?.hero,
                      subtitle: e.target.value,
                    },
                  },
                },
              })
            }
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder={t("admin.siteSettings.home.heroSubtitle")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.home.featuresSectionTitle")}</label>
          <input
            type="text"
            value={formData.homeContent?.[contentLocale]?.featuresSectionTitle || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                homeContent: {
                  ...formData.homeContent,
                  [contentLocale]: {
                    ...formData.homeContent?.[contentLocale],
                    featuresSectionTitle: e.target.value,
                  },
                },
              })
            }
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder={t("admin.siteSettings.home.featuresSectionTitle")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.home.featuresSectionSubtitle")}</label>
          <input
            type="text"
            value={formData.homeContent?.[contentLocale]?.featuresSectionSubtitle || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                homeContent: {
                  ...formData.homeContent,
                  [contentLocale]: {
                    ...formData.homeContent?.[contentLocale],
                    featuresSectionSubtitle: e.target.value,
                  },
                },
              })
            }
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder={t("admin.siteSettings.home.featuresSectionSubtitle")}
          />
        </div>
      </div>
    </div>
  );
}

