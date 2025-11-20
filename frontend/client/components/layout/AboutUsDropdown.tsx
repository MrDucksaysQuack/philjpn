"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export default function AboutUsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);

  // useMemo 제거: t() 함수 호출이 hydration mismatch를 일으킬 수 있음
  // locale이 변경되면 컴포넌트가 리렌더링되므로 자동으로 업데이트됨
  const menuItems = [
    { href: "/about/company", label: t("about.companyLabel"), icon: "🏢" },
    { href: "/about/team", label: t("about.teamLabel"), icon: "👥" },
    { href: "/about/contact", label: t("about.contactLabel"), icon: "📧" },
    { href: "/about/service", label: t("about.serviceLabel"), icon: "🚀" },
  ];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-1"
        aria-label={t("about.title")}
        aria-expanded={isOpen}
        type="button"
      >
        <span>{t("about.title")}</span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              aria-label={`${item.label} ${t("common.navigate")}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

