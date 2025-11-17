"use client";

import { useState, useMemo } from "react";
import {
  BuildingIcon,
  UsersIcon,
  RocketIcon,
  TargetIcon,
  EyeIcon,
  HeartIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CheckIcon,
} from "../about/icons";
import { getIconComponent } from "../about/iconMapper";

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  className?: string;
}

// 사용 가능한 아이콘 목록
const availableIcons = [
  { name: "BuildingIcon", label: "건물", component: BuildingIcon },
  { name: "UsersIcon", label: "사용자", component: UsersIcon },
  { name: "RocketIcon", label: "로켓", component: RocketIcon },
  { name: "TargetIcon", label: "타겟", component: TargetIcon },
  { name: "EyeIcon", label: "눈", component: EyeIcon },
  { name: "HeartIcon", label: "하트", component: HeartIcon },
  { name: "MailIcon", label: "메일", component: MailIcon },
  { name: "PhoneIcon", label: "전화", component: PhoneIcon },
  { name: "MapPinIcon", label: "위치", component: MapPinIcon },
  { name: "CheckIcon", label: "체크", component: CheckIcon },
];

// 아이콘 카테고리
const iconCategories = {
  일반: ["BuildingIcon", "UsersIcon", "RocketIcon", "TargetIcon"],
  감정: ["EyeIcon", "HeartIcon"],
  연락처: ["MailIcon", "PhoneIcon", "MapPinIcon"],
  기타: ["CheckIcon"],
};

export default function IconPicker({
  value,
  onChange,
  className = "",
}: IconPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 검색 및 카테고리 필터링
  const filteredIcons = useMemo(() => {
    let icons = availableIcons;

    // 카테고리 필터
    if (selectedCategory) {
      const categoryIcons = iconCategories[selectedCategory as keyof typeof iconCategories] || [];
      icons = icons.filter((icon) => categoryIcons.includes(icon.name));
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(query) ||
          icon.label.toLowerCase().includes(query)
      );
    }

    return icons;
  }, [searchQuery, selectedCategory]);

  const selectedIcon = availableIcons.find((icon) => icon.name === value);
  const SelectedIconComponent = selectedIcon?.component;

  return (
    <div className={className}>
      {/* 아이콘 선택 버튼 */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-theme-primary transition-colors w-full"
      >
        {SelectedIconComponent ? (
          <>
            <SelectedIconComponent className="w-6 h-6 text-theme-primary" />
            <span className="flex-1 text-left text-sm text-gray-700">
              {selectedIcon.label} ({value})
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-sm text-gray-500">
            아이콘 선택하기
          </span>
        )}
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 아이콘 선택 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-extrabold text-gray-900">아이콘 선택</h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 검색 및 필터 */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="아이콘 이름 또는 라벨로 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedCategory === null
                      ? "bg-theme-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  전체
                </button>
                {Object.keys(iconCategories).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedCategory === category
                        ? "bg-theme-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 아이콘 그리드 */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                  {filteredIcons.map((icon) => {
                    const IconComponent = icon.component;
                    const isSelected = value === icon.name;
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => {
                          onChange(icon.name);
                          setShowModal(false);
                          setSearchQuery("");
                          setSelectedCategory(null);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-theme-primary bg-theme-primary-light"
                            : "border-gray-200 hover:border-theme-primary hover:bg-gray-50"
                        }`}
                      >
                        <IconComponent className="w-8 h-8 text-theme-primary" />
                        <span className="text-xs text-gray-700 text-center">
                          {icon.label}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 bg-theme-primary rounded-full flex items-center justify-center">
                              <CheckIcon className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setShowModal(false);
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                아이콘 제거
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

