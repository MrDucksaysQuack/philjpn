"use client";

import { useEffect, useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon: string;
  groupId: string;
}

interface DashboardTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onScrollToGroup: (groupId: string) => void;
}

export default function DashboardTabs({
  tabs,
  activeTab,
  onTabChange,
  onScrollToGroup,
}: DashboardTabsProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 100);

      // 현재 보이는 그룹 감지
      const groups = tabs.map((tab) => {
        const element = document.getElementById(tab.groupId);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: tab.id,
            groupId: tab.groupId,
            top: rect.top,
            bottom: rect.bottom,
          };
        }
        return null;
      }).filter(Boolean) as Array<{ id: string; groupId: string; top: number; bottom: number }>;

      // 화면 상단에 가장 가까운 그룹 찾기
      const visibleGroup = groups.find(
        (group) => group.top <= 150 && group.bottom >= 150
      );

      if (visibleGroup && visibleGroup.id !== activeTab) {
        onTabChange(visibleGroup.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabs, activeTab, onTabChange]);

  const handleTabClick = (tab: Tab) => {
    onTabChange(tab.id);
    onScrollToGroup(tab.groupId);
  };

  return (
    <div
      className={`sticky top-0 z-40 bg-white border-b border-gray-200 transition-all ${
        isSticky ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

