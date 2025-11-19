"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";

interface MenuItem {
  href: string;
  title: string;
  description: string;
  icon: string;
  priority: string;
}

interface MenuGroup {
  id: string;
  title: string;
  description: string;
  color: string;
  items: MenuItem[];
}

interface SortableGroupProps {
  id: string;
  group: MenuGroup;
  groupId: string;
  getColorClasses: (color: string) => string;
  getPriorityBadge: (priority: string) => React.ReactNode;
  isFavorite: (href: string) => boolean;
  toggleFavorite: (href: string) => void;
  addRecentMenu: (href: string, title: string, icon: string) => void;
}

export default function SortableGroup({
  id,
  group,
  groupId,
  getColorClasses,
  getPriorityBadge,
  isFavorite,
  toggleFavorite,
  addRecentMenu,
}: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={groupId}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden scroll-mt-24"
    >
      {/* 그룹 헤더 */}
      <div
        className={`px-6 py-4 border-b ${getColorClasses(group.color)} cursor-move`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
                d="M4 8h16M4 16h16"
              />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{group.title.split(' ')[0]}</span>
                <span>{group.title.split(' ').slice(1).join(' ')}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 그룹 내 메뉴 아이템 */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => addRecentMenu(item.href, item.title, item.icon)}
              className="group relative bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center">
                      {item.title}
                      {getPriorityBadge(item.priority)}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(item.href);
                        }}
                        className={`ml-2 ${
                          isFavorite(item.href)
                            ? "text-yellow-500"
                            : "text-gray-300 hover:text-yellow-400"
                        } transition-colors`}
                        title={
                          isFavorite(item.href)
                            ? "즐겨찾기 제거"
                            : "즐겨찾기 추가"
                        }
                      >
                        {isFavorite(item.href) ? "⭐" : "☆"}
                      </button>
                    </h3>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-11">{item.description}</p>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

