"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { adminAPI, UpdateSiteSettingsDto, ColorAnalysisResult, isLocalizedString } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "@/components/common/Toast";
import { ColorHarmonyService, ColorTheme } from "@/lib/color-harmony";
import BasicInfoTab from "./components/BasicInfoTab";
import CompanyTab from "./components/CompanyTab";
import TeamTab from "./components/TeamTab";
import ServiceTab from "./components/ServiceTab";
import ContactTab from "./components/ContactTab";
import ContentTab from "./components/ContentTab";
import PreviewTab from "./components/PreviewTab";
import ColorThemeTab from "./components/ColorThemeTab";
import VersionHistoryTab from "./components/VersionHistoryTab";

export default function SiteSettingsPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"basic" | "company" | "team" | "service" | "contact" | "content" | "preview" | "versions" | "colorTheme">("basic");
  const [contentLocale, setContentLocale] = useState<"ko" | "en" | "ja">("ko");
  const [markdownLocale, setMarkdownLocale] = useState<"ko" | "en" | "ja">("ko");
  const [structuredLocale, setStructuredLocale] = useState<"ko" | "en" | "ja">("ko");
  const [previewType, setPreviewType] = useState<"home" | "about">("home");
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const isInitialLoad = useRef(true);

  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const response = await adminAPI.getSiteSettings();
      return response.data;
    },
    enabled: user?.role === "admin",
  });

  const settings = settingsResponse?.data;

  const [formData, setFormData] = useState<UpdateSiteSettingsDto>({
    companyName: "",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "",
    secondaryColor: "",
    accentColor: "",
    aboutCompany: { ko: "", en: "", ja: "" },
    aboutTeam: { ko: "", en: "", ja: "" },
    contactInfo: {
      email: "",
      phone: "",
      address: "",
      socialMedia: {},
    },
    serviceInfo: { ko: "", en: "", ja: "" },
    companyStats: { stats: [] },
    companyValues: { values: [] },
    teamMembers: { members: [] },
    teamCulture: { culture: [] },
    serviceFeatures: { features: [] },
    serviceBenefits: { benefits: [] },
    serviceProcess: { steps: [] },
    homeContent: {
      ko: { hero: { title: "", subtitle: "" }, features: [] },
      en: { hero: { title: "", subtitle: "" }, features: [] },
      ja: { hero: { title: "", subtitle: "" }, features: [] },
    },
    aboutContent: {
      ko: { team: {}, company: {}, service: {}, contact: {} },
      en: { team: {}, company: {}, service: {}, contact: {} },
      ja: { team: {}, company: {}, service: {}, contact: {} },
    },
  });

  // 설정 데이터 로드 시 폼 데이터 설정
  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        logoUrl: settings.logoUrl || "",
        faviconUrl: settings.faviconUrl || "",
        primaryColor: settings.primaryColor || "",
        secondaryColor: settings.secondaryColor || "",
        accentColor: settings.accentColor || "",
        aboutCompany: typeof settings.aboutCompany === "string" 
          ? { ko: settings.aboutCompany, en: "", ja: "" }
          : (isLocalizedString(settings.aboutCompany) ? settings.aboutCompany : { ko: "", en: "", ja: "" }),
        aboutTeam: typeof settings.aboutTeam === "string"
          ? { ko: settings.aboutTeam, en: "", ja: "" }
          : (isLocalizedString(settings.aboutTeam) ? settings.aboutTeam : { ko: "", en: "", ja: "" }),
        contactInfo: settings.contactInfo || {
          email: "",
          phone: "",
          address: "",
          socialMedia: {},
        },
        serviceInfo: typeof settings.serviceInfo === "string"
          ? { ko: settings.serviceInfo, en: "", ja: "" }
          : (isLocalizedString(settings.serviceInfo) ? settings.serviceInfo : { ko: "", en: "", ja: "" }),
        companyStats: settings.companyStats || { stats: [] },
        companyValues: settings.companyValues || { values: [] },
        teamMembers: settings.teamMembers || { members: [] },
        teamCulture: settings.teamCulture || { culture: [] },
        serviceFeatures: settings.serviceFeatures || { features: [] },
        serviceBenefits: settings.serviceBenefits || { benefits: [] },
        serviceProcess: settings.serviceProcess || { steps: [] },
        homeContent: settings.homeContent || {
          ko: { hero: { title: "", subtitle: "" }, features: [] },
          en: { hero: { title: "", subtitle: "" }, features: [] },
          ja: { hero: { title: "", subtitle: "" }, features: [] },
        },
        aboutContent: settings.aboutContent || {
          ko: { team: {}, company: {}, service: {}, contact: {} },
          en: { team: {}, company: {}, service: {}, contact: {} },
          ja: { team: {}, company: {}, service: {}, contact: {} },
        },
        colorTheme: settings.colorTheme || undefined,
      });
      // 초기 로드 완료 표시
      isInitialLoad.current = false;
    }
  }, [settings]);

  // 데이터 정리 함수
  const cleanFormData = useCallback((data: UpdateSiteSettingsDto): UpdateSiteSettingsDto => {
    let cleanedContactInfo: UpdateSiteSettingsDto['contactInfo'] = data.contactInfo ? {
      email: data.contactInfo.email?.trim() || undefined,
      phone: data.contactInfo.phone?.trim() || undefined,
      address: data.contactInfo.address?.trim() || undefined,
      socialMedia: data.contactInfo.socialMedia ? {
        website: data.contactInfo.socialMedia.website?.trim() || undefined,
        facebook: data.contactInfo.socialMedia.facebook?.trim() || undefined,
        twitter: data.contactInfo.socialMedia.twitter?.trim() || undefined,
        instagram: data.contactInfo.socialMedia.instagram?.trim() || undefined,
        linkedin: data.contactInfo.socialMedia.linkedin?.trim() || undefined,
      } : undefined,
    } : undefined;
    
    if (cleanedContactInfo?.socialMedia) {
      const hasAnySocialMedia = Object.values(cleanedContactInfo.socialMedia).some(v => v !== undefined);
      if (!hasAnySocialMedia) {
        cleanedContactInfo.socialMedia = undefined;
      }
    }
    
    if (cleanedContactInfo) {
      const hasAnyContactInfo = 
        cleanedContactInfo.email !== undefined ||
        cleanedContactInfo.phone !== undefined ||
        cleanedContactInfo.address !== undefined ||
        cleanedContactInfo.socialMedia !== undefined;
      if (!hasAnyContactInfo) {
        cleanedContactInfo = undefined;
      }
    }
    
    // colorTheme이 있으면 primaryColor, secondaryColor, accentColor를 동기화 (하위 호환성)
    let syncedData = { ...data };
    if (data.colorTheme && typeof data.colorTheme === 'object') {
      const theme = data.colorTheme as Partial<ColorTheme>;
      syncedData = {
        ...syncedData,
        primaryColor: theme.primary || data.primaryColor?.trim() || undefined,
        secondaryColor: theme.secondary || data.secondaryColor?.trim() || undefined,
        accentColor: theme.accent || data.accentColor?.trim() || undefined,
      };
    }
    
    return {
      ...syncedData,
      logoUrl: data.logoUrl?.trim() || undefined,
      faviconUrl: data.faviconUrl?.trim() || undefined,
      primaryColor: syncedData.primaryColor?.trim() || undefined,
      secondaryColor: syncedData.secondaryColor?.trim() || undefined,
      accentColor: syncedData.accentColor?.trim() || undefined,
      aboutCompany: isLocalizedString(data.aboutCompany)
        ? {
            ko: data.aboutCompany.ko?.trim() || "",
            en: data.aboutCompany.en?.trim() || "",
            ja: data.aboutCompany.ja?.trim() || "",
          }
        : typeof data.aboutCompany === "string" 
          ? data.aboutCompany.trim() || undefined
          : undefined,
      aboutTeam: isLocalizedString(data.aboutTeam)
        ? {
            ko: data.aboutTeam.ko?.trim() || "",
            en: data.aboutTeam.en?.trim() || "",
            ja: data.aboutTeam.ja?.trim() || "",
          }
        : typeof data.aboutTeam === "string"
          ? data.aboutTeam.trim() || undefined
          : undefined,
      serviceInfo: isLocalizedString(data.serviceInfo)
        ? {
            ko: data.serviceInfo.ko?.trim() || "",
            en: data.serviceInfo.en?.trim() || "",
            ja: data.serviceInfo.ja?.trim() || "",
          }
        : typeof data.serviceInfo === "string"
          ? data.serviceInfo.trim() || undefined
          : undefined,
      contactInfo: cleanedContactInfo,
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSiteSettingsDto) => {
      const response = await adminAPI.updateSiteSettings(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setSavingStatus("saved");
      // 2초 후 idle로 변경
      setTimeout(() => {
        setSavingStatus("idle");
      }, 2000);
    },
    onError: (error: any) => {
      setSavingStatus("error");
      // ✅ 상세한 검증 에러 메시지 표시
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err: any) => {
            const constraints = Object.values(err.constraints || {}).join(', ');
            return `${err.property}: ${constraints}`;
          })
          .join('\n');
        toast.error(`${t("admin.siteSettings.saveError")}:\n\n${errorMessages}`);
      } else {
        toast.error(`${t("admin.siteSettings.saveError")}: ${error.response?.data?.message || error.message}`);
      }
      // 3초 후 idle로 변경
      setTimeout(() => {
        setSavingStatus("idle");
      }, 3000);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // 자동 저장 기능 제거됨 - 저장 버튼을 눌러야만 저장됩니다

  const analyzeColorsMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      const response = await adminAPI.analyzeColors(logoUrl);
      return response.data.data;
    },
    onSuccess: (result: ColorAnalysisResult) => {
      // colorTheme에 색상 분석 결과 저장
      const currentColorTheme = (formData.colorTheme as Partial<ColorTheme>) || {};
      const updatedColorTheme = {
        ...currentColorTheme,
        primary: result.primaryColor,
        secondary: result.secondaryColor,
        accent: result.accentColor,
      };
      setFormData({
        ...formData,
        colorTheme: updatedColorTheme,
      });
      alert(`색상 분석 완료! (신뢰도: ${Math.round(result.confidence * 100)}%)`);
    },
    onError: (error: any) => {
      alert(`색상 분석 실패: ${error.response?.data?.message || error.message}`);
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });

  const handleAnalyzeColors = async () => {
    if (!formData.logoUrl) {
      alert("로고 URL을 먼저 입력해주세요.");
      return;
    }
    setIsAnalyzing(true);
    analyzeColorsMutation.mutate(formData.logoUrl);
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return;

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      alert("이미지 파일만 업로드 가능합니다. (JPG, PNG, GIF, WEBP, SVG, ICO)");
      return;
    }

    try {
      if (type === 'logo') {
        setUploadingLogo(true);
      } else {
        setUploadingFavicon(true);
      }

      const response = await adminAPI.uploadImage(file);
      const uploadedUrl = response.data.data.url;

      if (type === 'logo') {
        setFormData({ ...formData, logoUrl: uploadedUrl });
      } else {
        setFormData({ ...formData, faviconUrl: uploadedUrl });
      }

      alert("파일이 성공적으로 업로드되었습니다.");
    } catch (error: any) {
      alert(`파일 업로드 실패: ${error.response?.data?.message || error.message}`);
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingFavicon(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavingStatus("saving");
    
    const cleanedData = cleanFormData(formData);
    updateMutation.mutate(cleanedData);
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message="인증 확인 중..." />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-theme-gradient-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSpinner message={t("admin.siteSettings.loading")} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        {/* 헤더 섹션 */}
        <div className="relative bg-theme-gradient-diagonal overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                {t("admin.siteSettings.title")}
              </h1>
              <p className="text-xl text-theme-primary-light max-w-2xl mx-auto">
                {t("admin.siteSettings.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 탭 네비게이션 */}
          <div className="mb-8">
            <div className="border-b border-border">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("basic")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "basic"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.basic")}
                </button>
                <button
                  onClick={() => setActiveTab("company")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "company"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.company")}
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "team"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.team")}
                </button>
                <button
                  onClick={() => setActiveTab("service")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "service"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.service")}
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "contact"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.contact")}
                </button>
                <button
                  onClick={() => setActiveTab("content")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "content"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.content")}
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "preview"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.preview")}
                </button>
                <button
                  onClick={() => setActiveTab("versions")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "versions"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  {t("admin.siteSettings.tabs.versions")}
                </button>
                <button
                  onClick={() => setActiveTab("colorTheme")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "colorTheme"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  🎨 {t("admin.siteSettings.tabs.colorTheme")}
                </button>
              </nav>
            </div>
          </div>

          {/* 저장 상태 표시 */}
          {savingStatus !== "idle" && (
            <div className="mb-4 flex items-center justify-end">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  savingStatus === "saving"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : savingStatus === "saved"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {savingStatus === "saving" && (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>{t("admin.siteSettings.saving")}</span>
                  </>
                )}
                {savingStatus === "saved" && (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{t("admin.siteSettings.saved")}</span>
                  </>
                )}
                {savingStatus === "error" && (
                  <>
                    <svg
                      className="h-4 w-4"
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
                    <span>{t("admin.siteSettings.saveFailed")}</span>
                  </>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 기본 정보 탭 */}
            {activeTab === "basic" && (
              <BasicInfoTab
                formData={formData}
                setFormData={setFormData}
                uploadingLogo={uploadingLogo}
                uploadingFavicon={uploadingFavicon}
                isAnalyzing={isAnalyzing}
                onFileUpload={handleFileUpload}
                onAnalyzeColors={handleAnalyzeColors}
                t={t}
              />
            )}

            {/* 회사 소개 탭 */}
            {activeTab === "company" && (
              <CompanyTab
                formData={formData}
                setFormData={setFormData}
                markdownLocale={markdownLocale}
                setMarkdownLocale={setMarkdownLocale}
                structuredLocale={structuredLocale}
                setStructuredLocale={setStructuredLocale}
              />
            )}

            {/* 팀 소개 탭 */}
            {activeTab === "team" && (
              <TeamTab
                formData={formData}
                setFormData={setFormData}
                markdownLocale={markdownLocale}
                setMarkdownLocale={setMarkdownLocale}
                structuredLocale={structuredLocale}
                setStructuredLocale={setStructuredLocale}
              />
            )}

            {/* 서비스 소개 탭 */}
            {activeTab === "service" && (
              <ServiceTab
                formData={formData}
                setFormData={setFormData}
                markdownLocale={markdownLocale}
                setMarkdownLocale={setMarkdownLocale}
                structuredLocale={structuredLocale}
                setStructuredLocale={setStructuredLocale}
              />
            )}

            {/* 연락처 탭 */}
            {activeTab === "contact" && (
              <ContactTab
                formData={formData}
                setFormData={setFormData}
              />
            )}

            {/* 언어별 콘텐츠 탭 */}
            {activeTab === "content" && (
              <ContentTab
                formData={formData}
                setFormData={setFormData}
                contentLocale={contentLocale}
                setContentLocale={setContentLocale}
              />
            )}

            {/* 미리보기 탭 */}
            {activeTab === "preview" && (
              <PreviewTab
                formData={formData}
                contentLocale={contentLocale}
                setContentLocale={setContentLocale}
                previewType={previewType}
                setPreviewType={setPreviewType}
              />
            )}

            {/* 색상 테마 탭 */}
            {activeTab === "colorTheme" && (
              <ColorThemeTab
                formData={formData}
                setFormData={setFormData}
                t={t}
              />
            )}

            {/* 버전 히스토리 탭 */}
            {activeTab === "versions" && (
              <VersionHistoryTab />
            )}

            {/* 저장 버튼 */}
            {activeTab === "colorTheme" && (
              <ColorThemeTab
                formData={formData}
                setFormData={setFormData}
                t={t}
              />
            )}

            {/* 버전 히스토리 탭 */}
            {activeTab === "versions" && <VersionHistoryTab />}

            {/* 저장 버튼 */}
            <div className="mt-8 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {savingStatus === "saving" && "💾 저장 중..."}
                {savingStatus === "saved" && "✅ 저장되었습니다"}
                {savingStatus === "error" && "❌ 저장 중 오류가 발생했습니다"}
                {savingStatus === "idle" && "💡 저장 버튼을 눌러 변경 사항을 저장하세요"}
              </div>
              <div className="flex gap-4">
              <Link
                href="/admin"
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-theme-gradient-primary text-white rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isSaving ? "저장 중..." : "지금 저장"}
              </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

