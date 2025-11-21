"use client";

import { useState } from "react";
import EditableCard from "./EditableCard";
import StatCard from "@/components/about/StatCard";
import IconPicker from "@/components/admin/IconPicker";
import { getLocalizedValue, updateLocalizedValue } from "@/lib/api";
import { getIconComponent } from "@/components/about/iconMapper";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface Stat {
  icon?: string;
  value: string | number;
  suffix?: string;
  label: string | { ko?: string; en?: string; ja?: string };
}

interface StatCardEditableProps {
  stat: Stat;
  locale: "ko" | "en" | "ja";
  isEditing: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onSave: (updated: Stat) => void;
  onCancel: () => void;
}

export default function StatCardEditable({
  stat,
  locale,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: StatCardEditableProps) {
  const { t } = useTranslation(locale);
  const [editData, setEditData] = useState<Stat>(stat);

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData(stat);
    onCancel();
  };

  const previewContent = (
    <StatCard
      icon={getIconComponent(editData.icon, "w-7 h-7")}
      value={typeof editData.value === "number" ? editData.value : (editData.value ? Number(editData.value) || editData.value : "")}
      suffix={editData.suffix}
      label={getLocalizedValue(editData.label, locale)}
      animate={false}
    />
  );

  const editContent = (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-theme-primary border-dashed text-center">
      <div className="space-y-4">
        {/* 아이콘 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">
            아이콘
          </label>
          <div className="flex justify-center">
            <IconPicker
              value={editData.icon}
              onChange={(iconName) => setEditData({ ...editData, icon: iconName })}
            />
          </div>
        </div>

        {/* 값 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            값 * (숫자)
          </label>
          <input
            type="text"
            value={String(editData.value || "")}
            onChange={(e) => setEditData({ ...editData, value: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary text-center text-2xl font-bold"
            placeholder="예: 1000"
          />
          <p className="text-xs text-text-muted mt-1">💡 숫자만 입력하세요</p>
        </div>

        {/* 접미사 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            접미사 (선택)
          </label>
          <input
            type="text"
            value={editData.suffix || ""}
            onChange={(e) => setEditData({ ...editData, suffix: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary text-center"
            placeholder="예: +, %, 명"
          />
          <p className="text-xs text-text-muted mt-1">💡 단위나 기호를 입력하세요</p>
        </div>

        {/* 라벨 */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            라벨 * ({locale === "ko" ? "한국어" : locale === "en" ? "English" : "日本語"})
          </label>
          <input
            type="text"
            value={getLocalizedValue(editData.label, locale)}
            onChange={(e) =>
              setEditData({
                ...editData,
                label: updateLocalizedValue(editData.label, locale, e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary text-center"
            placeholder="예: 만족한 고객"
          />
          <p className="text-xs text-text-muted mt-1">💡 통계의 의미를 설명하세요</p>
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

