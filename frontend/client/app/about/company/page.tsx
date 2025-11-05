"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { siteSettingsAPI } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function CompanyPage() {
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await siteSettingsAPI.getPublicSettings();
      return response.data;
    },
  });

  const data = (settingsResponse as any)?.data || settingsResponse;

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="회사 정보를 불러오는 중..." />
          </div>
        </div>
      </>
    );
  }

  const settings = data as any;
  const content = settings?.aboutCompany || "회사 소개 내용이 아직 등록되지 않았습니다.";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4 flex items-center gap-3">
                <span className="text-5xl">🏢</span>
                회사 소개
              </h1>
              <div className="w-24 h-1 bg-theme-gradient-horizontal rounded-full"></div>
            </div>

            <div className="prose prose-lg max-w-none">
              {content.includes("#") || content.includes("*") || content.includes("`") ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

