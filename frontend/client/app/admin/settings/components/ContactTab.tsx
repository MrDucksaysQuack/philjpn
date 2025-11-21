"use client";

import Link from "next/link";
import { UpdateSiteSettingsDto } from "@/lib/api";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface ContactTabProps {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
}

export default function ContactTab({
  formData,
  setFormData,
}: ContactTabProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t("admin.siteSettings.contact.title")}</h2>
        <Link
          href="/about/contact"
          target="_blank"
          className="text-sm text-theme-primary hover:underline"
        >
          {t("admin.siteSettings.contact.viewPage")}
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.contact.contactInfo")}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.contact.contactInfoDescription")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              {t("admin.siteSettings.contact.email")}
            </label>
            <input
              type="email"
              value={formData.contactInfo?.email || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    email: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.email")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              {t("admin.siteSettings.contact.phone")}
            </label>
            <input
              type="tel"
              value={formData.contactInfo?.phone || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    phone: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.phone")}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-text-primary mb-2">
              {t("admin.siteSettings.contact.address")}
            </label>
            <input
              type="text"
              value={formData.contactInfo?.address || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    address: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.address")}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.contact.socialMedia")}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.contact.socialMediaDescription")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.contact.website")}</label>
            <input
              type="url"
              value={formData.contactInfo?.socialMedia?.website || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    socialMedia: {
                      ...formData.contactInfo?.socialMedia,
                      website: e.target.value,
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.website")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.contact.facebook")}</label>
            <input
              type="url"
              value={formData.contactInfo?.socialMedia?.facebook || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    socialMedia: {
                      ...formData.contactInfo?.socialMedia,
                      facebook: e.target.value,
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.facebook")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.contact.twitter")}</label>
            <input
              type="url"
              value={formData.contactInfo?.socialMedia?.twitter || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    socialMedia: {
                      ...formData.contactInfo?.socialMedia,
                      twitter: e.target.value,
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.twitter")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.contact.instagram")}</label>
            <input
              type="url"
              value={formData.contactInfo?.socialMedia?.instagram || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    socialMedia: {
                      ...formData.contactInfo?.socialMedia,
                      instagram: e.target.value,
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.instagram")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.contact.linkedin")}</label>
            <input
              type="url"
              value={formData.contactInfo?.socialMedia?.linkedin || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactInfo: {
                    ...formData.contactInfo,
                    socialMedia: {
                      ...formData.contactInfo?.socialMedia,
                      linkedin: e.target.value,
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.contact.linkedin")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

