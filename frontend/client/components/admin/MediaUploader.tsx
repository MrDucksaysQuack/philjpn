"use client";

import { useState } from "react";
import { adminAPI } from "@/lib/api";
import { toast } from "@/components/common/Toast";

interface MediaUploaderProps {
  type: "image" | "audio";
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  label?: string;
  maxSize?: number; // MB
}

export default function MediaUploader({
  type,
  currentUrl,
  onUploadComplete,
  onRemove,
  className = "",
  label,
  maxSize = type === "image" ? 5 : 10,
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`파일 크기는 ${maxSize}MB 이하여야 합니다.`);
      return;
    }

    // 파일 타입 검증
    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드 가능합니다.");
        return;
      }
    } else if (type === "audio") {
      if (!file.type.startsWith("audio/")) {
        toast.error("오디오 파일만 업로드 가능합니다.");
        return;
      }
    }

    setIsUploading(true);

    try {
      const response = type === "image"
        ? await adminAPI.uploadImage(file)
        : await adminAPI.uploadAudio(file);

      const uploadedUrl = response.data.data.url;
      setPreviewUrl(uploadedUrl);
      onUploadComplete(uploadedUrl);
      toast.success("파일이 업로드되었습니다.");
    } catch (error: any) {
      console.error("파일 업로드 실패:", error);
      toast.error(error.response?.data?.message || "파일 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      // input 초기화 (같은 파일 다시 선택 가능하도록)
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    }
  };

  const displayLabel = label || (type === "image" ? "이미지" : "오디오");

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {displayLabel} {type === "audio" && "(Part 4: Listening용)"}
        {type === "image" && "(Part 1: Vocabulary & Grammar용)"}
      </label>

      {previewUrl ? (
        <div className="space-y-2">
          {type === "image" ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="미리보기"
                className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                aria-label="이미지 제거"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">오디오 파일</div>
                    <div className="text-xs text-gray-500">업로드 완료</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700"
                  aria-label="오디오 제거"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500">
            {previewUrl}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept={type === "image" ? "image/*" : "audio/*"}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id={`${type}-upload-${Math.random()}`}
          />
          <label
            htmlFor={`${type}-upload-${Math.random()}`}
            className={`cursor-pointer flex flex-col items-center gap-2 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">업로드 중...</span>
              </>
            ) : (
              <>
                {type === "image" ? (
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                )}
                <span className="text-sm text-gray-600">
                  클릭하여 {displayLabel} 업로드
                </span>
                <span className="text-xs text-gray-400">
                  최대 {maxSize}MB
                </span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}

