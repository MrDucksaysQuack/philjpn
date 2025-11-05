"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { siteSettingsAPI } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import HeroSection from "@/components/about/HeroSection";
import SectionTitle from "@/components/about/SectionTitle";
import FeatureCard from "@/components/about/FeatureCard";
import StatCard from "@/components/about/StatCard";
import { getIconComponent } from "@/components/about/iconMapper";

export default function CompanyPage() {
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
            <LoadingSpinner message="회사 정보를 불러오는 중..." />
          </div>
        </div>
      </>
    );
  }

  const settings = data as any;
  const companyName = settings?.companyName || "Exam Platform";
  const content = settings?.aboutCompany || "회사 소개 내용이 아직 등록되지 않았습니다.";
  const stats = settings?.companyStats?.stats || [];
  const companyValues = settings?.companyValues?.values || [];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <HeroSection
        title={companyName}
        subtitle="혁신적인 교육 플랫폼으로 학습의 미래를 만들어갑니다"
      />

      <div className="min-h-screen bg-white">
        {/* 통계 섹션 */}
        {stats.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {stats.map((stat: any, index: number) => (
                  <StatCard
                    key={index}
                    icon={getIconComponent(stat.icon, "w-7 h-7")}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                    animate={false}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 미션/비전/가치 섹션 */}
        {companyValues.length > 0 && (
          <section className="py-16 md:py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title="우리의 가치"
                subtitle="고객 중심의 서비스로 최고의 학습 경험을 제공합니다"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {companyValues.map((value: any, index: number) => (
                  <FeatureCard
                    key={index}
                    icon={getIconComponent(value.icon, "w-8 h-8")}
                    title={value.title}
                    description={value.description}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 상세 소개 섹션 */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle title="회사 소개" />
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
              <div className="prose prose-lg max-w-none">
                {content.includes("#") || content.includes("*") || content.includes("`") ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

