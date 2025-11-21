"use client";

import Link from "next/link";
import { UpdateSiteSettingsDto, getLocalizedValue, updateLocalizedValue, isLocalizedString } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import IconPicker from "@/components/admin/IconPicker";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface CompanyTabProps {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
  markdownLocale: "ko" | "en" | "ja";
  setMarkdownLocale: (locale: "ko" | "en" | "ja") => void;
  structuredLocale: "ko" | "en" | "ja";
  setStructuredLocale: (locale: "ko" | "en" | "ja") => void;
}

export default function CompanyTab({
  formData,
  setFormData,
  markdownLocale,
  setMarkdownLocale,
  structuredLocale,
  setStructuredLocale,
}: CompanyTabProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  const getLanguageLabel = (loc: "ko" | "en" | "ja") => {
    return loc === "ko" ? t("common.languages.ko") : loc === "en" ? t("common.languages.en") : t("common.languages.ja");
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t("admin.siteSettings.company.title")}</h2>
        <Link
          href="/about/company"
          target="_blank"
          className="text-sm text-theme-primary hover:underline"
        >
          {t("admin.siteSettings.company.viewPage")}
        </Link>
      </div>

      {/* 언어 선택 */}
      <div className="border-b border-border pb-4 mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.company.selectLanguage")}</label>
        <div className="flex gap-2">
          {(["ko", "en", "ja"] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setMarkdownLocale(loc)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                markdownLocale === loc
                  ? "bg-theme-primary text-button-text"
                  : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {getLanguageLabel(loc)}
            </button>
          ))}
        </div>
      </div>

      {/* 회사 소개 텍스트 */}
      <div className="border-b border-border pb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {t("admin.siteSettings.company.aboutCompany")} - {getLanguageLabel(markdownLocale)}
        </label>
        <MarkdownEditor
          value={getLocalizedValue(formData.aboutCompany, markdownLocale)}
          onChange={(value) =>
            setFormData({ 
              ...formData, 
              aboutCompany: updateLocalizedValue(formData.aboutCompany, markdownLocale, value)
            })
          }
          placeholder={t("admin.siteSettings.company.aboutCompany")}
          rows={10}
          showPreview={true}
        />
        <p className="mt-2 text-xs text-text-muted">{t("admin.siteSettings.company.aboutCompanyDescription")}</p>
      </div>

      {/* 언어 선택 (구조화된 데이터용) */}
      <div className="border-b border-border pb-4 mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.company.selectLanguageStructured")}</label>
        <div className="flex gap-2">
          {(["ko", "en", "ja"] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setStructuredLocale(loc)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                structuredLocale === loc
                  ? "bg-theme-primary text-button-text"
                  : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {getLanguageLabel(loc)}
            </button>
          ))}
        </div>
      </div>

      {/* 회사 통계 */}
      <div className="border-b border-border pb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.company.companyStats")} - {getLanguageLabel(structuredLocale)}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.company.companyStatsDescription")}</p>
        <div className="space-y-4">
          {(formData.companyStats?.stats || []).map((stat, index) => (
            <div key={index} className="flex gap-4 items-start p-4 bg-surface-hover rounded-lg border border-border hover:border-theme-primary transition-colors">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.icon")}</label>
                  <IconPicker
                    value={stat.icon}
                    onChange={(iconName) => {
                      const newStats = [...(formData.companyStats?.stats || [])];
                      newStats[index] = { ...stat, icon: iconName };
                      setFormData({
                        ...formData,
                        companyStats: { stats: newStats },
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.value")} *</label>
                  <input
                    type="text"
                    value={stat.value || ""}
                    onChange={(e) => {
                      const newStats = [...(formData.companyStats?.stats || [])];
                      newStats[index] = { ...stat, value: e.target.value };
                      setFormData({
                        ...formData,
                        companyStats: { stats: newStats },
                      });
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                    placeholder={t("admin.siteSettings.company.value")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.suffix")}</label>
                  <input
                    type="text"
                    value={stat.suffix || ""}
                    onChange={(e) => {
                      const newStats = [...(formData.companyStats?.stats || [])];
                      newStats[index] = { ...stat, suffix: e.target.value };
                      setFormData({
                        ...formData,
                        companyStats: { stats: newStats },
                      });
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                    placeholder={t("admin.siteSettings.company.suffixPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.label")} * ({getLanguageLabel(structuredLocale)})</label>
                  <input
                    type="text"
                    value={getLocalizedValue(stat.label, structuredLocale)}
                    onChange={(e) => {
                      const newStats = [...(formData.companyStats?.stats || [])];
                      newStats[index] = { 
                        ...stat, 
                        label: updateLocalizedValue(stat.label, structuredLocale, e.target.value)
                      };
                      setFormData({
                        ...formData,
                        companyStats: { stats: newStats },
                      });
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                    placeholder={t("admin.siteSettings.company.label")}
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newStats = formData.companyStats?.stats?.filter((_, i) => i !== index) || [];
                  setFormData({
                    ...formData,
                    companyStats: { stats: newStats },
                  });
                }}
                className="px-3 py-2 text-error hover:bg-error/10 rounded-lg text-sm transition-colors"
                title={t("admin.siteSettings.company.delete")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                companyStats: {
                  stats: [...(formData.companyStats?.stats || []), { icon: "", value: "", suffix: "", label: "" }],
                },
              });
            }}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
          >
            {t("admin.siteSettings.company.addStat")}
          </button>
        </div>
      </div>

      {/* 회사 가치 */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.company.companyValues")}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.company.companyValuesDescription")}</p>
        <div className="space-y-4">
          {(formData.companyValues?.values || []).map((value, index) => (
            <div key={index} className="p-4 bg-surface-hover rounded-lg border border-border hover:border-theme-primary transition-colors space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.icon")}</label>
                <IconPicker
                  value={value.icon}
                  onChange={(iconName) => {
                    const newValues = [...(formData.companyValues?.values || [])];
                    newValues[index] = { ...value, icon: iconName };
                    setFormData({
                      ...formData,
                      companyValues: { values: newValues },
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.titleField")} * ({getLanguageLabel(structuredLocale)})</label>
                <input
                  type="text"
                  value={getLocalizedValue(value.title, structuredLocale)}
                  onChange={(e) => {
                    const newValues = [...(formData.companyValues?.values || [])];
                    newValues[index] = { 
                      ...value, 
                      title: updateLocalizedValue(value.title, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      companyValues: { values: newValues },
                    });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.company.titlePlaceholder")}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.description")} * ({getLanguageLabel(structuredLocale)})</label>
                <textarea
                  value={getLocalizedValue(value.description, structuredLocale)}
                  onChange={(e) => {
                    const newValues = [...(formData.companyValues?.values || [])];
                    newValues[index] = { 
                      ...value, 
                      description: updateLocalizedValue(value.description, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      companyValues: { values: newValues },
                    });
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.company.description")}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newValues = formData.companyValues?.values?.filter((_, i) => i !== index) || [];
                  setFormData({
                    ...formData,
                    companyValues: { values: newValues },
                  });
                }}
                className="px-3 py-2 text-error hover:bg-error/10 rounded-lg text-sm transition-colors"
                title={t("admin.siteSettings.company.delete")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                companyValues: {
                  values: [...(formData.companyValues?.values || []), { icon: "", title: "", description: "" }],
                },
              });
            }}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
          >
            {t("admin.siteSettings.company.addValue")}
          </button>
        </div>
      </div>
    </div>
  );
}

