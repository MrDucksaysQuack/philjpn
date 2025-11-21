"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import HeroSection from "@/components/about/HeroSection";
import SectionTitle from "@/components/about/SectionTitle";
import FeatureCard from "@/components/about/FeatureCard";
import StatCard from "@/components/about/StatCard";
import TeamMemberCard from "@/components/about/TeamMemberCard";
import BenefitList from "@/components/about/BenefitList";
import ProcessStep from "@/components/about/ProcessStep";
import { getIconComponent } from "@/components/about/iconMapper";
import { UpdateSiteSettingsDto, getLocalizedValue } from "@/lib/api";

interface SettingsPreviewProps {
  formData: UpdateSiteSettingsDto;
  previewLocale: "ko" | "en" | "ja";
  previewType: "home" | "about";
}

export default function SettingsPreview({
  formData,
  previewLocale,
  previewType,
}: SettingsPreviewProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  // 언어별 콘텐츠 가져오기
  const homeContent = formData.homeContent?.[previewLocale];
  const aboutContent = formData.aboutContent?.[previewLocale];

  // 색상 스타일 적용
  const colorStyle = {
    "--primary-color": formData.primaryColor || "#667eea",
    "--secondary-color": formData.secondaryColor || "#764ba2",
    "--accent-color": formData.accentColor || "#4facfe",
  } as React.CSSProperties;

  // 홈 페이지 미리보기
  const renderHomePreview = () => {
    const hero = homeContent?.hero || { title: "", subtitle: "" };
    const features = homeContent?.features || [];

    return (
      <div className="space-y-12">
        {/* Hero Section */}
        <HeroSection
          title={hero.title || "환영합니다"}
          subtitle={hero.subtitle || "시작하세요"}
        >
          <div className="mt-6">
            <button className="px-6 py-3 bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 transition-all">
              시작하기
            </button>
          </div>
        </HeroSection>

        {/* Features Section */}
        {features.length > 0 && (
          <div className="py-12">
            <SectionTitle
              title={homeContent?.featuresSectionTitle || "주요 기능"}
              subtitle={homeContent?.featuresSectionSubtitle || "다양한 기능을 제공합니다"}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {features.map((feature: any, index: number) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon || "✨"}
                  title={feature.title || `기능 ${index + 1}`}
                  description={feature.description || ""}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // About 페이지 미리보기
  const renderAboutPreview = () => {
    if (!aboutContent) {
      return (
        <div className="text-center py-12 text-gray-500">
          {previewLocale === "ko" && "About 콘텐츠가 설정되지 않았습니다."}
          {previewLocale === "en" && "About content is not set."}
          {previewLocale === "ja" && "Aboutコンテンツが設定されていません。"}
        </div>
      );
    }

    return (
      <div className="space-y-12">
        {/* Team Section */}
        {aboutContent.team && (
          <div>
            <HeroSection
              title={aboutContent.team.hero?.title || "팀 소개"}
              subtitle={aboutContent.team.hero?.subtitle || ""}
            />
            {aboutContent.team.members && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {aboutContent.team.members.map((member, index) => (
                  <TeamMemberCard
                    key={index}
                    name={member.name || `멤버 ${index + 1}`}
                    role={member.role || ""}
                    description={member.bio || member.description}
                    imageUrl={member.image || member.imageUrl}
                    socialLinks={member.socialLinks}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Company Section */}
        {aboutContent.company && (
          <div>
            <HeroSection
              title={aboutContent.company.hero?.title || "회사 소개"}
              subtitle={aboutContent.company.hero?.subtitle || ""}
            />
            {formData.companyStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {formData.companyStats.stats?.map((stat, index) => {
                  const IconComponent = stat.icon ? getIconComponent(stat.icon) : null;
                  return (
                    <StatCard
                      key={index}
                      value={stat.value || "0"}
                      label={getLocalizedValue(stat.label, previewLocale)}
                      icon={IconComponent}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Service Section */}
        {aboutContent.service && (
          <div>
            <HeroSection
              title={aboutContent.service.hero?.title || "서비스 소개"}
              subtitle={aboutContent.service.hero?.subtitle || ""}
            />
            {aboutContent.service.features && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {aboutContent.service.features.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    icon={feature.icon || "✨"}
                    title={feature.title || ""}
                    description={feature.description || ""}
                  />
                ))}
              </div>
            )}
            {aboutContent.service.benefits && (
              <div className="mt-8">
                <SectionTitle
                  title="서비스 혜택"
                  subtitle=""
                />
                <BenefitList 
                  benefits={Array.isArray(aboutContent.service.benefits) 
                    ? aboutContent.service.benefits.map((b) => 
                        typeof b === 'string' ? { text: b } : b
                      )
                    : []} 
                />
              </div>
            )}
            {aboutContent.service.process && (
              <div className="mt-8">
                <SectionTitle
                  title="서비스 프로세스"
                  subtitle=""
                />
                <div className="space-y-4 mt-8">
                  {aboutContent.service.process.map((step, index) => (
                    <ProcessStep
                      key={index}
                      step={index + 1}
                      title={step.title || ""}
                      description={step.description || ""}
                      isLast={index === (aboutContent.service?.process?.length ?? 0) - 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Section */}
        {aboutContent.contact && (
          <div>
            <HeroSection
              title={aboutContent.contact.hero?.title || "연락처"}
              subtitle={aboutContent.contact.hero?.subtitle || ""}
            />
            {formData.contactInfo && (
              <div className="mt-8 space-y-4">
                {formData.contactInfo.email && (
                  <p className="text-gray-700">
                    <strong>이메일:</strong> {formData.contactInfo.email}
                  </p>
                )}
                {formData.contactInfo.phone && (
                  <p className="text-gray-700">
                    <strong>전화:</strong> {formData.contactInfo.phone}
                  </p>
                )}
                {formData.contactInfo.address && (
                  <p className="text-gray-700">
                    <strong>주소:</strong> {formData.contactInfo.address}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 디바이스 뷰 선택 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setDeviceView("desktop")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              deviceView === "desktop"
                ? "bg-button-primary text-button-text"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🖥️ 데스크톱
          </button>
          <button
            onClick={() => setDeviceView("mobile")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              deviceView === "mobile"
                ? "bg-button-primary text-button-text"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📱 모바일
          </button>
        </div>
        <div className="text-sm text-gray-500">
          언어: {previewLocale === "ko" ? "한국어" : previewLocale === "en" ? "English" : "日本語"}
        </div>
      </div>

      {/* 미리보기 컨테이너 */}
      <div
        className={`border-2 border-gray-300 rounded-lg overflow-hidden bg-white ${
          deviceView === "mobile" ? "max-w-sm mx-auto" : "w-full"
        }`}
        style={colorStyle}
      >
        {/* 미리보기 헤더 (브라우저 바) */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600 text-center">
            {formData.companyName || "Exam Platform"}
          </div>
        </div>

        {/* 실제 콘텐츠 */}
        <div
          className={`overflow-y-auto bg-theme-gradient-light ${
            deviceView === "mobile" ? "h-[600px]" : "h-[800px]"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 로고 표시 */}
            {formData.logoUrl && (
              <div className="mb-8 flex justify-center">
                <img
                  src={formData.logoUrl}
                  alt="Logo"
                  className="h-12 object-contain"
                />
              </div>
            )}

            {/* 콘텐츠 렌더링 */}
            {previewType === "home" ? renderHomePreview() : renderAboutPreview()}
          </div>
        </div>
      </div>
    </div>
  );
}

