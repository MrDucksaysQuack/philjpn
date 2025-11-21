"use client";

import Link from "next/link";
import { UpdateSiteSettingsDto, getLocalizedValue, updateLocalizedValue } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import IconPicker from "@/components/admin/IconPicker";
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
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.service.serviceFeatures")} - {getLanguageLabel(structuredLocale)}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.service.serviceFeaturesDescription")}</p>
        <div className="space-y-4">
          {(formData.serviceFeatures?.features || []).map((feature, index) => (
            <div key={index} className="p-4 bg-surface-hover rounded-lg border border-border hover:border-theme-primary transition-colors space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.icon")}</label>
                <IconPicker
                  value={feature.icon}
                  onChange={(iconName) => {
                    const newFeatures = [...(formData.serviceFeatures?.features || [])];
                    newFeatures[index] = { ...feature, icon: iconName };
                    setFormData({
                      ...formData,
                      serviceFeatures: { features: newFeatures },
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.titleField")} * ({getLanguageLabel(structuredLocale)})</label>
                <input
                  type="text"
                  value={getLocalizedValue(feature.title, structuredLocale)}
                  onChange={(e) => {
                    const newFeatures = [...(formData.serviceFeatures?.features || [])];
                    newFeatures[index] = { 
                      ...feature, 
                      title: updateLocalizedValue(feature.title, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      serviceFeatures: { features: newFeatures },
                    });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.company.titleField")}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.description")} * ({getLanguageLabel(structuredLocale)})</label>
                <textarea
                  value={getLocalizedValue(feature.description, structuredLocale)}
                  onChange={(e) => {
                    const newFeatures = [...(formData.serviceFeatures?.features || [])];
                    newFeatures[index] = { 
                      ...feature, 
                      description: updateLocalizedValue(feature.description, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      serviceFeatures: { features: newFeatures },
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
                  const newFeatures = formData.serviceFeatures?.features?.filter((_, i) => i !== index) || [];
                  setFormData({
                    ...formData,
                    serviceFeatures: { features: newFeatures },
                  });
                }}
                className="px-3 py-2 text-error hover:bg-error/10 rounded-lg text-sm transition-colors"
                title={t("common.delete")}
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
                serviceFeatures: {
                  features: [...(formData.serviceFeatures?.features || []), { icon: "", title: "", description: "" }],
                },
              });
            }}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
          >
            {t("admin.siteSettings.service.addFeature")}
          </button>
        </div>
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

