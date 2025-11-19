"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { statisticsAPI } from "@/lib/api";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import CustomRadarChart from "@/components/charts/RadarChart";
import CustomLineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function StatisticsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [period, setPeriod] = useState<string>("month");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["statistics", period],
    queryFn: async () => {
      const response = await statisticsAPI.getUserStatistics({ period });
      return response.data;
    },
    enabled: !!user,
  });

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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-gradient-light">
        {/* 헤더 섹션 */}
        <div className="relative bg-gradient-to-r from-warning via-warning to-error overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
                학습 통계
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                학습 진척도와 성적 추이를 한눈에 확인하세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-purple-300 focus:outline-none focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
            >
              <option value="week">최근 1주</option>
              <option value="month">최근 1개월</option>
              <option value="year">최근 1년</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">통계를 불러오는 중...</p>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-primary-light rounded-2xl shadow-lg p-8 border border-theme-primary hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-theme-gradient-primary rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-theme-primary">총 시험 수</div>
                  </div>
                  <div className="text-4xl font-extrabold text-theme-primary">
                    {stats.totalExams}
                  </div>
                </div>
                <div className="bg-theme-secondary-light rounded-2xl shadow-lg p-8 border border-theme-secondary hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-theme-gradient-secondary rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-theme-secondary">평균 점수</div>
                  </div>
                  <div className="text-4xl font-extrabold text-theme-secondary">
                    {stats.averageScore}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-success/10 to-success/20 rounded-2xl shadow-lg p-8 border border-success/20 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-success to-success rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-success">최고 점수</div>
                  </div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-success to-success bg-clip-text text-transparent">
                    {stats.bestScore}
                  </div>
                </div>
              </div>

              {stats.improvementTrend && stats.improvementTrend.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-8 bg-gradient-to-b from-warning to-warning rounded-full"></div>
                    개선 추이
                  </h2>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <CustomLineChart
                      data={stats.improvementTrend.map((item: any) => ({
                        date: item.date,
                        score: item.score,
                      }))}
                      dataKeys={[
                        { key: "score", name: "점수", color: "#6366f1" },
                      ]}
                      title="시험 점수 추이"
                    />
                  </div>
                </div>
              )}

              {stats.sectionPerformance &&
                stats.sectionPerformance.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-8 bg-gradient-to-b from-theme-primary to-theme-secondary rounded-full"></div>
                      섹션별 성능 균형도
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* 레이다 차트 */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <CustomRadarChart
                          data={stats.sectionPerformance.map((section: any) => ({
                            subject: section.sectionTitle,
                            score: section.averageScore,
                            fullMark: 100,
                          }))}
                          title="섹션별 실력 균형"
                        />
                      </div>
                      {/* 섹션별 상세 정보 */}
                      <div className="space-y-4">
                        {stats.sectionPerformance.map(
                          (section: any, index: number) => (
                            <div key={index} className="bg-gradient-to-r from-surface-hover to-theme-secondary/10 rounded-xl p-6 border border-border hover:shadow-md transition-all">
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {section.sectionTitle}
                                </h3>
                                <div className="text-right">
                                  <div className="text-xl font-bold bg-gradient-to-r from-theme-secondary to-theme-primary bg-clip-text text-transparent">
                                    {section.averageScore}점
                                  </div>
                                  {section.improvement !== 0 && (
                                    <div
                                      className={`text-sm font-semibold flex items-center gap-1 ${
                                        section.improvement > 0
                                          ? "text-success"
                                          : "text-error"
                                      }`}
                                    >
                                      {section.improvement > 0 ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                      )}
                                      {section.improvement > 0 ? "+" : ""}
                                      {section.improvement}점
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-full bg-theme-gradient-primary rounded-full transition-all duration-1000"
                                  style={{ width: `${Math.min((section.averageScore / 100) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-warning/20 to-warning/30 rounded-2xl mb-6 shadow-lg">
                <svg className="w-12 h-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                통계 데이터가 없습니다
              </p>
              <p className="text-gray-500">시험을 응시하면 통계가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}