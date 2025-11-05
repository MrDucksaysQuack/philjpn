"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { siteSettingsAPI } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import HeroSection from "@/components/about/HeroSection";
import SectionTitle from "@/components/about/SectionTitle";
import TeamMemberCard from "@/components/about/TeamMemberCard";
import FeatureCard from "@/components/about/FeatureCard";
import { getIconComponent } from "@/components/about/iconMapper";

export default function TeamPage() {
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
            <LoadingSpinner message="팀 정보를 불러오는 중..." />
          </div>
        </div>
      </>
    );
  }

  const settings = data as any;
  const content = settings?.aboutTeam || "팀 소개 내용이 아직 등록되지 않았습니다.";
  const teamMembers = settings?.teamMembers?.members || [];
  const teamCulture = settings?.teamCulture?.culture || [];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <HeroSection
        title="우리 팀을 소개합니다"
        subtitle="열정과 전문성을 갖춘 팀으로 최고의 서비스를 제공합니다"
      />

      <div className="min-h-screen bg-white">
        {/* 팀원 섹션 */}
        {teamMembers.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title="팀 멤버"
                subtitle="다양한 전문성을 가진 팀원들이 함께 성장하고 있습니다"
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
          <section className="py-16 md:py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle
                title="팀 문화"
                subtitle="우리가 함께 만드는 가치와 원칙"
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
            <SectionTitle title="팀 소개" />
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

