"use client";

import { UpdateSiteSettingsDto } from "@/lib/api";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface ContentTabProps {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
  contentLocale: "ko" | "en" | "ja";
  setContentLocale: (locale: "ko" | "en" | "ja") => void;
}

export default function ContentTab({
  formData,
  setFormData,
  contentLocale,
  setContentLocale,
}: ContentTabProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  const getLanguageLabel = (loc: "ko" | "en" | "ja") => {
    return loc === "ko" ? t("common.languages.ko") : loc === "en" ? t("common.languages.en") : t("common.languages.ja");
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">{t("admin.siteSettings.content.title")}</h2>
        <p className="text-text-secondary">
          {t("admin.siteSettings.content.description")}
        </p>
      </div>

      {/* 언어 선택 */}
      <div className="border-b border-border pb-4">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.selectLanguage")}</label>
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
      <div className="space-y-6 border-b border-border pb-6">
        <h3 className="text-xl font-bold text-text-primary">{t("admin.siteSettings.content.homePage")}</h3>
        
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroTitle")}</label>
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
            placeholder={t("admin.siteSettings.content.heroTitle")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroSubtitle")}</label>
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
            placeholder={t("admin.siteSettings.content.heroSubtitle")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.featuresSectionTitle")}</label>
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
            placeholder={t("admin.siteSettings.content.featuresSectionTitle")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.featuresSectionSubtitle")}</label>
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
            placeholder={t("admin.siteSettings.content.featuresSectionSubtitle")}
          />
        </div>
      </div>

      {/* About 페이지 콘텐츠 */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-text-primary">{t("admin.siteSettings.content.aboutPage")}</h3>
        
        {/* Team */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-text-primary">{t("admin.siteSettings.content.team")}</h4>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroTitle")}</label>
            <input
              type="text"
              value={formData.aboutContent?.[contentLocale]?.team?.hero?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [contentLocale]: {
                      ...formData.aboutContent?.[contentLocale],
                      team: {
                        ...formData.aboutContent?.[contentLocale]?.team,
                        hero: {
                          ...formData.aboutContent?.[contentLocale]?.team?.hero,
                          title: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.content.heroTitle")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroSubtitle")}</label>
            <input
              type="text"
              value={formData.aboutContent?.[contentLocale]?.team?.hero?.subtitle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [contentLocale]: {
                      ...formData.aboutContent?.[contentLocale],
                      team: {
                        ...formData.aboutContent?.[contentLocale]?.team,
                        hero: {
                          ...formData.aboutContent?.[contentLocale]?.team?.hero,
                          subtitle: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.content.heroSubtitle")}
            />
          </div>
        </div>

        {/* Company */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-text-primary">{t("admin.siteSettings.content.company")}</h4>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroSubtitle")}</label>
            <input
              type="text"
              value={formData.aboutContent?.[contentLocale]?.company?.hero?.subtitle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [contentLocale]: {
                      ...formData.aboutContent?.[contentLocale],
                      company: {
                        ...formData.aboutContent?.[contentLocale]?.company,
                        hero: {
                          ...formData.aboutContent?.[contentLocale]?.company?.hero,
                          subtitle: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.content.heroSubtitle")}
            />
          </div>
        </div>

        {/* Service */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-text-primary">{t("admin.siteSettings.content.service")}</h4>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroTitle")}</label>
            <input
              type="text"
              value={formData.aboutContent?.[contentLocale]?.service?.hero?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [contentLocale]: {
                      ...formData.aboutContent?.[contentLocale],
                      service: {
                        ...formData.aboutContent?.[contentLocale]?.service,
                        hero: {
                          ...formData.aboutContent?.[contentLocale]?.service?.hero,
                          title: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.content.heroTitle")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroSubtitle")}</label>
            <input
              type="text"
              value={formData.aboutContent?.[contentLocale]?.service?.hero?.subtitle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [contentLocale]: {
                      ...formData.aboutContent?.[contentLocale],
                      service: {
                        ...formData.aboutContent?.[contentLocale]?.service,
                        hero: {
                          ...formData.aboutContent?.[contentLocale]?.service?.hero,
                          subtitle: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.content.heroSubtitle")}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-text-primary">{t("admin.siteSettings.content.contact")}</h4>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroTitle")}</label>
            <input
              type="text"
              value={formData.aboutContent?.[contentLocale]?.contact?.hero?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [contentLocale]: {
                      ...formData.aboutContent?.[contentLocale],
                      contact: {
                        ...formData.aboutContent?.[contentLocale]?.contact,
                        hero: {
                          ...formData.aboutContent?.[contentLocale]?.contact?.hero,
                          title: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.content.heroTitle")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.content.heroSubtitle")}</label>
            <input
              type="text"
              value={formData.aboutContent?.[contentLocale]?.contact?.hero?.subtitle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [contentLocale]: {
                      ...formData.aboutContent?.[contentLocale],
                      contact: {
                        ...formData.aboutContent?.[contentLocale]?.contact,
                        hero: {
                          ...formData.aboutContent?.[contentLocale]?.contact?.hero,
                          subtitle: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.content.heroSubtitle")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

