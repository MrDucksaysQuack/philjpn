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
import StatCard from "@/components/about/StatCard";
import { getIconComponent } from "@/components/about/iconMapper";

export default function CompanyPage() {
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
  const companyContent = aboutContent?.[locale]?.company;
  
  // 언어별 콘텐츠 가져오기 (없으면 i18n fallback)
  const heroContent = companyContent?.hero || {
    subtitle: t("about.company.hero.subtitle"),
  };
  
  const valuesSection = companyContent?.values || {
    title: t("about.company.values.title"),
    subtitle: t("about.company.values.subtitle"),
  };
  
  const introSection = companyContent?.intro || {
    title: t("about.company.intro.title"),
  };
  
  const companyName = settings?.companyName || "Exam Platform";
  const content = settings?.aboutCompany || t("about.company.intro.title");
  const stats = settings?.companyStats?.stats || [];
  const companyValues = settings?.companyValues?.values || [];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <HeroSection
        title={companyName}
        subtitle={heroContent.subtitle}
      />

      <div className="min-h-screen bg-background">
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
          <section className="py-16 md:py-24 bg-surface-hover">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title={valuesSection.title}
                subtitle={valuesSection.subtitle}
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
            <SectionTitle title={introSection.title} />
            <div className="bg-surface rounded-2xl shadow-lg p-8 md:p-12 border border-border-light">
              <div className="prose prose-lg max-w-none">
                {content.includes("#") || content.includes("*") || content.includes("`") ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <div className="text-text-secondary leading-relaxed whitespace-pre-line">{content}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

