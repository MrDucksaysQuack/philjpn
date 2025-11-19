"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { badgeAPI, UserBadge } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

const RARITY_COLORS = {
  common: 'bg-text-muted/20 text-text-muted',
  rare: 'bg-info/20 text-info',
  epic: 'bg-theme-secondary/20 text-theme-secondary',
  legendary: 'bg-warning/20 text-warning',
};

export default function BadgesWidget() {
  const user = useAuthStore((state) => state.user);

  const { data: badgesResponse, isLoading } = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      const response = await badgeAPI.getUserBadges();
      return response.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  const badges = badgesResponse?.data || [];
  const recentBadges = badges.slice(0, 6); // 최근 6개

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-warning to-warning rounded-full"></div>
          내 배지
        </h2>
        {badges.length > 0 && (
          <Link
            href="/badges"
            className="text-sm text-link hover:text-link-hover font-medium flex items-center gap-1"
          >
            전체 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-text-secondary mb-2">아직 획득한 배지가 없습니다.</p>
          <p className="text-text-muted text-sm mb-4">시험을 완료하고 배지를 획득해보세요!</p>
          <Link
            href="/exams"
            className="inline-block text-link hover:text-link-hover text-sm font-medium"
          >
            시험 보러 가기 →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
            {recentBadges.map((badge: UserBadge) => (
              <div
                key={badge.id}
                className="aspect-square rounded-lg border-2 border-border bg-surface p-2 flex flex-col items-center justify-center hover:shadow-md transition-all cursor-pointer"
                title={badge.name}
              >
                <div className="text-3xl mb-1">{badge.icon || "🏆"}</div>
                <div className={`text-xs px-1.5 py-0.5 rounded ${RARITY_COLORS[badge.rarity]}`}>
                  {badge.rarity === 'common' ? '일반' : 
                   badge.rarity === 'rare' ? '희귀' :
                   badge.rarity === 'epic' ? '영웅' : '전설'}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              총 <span className="font-semibold text-text-primary">{badges.length}개</span>의 배지를 획득했습니다
            </p>
          </div>
        </>
      )}
    </div>
  );
}

