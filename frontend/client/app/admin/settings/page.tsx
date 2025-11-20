"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocaleStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { adminAPI, SiteSettings, UpdateSiteSettingsDto, ColorAnalysisResult, SiteSettingsVersion } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";
import IconPicker from "@/components/admin/IconPicker";
import { getIconComponent } from "@/components/about/iconMapper";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import { toast } from "@/components/common/Toast";
import SettingsPreview from "@/components/admin/SettingsPreview";
import ColorPicker from "@/components/admin/ColorPicker";
import { ColorHarmonyService, ColorTheme, ColorImportance, COLOR_IMPORTANCE_MAP } from "@/lib/color-harmony";

export default function SiteSettingsPage() {
  const { locale } = useLocaleStore();
  const { t } = useTranslation(locale);
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"basic" | "company" | "team" | "service" | "contact" | "content" | "preview" | "versions" | "colorTheme">("basic");
  const [contentLocale, setContentLocale] = useState<"ko" | "en" | "ja">("ko");
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
    aboutCompany: "",
    aboutTeam: "",
    contactInfo: {
      email: "",
      phone: "",
      address: "",
      socialMedia: {},
    },
    serviceInfo: "",
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
        aboutCompany: settings.aboutCompany || "",
        aboutTeam: settings.aboutTeam || "",
        contactInfo: settings.contactInfo || {
          email: "",
          phone: "",
          address: "",
          socialMedia: {},
        },
        serviceInfo: settings.serviceInfo || "",
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
      aboutCompany: data.aboutCompany?.trim() || undefined,
      aboutTeam: data.aboutTeam?.trim() || undefined,
      serviceInfo: data.serviceInfo?.trim() || undefined,
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
              <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border-light space-y-6">
                <h2 className="text-2xl font-bold text-text-primary mb-6">기본 정보</h2>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    로고
                  </label>
                  <div className="space-y-3">
                    {/* 파일 업로드 버튼 */}
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, 'logo');
                            }
                          }}
                          disabled={uploadingLogo}
                        />
                        <div className="px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-theme-primary transition-colors text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          {uploadingLogo ? (
                            <span className="text-theme-primary">업로드 중...</span>
                          ) : (
                            <span className="text-text-secondary">📁 파일 선택 (JPG, PNG, SVG, ICO 등)</span>
                          )}
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={handleAnalyzeColors}
                        disabled={!formData.logoUrl || isAnalyzing || uploadingLogo}
                        className="px-4 py-2 bg-theme-gradient-secondary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                        title="로고에서 색상을 분석하여 색상 테마 관리 탭에 적용합니다"
                      >
                        {isAnalyzing ? t("admin.siteSettings.analyzing") : t("admin.siteSettings.colorAnalysis")}
                      </button>
                    </div>
                    
                    {/* URL 직접 입력 (또는) */}
                    <div className="text-center text-xs text-text-muted">또는</div>
                    
                    {/* URL 입력 필드 */}
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, logoUrl: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="https://example.com/logo.png (URL 직접 입력)"
                      disabled={uploadingLogo}
                    />
                    
                    {/* 미리보기 */}
                    {formData.logoUrl && (
                      <div className="mt-2 p-3 bg-surface-hover rounded-lg border border-border">
                        <div className="text-xs text-text-secondary mb-2">{t("admin.siteSettings.preview")}:</div>
                        <img
                          src={formData.logoUrl}
                          alt={t("admin.siteSettings.logoPreview")}
                          className="h-20 object-contain mx-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    파비콘
                  </label>
                  <div className="space-y-3">
                    {/* 파일 업로드 버튼 */}
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.ico"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'favicon');
                          }
                        }}
                        disabled={uploadingFavicon}
                      />
                      <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-theme-primary transition-colors text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploadingFavicon ? (
                          <span className="text-theme-primary">업로드 중...</span>
                        ) : (
                          <span className="text-gray-600">📁 파일 선택 (ICO, PNG 등)</span>
                        )}
                      </div>
                    </label>
                    
                    {/* URL 직접 입력 (또는) */}
                    <div className="text-center text-xs text-text-muted">또는</div>
                    
                    {/* URL 입력 필드 */}
                    <input
                      type="url"
                      value={formData.faviconUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, faviconUrl: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="https://example.com/favicon.ico (URL 직접 입력)"
                      disabled={uploadingFavicon}
                    />
                    
                    {/* 미리보기 */}
                    {formData.faviconUrl && (
                      <div className="mt-2 p-3 bg-surface-hover rounded-lg border border-border">
                        <div className="text-xs text-text-secondary mb-2">{t("admin.siteSettings.preview")}:</div>
                        <img
                          src={formData.faviconUrl}
                          alt={t("admin.siteSettings.faviconPreview")}
                          className="h-16 w-16 object-contain mx-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 회사 소개 탭 */}
            {activeTab === "company" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">회사 소개 페이지 관리</h2>
                  <Link
                    href="/about/company"
                    target="_blank"
                    className="text-sm text-theme-primary hover:underline"
                  >
                    페이지 보기 →
                  </Link>
                </div>

                {/* 회사 소개 텍스트 */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    회사 소개 내용 (마크다운 지원)
                  </label>
                  <MarkdownEditor
                    value={formData.aboutCompany || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, aboutCompany: value })
                    }
                    placeholder="회사 소개 내용을 마크다운 형식으로 입력하세요..."
                    rows={10}
                    showPreview={true}
                  />
                  <p className="mt-2 text-xs text-gray-500">이 내용은 /about/company 페이지의 "회사 소개" 섹션에 표시됩니다.</p>
                </div>

                {/* 회사 통계 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">회사 통계</h3>
                  <p className="text-sm text-gray-600 mb-4">회사 소개 페이지 상단에 표시되는 통계 카드입니다.</p>
                  <div className="space-y-4">
                    {(formData.companyStats?.stats || []).map((stat, index) => (
                      <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-theme-primary transition-colors">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">아이콘</label>
                            <IconPicker
                              value={stat.icon}
                              onChange={(iconName) => {
                                const newStats = [...(formData.companyStats?.stats || [])];
                                newStats[index] = { ...stat, icon: iconName };
                                setFormData({
                                  ...formData,
                                  companyStats: { stats: newStats },
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">값 *</label>
                            <input
                              type="text"
                              value={stat.value || ""}
                              onChange={(e) => {
                                const newStats = [...(formData.companyStats?.stats || [])];
                                newStats[index] = { ...stat, value: e.target.value };
                                setFormData({
                                  ...formData,
                                  companyStats: { stats: newStats },
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                              placeholder="숫자"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">접미사</label>
                            <input
                              type="text"
                              value={stat.suffix || ""}
                              onChange={(e) => {
                                const newStats = [...(formData.companyStats?.stats || [])];
                                newStats[index] = { ...stat, suffix: e.target.value };
                                setFormData({
                                  ...formData,
                                  companyStats: { stats: newStats },
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                              placeholder="예: +, %"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">라벨 *</label>
                            <input
                              type="text"
                              value={stat.label || ""}
                              onChange={(e) => {
                                const newStats = [...(formData.companyStats?.stats || [])];
                                newStats[index] = { ...stat, label: e.target.value };
                                setFormData({
                                  ...formData,
                                  companyStats: { stats: newStats },
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                              placeholder="라벨"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newStats = formData.companyStats?.stats?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              companyStats: { stats: newStats },
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          companyStats: {
                            stats: [...(formData.companyStats?.stats || []), { icon: "", value: "", suffix: "", label: "" }],
                          },
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      + 통계 추가
                    </button>
                  </div>
                </div>

                {/* 회사 가치 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">회사 가치 (미션/비전/가치)</h3>
                  <p className="text-sm text-gray-600 mb-4">회사 소개 페이지의 "우리의 가치" 섹션에 표시됩니다.</p>
                  <div className="space-y-4">
                    {(formData.companyValues?.values || []).map((value, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-theme-primary transition-colors space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">아이콘</label>
                          <IconPicker
                            value={value.icon}
                            onChange={(iconName) => {
                              const newValues = [...(formData.companyValues?.values || [])];
                              newValues[index] = { ...value, icon: iconName };
                              setFormData({
                                ...formData,
                                companyValues: { values: newValues },
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">제목 *</label>
                          <input
                            type="text"
                            value={value.title || ""}
                            onChange={(e) => {
                              const newValues = [...(formData.companyValues?.values || [])];
                              newValues[index] = { ...value, title: e.target.value };
                              setFormData({
                                ...formData,
                                companyValues: { values: newValues },
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="제목 (예: 미션, 비전, 가치)"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">설명 *</label>
                          <textarea
                            value={value.description || ""}
                            onChange={(e) => {
                              const newValues = [...(formData.companyValues?.values || [])];
                              newValues[index] = { ...value, description: e.target.value };
                              setFormData({
                                ...formData,
                                companyValues: { values: newValues },
                              });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="설명"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newValues = formData.companyValues?.values?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              companyValues: { values: newValues },
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          companyValues: {
                            values: [...(formData.companyValues?.values || []), { icon: "", title: "", description: "" }],
                          },
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      + 가치 추가
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 팀 소개 탭 */}
            {activeTab === "team" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">팀 소개 페이지 관리</h2>
                  <Link
                    href="/about/team"
                    target="_blank"
                    className="text-sm text-theme-primary hover:underline"
                  >
                    페이지 보기 →
                  </Link>
                </div>

                {/* 팀 소개 텍스트 */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    팀 소개 내용 (마크다운 지원)
                  </label>
                  <MarkdownEditor
                    value={formData.aboutTeam || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, aboutTeam: value })
                    }
                    placeholder="팀 소개 내용을 마크다운 형식으로 입력하세요..."
                    rows={10}
                    showPreview={true}
                  />
                  <p className="mt-2 text-xs text-gray-500">이 내용은 /about/team 페이지의 "팀 소개" 섹션에 표시됩니다.</p>
                </div>

                {/* 팀원 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">팀원</h3>
                  <p className="text-sm text-gray-600 mb-4">팀 소개 페이지의 "팀 멤버" 섹션에 표시됩니다.</p>
                  <div className="space-y-4">
                    {(formData.teamMembers?.members || []).map((member, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={member.name || ""}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers?.members || [])];
                              newMembers[index] = { ...member, name: e.target.value };
                              setFormData({
                                ...formData,
                                teamMembers: { members: newMembers },
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="이름"
                          />
                          <input
                            type="text"
                            value={member.role || ""}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers?.members || [])];
                              newMembers[index] = { ...member, role: e.target.value };
                              setFormData({
                                ...formData,
                                teamMembers: { members: newMembers },
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="역할"
                          />
                        </div>
                        <textarea
                          value={member.description || ""}
                          onChange={(e) => {
                            const newMembers = [...(formData.teamMembers?.members || [])];
                            newMembers[index] = { ...member, description: e.target.value };
                            setFormData({
                              ...formData,
                              teamMembers: { members: newMembers },
                            });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          placeholder="설명"
                        />
                        <input
                          type="url"
                          value={member.imageUrl || ""}
                          onChange={(e) => {
                            const newMembers = [...(formData.teamMembers?.members || [])];
                            newMembers[index] = { ...member, imageUrl: e.target.value };
                            setFormData({
                              ...formData,
                              teamMembers: { members: newMembers },
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          placeholder="프로필 이미지 URL"
                        />
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">소셜 링크</label>
                          <input
                            type="email"
                            value={member.socialLinks?.email || ""}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers?.members || [])];
                              newMembers[index] = {
                                ...member,
                                socialLinks: {
                                  ...member.socialLinks,
                                  email: e.target.value,
                                },
                              };
                              setFormData({
                                ...formData,
                                teamMembers: { members: newMembers },
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="이메일"
                          />
                          <input
                            type="url"
                            value={member.socialLinks?.linkedin || ""}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers?.members || [])];
                              newMembers[index] = {
                                ...member,
                                socialLinks: {
                                  ...member.socialLinks,
                                  linkedin: e.target.value,
                                },
                              };
                              setFormData({
                                ...formData,
                                teamMembers: { members: newMembers },
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="LinkedIn URL"
                          />
                          <input
                            type="url"
                            value={member.socialLinks?.github || ""}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers?.members || [])];
                              newMembers[index] = {
                                ...member,
                                socialLinks: {
                                  ...member.socialLinks,
                                  github: e.target.value,
                                },
                              };
                              setFormData({
                                ...formData,
                                teamMembers: { members: newMembers },
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="GitHub URL"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newMembers = formData.teamMembers?.members?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              teamMembers: { members: newMembers },
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          teamMembers: {
                            members: [...(formData.teamMembers?.members || []), { 
                              name: "", 
                              role: "", 
                              description: "",
                              imageUrl: "",
                              socialLinks: {}
                            }],
                          },
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      + 팀원 추가
                    </button>
                  </div>
                </div>

                {/* 팀 문화 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">팀 문화</h3>
                  <p className="text-sm text-gray-600 mb-4">팀 소개 페이지의 "팀 문화" 섹션에 표시됩니다.</p>
                  <div className="space-y-4">
                    {(formData.teamCulture?.culture || []).map((culture, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-theme-primary transition-colors space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">아이콘</label>
                          <IconPicker
                            value={culture.icon}
                            onChange={(iconName) => {
                              const newCulture = [...(formData.teamCulture?.culture || [])];
                              newCulture[index] = { ...culture, icon: iconName };
                              setFormData({
                                ...formData,
                                teamCulture: { culture: newCulture },
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">제목 *</label>
                          <input
                            type="text"
                            value={culture.title || ""}
                            onChange={(e) => {
                              const newCulture = [...(formData.teamCulture?.culture || [])];
                              newCulture[index] = { ...culture, title: e.target.value };
                              setFormData({
                                ...formData,
                                teamCulture: { culture: newCulture },
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="제목"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">설명 *</label>
                          <textarea
                            value={culture.description || ""}
                            onChange={(e) => {
                              const newCulture = [...(formData.teamCulture?.culture || [])];
                              newCulture[index] = { ...culture, description: e.target.value };
                              setFormData({
                                ...formData,
                                teamCulture: { culture: newCulture },
                              });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="설명"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newCulture = formData.teamCulture?.culture?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              teamCulture: { culture: newCulture },
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          teamCulture: {
                            culture: [...(formData.teamCulture?.culture || []), { icon: "", title: "", description: "" }],
                          },
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      + 문화 추가
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 서비스 소개 탭 */}
            {activeTab === "service" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">서비스 소개 페이지 관리</h2>
                  <Link
                    href="/about/service"
                    target="_blank"
                    className="text-sm text-theme-primary hover:underline"
                  >
                    페이지 보기 →
                  </Link>
                </div>

                {/* 서비스 소개 텍스트 */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    서비스 소개 내용 (마크다운 지원)
                  </label>
                  <MarkdownEditor
                    value={formData.serviceInfo || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, serviceInfo: value })
                    }
                    placeholder="서비스 소개 내용을 마크다운 형식으로 입력하세요..."
                    rows={10}
                    showPreview={true}
                  />
                  <p className="mt-2 text-xs text-gray-500">이 내용은 /about/service 페이지의 "서비스 소개" 섹션에 표시됩니다.</p>
                </div>

                {/* 서비스 기능 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 기능</h3>
                  <p className="text-sm text-gray-600 mb-4">서비스 소개 페이지의 "주요 기능" 섹션에 표시됩니다.</p>
                  <div className="space-y-4">
                    {(formData.serviceFeatures?.features || []).map((feature, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-theme-primary transition-colors space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">아이콘</label>
                          <IconPicker
                            value={feature.icon}
                            onChange={(iconName) => {
                              const newFeatures = [...(formData.serviceFeatures?.features || [])];
                              newFeatures[index] = { ...feature, icon: iconName };
                              setFormData({
                                ...formData,
                                serviceFeatures: { features: newFeatures },
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">제목 *</label>
                          <input
                            type="text"
                            value={feature.title || ""}
                            onChange={(e) => {
                              const newFeatures = [...(formData.serviceFeatures?.features || [])];
                              newFeatures[index] = { ...feature, title: e.target.value };
                              setFormData({
                                ...formData,
                                serviceFeatures: { features: newFeatures },
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="제목"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">설명 *</label>
                          <textarea
                            value={feature.description || ""}
                            onChange={(e) => {
                              const newFeatures = [...(formData.serviceFeatures?.features || [])];
                              newFeatures[index] = { ...feature, description: e.target.value };
                              setFormData({
                                ...formData,
                                serviceFeatures: { features: newFeatures },
                              });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="설명"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = formData.serviceFeatures?.features?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              serviceFeatures: { features: newFeatures },
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          serviceFeatures: {
                            features: [...(formData.serviceFeatures?.features || []), { icon: "", title: "", description: "" }],
                          },
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      + 기능 추가
                    </button>
                  </div>
                </div>

                {/* 서비스 혜택 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 혜택</h3>
                  <p className="text-sm text-gray-600 mb-4">서비스 소개 페이지의 "서비스 혜택" 섹션에 표시됩니다.</p>
                  <div className="space-y-4">
                    {(formData.serviceBenefits?.benefits || []).map((benefit, index) => (
                      <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          value={benefit.text || ""}
                          onChange={(e) => {
                            const newBenefits = [...(formData.serviceBenefits?.benefits || [])];
                            newBenefits[index] = { text: e.target.value };
                            setFormData({
                              ...formData,
                              serviceBenefits: { benefits: newBenefits },
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          placeholder="혜택 내용"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBenefits = formData.serviceBenefits?.benefits?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              serviceBenefits: { benefits: newBenefits },
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          serviceBenefits: {
                            benefits: [...(formData.serviceBenefits?.benefits || []), { text: "" }],
                          },
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      + 혜택 추가
                    </button>
                  </div>
                </div>

                {/* 서비스 프로세스 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 프로세스</h3>
                  <p className="text-sm text-gray-600 mb-4">서비스 소개 페이지의 "사용 방법" 섹션에 표시됩니다.</p>
                  <div className="space-y-4">
                    {(formData.serviceProcess?.steps || []).map((step, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex gap-4 items-center">
                          <span className="text-sm font-medium text-gray-700 w-12">단계 {step.step || index + 1}</span>
                          <input
                            type="text"
                            value={step.title || ""}
                            onChange={(e) => {
                              const newSteps = [...(formData.serviceProcess?.steps || [])];
                              newSteps[index] = { ...step, title: e.target.value };
                              setFormData({
                                ...formData,
                                serviceProcess: { steps: newSteps },
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="제목"
                          />
                        </div>
                        <textarea
                          value={step.description || ""}
                          onChange={(e) => {
                            const newSteps = [...(formData.serviceProcess?.steps || [])];
                            newSteps[index] = { ...step, description: e.target.value };
                            setFormData({
                              ...formData,
                              serviceProcess: { steps: newSteps },
                            });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          placeholder="설명"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSteps = formData.serviceProcess?.steps?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              serviceProcess: { steps: newSteps },
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const currentSteps = formData.serviceProcess?.steps || [];
                        setFormData({
                          ...formData,
                          serviceProcess: {
                            steps: [...currentSteps, { step: currentSteps.length + 1, title: "", description: "" }],
                          },
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      + 단계 추가
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 연락처 탭 */}
            {activeTab === "contact" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">연락처 페이지 관리</h2>
                  <Link
                    href="/about/contact"
                    target="_blank"
                    className="text-sm text-theme-primary hover:underline"
                  >
                    페이지 보기 →
                  </Link>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h3>
                  <p className="text-sm text-gray-600 mb-4">연락처 페이지에 표시되는 기본 연락처 정보입니다.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={formData.contactInfo?.email || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              email: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        전화번호
                      </label>
                      <input
                        type="tel"
                        value={formData.contactInfo?.phone || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="02-1234-5678"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        주소
                      </label>
                      <input
                        type="text"
                        value={formData.contactInfo?.address || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              address: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="서울시 강남구..."
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">소셜 미디어</h3>
                  <p className="text-sm text-gray-600 mb-4">연락처 페이지에 표시되는 소셜 미디어 링크입니다.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">웹사이트</label>
                      <input
                        type="url"
                        value={formData.contactInfo?.socialMedia?.website || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              socialMedia: {
                                ...formData.contactInfo?.socialMedia,
                                website: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Facebook</label>
                      <input
                        type="url"
                        value={formData.contactInfo?.socialMedia?.facebook || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              socialMedia: {
                                ...formData.contactInfo?.socialMedia,
                                facebook: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Twitter</label>
                      <input
                        type="url"
                        value={formData.contactInfo?.socialMedia?.twitter || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              socialMedia: {
                                ...formData.contactInfo?.socialMedia,
                                twitter: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Instagram</label>
                      <input
                        type="url"
                        value={formData.contactInfo?.socialMedia?.instagram || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              socialMedia: {
                                ...formData.contactInfo?.socialMedia,
                                instagram: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">LinkedIn</label>
                      <input
                        type="url"
                        value={formData.contactInfo?.socialMedia?.linkedin || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactInfo: {
                              ...formData.contactInfo,
                              socialMedia: {
                                ...formData.contactInfo?.socialMedia,
                                linkedin: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 언어별 콘텐츠 탭 */}
            {activeTab === "content" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">언어별 콘텐츠 편집</h2>
                  <p className="text-gray-600">
                    메인 페이지와 About 페이지의 언어별 콘텐츠를 편집할 수 있습니다.
                  </p>
                </div>

                {/* 언어 선택 */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-semibold text-text-primary mb-2">편집할 언어 선택</label>
                  <div className="flex gap-2">
                    {(["ko", "en", "ja"] as const).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setContentLocale(loc)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          contentLocale === loc
                            ? "bg-theme-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {loc === "ko" ? "한국어" : loc === "en" ? "English" : "日本語"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 메인 페이지 콘텐츠 */}
                <div className="space-y-6 border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-bold text-gray-900">메인 페이지 (Home)</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Hero 제목</label>
                    <input
                      type="text"
                      value={formData.homeContent?.[contentLocale]?.hero?.title || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          homeContent: {
                            ...formData.homeContent,
                            [contentLocale]: {
                              ...formData.homeContent?.[contentLocale],
                              hero: {
                                ...formData.homeContent?.[contentLocale]?.hero,
                                title: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="온라인 시험 플랫폼"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Hero 부제목</label>
                    <input
                      type="text"
                      value={formData.homeContent?.[contentLocale]?.hero?.subtitle || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          homeContent: {
                            ...formData.homeContent,
                            [contentLocale]: {
                              ...formData.homeContent?.[contentLocale],
                              hero: {
                                ...formData.homeContent?.[contentLocale]?.hero,
                                subtitle: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="언제 어디서나 편리하게 시험을 응시하고 학습하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">기능 섹션 제목</label>
                    <input
                      type="text"
                      value={formData.homeContent?.[contentLocale]?.featuresSectionTitle || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          homeContent: {
                            ...formData.homeContent,
                            [contentLocale]: {
                              ...formData.homeContent?.[contentLocale],
                              featuresSectionTitle: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="주요 기능"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">기능 섹션 부제목</label>
                    <input
                      type="text"
                      value={formData.homeContent?.[contentLocale]?.featuresSectionSubtitle || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          homeContent: {
                            ...formData.homeContent,
                            [contentLocale]: {
                              ...formData.homeContent?.[contentLocale],
                              featuresSectionSubtitle: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="체계적이고 효율적인 학습 환경을 제공합니다"
                    />
                  </div>
                </div>

                {/* About 페이지 콘텐츠 */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">About 페이지</h3>
                  
                  {/* Team */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">팀 소개 (Team)</h4>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Hero 제목</label>
                      <input
                        type="text"
                        value={formData.aboutContent?.[contentLocale]?.team?.hero?.title || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aboutContent: {
                              ...formData.aboutContent,
                              [contentLocale]: {
                                ...formData.aboutContent?.[contentLocale],
                                team: {
                                  ...formData.aboutContent?.[contentLocale]?.team,
                                  hero: {
                                    ...formData.aboutContent?.[contentLocale]?.team?.hero,
                                    title: e.target.value,
                                  },
                                },
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="우리 팀을 소개합니다"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Hero 부제목</label>
                      <input
                        type="text"
                        value={formData.aboutContent?.[contentLocale]?.team?.hero?.subtitle || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aboutContent: {
                              ...formData.aboutContent,
                              [contentLocale]: {
                                ...formData.aboutContent?.[contentLocale],
                                team: {
                                  ...formData.aboutContent?.[contentLocale]?.team,
                                  hero: {
                                    ...formData.aboutContent?.[contentLocale]?.team?.hero,
                                    subtitle: e.target.value,
                                  },
                                },
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="열정과 전문성을 갖춘 팀으로 최고의 서비스를 제공합니다"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">회사 소개 (Company)</h4>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Hero 부제목</label>
                      <input
                        type="text"
                        value={formData.aboutContent?.[contentLocale]?.company?.hero?.subtitle || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aboutContent: {
                              ...formData.aboutContent,
                              [contentLocale]: {
                                ...formData.aboutContent?.[contentLocale],
                                company: {
                                  ...formData.aboutContent?.[contentLocale]?.company,
                                  hero: {
                                    ...formData.aboutContent?.[contentLocale]?.company?.hero,
                                    subtitle: e.target.value,
                                  },
                                },
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="혁신적인 교육 플랫폼으로 학습의 미래를 만들어갑니다"
                      />
                    </div>
                  </div>

                  {/* Service */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">서비스 소개 (Service)</h4>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Hero 제목</label>
                      <input
                        type="text"
                        value={formData.aboutContent?.[contentLocale]?.service?.hero?.title || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aboutContent: {
                              ...formData.aboutContent,
                              [contentLocale]: {
                                ...formData.aboutContent?.[contentLocale],
                                service: {
                                  ...formData.aboutContent?.[contentLocale]?.service,
                                  hero: {
                                    ...formData.aboutContent?.[contentLocale]?.service?.hero,
                                    title: e.target.value,
                                  },
                                },
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="혁신적인 시험 플랫폼"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Hero 부제목</label>
                      <input
                        type="text"
                        value={formData.aboutContent?.[contentLocale]?.service?.hero?.subtitle || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aboutContent: {
                              ...formData.aboutContent,
                              [contentLocale]: {
                                ...formData.aboutContent?.[contentLocale],
                                service: {
                                  ...formData.aboutContent?.[contentLocale]?.service,
                                  hero: {
                                    ...formData.aboutContent?.[contentLocale]?.service?.hero,
                                    subtitle: e.target.value,
                                  },
                                },
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="AI 기반 개인 맞춤형 학습으로 목표를 달성하세요"
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-gray-800">연락처 (Contact)</h4>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Hero 제목</label>
                      <input
                        type="text"
                        value={formData.aboutContent?.[contentLocale]?.contact?.hero?.title || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aboutContent: {
                              ...formData.aboutContent,
                              [contentLocale]: {
                                ...formData.aboutContent?.[contentLocale],
                                contact: {
                                  ...formData.aboutContent?.[contentLocale]?.contact,
                                  hero: {
                                    ...formData.aboutContent?.[contentLocale]?.contact?.hero,
                                    title: e.target.value,
                                  },
                                },
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="언제든지 연락주세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">Hero 부제목</label>
                      <input
                        type="text"
                        value={formData.aboutContent?.[contentLocale]?.contact?.hero?.subtitle || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aboutContent: {
                              ...formData.aboutContent,
                              [contentLocale]: {
                                ...formData.aboutContent?.[contentLocale],
                                contact: {
                                  ...formData.aboutContent?.[contentLocale]?.contact,
                                  hero: {
                                    ...formData.aboutContent?.[contentLocale]?.contact?.hero,
                                    subtitle: e.target.value,
                                  },
                                },
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="궁금한 점이나 문의사항이 있으시면 언제든지 연락해주세요"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 미리보기 탭 */}
            {activeTab === "preview" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">미리보기</h2>
                
                {/* 미리보기 타입 및 언어 선택 */}
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContentLocale("ko")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        contentLocale === "ko"
                          ? "bg-button-primary text-button-text"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      한국어
                    </button>
                    <button
                      onClick={() => setContentLocale("en")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        contentLocale === "en"
                          ? "bg-button-primary text-button-text"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setContentLocale("ja")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        contentLocale === "ja"
                          ? "bg-button-primary text-button-text"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      日本語
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center">
                      페이지 선택:
                    </span>
                    <select
                      value={previewType}
                      onChange={(e) => setPreviewType(e.target.value as "home" | "about")}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="home">홈 페이지</option>
                      <option value="about">About 페이지</option>
                    </select>
                  </div>
                </div>

                {/* 미리보기 컴포넌트 */}
                <SettingsPreview
                  formData={formData}
                  previewLocale={contentLocale}
                  previewType={previewType}
                />
              </div>
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

// 색상 테마 탭 컴포넌트
function ColorThemeTab({
  formData,
  setFormData,
  t,
}: {
  formData: UpdateSiteSettingsDto;
  setFormData: React.Dispatch<React.SetStateAction<UpdateSiteSettingsDto>>;
  t: (key: string) => string;
}) {
  const [colorTheme, setColorTheme] = useState<Partial<ColorTheme>>(
    (formData.colorTheme as Partial<ColorTheme>) || {}
  );

  // CRITICAL 색상들
  const criticalColors = {
    primary: colorTheme.primary || formData.primaryColor || "#667eea",
    background: colorTheme.background || "#fafafa",
    textPrimary: colorTheme.textPrimary || "#171717",
  };

  // 색상 변경 핸들러
  const handleColorChange = (key: keyof ColorTheme, value: string) => {
    const newTheme = { ...colorTheme, [key]: value };
    setColorTheme(newTheme);
    
    // CRITICAL 색상 변경 시 자동 생성
    if (key === "primary" || key === "background" || key === "textPrimary") {
      const newCritical = {
        primary: newTheme.primary || criticalColors.primary,
        background: newTheme.background || criticalColors.background,
        textPrimary: newTheme.textPrimary || criticalColors.textPrimary,
      };
      
      // 자동 색상 생성
      const autoGenerated = ColorHarmonyService.generateThemeFromCritical(newCritical);
      const mergedTheme = { ...autoGenerated, ...newTheme };
      setColorTheme(mergedTheme);
      setFormData({ ...formData, colorTheme: mergedTheme });
    } else {
      setFormData({ ...formData, colorTheme: newTheme });
    }
  };

  // 조화 색상 제안 가져오기
  const getHarmonySuggestions = (baseColor: string) => {
    return [
      ...ColorHarmonyService.generateHarmoniousColors(baseColor, "analogous"),
      ...ColorHarmonyService.generateHarmoniousColors(baseColor, "complementary"),
    ].slice(0, 4);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">색상 테마 관리</h2>
        <p className="text-gray-600">
          중요도가 높은 색상부터 설정하면 나머지 색상이 자동으로 생성됩니다.
        </p>
      </div>

      {/* CRITICAL 색상 섹션 */}
      <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          ⚠️ 최우선 색상 (CRITICAL)
        </h3>
        <p className="text-sm text-red-700 mb-4">
          이 색상들을 먼저 설정하면 나머지 색상이 자동으로 생성됩니다.
        </p>
        <div className="space-y-4">
          <ColorPicker
            label="Primary (메인 브랜드 색상)"
            value={colorTheme.primary || criticalColors.primary}
            onChange={(value) => handleColorChange("primary", value)}
            importance={ColorImportance.CRITICAL}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Background (메인 배경)"
            value={colorTheme.background || criticalColors.background}
            onChange={(value) => handleColorChange("background", value)}
            importance={ColorImportance.CRITICAL}
            criticalColors={criticalColors}
            validateAgainst={colorTheme.textPrimary || criticalColors.textPrimary}
          />
          <ColorPicker
            label="Text Primary (주요 텍스트)"
            value={colorTheme.textPrimary || criticalColors.textPrimary}
            onChange={(value) => handleColorChange("textPrimary", value)}
            importance={ColorImportance.CRITICAL}
            criticalColors={criticalColors}
            validateAgainst={colorTheme.background || criticalColors.background}
          />
        </div>
      </div>

      {/* HIGH 중요도 색상 */}
      <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="text-lg font-semibold text-orange-900 mb-4">
          높은 중요도 색상 (HIGH)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPicker
            label="Secondary"
            value={colorTheme.secondary || ""}
            onChange={(value) => handleColorChange("secondary", value)}
            importance={ColorImportance.HIGH}
            criticalColors={criticalColors}
            suggestions={getHarmonySuggestions(criticalColors.primary)}
          />
          <ColorPicker
            label="Surface"
            value={colorTheme.surface || ""}
            onChange={(value) => handleColorChange("surface", value)}
            importance={ColorImportance.HIGH}
            criticalColors={criticalColors}
            validateAgainst={colorTheme.textPrimary || criticalColors.textPrimary}
          />
          <ColorPicker
            label="Text Secondary"
            value={colorTheme.textSecondary || ""}
            onChange={(value) => handleColorChange("textSecondary", value)}
            importance={ColorImportance.HIGH}
            criticalColors={criticalColors}
            validateAgainst={colorTheme.background || criticalColors.background}
          />
          <ColorPicker
            label="Button Primary"
            value={colorTheme.buttonPrimary || ""}
            onChange={(value) => handleColorChange("buttonPrimary", value)}
            importance={ColorImportance.HIGH}
            criticalColors={criticalColors}
          />
        </div>
      </div>

      {/* MEDIUM 중요도 색상 */}
      <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">
          중간 중요도 색상 (MEDIUM)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPicker
            label="Accent"
            value={colorTheme.accent || ""}
            onChange={(value) => handleColorChange("accent", value)}
            importance={ColorImportance.MEDIUM}
            criticalColors={criticalColors}
            suggestions={ColorHarmonyService.generateHarmoniousColors(criticalColors.primary, "complementary")}
          />
          <ColorPicker
            label="Link"
            value={colorTheme.link || ""}
            onChange={(value) => handleColorChange("link", value)}
            importance={ColorImportance.MEDIUM}
            criticalColors={criticalColors}
            validateAgainst={colorTheme.background || criticalColors.background}
          />
          <ColorPicker
            label="Border"
            value={colorTheme.border || ""}
            onChange={(value) => handleColorChange("border", value)}
            importance={ColorImportance.MEDIUM}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Success"
            value={colorTheme.success || "#10b981"}
            onChange={(value) => handleColorChange("success", value)}
            importance={ColorImportance.MEDIUM}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Error"
            value={colorTheme.error || "#ef4444"}
            onChange={(value) => handleColorChange("error", value)}
            importance={ColorImportance.MEDIUM}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Warning"
            value={colorTheme.warning || "#f59e0b"}
            onChange={(value) => handleColorChange("warning", value)}
            importance={ColorImportance.MEDIUM}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Info"
            value={colorTheme.info || "#3b82f6"}
            onChange={(value) => handleColorChange("info", value)}
            importance={ColorImportance.MEDIUM}
            criticalColors={criticalColors}
          />
        </div>
      </div>

      {/* LOW 중요도 색상 */}
      <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          낮은 중요도 색상 (LOW)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPicker
            label="Surface Hover"
            value={colorTheme.surfaceHover || ""}
            onChange={(value) => handleColorChange("surfaceHover", value)}
            importance={ColorImportance.LOW}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Text Muted"
            value={colorTheme.textMuted || ""}
            onChange={(value) => handleColorChange("textMuted", value)}
            importance={ColorImportance.LOW}
            criticalColors={criticalColors}
            validateAgainst={colorTheme.background || criticalColors.background}
          />
          <ColorPicker
            label="Border Light"
            value={colorTheme.borderLight || ""}
            onChange={(value) => handleColorChange("borderLight", value)}
            importance={ColorImportance.LOW}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Border Dark"
            value={colorTheme.borderDark || ""}
            onChange={(value) => handleColorChange("borderDark", value)}
            importance={ColorImportance.LOW}
            criticalColors={criticalColors}
          />
          <ColorPicker
            label="Link Hover"
            value={colorTheme.linkHover || ""}
            onChange={(value) => handleColorChange("linkHover", value)}
            importance={ColorImportance.LOW}
            criticalColors={criticalColors}
          />
        </div>
      </div>

      {/* 실시간 미리보기 */}
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 미리보기</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-lg border-2"
            style={{
              backgroundColor: colorTheme.surface || criticalColors.background,
              borderColor: colorTheme.border || "#e5e7eb",
            }}
          >
            <h4
              className="text-lg font-bold mb-2"
              style={{ color: colorTheme.textPrimary || criticalColors.textPrimary }}
            >
              제목 텍스트
            </h4>
            <p
              className="text-sm mb-4"
              style={{ color: colorTheme.textSecondary || "#6b7280" }}
            >
              보조 텍스트 색상입니다.
            </p>
            <button
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colorTheme.buttonPrimary || criticalColors.primary }}
            >
              주요 버튼
            </button>
          </div>
          <div
            className="p-4 rounded-lg border-2"
            style={{
              backgroundColor: colorTheme.background || criticalColors.background,
              borderColor: colorTheme.border || "#e5e7eb",
            }}
          >
            <a
              href="#"
              className="text-sm font-medium underline"
              style={{ color: colorTheme.link || criticalColors.primary }}
            >
              링크 색상
            </a>
            <div className="mt-4 space-y-2">
              <div
                className="px-3 py-1 rounded text-xs"
                style={{ backgroundColor: colorTheme.success || "#10b981", color: "white" }}
              >
                Success
              </div>
              <div
                className="px-3 py-1 rounded text-xs"
                style={{ backgroundColor: colorTheme.error || "#ef4444", color: "white" }}
              >
                Error
              </div>
            </div>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: colorTheme.primary || criticalColors.primary }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: colorTheme.buttonText || "#ffffff" }}
            >
              Primary 배경 위 텍스트
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 버전 히스토리 탭 컴포넌트
function VersionHistoryTab() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [rollbackingVersionId, setRollbackingVersionId] = useState<string | null>(null);

  // 버전 목록 조회
  const { data: versionsResponse, isLoading } = useQuery({
    queryKey: ["site-settings-versions"],
    queryFn: async () => {
      const response = await adminAPI.getSiteSettingsVersions();
      return response.data;
    },
  });

  const versions = versionsResponse?.data || [];

  // 버전 생성 Mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: { label?: string; description?: string }) => {
      return await adminAPI.createSiteSettingsVersion(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings-versions"] });
      setShowCreateModal(false);
      setCreateLabel("");
      setCreateDescription("");
      toast.success("버전이 생성되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "버전 생성에 실패했습니다.");
    },
  });

  // 롤백 Mutation
  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      return await adminAPI.rollbackSiteSettingsVersion(versionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings-versions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setRollbackingVersionId(null);
      toast.success("버전으로 롤백되었습니다.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "롤백에 실패했습니다.");
      setRollbackingVersionId(null);
    },
  });

  const handleCreateVersion = () => {
    createVersionMutation.mutate({
      label: createLabel || undefined,
      description: createDescription || undefined,
    });
  };

  const handleRollback = (versionId: string, version: number) => {
    if (typeof window !== "undefined" && confirm(`버전 ${version}으로 롤백하시겠습니까? 현재 설정은 자동으로 백업됩니다.`)) {
      setRollbackingVersionId(versionId);
      rollbackMutation.mutate(versionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">버전 히스토리</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
        >
          + 새 버전 생성
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="버전 목록을 불러오는 중..." />
      ) : versions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">아직 생성된 버전이 없습니다.</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
          >
            첫 버전 생성하기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version: SiteSettingsVersion) => (
            <div
              key={version.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-gray-900">
                      v{version.version}
                    </span>
                    {version.label && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {version.label}
                      </span>
                    )}
                  </div>
                  {version.description && (
                    <p className="text-gray-600 mb-2">{version.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    <p>
                      생성일: {formatDate(version.createdAt)}
                      {version.creator && ` • ${version.creator.name || version.creator.email}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRollback(version.id, version.version)}
                    disabled={rollbackingVersionId === version.id || rollbackMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {rollbackingVersionId === version.id ? "롤백 중..." : "롤백"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 버전 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">새 버전 생성</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  라벨 (선택 사항)
                </label>
                <input
                  type="text"
                  value={createLabel}
                  onChange={(e) => setCreateLabel(e.target.value)}
                  placeholder="예: 2024년 1월 업데이트"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명 (선택 사항)
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="변경 사유를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateLabel("");
                  setCreateDescription("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <Button
                onClick={handleCreateVersion}
                disabled={createVersionMutation.isPending}
                isLoading={createVersionMutation.isPending}
                className="flex-1"
              >
                생성
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

