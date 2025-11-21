"use client";

import Link from "next/link";
import { useState } from "react";
import { UpdateSiteSettingsDto, getLocalizedValue, updateLocalizedValue } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import IconPicker from "@/components/admin/IconPicker";
import { FeatureCardEditable } from "@/components/admin/EditableCards";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface ServiceTabProps {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
  markdownLocale: "ko" | "en" | "ja";
  setMarkdownLocale: (locale: "ko" | "en" | "ja") => void;
  structuredLocale: "ko" | "en" | "ja";
  setStructuredLocale: (locale: "ko" | "en" | "ja") => void;
}

export default function ServiceTab({
  formData,
  setFormData,
  markdownLocale,
  setMarkdownLocale,
  structuredLocale,
  setStructuredLocale,
}: ServiceTabProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  
  // 편집 상태 관리
  const [editingFeatures, setEditingFeatures] = useState<Record<number, boolean>>({});

  const getLanguageLabel = (loc: "ko" | "en" | "ja") => {
    return loc === "ko" ? t("common.languages.ko") : loc === "en" ? t("common.languages.en") : t("common.languages.ja");
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t("admin.siteSettings.service.title")}</h2>
        <Link
          href="/about/service"
          target="_blank"
          className="text-sm text-theme-primary hover:underline"
        >
          {t("admin.siteSettings.service.viewPage")}
        </Link>
      </div>

      {/* 언어 선택 */}
      <div className="border-b border-border pb-4 mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.service.selectLanguage")}</label>
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

      {/* 서비스 소개 텍스트 */}
      <div className="border-b border-border pb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {t("admin.siteSettings.service.serviceInfo")} - {getLanguageLabel(markdownLocale)}
        </label>
        <MarkdownEditor
          value={getLocalizedValue(formData.serviceInfo, markdownLocale)}
          onChange={(value) =>
            setFormData({ 
              ...formData, 
              serviceInfo: updateLocalizedValue(formData.serviceInfo, markdownLocale, value)
            })
          }
          placeholder={t("admin.siteSettings.service.serviceInfo")}
          rows={10}
          showPreview={true}
        />
        <p className="mt-2 text-xs text-text-muted">{t("admin.siteSettings.service.serviceInfoDescription")}</p>
      </div>

      {/* Hero 섹션 */}
      <div className="border-b border-border pb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.service.heroSection")}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.service.heroSectionDescription")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.service.heroTitle")} ({getLanguageLabel(structuredLocale)})</label>
            <input
              type="text"
              value={formData.aboutContent?.[structuredLocale]?.service?.hero?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [structuredLocale]: {
                      ...formData.aboutContent?.[structuredLocale],
                      service: {
                        ...formData.aboutContent?.[structuredLocale]?.service,
                        hero: {
                          ...formData.aboutContent?.[structuredLocale]?.service?.hero,
                          title: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.service.heroTitle")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.service.heroSubtitle")} ({getLanguageLabel(structuredLocale)})</label>
            <input
              type="text"
              value={formData.aboutContent?.[structuredLocale]?.service?.hero?.subtitle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [structuredLocale]: {
                      ...formData.aboutContent?.[structuredLocale],
                      service: {
                        ...formData.aboutContent?.[structuredLocale]?.service,
                        hero: {
                          ...formData.aboutContent?.[structuredLocale]?.service?.hero,
                          subtitle: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.service.heroSubtitle")}
            />
          </div>
        </div>
      </div>

      {/* 언어 선택 (구조화된 데이터용) */}
      <div className="border-b border-border pb-4 mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.service.selectLanguageStructured")}</label>
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

      {/* 서비스 기능 */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{t("admin.siteSettings.service.serviceFeatures")} - {getLanguageLabel(structuredLocale)}</h3>
            <p className="text-sm text-text-secondary mt-1">{t("admin.siteSettings.service.serviceFeaturesDescription")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(formData.serviceFeatures?.features || []).map((feature, index) => (
            <FeatureCardEditable
              key={index}
              feature={feature}
              locale={structuredLocale}
              isEditing={editingFeatures[index] || false}
              onEdit={() => setEditingFeatures({ ...editingFeatures, [index]: true })}
              onDelete={() => {
                const newFeatures = formData.serviceFeatures?.features?.filter((_, i) => i !== index) || [];
                setFormData({
                  ...formData,
                  serviceFeatures: { features: newFeatures },
                });
                const newEditing = { ...editingFeatures };
                delete newEditing[index];
                setEditingFeatures(newEditing);
              }}
              onSave={(updated) => {
                const newFeatures = [...(formData.serviceFeatures?.features || [])];
                newFeatures[index] = updated;
                setFormData({
                  ...formData,
                  serviceFeatures: { features: newFeatures },
                });
                setEditingFeatures({ ...editingFeatures, [index]: false });
              }}
              onCancel={() => {
                const newEditing = { ...editingFeatures };
                delete newEditing[index];
                setEditingFeatures(newEditing);
              }}
            />
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => {
            const newIndex = (formData.serviceFeatures?.features || []).length;
            setFormData({
              ...formData,
              serviceFeatures: {
                features: [...(formData.serviceFeatures?.features || []), { icon: "", title: "", description: "" }],
              },
            });
            setEditingFeatures({ ...editingFeatures, [newIndex]: true });
          }}
          className="mt-4 px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          + {t("admin.siteSettings.service.addFeature")}
        </button>
      </div>

      {/* 서비스 혜택 */}
      <div className="border-b border-border pb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.service.serviceBenefits")} - {getLanguageLabel(structuredLocale)}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.service.serviceBenefitsDescription")}</p>
        <div className="space-y-4">
          {(formData.serviceBenefits?.benefits || []).map((benefit, index) => (
            <div key={index} className="flex gap-4 items-start p-4 bg-surface-hover rounded-lg">
              <input
                type="text"
                value={getLocalizedValue(benefit.text, structuredLocale)}
                onChange={(e) => {
                  const newBenefits = [...(formData.serviceBenefits?.benefits || [])];
                  newBenefits[index] = { 
                    text: updateLocalizedValue(benefit.text, structuredLocale, e.target.value)
                  };
                  setFormData({
                    ...formData,
                    serviceBenefits: { benefits: newBenefits },
                  });
                }}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                placeholder={t("admin.siteSettings.service.benefitText")}
              />
              <button
                type="button"
                onClick={() => {
                  const newBenefits = formData.serviceBenefits?.benefits?.filter((_, i) => i !== index) || [];
                  setFormData({
                    ...formData,
                    serviceBenefits: { benefits: newBenefits },
                  });
                }}
                className="px-3 py-2 text-error hover:bg-error/10 rounded-lg text-sm"
              >
                {t("common.delete")}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                serviceBenefits: {
                  benefits: [...(formData.serviceBenefits?.benefits || []), { text: "" }],
                },
              });
            }}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
          >
            {t("admin.siteSettings.service.addBenefit")}
          </button>
        </div>
      </div>

      {/* 서비스 프로세스 */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.service.serviceProcess")} - {getLanguageLabel(structuredLocale)}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.service.serviceProcessDescription")}</p>
        <div className="space-y-4">
          {(formData.serviceProcess?.steps || []).map((step, index) => (
            <div key={index} className="p-4 bg-surface-hover rounded-lg space-y-3">
              <div className="flex gap-4 items-center">
                <span className="text-sm font-medium text-text-secondary w-12">{t("admin.siteSettings.service.step")} {step.step || index + 1}</span>
                <input
                  type="text"
                  value={getLocalizedValue(step.title, structuredLocale)}
                  onChange={(e) => {
                    const newSteps = [...(formData.serviceProcess?.steps || [])];
                    newSteps[index] = { 
                      ...step, 
                      title: updateLocalizedValue(step.title, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      serviceProcess: { steps: newSteps },
                    });
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.company.titleField")}
                />
              </div>
              <textarea
                value={getLocalizedValue(step.description, structuredLocale)}
                onChange={(e) => {
                  const newSteps = [...(formData.serviceProcess?.steps || [])];
                  newSteps[index] = { 
                    ...step, 
                    description: updateLocalizedValue(step.description, structuredLocale, e.target.value)
                  };
                  setFormData({
                    ...formData,
                    serviceProcess: { steps: newSteps },
                  });
                }}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                placeholder={t("admin.siteSettings.company.description")}
              />
              <button
                type="button"
                onClick={() => {
                  const newSteps = formData.serviceProcess?.steps?.filter((_, i) => i !== index) || [];
                  setFormData({
                    ...formData,
                    serviceProcess: { steps: newSteps },
                  });
                }}
                className="px-3 py-2 text-error hover:bg-error/10 rounded-lg text-sm"
              >
                {t("common.delete")}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const currentSteps = formData.serviceProcess?.steps || [];
              setFormData({
                ...formData,
                serviceProcess: {
                  steps: [...currentSteps, { step: currentSteps.length + 1, title: "", description: "" }],
                },
              });
            }}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
          >
            {t("admin.siteSettings.service.addStep")}
          </button>
        </div>
      </div>
    </div>
  );
}

