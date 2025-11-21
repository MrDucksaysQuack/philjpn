"use client";

import { useState } from "react";
import EditableCard from "./EditableCard";
import FeatureCard from "@/components/about/FeatureCard";
import IconPicker from "@/components/admin/IconPicker";
import { getLocalizedValue, updateLocalizedValue } from "@/lib/api";
import { getIconComponent } from "@/components/about/iconMapper";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface Feature {
  icon?: string;
  title: string | { ko?: string; en?: string; ja?: string };
  description: string | { ko?: string; en?: string; ja?: string };
}

interface FeatureCardEditableProps {
  feature: Feature;
  locale: "ko" | "en" | "ja";
  isEditing: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onSave: (updated: Feature) => void;
  onCancel: () => void;
}

export default function FeatureCardEditable({
  feature,
  locale,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: FeatureCardEditableProps) {
  const { t } = useTranslation(locale);
  const [editData, setEditData] = useState<Feature>(feature);

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData(feature);
    onCancel();
  };

  const previewContent = (
    <FeatureCard
      icon={getIconComponent(editData.icon, "w-8 h-8")}
      title={getLocalizedValue(editData.title, locale)}
      description={getLocalizedValue(editData.description, locale)}
    />
  );

  const editContent = (
    <div className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-theme-primary border-dashed">
      <div className="space-y-4">
        {/* 아이콘 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">
            아이콘
          </label>
          <IconPicker
            value={editData.icon}
            onChange={(iconName) => setEditData({ ...editData, icon: iconName })}
          />
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            제목 * ({locale === "ko" ? "한국어" : locale === "en" ? "English" : "日本語"})
          </label>
          <input
            type="text"
            value={getLocalizedValue(editData.title, locale)}
            onChange={(e) =>
              setEditData({
                ...editData,
                title: updateLocalizedValue(editData.title, locale, e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
            placeholder="예: 혁신적인 솔루션"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            설명 * ({locale === "ko" ? "한국어" : locale === "en" ? "English" : "日本語"})
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
            placeholder="예: 최신 기술을 활용한 혁신적인 솔루션을 제공합니다"
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

