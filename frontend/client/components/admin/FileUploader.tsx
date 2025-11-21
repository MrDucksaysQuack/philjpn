"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { adminAPI } from "@/lib/api";
import { toast } from "@/components/common/Toast";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface FileUploaderProps {
  type: "image" | "audio" | "video";
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  label?: string;
  maxSize?: number; // MB
  accept?: string; // 파일 타입 (예: "image/*", "audio/*")
  aspectRatio?: "square" | "wide" | "tall" | "auto"; // 이미지 비율 (이미지 타입만)
}

export default function FileUploader({
  type,
  currentUrl,
  onUploadComplete,
  onRemove,
  className = "",
  label,
  maxSize = type === "image" ? 5 : type === "audio" ? 10 : 50,
  accept,
  aspectRatio = "auto",
}: FileUploaderProps) {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);

  const defaultAccept = type === "image" 
    ? "image/*" 
    : type === "audio" 
    ? "audio/*" 
    : "video/*";

  const handleFileUpload = useCallback(async (file: File) => {
    // 파일 크기 검증
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(t("admin.fileUploader.fileTooLarge", { maxSize }));
      return;
    }

    // 파일 타입 검증
    if (type === "image" && !file.type.startsWith("image/")) {
      toast.error(t("admin.fileUploader.imageOnly"));
      return;
    } else if (type === "audio" && !file.type.startsWith("audio/")) {
      toast.error(t("admin.fileUploader.audioOnly"));
      return;
    } else if (type === "video" && !file.type.startsWith("video/")) {
      toast.error(t("admin.fileUploader.videoOnly"));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 진행률 시뮬레이션 (실제로는 XMLHttpRequest로 구현 가능)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = type === "image"
        ? await adminAPI.uploadImage(file)
        : type === "audio"
        ? await adminAPI.uploadAudio(file)
        : { data: { data: { url: "" } } }; // TODO: video upload API 추가 필요

      clearInterval(progressInterval);
      setUploadProgress(100);

      const uploadedUrl = response.data.data.url;
      setPreviewUrl(uploadedUrl);
      onUploadComplete(uploadedUrl);
      toast.success(t("admin.fileUploader.uploadSuccess"));

      setTimeout(() => setUploadProgress(0), 500);
    } catch (error: any) {
      console.error("파일 업로드 실패:", error);
      toast.error(error.response?.data?.message || t("admin.fileUploader.uploadFailed"));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [type, maxSize, onUploadComplete, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    accept: accept ? { [accept]: [] } : { [defaultAccept]: [] },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
    disabled: isUploading,
  });

  const handleRemove = () => {
    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    }
  };

  const displayLabel = label || (type === "image" 
    ? t("admin.fileUploader.image") 
    : type === "audio" 
    ? t("admin.fileUploader.audio") 
    : t("admin.fileUploader.video"));

  // 미리보기가 있는 경우
  if (previewUrl) {
    return (
      <div className={className}>
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {displayLabel}
        </label>
        <div className="space-y-2">
          {type === "image" ? (
            <div className="relative group">
              <div className={`overflow-hidden rounded-lg border border-border bg-surface-hover ${
                aspectRatio === "square" ? "aspect-square" :
                aspectRatio === "wide" ? "aspect-video" :
                aspectRatio === "tall" ? "aspect-[3/4]" :
                ""
              }`}>
                <img
                  src={previewUrl}
                  alt={t("admin.fileUploader.preview")}
                  className={`w-full h-full object-contain ${
                    aspectRatio === "auto" ? "max-h-64" : ""
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-error/80 hover:bg-error text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t("admin.fileUploader.remove")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = accept || defaultAccept;
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file);
                  };
                  input.click();
                }}
                className="absolute bottom-2 right-2 bg-theme-primary/80 hover:bg-theme-primary text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t("admin.fileUploader.change")}
                disabled={isUploading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>
          ) : type === "audio" ? (
            <div className="relative bg-surface-hover rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{t("admin.fileUploader.audioFile")}</div>
                    <div className="text-xs text-text-secondary">{t("admin.fileUploader.uploaded")}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-error hover:text-error/80"
                  title={t("admin.fileUploader.remove")}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative bg-surface-hover rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{t("admin.fileUploader.videoFile")}</div>
                    <div className="text-xs text-text-secondary">{t("admin.fileUploader.uploaded")}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-error hover:text-error/80"
                  title={t("admin.fileUploader.remove")}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 업로드 영역
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-text-primary mb-2">
        {displayLabel}
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-theme-primary bg-theme-primary/5"
            : "border-border hover:border-theme-primary bg-surface-hover"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
            <div className="text-sm font-medium text-text-primary">
              {t("admin.fileUploader.uploading")}... {uploadProgress}%
            </div>
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
              <div
                className="bg-theme-primary h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {type === "image" ? (
              <svg className="w-12 h-12 text-text-muted mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : type === "audio" ? (
              <svg className="w-12 h-12 text-text-muted mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-text-muted mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            )}
            <div className="text-sm font-medium text-text-primary">
              {isDragActive 
                ? t("admin.fileUploader.dropHere") 
                : t("admin.fileUploader.dragOrClick")}
            </div>
            <div className="text-xs text-text-muted">
              {t("admin.fileUploader.maxSize", { maxSize })} • {t(`admin.fileUploader.${type}Formats`)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

