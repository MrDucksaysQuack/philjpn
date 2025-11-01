"use client";

import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      label: "시험 시작하기",
      href: "/exams",
      icon: "📝",
      color: "from-blue-600 to-blue-700",
      description: "새로운 시험에 도전하세요",
    },
    {
      label: "자기 분석 보기",
      href: "/analysis",
      icon: "📊",
      color: "from-purple-600 to-purple-700",
      description: "학습 패턴과 약점을 분석하세요",
    },
    {
      label: "통계 확인하기",
      href: "/statistics",
      icon: "📈",
      color: "from-indigo-600 to-indigo-700",
      description: "성적 추이와 개선 상황을 확인하세요",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
        빠른 액션
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-2xl shadow-md transform group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
              {action.label}
            </h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

