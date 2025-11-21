"use client";

import { useState } from "react";
import EditableCard from "./EditableCard";
import TeamMemberCard from "@/components/about/TeamMemberCard";
import FileUploader from "@/components/admin/FileUploader";
import { getLocalizedValue, updateLocalizedValue } from "@/lib/api";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface TeamMember {
  name: string;
  role: string | { ko?: string; en?: string; ja?: string };
  description?: string | { ko?: string; en?: string; ja?: string };
  imageUrl?: string;
  socialLinks?: {
    email?: string;
    linkedin?: string;
    github?: string;
  };
}

interface TeamMemberCardEditableProps {
  member: TeamMember;
  locale: "ko" | "en" | "ja";
  isEditing: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onSave: (updated: TeamMember) => void;
  onCancel: () => void;
}

export default function TeamMemberCardEditable({
  member,
  locale,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: TeamMemberCardEditableProps) {
  const { t } = useTranslation(locale);
  const [editData, setEditData] = useState<TeamMember>(member);

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData(member);
    onCancel();
  };

  const previewContent = (
    <TeamMemberCard
      name={editData.name}
      role={getLocalizedValue(editData.role, locale)}
      description={getLocalizedValue(editData.description, locale)}
      imageUrl={editData.imageUrl}
      socialLinks={editData.socialLinks}
    />
  );

  const editContent = (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-theme-primary border-dashed">
      <div className="space-y-4">
        {/* 프로필 이미지 */}
        <div className="flex justify-center">
          <FileUploader
            type="image"
            currentUrl={editData.imageUrl}
            onUploadComplete={(url) => setEditData({ ...editData, imageUrl: url })}
            onRemove={() => setEditData({ ...editData, imageUrl: "" })}
            label="프로필 이미지"
            maxSize={5}
            accept="image/*"
            aspectRatio="square"
            className="w-32"
          />
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            이름 *
          </label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder="예: 홍길동"
          />
        </div>

        {/* 역할 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            역할 * ({locale === "ko" ? "한국어" : locale === "en" ? "English" : "日本語"})
          </label>
          <input
            type="text"
            value={getLocalizedValue(editData.role, locale)}
            onChange={(e) =>
              setEditData({
                ...editData,
                role: updateLocalizedValue(editData.role, locale, e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder="예: 프론트엔드 개발자"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            설명 ({locale === "ko" ? "한국어" : locale === "en" ? "English" : "日本語"})
          </label>
          <textarea
            value={getLocalizedValue(editData.description, locale)}
            onChange={(e) =>
              setEditData({
                ...editData,
                description: updateLocalizedValue(editData.description, locale, e.target.value),
              })
            }
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary resize-none"
            placeholder="예: React와 TypeScript 전문가"
          />
        </div>

        {/* 소셜 링크 */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="block text-xs font-semibold text-text-secondary mb-2">
            소셜 링크
          </label>
          <input
            type="email"
            value={editData.socialLinks?.email || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                socialLinks: { ...editData.socialLinks, email: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder="이메일 (예: example@email.com)"
          />
          <input
            type="url"
            value={editData.socialLinks?.linkedin || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                socialLinks: { ...editData.socialLinks, linkedin: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder="LinkedIn URL"
          />
          <input
            type="url"
            value={editData.socialLinks?.github || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                socialLinks: { ...editData.socialLinks, github: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder="GitHub URL"
          />
        </div>
      </div>
    </div>
  );

  return (
    <EditableCard
      isEditing={isEditing}
      onEdit={onEdit}
      onDelete={onDelete}
      onSave={handleSave}
      onCancel={handleCancel}
      previewContent={previewContent}
      editContent={editContent}
    />
  );
}

