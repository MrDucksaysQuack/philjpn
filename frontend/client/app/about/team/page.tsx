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
import TeamMemberCard from "@/components/about/TeamMemberCard";
import FeatureCard from "@/components/about/FeatureCard";
import { getIconComponent } from "@/components/about/iconMapper";

export default function TeamPage() {
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
  const teamContent = aboutContent?.[locale]?.team;
  
  // 언어별 콘텐츠 가져오기 (없으면 i18n fallback)
  const heroContent = teamContent?.hero || {
    title: t("about.team.hero.title"),
    subtitle: t("about.team.hero.subtitle"),
  };
  
  const membersSection = teamContent?.members || {
    title: t("about.team.members.title"),
    subtitle: t("about.team.members.subtitle"),
  };
  
  const cultureSection = teamContent?.culture || {
    title: t("about.team.culture.title"),
    subtitle: t("about.team.culture.subtitle"),
  };
  
  const introSection = teamContent?.intro || {
    title: t("about.team.intro.title"),
  };
  
  const content = settings?.aboutTeam || t("about.team.intro.title");
  const teamMembers = settings?.teamMembers?.members || [];
  const teamCulture = settings?.teamCulture?.culture || [];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <HeroSection
        title={heroContent.title}
        subtitle={heroContent.subtitle}
      />

      <div className="min-h-screen bg-background">
        {/* 팀원 섹션 */}
        {teamMembers.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title={membersSection.title}
                subtitle={membersSection.subtitle}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {teamMembers.map((member: any, index: number) => (
                  <TeamMemberCard
                    key={index}
                    name={member.name}
                    role={member.role}
                    description={member.description}
                    imageUrl={member.imageUrl}
                    socialLinks={member.socialLinks}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 팀 문화 섹션 */}
        {teamCulture.length > 0 && (
          <section className="py-16 md:py-24 bg-surface-hover">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title={cultureSection.title}
                subtitle={cultureSection.subtitle}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {teamCulture.map((culture: any, index: number) => (
                  <FeatureCard
                    key={index}
                    icon={getIconComponent(culture.icon, "w-8 h-8")}
                    title={culture.title}
                    description={culture.description}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 상세 팀 소개 섹션 */}
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

