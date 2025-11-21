"use client";

import { ReactNode } from "react";

interface EditableCardProps {
  isEditing: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  previewContent: ReactNode;
  editContent: ReactNode;
  className?: string;
}

/**
 * 표준화된 편집 가능한 카드 컴포넌트
 * 편집 모드와 미리보기 모드를 자동으로 전환
 */
export default function EditableCard({
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  previewContent,
  editContent,
  className = "",
}: EditableCardProps) {
  return (
    <div className={`relative ${className}`}>
      {isEditing ? (
        <div className="relative">
          {editContent}
          {(onSave || onCancel) && (
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  className="px-3 py-1.5 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shadow-lg"
                  title="저장"
                >
                  ✓ 저장
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 bg-surface-hover text-text-secondary rounded-lg hover:bg-surface transition-colors text-sm font-medium"
                  title="취소"
                >
                  ✕ 취소
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative group">
          {previewContent}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1.5 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shadow-lg"
              title="수정"
            >
              ✏️ 수정
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-1.5 bg-error text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shadow-lg"
                title="삭제"
              >
                🗑️ 삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

