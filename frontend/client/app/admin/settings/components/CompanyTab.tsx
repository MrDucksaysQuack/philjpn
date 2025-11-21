"use client";

import Link from "next/link";
import { useState } from "react";
import { UpdateSiteSettingsDto, getLocalizedValue, updateLocalizedValue, isLocalizedString } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import IconPicker from "@/components/admin/IconPicker";
import { StatCardEditable, FeatureCardEditable } from "@/components/admin/EditableCards";
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
  
  // 편집 상태 관리
  const [editingStats, setEditingStats] = useState<Record<number, boolean>>({});
  const [editingValues, setEditingValues] = useState<Record<number, boolean>>({});

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

      {/* Hero 섹션 */}
      <div className="border-b border-border pb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.company.heroSection")}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.company.heroSectionDescription")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.company.heroSubtitle")} ({getLanguageLabel(structuredLocale)})</label>
            <input
              type="text"
              value={formData.aboutContent?.[structuredLocale]?.company?.hero?.subtitle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [structuredLocale]: {
                      ...formData.aboutContent?.[structuredLocale],
                      company: {
                        ...formData.aboutContent?.[structuredLocale]?.company,
                        hero: {
                          ...formData.aboutContent?.[structuredLocale]?.company?.hero,
                          subtitle: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.company.heroSubtitle")}
            />
          </div>
        </div>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{t("admin.siteSettings.company.companyStats")} - {getLanguageLabel(structuredLocale)}</h3>
            <p className="text-sm text-text-secondary mt-1">{t("admin.siteSettings.company.companyStatsDescription")}</p>
          </div>
        </div>
        
        {/* 가이드 메시지 */}
        <div className="mb-4 p-4 bg-theme-primary/5 border border-theme-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <h4 className="font-semibold mb-1 text-sm">{t("admin.siteSettings.company.companyStatsGuide")}</h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• 카드에 직접 정보를 입력하면 실시간으로 미리보기가 업데이트됩니다</li>
                <li>• Value는 숫자만 입력 (예: 1000)</li>
                <li>• Suffix는 단위나 기호 (예: +, %, 명)</li>
                <li>• Label은 통계의 의미를 설명 (예: "만족한 고객")</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(formData.companyStats?.stats || []).map((stat, index) => (
            <StatCardEditable
              key={index}
              stat={stat}
              locale={structuredLocale}
              isEditing={editingStats[index] || false}
              onEdit={() => setEditingStats({ ...editingStats, [index]: true })}
              onDelete={() => {
                const newStats = formData.companyStats?.stats?.filter((_, i) => i !== index) || [];
                setFormData({
                  ...formData,
                  companyStats: { stats: newStats },
                });
                const newEditing = { ...editingStats };
                delete newEditing[index];
                setEditingStats(newEditing);
              }}
              onSave={(updated) => {
                const newStats = [...(formData.companyStats?.stats || [])];
                newStats[index] = updated;
                setFormData({
                  ...formData,
                  companyStats: { stats: newStats },
                });
                setEditingStats({ ...editingStats, [index]: false });
              }}
              onCancel={() => {
                const newEditing = { ...editingStats };
                delete newEditing[index];
                setEditingStats(newEditing);
              }}
            />
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => {
            const newIndex = (formData.companyStats?.stats || []).length;
            setFormData({
              ...formData,
              companyStats: {
                stats: [...(formData.companyStats?.stats || []), { icon: "", value: "", suffix: "", label: "" }],
              },
            });
            setEditingStats({ ...editingStats, [newIndex]: true });
          }}
          className="mt-4 px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          + {t("admin.siteSettings.company.addStat")}
        </button>
      </div>

      {/* 회사 가치 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{t("admin.siteSettings.company.companyValues")} - {getLanguageLabel(structuredLocale)}</h3>
            <p className="text-sm text-text-secondary mt-1">{t("admin.siteSettings.company.companyValuesDescription")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(formData.companyValues?.values || []).map((value, index) => (
            <FeatureCardEditable
              key={index}
              feature={value}
              locale={structuredLocale}
              isEditing={editingValues[index] || false}
              onEdit={() => setEditingValues({ ...editingValues, [index]: true })}
              onDelete={() => {
                const newValues = formData.companyValues?.values?.filter((_, i) => i !== index) || [];
                setFormData({
                  ...formData,
                  companyValues: { values: newValues },
                });
                const newEditing = { ...editingValues };
                delete newEditing[index];
                setEditingValues(newEditing);
              }}
              onSave={(updated) => {
                const newValues = [...(formData.companyValues?.values || [])];
                newValues[index] = updated;
                setFormData({
                  ...formData,
                  companyValues: { values: newValues },
                });
                setEditingValues({ ...editingValues, [index]: false });
              }}
              onCancel={() => {
                const newEditing = { ...editingValues };
                delete newEditing[index];
                setEditingValues(newEditing);
              }}
            />
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => {
            const newIndex = (formData.companyValues?.values || []).length;
            setFormData({
              ...formData,
              companyValues: {
                values: [...(formData.companyValues?.values || []), { icon: "", title: "", description: "" }],
              },
            });
            setEditingValues({ ...editingValues, [newIndex]: true });
          }}
          className="mt-4 px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          + {t("admin.siteSettings.company.addValue")}
        </button>
      </div>
    </div>
  );
}

