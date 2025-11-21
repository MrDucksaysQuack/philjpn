"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { adminAPI } from "@/lib/api";
import { toast } from "@/components/common/Toast";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showPreview?: boolean;
}

type ViewMode = "edit" | "preview" | "split";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
  className = "",
  showPreview = true,
}: MarkdownEditorProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 툴바 버튼 핸들러
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let newText = "";
    if (selectedText) {
      // 텍스트가 선택된 경우: 선택된 텍스트를 감싸기
      newText = beforeText + before + selectedText + after + afterText;
      onChange(newText);
      // 선택된 텍스트 범위로 커서 이동
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          end + before.length
        );
      }, 0);
    } else {
      // 텍스트가 선택되지 않은 경우: 커서 위치에 삽입
      newText = beforeText + before + after + afterText;
      onChange(newText);
      // 커서를 삽입된 텍스트 사이로 이동
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length
        );
      }, 0);
    }
  };

  const handleBold = () => insertMarkdown("**", "**");
  const handleItalic = () => insertMarkdown("*", "*");
  const handleHeading = (level: 1 | 2 | 3) => {
    const prefix = "#".repeat(level) + " ";
    insertMarkdown(prefix);
  };
  const handleLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      insertMarkdown("[", `](${selectedText})`);
    } else {
      insertMarkdown("[링크 텍스트](", ")");
      setTimeout(() => {
        textarea.focus();
        const newStart = start + "[링크 텍스트](".length;
        textarea.setSelectionRange(newStart - 11, newStart - 1);
      }, 0);
    }
  };
  const handleImage = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 파일 선택 다이얼로그 열기
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("admin.fileUploader.fileTooLarge", { maxSize: 5 }));
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith("image/")) {
        toast.error(t("admin.fileUploader.imageOnly"));
        return;
      }

      try {
        toast.info(t("admin.fileUploader.uploading"));
        const response = await adminAPI.uploadImage(file);
        const uploadedUrl = response.data.data.url;
        
        // 마크다운에 이미지 삽입
        const start = textarea.selectionStart;
        const beforeText = value.substring(0, start);
        const afterText = value.substring(start);
        const imageMarkdown = `![${t("admin.markdownEditor.image")}](${uploadedUrl})`;
        
        onChange(beforeText + imageMarkdown + afterText);
        
        // 커서를 이미지 마크다운 뒤로 이동
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + imageMarkdown.length,
            start + imageMarkdown.length
          );
        }, 0);
        
        toast.success(t("admin.fileUploader.uploadSuccess"));
      } catch (error: any) {
        console.error("이미지 업로드 실패:", error);
        toast.error(error.response?.data?.message || t("admin.fileUploader.uploadFailed"));
      }
    };
    input.click();
  };
  const handleList = () => insertMarkdown("- ");
  const handleCode = () => insertMarkdown("`", "`");
  const handleCodeBlock = () => insertMarkdown("```\n", "\n```");

  const Toolbar = () => (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-surface-hover rounded-t-lg">
      <button
        type="button"
        onClick={handleBold}
        className="px-2 py-1 text-sm font-bold text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.bold")}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={handleItalic}
        className="px-2 py-1 text-sm italic text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.italic")}
      >
        <em>I</em>
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        type="button"
        onClick={() => handleHeading(1)}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.heading1")}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => handleHeading(2)}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.heading2")}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => handleHeading(3)}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.heading3")}
      >
        H3
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        type="button"
        onClick={handleLink}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.link")}
      >
        🔗
      </button>
      <button
        type="button"
        onClick={handleImage}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.image")}
      >
        🖼️
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        type="button"
        onClick={handleList}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.list")}
      >
        📋
      </button>
      <button
        type="button"
        onClick={handleCode}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.code")}
      >
        💻
      </button>
      <button
        type="button"
        onClick={handleCodeBlock}
        className="px-2 py-1 text-sm text-text-primary hover:bg-surface rounded transition-colors"
        title={t("admin.markdownEditor.codeBlock")}
      >
        💻📦
      </button>
    </div>
  );

  const ViewModeToggle = () => (
    <div className="flex border-b border-border bg-surface-hover">
      <button
        type="button"
        onClick={() => setViewMode("edit")}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          viewMode === "edit"
            ? "bg-surface text-theme-primary border-b-2 border-theme-primary"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        ✏️ {t("admin.markdownEditor.edit")}
      </button>
      <button
        type="button"
        onClick={() => setViewMode("preview")}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          viewMode === "preview"
            ? "bg-surface text-theme-primary border-b-2 border-theme-primary"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        👁️ {t("admin.markdownEditor.preview")}
      </button>
      {showPreview && (
        <button
          type="button"
          onClick={() => setViewMode("split")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "split"
              ? "bg-surface text-theme-primary border-b-2 border-theme-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          ⚡ {t("admin.markdownEditor.split")}
        </button>
      )}
    </div>
  );

  if (!showPreview) {
    return (
      <div className={className}>
        <Toolbar />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t("admin.markdownEditor.placeholder")}
          rows={rows}
          className="w-full px-4 py-2 border border-border rounded-b-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm resize-none"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <Toolbar />
      <div className="border border-border rounded-b-lg overflow-hidden">
        <ViewModeToggle />

        {viewMode === "edit" && (
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || t("admin.markdownEditor.placeholder")}
              rows={rows}
              className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm resize-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>💡 {t("admin.markdownEditor.markdownSyntax")}:</span>
              <span>**{t("admin.markdownEditor.bold")}**</span>
              <span>*{t("admin.markdownEditor.italic")}*</span>
              <span># {t("admin.markdownEditor.heading")}</span>
              <span>[{t("admin.markdownEditor.link")}](URL)</span>
              <span>- {t("admin.markdownEditor.list")}</span>
            </div>
          </div>
        )}

        {viewMode === "preview" && (
          <div className="p-4 min-h-[200px] bg-surface">
            {value ? (
              <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-a:text-theme-primary prose-a:no-underline hover:prose-a:underline prose-ul:text-text-primary prose-ol:text-text-primary prose-li:text-text-primary prose-code:text-text-primary prose-pre:bg-surface-hover prose-pre:text-text-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-text-muted">{t("admin.markdownEditor.noPreview")}</p>
            )}
          </div>
        )}

        {viewMode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border">
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || t("admin.markdownEditor.placeholder")}
                rows={rows}
                className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm resize-none"
              />
            </div>
            <div className="p-4 min-h-[200px] bg-surface overflow-auto">
              {value ? (
                <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-a:text-theme-primary prose-a:no-underline hover:prose-a:underline prose-ul:text-text-primary prose-ol:text-text-primary prose-li:text-text-primary prose-code:text-text-primary prose-pre:bg-surface-hover prose-pre:text-text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-text-muted">{t("admin.markdownEditor.noPreview")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
