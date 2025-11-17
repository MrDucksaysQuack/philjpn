"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { siteSettingsAPI } from "@/lib/api";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";
import HeroSection from "@/components/about/HeroSection";
import SectionTitle from "@/components/about/SectionTitle";
import FeatureCard from "@/components/about/FeatureCard";
import BenefitList from "@/components/about/BenefitList";
import ProcessStep from "@/components/about/ProcessStep";
import { getIconComponent } from "@/components/about/iconMapper";
import Link from "next/link";

export default function ServicePage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  
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
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("common.loading")} />
          </div>
        </div>
      </>
    );
  }

  const settings = data as any;
  const aboutContent = settings?.aboutContent as any;
  const serviceContent = aboutContent?.[locale]?.service;
  
  // 언어별 콘텐츠 가져오기 (없으면 i18n fallback)
  const heroContent = serviceContent?.hero || {
    title: t("about.service.hero.title"),
    subtitle: t("about.service.hero.subtitle"),
    startButton: t("about.service.hero.startButton"),
  };
  
  const featuresSection = serviceContent?.features || {
    title: t("about.service.features.title"),
    subtitle: t("about.service.features.subtitle"),
  };
  
  const benefitsSection = serviceContent?.benefits || {
    title: t("about.service.benefits.title"),
    subtitle: t("about.service.benefits.subtitle"),
  };
  
  const processSection = serviceContent?.process || {
    title: t("about.service.process.title"),
    subtitle: t("about.service.process.subtitle"),
  };
  
  const introSection = serviceContent?.intro || {
    title: t("about.service.intro.title"),
  };
  
  const content = settings?.serviceInfo || t("about.service.intro.title");
  const features = settings?.serviceFeatures?.features || [];
  const benefits = settings?.serviceBenefits?.benefits || [];
  const processSteps = settings?.serviceProcess?.steps || [];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <HeroSection
        title={heroContent.title}
        subtitle={heroContent.subtitle}
      >
        <Link
          href="/exams"
          className="inline-block mt-8 px-8 py-4 bg-white text-theme-primary rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
        >
          {heroContent.startButton}
        </Link>
      </HeroSection>

      <div className="min-h-screen bg-white">
        {/* 주요 기능 섹션 */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
              title={featuresSection.title}
              subtitle={featuresSection.subtitle}
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
                title={benefitsSection.title}
                subtitle={benefitsSection.subtitle}
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
                title={processSection.title}
                subtitle={processSection.subtitle}
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
            <SectionTitle title={introSection.title} />
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

