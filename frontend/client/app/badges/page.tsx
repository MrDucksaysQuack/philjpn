"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { badgeAPI, Badge, UserBadge } from "@/lib/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

const RARITY_COLORS = {
  common: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-800',
    badge: 'bg-gray-200 text-gray-800',
  },
  rare: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    badge: 'bg-blue-200 text-blue-800',
  },
  epic: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-800',
    badge: 'bg-purple-200 text-purple-800',
  },
  legendary: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    badge: 'bg-yellow-200 text-yellow-800',
  },
};

export default function BadgesPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const { user, isLoading: authLoading } = useRequireAuth();

  // 전체 배지 목록
  const { data: allBadgesResponse, isLoading: allBadgesLoading } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const response = await badgeAPI.getAllBadges();
      return response.data;
    },
    enabled: !!user,
  });

  // 사용자 배지 목록
  const { data: userBadgesResponse, isLoading: userBadgesLoading } = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      const response = await badgeAPI.getUserBadges();
      return response.data;
    },
    enabled: !!user,
  });

  const allBadges = allBadgesResponse?.data || [];
  const userBadges = userBadgesResponse?.data || [];
  const earnedBadgeIds = new Set(userBadges.map((b: UserBadge) => b.badgeId));

  // 배지 타입별 그룹화
  const badgesByType = allBadges.reduce((acc, badge) => {
    if (!acc[badge.badgeType]) {
      acc[badge.badgeType] = [];
    }
    acc[badge.badgeType].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  if (authLoading || allBadgesLoading || userBadgesLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("badges.loading")} />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;
  const progressPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 헤더 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{t("badges.title")}</h1>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{t("badges.collectionProgress")}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {earnedCount} / {totalCount} ({progressPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-theme-gradient-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              <Link
                href="/profile"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
              >
                <span>👤</span>
                <span>{t("badges.myProfile")}</span>
              </Link>
            </div>
          </div>

          {/* 배지 목록 */}
          {allBadges.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-600 text-lg">{t("badges.noBadges")}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(badgesByType).map(([badgeType, badges]) => (
                <div key={badgeType} className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t(`badges.types.${badgeType}` as any) || badgeType}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {badges.map((badge) => {
                      const isEarned = earnedBadgeIds.has(badge.id);
                      const userBadge = userBadges.find((b: UserBadge) => b.badgeId === badge.id);
                      const rarityColor = RARITY_COLORS[badge.rarity];

                      return (
                        <div
                          key={badge.id}
                          className={`border-2 rounded-xl p-6 text-center transition-all ${
                            isEarned
                              ? `${rarityColor.bg} ${rarityColor.border} hover:shadow-lg`
                              : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className={`text-5xl mb-3 ${isEarned ? '' : 'grayscale'}`}>
                            {badge.icon || "🏆"}
                          </div>
                          {!isEarned && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                {t("badges.notEarned")}
                              </span>
                            </div>
                          )}
                          <h3 className={`font-bold text-lg mb-2 ${isEarned ? rarityColor.text : 'text-gray-500'}`}>
                            {badge.name}
                          </h3>
                          {badge.description && (
                            <p className={`text-sm mb-3 ${isEarned ? 'opacity-80' : 'text-gray-400'}`}>
                              {badge.description}
                            </p>
                          )}
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded border ${
                              isEarned ? rarityColor.badge : 'bg-gray-200 text-gray-600 border-gray-300'
                            }`}>
                              {t(`badges.rarity.${badge.rarity}`)}
                            </span>
                          </div>
                          {isEarned && userBadge && (
                            <p className="text-xs opacity-70 mt-3">
                              {new Date(userBadge.earnedAt).toLocaleDateString(locale === 'ko' ? "ko-KR" : locale === 'ja' ? "ja-JP" : "en-US")} {t("profile.earnedOn")}
                            </p>
                          )}
                          {!isEarned && (
                            <p className="text-xs text-gray-400 mt-3">
                              {t("badges.notEarnedYet")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

