"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { adminAPI, SiteSettings, UpdateSiteSettingsDto, ColorAnalysisResult } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";

export default function SiteSettingsPage() {
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "admin" });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"basic" | "company" | "team" | "service" | "contact" | "preview">("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

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
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSiteSettingsDto) => {
      const response = await adminAPI.updateSiteSettings(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      alert("사이트 설정이 저장되었습니다.");
    },
    onError: (error: any) => {
      // ✅ 상세한 검증 에러 메시지 표시
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err: any) => {
            const constraints = Object.values(err.constraints || {}).join(', ');
            return `${err.property}: ${constraints}`;
          })
          .join('\n');
        alert(`저장 중 오류가 발생했습니다:\n\n${errorMessages}`);
      } else {
        alert(`저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
      }
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const analyzeColorsMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      const response = await adminAPI.analyzeColors(logoUrl);
      return response.data.data;
    },
    onSuccess: (result: ColorAnalysisResult) => {
      setFormData({
        ...formData,
        primaryColor: result.primaryColor,
        secondaryColor: result.secondaryColor,
        accentColor: result.accentColor,
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
    
    // 빈 문자열을 undefined로 변환 (DTO 검증 통과를 위해)
    let cleanedContactInfo: UpdateSiteSettingsDto['contactInfo'] = formData.contactInfo ? {
      email: formData.contactInfo.email?.trim() || undefined,
      phone: formData.contactInfo.phone?.trim() || undefined,
      address: formData.contactInfo.address?.trim() || undefined,
      socialMedia: formData.contactInfo.socialMedia ? {
        website: formData.contactInfo.socialMedia.website?.trim() || undefined,
        facebook: formData.contactInfo.socialMedia.facebook?.trim() || undefined,
        twitter: formData.contactInfo.socialMedia.twitter?.trim() || undefined,
        instagram: formData.contactInfo.socialMedia.instagram?.trim() || undefined,
        linkedin: formData.contactInfo.socialMedia.linkedin?.trim() || undefined,
      } : undefined,
    } : undefined;
    
    // socialMedia가 모든 필드가 undefined인 경우 undefined로 설정
    if (cleanedContactInfo?.socialMedia) {
      const hasAnySocialMedia = Object.values(cleanedContactInfo.socialMedia).some(v => v !== undefined);
      if (!hasAnySocialMedia) {
        cleanedContactInfo.socialMedia = undefined;
      }
    }
    
    // contactInfo가 모든 필드가 undefined인 경우 undefined로 설정
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
    
    const cleanedData: UpdateSiteSettingsDto = {
      ...formData,
      logoUrl: formData.logoUrl?.trim() || undefined,
      faviconUrl: formData.faviconUrl?.trim() || undefined,
      primaryColor: formData.primaryColor?.trim() || undefined,
      secondaryColor: formData.secondaryColor?.trim() || undefined,
      accentColor: formData.accentColor?.trim() || undefined,
      aboutCompany: formData.aboutCompany?.trim() || undefined,
      aboutTeam: formData.aboutTeam?.trim() || undefined,
      serviceInfo: formData.serviceInfo?.trim() || undefined,
      contactInfo: cleanedContactInfo,
    };
    
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
            <LoadingSpinner message="사이트 설정을 불러오는 중..." />
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
                사이트 설정
              </h1>
              <p className="text-xl text-theme-primary-light max-w-2xl mx-auto">
                회사 정보, 로고, 색상 테마 및 콘텐츠를 관리합니다
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 탭 네비게이션 */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("basic")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "basic"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  기본 정보
                </button>
                <button
                  onClick={() => setActiveTab("company")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "company"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  회사 소개
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "team"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  팀 소개
                </button>
                <button
                  onClick={() => setActiveTab("service")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "service"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  서비스 소개
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "contact"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  연락처
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "preview"
                      ? "border-theme-primary text-theme-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  미리보기
                </button>
              </nav>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 기본 정보 탭 */}
            {activeTab === "basic" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">기본 정보</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-theme-primary transition-colors text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          {uploadingLogo ? (
                            <span className="text-theme-primary">업로드 중...</span>
                          ) : (
                            <span className="text-gray-600">📁 파일 선택 (JPG, PNG, SVG, ICO 등)</span>
                          )}
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={handleAnalyzeColors}
                        disabled={!formData.logoUrl || isAnalyzing || uploadingLogo}
                        className="px-4 py-2 bg-theme-gradient-secondary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                      >
                        {isAnalyzing ? "분석 중..." : "🎨 색상 분석"}
                      </button>
                    </div>
                    
                    {/* URL 직접 입력 (또는) */}
                    <div className="text-center text-xs text-gray-500">또는</div>
                    
                    {/* URL 입력 필드 */}
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, logoUrl: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="https://example.com/logo.png (URL 직접 입력)"
                      disabled={uploadingLogo}
                    />
                    
                    {/* 미리보기 */}
                    {formData.logoUrl && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">미리보기:</div>
                        <img
                          src={formData.logoUrl}
                          alt="로고 미리보기"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <div className="text-center text-xs text-gray-500">또는</div>
                    
                    {/* URL 입력 필드 */}
                    <input
                      type="url"
                      value={formData.faviconUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, faviconUrl: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                      placeholder="https://example.com/favicon.ico (URL 직접 입력)"
                      disabled={uploadingFavicon}
                    />
                    
                    {/* 미리보기 */}
                    {formData.faviconUrl && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">미리보기:</div>
                        <img
                          src={formData.faviconUrl}
                          alt="파비콘 미리보기"
                          className="h-16 w-16 object-contain mx-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Primary 색상
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor || "#667eea"}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="#667eea"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Secondary 색상
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.secondaryColor || "#764ba2"}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryColor: e.target.value })
                        }
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryColor: e.target.value })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="#764ba2"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Accent 색상
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.accentColor || "#4facfe"}
                        onChange={(e) =>
                          setFormData({ ...formData, accentColor: e.target.value })
                        }
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) =>
                          setFormData({ ...formData, accentColor: e.target.value })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="#4facfe"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    회사 소개 내용 (마크다운 지원)
                  </label>
                  <textarea
                    value={formData.aboutCompany}
                    onChange={(e) =>
                      setFormData({ ...formData, aboutCompany: e.target.value })
                    }
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm"
                    placeholder="회사 소개 내용을 마크다운 형식으로 입력하세요..."
                  />
                  <p className="mt-2 text-xs text-gray-500">이 내용은 /about/company 페이지의 "회사 소개" 섹션에 표시됩니다.</p>
                </div>

                {/* 회사 통계 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">회사 통계</h3>
                  <p className="text-sm text-gray-600 mb-4">회사 소개 페이지 상단에 표시되는 통계 카드입니다.</p>
                  <div className="space-y-4">
                    {(formData.companyStats?.stats || []).map((stat, index) => (
                      <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <input
                            type="text"
                            value={stat.icon || ""}
                            onChange={(e) => {
                              const newStats = [...(formData.companyStats?.stats || [])];
                              newStats[index] = { ...stat, icon: e.target.value };
                              setFormData({
                                ...formData,
                                companyStats: { stats: newStats },
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="아이콘 이름 (예: BuildingIcon)"
                          />
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
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="숫자"
                          />
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
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="접미사 (예: +, %)"
                          />
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
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                            placeholder="라벨"
                          />
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
                      <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <input
                          type="text"
                          value={value.icon || ""}
                          onChange={(e) => {
                            const newValues = [...(formData.companyValues?.values || [])];
                            newValues[index] = { ...value, icon: e.target.value };
                            setFormData({
                              ...formData,
                              companyValues: { values: newValues },
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          placeholder="아이콘 이름"
                        />
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
                        />
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
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newValues = formData.companyValues?.values?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              companyValues: { values: newValues },
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    팀 소개 내용 (마크다운 지원)
                  </label>
                  <textarea
                    value={formData.aboutTeam}
                    onChange={(e) =>
                      setFormData({ ...formData, aboutTeam: e.target.value })
                    }
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm"
                    placeholder="팀 소개 내용을 마크다운 형식으로 입력하세요..."
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
                      <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <input
                          type="text"
                          value={culture.icon || ""}
                          onChange={(e) => {
                            const newCulture = [...(formData.teamCulture?.culture || [])];
                            newCulture[index] = { ...culture, icon: e.target.value };
                            setFormData({
                              ...formData,
                              teamCulture: { culture: newCulture },
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          placeholder="아이콘 이름"
                        />
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
                        />
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
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newCulture = formData.teamCulture?.culture?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              teamCulture: { culture: newCulture },
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    서비스 소개 내용 (마크다운 지원)
                  </label>
                  <textarea
                    value={formData.serviceInfo}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceInfo: e.target.value })
                    }
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary font-mono text-sm"
                    placeholder="서비스 소개 내용을 마크다운 형식으로 입력하세요..."
                  />
                  <p className="mt-2 text-xs text-gray-500">이 내용은 /about/service 페이지의 "서비스 소개" 섹션에 표시됩니다.</p>
                </div>

                {/* 서비스 기능 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 기능</h3>
                  <p className="text-sm text-gray-600 mb-4">서비스 소개 페이지의 "주요 기능" 섹션에 표시됩니다.</p>
                  <div className="space-y-4">
                    {(formData.serviceFeatures?.features || []).map((feature, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <input
                          type="text"
                          value={feature.icon || ""}
                          onChange={(e) => {
                            const newFeatures = [...(formData.serviceFeatures?.features || [])];
                            newFeatures[index] = { ...feature, icon: e.target.value };
                            setFormData({
                              ...formData,
                              serviceFeatures: { features: newFeatures },
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                          placeholder="아이콘 이름"
                        />
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
                        />
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
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = formData.serviceFeatures?.features?.filter((_, i) => i !== index) || [];
                            setFormData({
                              ...formData,
                              serviceFeatures: { features: newFeatures },
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="02-1234-5678"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">웹사이트</label>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook</label>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter</label>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram</label>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
                        placeholder="https://linkedin.com/..."
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
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-600 mb-4">
                    미리보기 기능은 Phase 4에서 구현 예정입니다.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">회사명: {formData.companyName || "(미설정)"}</p>
                    {formData.logoUrl && (
                      <div>
                        <p className="font-semibold mb-2">로고:</p>
                        <img src={formData.logoUrl} alt="로고" className="h-16" />
                      </div>
                    )}
                    <div className="flex gap-4 mt-4">
                      {formData.primaryColor && (
                        <div>
                          <p className="font-semibold mb-2">Primary:</p>
                          <div
                            className="w-20 h-20 rounded-lg border border-gray-300"
                            style={{ backgroundColor: formData.primaryColor }}
                          />
                        </div>
                      )}
                      {formData.secondaryColor && (
                        <div>
                          <p className="font-semibold mb-2">Secondary:</p>
                          <div
                            className="w-20 h-20 rounded-lg border border-gray-300"
                            style={{ backgroundColor: formData.secondaryColor }}
                          />
                        </div>
                      )}
                      {formData.accentColor && (
                        <div>
                          <p className="font-semibold mb-2">Accent:</p>
                          <div
                            className="w-20 h-20 rounded-lg border border-gray-300"
                            style={{ backgroundColor: formData.accentColor }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 저장 버튼 */}
            <div className="mt-8 flex justify-end gap-4">
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
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

