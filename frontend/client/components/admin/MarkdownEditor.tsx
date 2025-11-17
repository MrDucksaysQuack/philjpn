"use client";

import { useState } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showPreview?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "마크다운 형식으로 입력하세요...",
  rows = 10,
  className = "",
  showPreview = true,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // 간단한 마크다운 미리보기 (기본적인 변환)
  const renderPreview = (markdown: string) => {
    if (!markdown) return <p className="text-gray-400">미리보기 내용이 없습니다.</p>;

    // 기본 마크다운 변환 (간단한 버전)
    let html = markdown
      // 헤딩
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      // 볼드
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      // 이탤릭
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      // 링크
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-theme-primary hover:underline">$1</a>')
      // 리스트
      .replace(/^\* (.*$)/gim, "<li>$1</li>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      // 줄바꿈
      .replace(/\n/gim, "<br />");

    // 리스트 래핑
    html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");

    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className={className}>
      {showPreview ? (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* 탭 헤더 */}
          <div className="flex border-b border-gray-300 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "edit"
                  ? "bg-white text-theme-primary border-b-2 border-theme-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ✏️ 편집
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-white text-theme-primary border-b-2 border-theme-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              👁️ 미리보기
            </button>
          </div>

          {/* 편집 영역 */}
          {activeTab === "edit" && (
            <div className="p-4">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm resize-none"
              />
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>💡 마크다운 문법:</span>
                <span>**볼드**</span>
                <span>*이탤릭*</span>
                <span># 헤딩</span>
                <span>[링크](URL)</span>
                <span>- 리스트</span>
              </div>
            </div>
          )}

          {/* 미리보기 영역 */}
          {activeTab === "preview" && (
            <div className="p-4 min-h-[200px] bg-white">
              {renderPreview(value)}
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm ${className}`}
        />
      )}
    </div>
  );
}

