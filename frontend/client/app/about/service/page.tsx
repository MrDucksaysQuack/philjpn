"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { siteSettingsAPI } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import HeroSection from "@/components/about/HeroSection";
import SectionTitle from "@/components/about/SectionTitle";
import FeatureCard from "@/components/about/FeatureCard";
import BenefitList from "@/components/about/BenefitList";
import ProcessStep from "@/components/about/ProcessStep";
import { getIconComponent } from "@/components/about/iconMapper";
import Link from "next/link";

export default function ServicePage() {
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
            <LoadingSpinner message="서비스 정보를 불러오는 중..." />
          </div>
        </div>
      </>
    );
  }

  const settings = data as any;
  const content = settings?.serviceInfo || "서비스 소개 내용이 아직 등록되지 않았습니다.";
  const features = settings?.serviceFeatures?.features || [];
  const benefits = settings?.serviceBenefits?.benefits || [];
  const processSteps = settings?.serviceProcess?.steps || [];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <HeroSection
        title="혁신적인 시험 플랫폼"
        subtitle="AI 기반 개인 맞춤형 학습으로 목표를 달성하세요"
      >
        <Link
          href="/exams"
          className="inline-block mt-8 px-8 py-4 bg-white text-theme-primary rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
        >
          시험 시작하기 →
        </Link>
      </HeroSection>

      <div className="min-h-screen bg-white">
        {/* 주요 기능 섹션 */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
              title="주요 기능"
              subtitle="최고의 학습 경험을 위한 핵심 기능들"
            />
            {features.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {features.map((feature: any, index: number) => (
                  <FeatureCard
                    key={index}
                    icon={getIconComponent(feature.icon, "w-8 h-8")}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 혜택 섹션 */}
        {benefits.length > 0 && (
          <section className="py-16 md:py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title="서비스 혜택"
                subtitle="우리 서비스를 통해 얻을 수 있는 것들"
              />
              <BenefitList benefits={benefits} />
            </div>
          </section>
        )}

        {/* 프로세스 섹션 */}
        {processSteps.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title="사용 방법"
                subtitle="간단한 4단계로 시작하세요"
              />
              <div className="space-y-8 md:space-y-12">
                {processSteps.map((step: any, index: number) => (
                  <ProcessStep
                    key={index}
                    step={step.step || index + 1}
                    title={step.title}
                    description={step.description}
                    isLast={index === processSteps.length - 1}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 상세 서비스 소개 섹션 */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle title="서비스 소개" />
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

