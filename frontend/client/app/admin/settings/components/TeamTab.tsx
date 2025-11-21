"use client";

import Link from "next/link";
import { useState } from "react";
import { UpdateSiteSettingsDto, getLocalizedValue, updateLocalizedValue } from "@/lib/api";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import IconPicker from "@/components/admin/IconPicker";
import { TeamMemberCardEditable, FeatureCardEditable } from "@/components/admin/EditableCards";
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
  
  // 편집 상태 관리
  const [editingMembers, setEditingMembers] = useState<Record<number, boolean>>({});
  const [editingCulture, setEditingCulture] = useState<Record<number, boolean>>({});

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

      {/* Hero 섹션 */}
      <div className="border-b border-border pb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("admin.siteSettings.team.heroSection")}</h3>
        <p className="text-sm text-text-secondary mb-4">{t("admin.siteSettings.team.heroSectionDescription")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.team.heroTitle")} ({getLanguageLabel(structuredLocale)})</label>
            <input
              type="text"
              value={formData.aboutContent?.[structuredLocale]?.team?.hero?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [structuredLocale]: {
                      ...formData.aboutContent?.[structuredLocale],
                      team: {
                        ...formData.aboutContent?.[structuredLocale]?.team,
                        hero: {
                          ...formData.aboutContent?.[structuredLocale]?.team?.hero,
                          title: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.team.heroTitle")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">{t("admin.siteSettings.team.heroSubtitle")} ({getLanguageLabel(structuredLocale)})</label>
            <input
              type="text"
              value={formData.aboutContent?.[structuredLocale]?.team?.hero?.subtitle || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aboutContent: {
                    ...formData.aboutContent,
                    [structuredLocale]: {
                      ...formData.aboutContent?.[structuredLocale],
                      team: {
                        ...formData.aboutContent?.[structuredLocale]?.team,
                        hero: {
                          ...formData.aboutContent?.[structuredLocale]?.team?.hero,
                          subtitle: e.target.value,
                        },
                      },
                    },
                  },
                })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              placeholder={t("admin.siteSettings.team.heroSubtitle")}
            />
          </div>
        </div>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{t("admin.siteSettings.team.teamMembers")} - {getLanguageLabel(structuredLocale)}</h3>
            <p className="text-sm text-text-secondary mt-1">{t("admin.siteSettings.team.teamMembersDescription")}</p>
          </div>
        </div>
        
        {/* 가이드 메시지 */}
        <div className="mb-4 p-4 bg-theme-primary/5 border border-theme-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <h4 className="font-semibold mb-1 text-sm">{t("admin.siteSettings.team.teamMembersGuide")}</h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• 카드에 직접 정보를 입력하면 실시간으로 미리보기가 업데이트됩니다</li>
                <li>• 저장 버튼을 클릭하면 미리보기 모드로 전환됩니다</li>
                <li>• 수정 버튼을 클릭하면 다시 편집할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(formData.teamMembers?.members || []).map((member, index) => (
            <TeamMemberCardEditable
              key={index}
              member={member}
              locale={structuredLocale}
              isEditing={editingMembers[index] || false}
              onEdit={() => setEditingMembers({ ...editingMembers, [index]: true })}
              onDelete={() => {
                const newMembers = formData.teamMembers?.members?.filter((_, i) => i !== index) || [];
                setFormData({
                  ...formData,
                  teamMembers: { members: newMembers },
                });
                const newEditing = { ...editingMembers };
                delete newEditing[index];
                setEditingMembers(newEditing);
              }}
              onSave={(updated) => {
                const newMembers = [...(formData.teamMembers?.members || [])];
                newMembers[index] = updated;
                setFormData({
                  ...formData,
                  teamMembers: { members: newMembers },
                });
                setEditingMembers({ ...editingMembers, [index]: false });
              }}
              onCancel={() => {
                const newEditing = { ...editingMembers };
                delete newEditing[index];
                setEditingMembers(newEditing);
              }}
            />
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => {
            const newIndex = (formData.teamMembers?.members || []).length;
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
            setEditingMembers({ ...editingMembers, [newIndex]: true });
          }}
          className="mt-4 px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          + {t("admin.siteSettings.team.addMember")}
        </button>
      </div>

      {/* 팀 문화 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{t("admin.siteSettings.team.teamCulture")} - {getLanguageLabel(structuredLocale)}</h3>
            <p className="text-sm text-text-secondary mt-1">{t("admin.siteSettings.team.teamCultureDescription")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(formData.teamCulture?.culture || []).map((culture, index) => (
            <FeatureCardEditable
              key={index}
              feature={culture}
              locale={structuredLocale}
              isEditing={editingCulture[index] || false}
              onEdit={() => setEditingCulture({ ...editingCulture, [index]: true })}
              onDelete={() => {
                const newCulture = formData.teamCulture?.culture?.filter((_, i) => i !== index) || [];
                setFormData({
                  ...formData,
                  teamCulture: { culture: newCulture },
                });
                const newEditing = { ...editingCulture };
                delete newEditing[index];
                setEditingCulture(newEditing);
              }}
              onSave={(updated) => {
                const newCulture = [...(formData.teamCulture?.culture || [])];
                newCulture[index] = updated;
                setFormData({
                  ...formData,
                  teamCulture: { culture: newCulture },
                });
                setEditingCulture({ ...editingCulture, [index]: false });
              }}
              onCancel={() => {
                const newEditing = { ...editingCulture };
                delete newEditing[index];
                setEditingCulture(newEditing);
              }}
            />
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => {
            const newIndex = (formData.teamCulture?.culture || []).length;
            setFormData({
              ...formData,
              teamCulture: {
                culture: [...(formData.teamCulture?.culture || []), { icon: "", title: "", description: "" }],
              },
            });
            setEditingCulture({ ...editingCulture, [newIndex]: true });
          }}
          className="mt-4 px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          + {t("admin.siteSettings.team.addCulture")}
        </button>
      </div>
    </div>
  );
}

