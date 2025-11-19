"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { badgeAPI, UserBadge } from "@/lib/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

const RARITY_COLORS = {
  common: 'bg-gray-200 text-gray-800 border-gray-300',
  rare: 'bg-blue-200 text-blue-800 border-blue-300',
  epic: 'bg-purple-200 text-purple-800 border-purple-300',
  legendary: 'bg-yellow-200 text-yellow-800 border-yellow-300',
};

export default function ProfilePage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const { user, isLoading: authLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<"badges" | "stats">("badges");

  const { data: badgesResponse, isLoading: badgesLoading } = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      const response = await badgeAPI.getUserBadges();
      return response.data;
    },
    enabled: !!user,
  });

  const badges = badgesResponse?.data || [];

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("profile.loading")} />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 프로필 헤더 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-theme-gradient-primary rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}님</h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-4 flex gap-4">
                  <Link
                    href="/badges"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    <span>🏆</span>
                    <span>{t("profile.viewBadgeGallery")}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("badges")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "badges"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {t("profile.myBadges")} ({badges.length})
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "stats"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {t("profile.statistics")}
                </button>
              </nav>
            </div>
          </div>

          {/* 배지 탭 */}
          {activeTab === "badges" && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("profile.earnedBadges")}</h2>
              {badgesLoading ? (
                <div className="text-center py-12">
                  <LoadingSpinner message={t("profile.loading")} />
                </div>
              ) : badges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-gray-600 text-lg mb-2">{t("profile.noBadgesTitle")}</p>
                  <p className="text-gray-500 text-sm mb-6">{t("profile.noBadgesSubtitle")}</p>
                  <Link
                    href="/exams"
                    className="inline-block bg-theme-gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
                  >
                    {t("profile.goToExams")} →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`border-2 rounded-xl p-6 text-center transition-all hover:shadow-lg ${
                        RARITY_COLORS[badge.rarity]
                      }`}
                    >
                      <div className="text-5xl mb-3">{badge.icon || "🏆"}</div>
                      <h3 className="font-bold text-lg mb-2">{badge.name}</h3>
                      {badge.description && (
                        <p className="text-sm opacity-80 mb-3">{badge.description}</p>
                      )}
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded border ${
                          RARITY_COLORS[badge.rarity]
                        }`}>
                          {t(`badges.rarity.${badge.rarity}`)}
                        </span>
                      </div>
                      <p className="text-xs opacity-70 mt-3">
                        {new Date(badge.earnedAt).toLocaleDateString(locale === 'ko' ? "ko-KR" : locale === 'ja' ? "ja-JP" : "en-US")} {t("profile.earnedOn")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 통계 탭 */}
          {activeTab === "stats" && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("profile.learningStats")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{t("profile.statsTitle")}</div>
                  <Link
                    href="/statistics"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {t("profile.viewDetails")} →
                  </Link>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="text-3xl mb-2">📈</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{t("profile.analysisTitle")}</div>
                  <Link
                    href="/analysis"
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    {t("profile.viewDetails")} →
                  </Link>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{t("profile.resultsTitle")}</div>
                  <Link
                    href="/results"
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    {t("profile.viewDetails")} →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

