"use client";

import Link from "next/link";
import { UpdateSiteSettingsDto, getLocalizedValue, updateLocalizedValue } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import IconPicker from "@/components/admin/IconPicker";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface TeamTabProps {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
  markdownLocale: "ko" | "en" | "ja";
  setMarkdownLocale: (locale: "ko" | "en" | "ja") => void;
  structuredLocale: "ko" | "en" | "ja";
  setStructuredLocale: (locale: "ko" | "en" | "ja") => void;
}

export default function TeamTab({
  formData,
  setFormData,
  markdownLocale,
  setMarkdownLocale,
  structuredLocale,
  setStructuredLocale,
}: TeamTabProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  const getLanguageLabel = (loc: "ko" | "en" | "ja") => {
    return loc === "ko" ? t("common.languages.ko") : loc === "en" ? t("common.languages.en") : t("common.languages.ja");
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t("admin.siteSettings.team.title")}</h2>
        <Link
          href="/about/team"
          target="_blank"
          className="text-sm text-theme-primary hover:underline"
        >
          {t("admin.siteSettings.team.viewPage")}
        </Link>
      </div>

      {/* 언어 선택 */}
      <div className="border-b border-border pb-4 mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.team.selectLanguage")}</label>
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

      {/* 팀 소개 텍스트 */}
      <div className="border-b border-border pb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {t("admin.siteSettings.team.aboutTeam")} - {getLanguageLabel(markdownLocale)}
        </label>
        <MarkdownEditor
          value={getLocalizedValue(formData.aboutTeam, markdownLocale)}
          onChange={(value) =>
            setFormData({ 
              ...formData, 
              aboutTeam: updateLocalizedValue(formData.aboutTeam, markdownLocale, value)
            })
          }
          placeholder={t("admin.siteSettings.team.aboutTeam")}
          rows={10}
          showPreview={true}
        />
        <p className="mt-2 text-xs text-text-muted">{t("admin.siteSettings.team.aboutTeamDescription")}</p>
      </div>

      {/* 언어 선택 (구조화된 데이터용) */}
      <div className="border-b border-border pb-4 mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.team.selectLanguageStructured")}</label>
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

      {/* 팀원 */}
      <div className="border-b border-border pb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.team.teamMembers")} - {getLanguageLabel(structuredLocale)}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.team.teamMembersDescription")}</p>
        <div className="space-y-4">
          {(formData.teamMembers?.members || []).map((member, index) => (
            <div key={index} className="p-4 bg-surface-hover rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={member.name || ""}
                  onChange={(e) => {
                    const newMembers = [...(formData.teamMembers?.members || [])];
                    newMembers[index] = { ...member, name: e.target.value };
                    setFormData({
                      ...formData,
                      teamMembers: { members: newMembers },
                    });
                  }}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.team.name")}
                />
                <input
                  type="text"
                  value={getLocalizedValue(member.role, structuredLocale)}
                  onChange={(e) => {
                    const newMembers = [...(formData.teamMembers?.members || [])];
                    newMembers[index] = { 
                      ...member, 
                      role: updateLocalizedValue(member.role, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      teamMembers: { members: newMembers },
                    });
                  }}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.team.role")}
                />
              </div>
              <textarea
                value={getLocalizedValue(member.description, structuredLocale)}
                onChange={(e) => {
                  const newMembers = [...(formData.teamMembers?.members || [])];
                  newMembers[index] = { 
                    ...member, 
                    description: updateLocalizedValue(member.description, structuredLocale, e.target.value)
                  };
                  setFormData({
                    ...formData,
                    teamMembers: { members: newMembers },
                  });
                }}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                placeholder={t("admin.siteSettings.team.description")}
              />
              <input
                type="url"
                value={member.imageUrl || ""}
                onChange={(e) => {
                  const newMembers = [...(formData.teamMembers?.members || [])];
                  newMembers[index] = { ...member, imageUrl: e.target.value };
                  setFormData({
                    ...formData,
                    teamMembers: { members: newMembers },
                  });
                }}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                placeholder={t("admin.siteSettings.team.profileImageUrl")}
              />
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">{t("admin.siteSettings.team.socialLinks")}</label>
                <input
                  type="email"
                  value={member.socialLinks?.email || ""}
                  onChange={(e) => {
                    const newMembers = [...(formData.teamMembers?.members || [])];
                    newMembers[index] = {
                      ...member,
                      socialLinks: {
                        ...member.socialLinks,
                        email: e.target.value,
                      },
                    };
                    setFormData({
                      ...formData,
                      teamMembers: { members: newMembers },
                    });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.team.email")}
                />
                <input
                  type="url"
                  value={member.socialLinks?.linkedin || ""}
                  onChange={(e) => {
                    const newMembers = [...(formData.teamMembers?.members || [])];
                    newMembers[index] = {
                      ...member,
                      socialLinks: {
                        ...member.socialLinks,
                        linkedin: e.target.value,
                      },
                    };
                    setFormData({
                      ...formData,
                      teamMembers: { members: newMembers },
                    });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.team.linkedin")}
                />
                <input
                  type="url"
                  value={member.socialLinks?.github || ""}
                  onChange={(e) => {
                    const newMembers = [...(formData.teamMembers?.members || [])];
                    newMembers[index] = {
                      ...member,
                      socialLinks: {
                        ...member.socialLinks,
                        github: e.target.value,
                      },
                    };
                    setFormData({
                      ...formData,
                      teamMembers: { members: newMembers },
                    });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                  placeholder={t("admin.siteSettings.team.github")}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newMembers = formData.teamMembers?.members?.filter((_, i) => i !== index) || [];
                  setFormData({
                    ...formData,
                    teamMembers: { members: newMembers },
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
                teamMembers: {
                  members: [...(formData.teamMembers?.members || []), { 
                    name: "", 
                    role: "", 
                    description: "",
                    imageUrl: "",
                    socialLinks: {}
                  }],
                },
              });
            }}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
          >
            {t("admin.siteSettings.team.addMember")}
          </button>
        </div>
      </div>

      {/* 팀 문화 */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.team.teamCulture")} - {getLanguageLabel(structuredLocale)}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.team.teamCultureDescription")}</p>
        <div className="space-y-4">
          {(formData.teamCulture?.culture || []).map((culture, index) => (
            <div key={index} className="p-4 bg-surface-hover rounded-lg border border-border hover:border-theme-primary transition-colors space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.icon")}</label>
                <IconPicker
                  value={culture.icon}
                  onChange={(iconName) => {
                    const newCulture = [...(formData.teamCulture?.culture || [])];
                    newCulture[index] = { ...culture, icon: iconName };
                    setFormData({
                      ...formData,
                      teamCulture: { culture: newCulture },
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t("admin.siteSettings.company.titleField")} * ({getLanguageLabel(structuredLocale)})</label>
                <input
                  type="text"
                  value={getLocalizedValue(culture.title, structuredLocale)}
                  onChange={(e) => {
                    const newCulture = [...(formData.teamCulture?.culture || [])];
                    newCulture[index] = { 
                      ...culture, 
                      title: updateLocalizedValue(culture.title, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      teamCulture: { culture: newCulture },
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
                  value={getLocalizedValue(culture.description, structuredLocale)}
                  onChange={(e) => {
                    const newCulture = [...(formData.teamCulture?.culture || [])];
                    newCulture[index] = { 
                      ...culture, 
                      description: updateLocalizedValue(culture.description, structuredLocale, e.target.value)
                    };
                    setFormData({
                      ...formData,
                      teamCulture: { culture: newCulture },
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
                  const newCulture = formData.teamCulture?.culture?.filter((_, i) => i !== index) || [];
                  setFormData({
                    ...formData,
                    teamCulture: { culture: newCulture },
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
                teamCulture: {
                  culture: [...(formData.teamCulture?.culture || []), { icon: "", title: "", description: "" }],
                },
              });
            }}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
          >
            {t("admin.siteSettings.team.addCulture")}
          </button>
        </div>
      </div>
    </div>
  );
}

