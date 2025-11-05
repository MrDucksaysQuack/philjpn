"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { siteSettingsAPI } from "@/lib/api";
import { ContactInfo } from "@/lib/api";

export default function ContactPage() {
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
            <LoadingSpinner message="연락처 정보를 불러오는 중..." />
          </div>
        </div>
      </>
    );
  }

  const settings = data as any;
  const contactInfo: ContactInfo | null = settings?.contactInfo || null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4 flex items-center gap-3">
                <span className="text-5xl">📧</span>
                연락처
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            </div>

            {contactInfo ? (
              <div className="space-y-6">
                {contactInfo.email && (
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-2xl">📧</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">이메일</div>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.phone && (
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-2xl">📞</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">전화번호</div>
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.address && (
                  <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-2xl">📍</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">주소</div>
                      <div className="text-gray-700">{contactInfo.address}</div>
                    </div>
                  </div>
                )}

                {contactInfo.socialMedia && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">소셜 미디어</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contactInfo.socialMedia.website && (
                        <a
                          href={contactInfo.socialMedia.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-2xl">🌐</span>
                          <span className="font-medium text-gray-700">웹사이트</span>
                        </a>
                      )}
                      {contactInfo.socialMedia.facebook && (
                        <a
                          href={contactInfo.socialMedia.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <span className="text-2xl">📘</span>
                          <span className="font-medium text-gray-700">Facebook</span>
                        </a>
                      )}
                      {contactInfo.socialMedia.twitter && (
                        <a
                          href={contactInfo.socialMedia.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-sky-50 rounded-xl border border-sky-200 hover:bg-sky-100 transition-colors"
                        >
                          <span className="text-2xl">🐦</span>
                          <span className="font-medium text-gray-700">Twitter</span>
                        </a>
                      )}
                      {contactInfo.socialMedia.instagram && (
                        <a
                          href={contactInfo.socialMedia.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl border border-pink-200 hover:bg-pink-100 transition-colors"
                        >
                          <span className="text-2xl">📷</span>
                          <span className="font-medium text-gray-700">Instagram</span>
                        </a>
                      )}
                      {contactInfo.socialMedia.linkedin && (
                        <a
                          href={contactInfo.socialMedia.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <span className="text-2xl">💼</span>
                          <span className="font-medium text-gray-700">LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                연락처 정보가 아직 등록되지 않았습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

