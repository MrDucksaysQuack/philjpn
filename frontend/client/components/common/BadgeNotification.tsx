"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { socketClient } from "@/lib/socket";

interface BadgeNotificationData {
  badgeId: string;
  badgeName: string;
  badgeIcon?: string;
  badgeRarity: string;
  earnedAt: Date;
}

const RARITY_COLORS = {
  common: "bg-gray-200 text-gray-800",
  rare: "bg-blue-200 text-blue-800",
  epic: "bg-purple-200 text-purple-800",
  legendary: "bg-yellow-200 text-yellow-800",
};

export default function BadgeNotification() {
  const { user, accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<BadgeNotificationData[]>([]);

  useEffect(() => {
    if (!user) return;

    // 배지 알림 WebSocket 연결
    const badgeSocket = socketClient.connectBadgeNotifications(user.id, accessToken);

    // 단일 배지 획득 알림
    const handleBadgeEarned = (data: BadgeNotificationData) => {
      setNotifications((prev) => [...prev, data]);
      // 5초 후 자동 제거
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.badgeId !== data.badgeId));
      }, 5000);
    };

    // 여러 배지 획득 알림
    const handleBadgesEarned = (data: { badges: BadgeNotificationData[] }) => {
      setNotifications((prev) => [...prev, ...data.badges]);
      // 5초 후 자동 제거
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => !data.badges.some((b) => b.badgeId === n.badgeId))
        );
      }, 5000);
    };

    socketClient.onBadgeEarned(handleBadgeEarned);
    socketClient.onBadgesEarned(handleBadgesEarned);

    return () => {
      socketClient.offBadgeEarned(handleBadgeEarned);
      socketClient.offBadgeEarned(handleBadgesEarned);
    };
  }, [user, accessToken]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.badgeId}
          className="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200 animate-slide-in-right min-w-[300px] max-w-md"
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl">{notification.badgeIcon || "🏆"}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">배지 획득!</h3>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    RARITY_COLORS[notification.badgeRarity as keyof typeof RARITY_COLORS] ||
                    RARITY_COLORS.common
                  }`}
                >
                  {notification.badgeRarity === "common"
                    ? "일반"
                    : notification.badgeRarity === "rare"
                    ? "희귀"
                    : notification.badgeRarity === "epic"
                    ? "영웅"
                    : "전설"}
                </span>
              </div>
              <p className="text-gray-700 font-medium">{notification.badgeName}</p>
            </div>
            <button
              onClick={() => {
                setNotifications((prev) =>
                  prev.filter((n) => n.badgeId !== notification.badgeId)
                );
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

