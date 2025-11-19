/**
 * 차트 색상을 위한 CSS 변수 읽기 유틸리티
 * 테마 색상을 동적으로 읽어서 차트에 적용
 */

/**
 * CSS 변수에서 색상 값을 읽어옵니다
 */
export function getCSSVariable(variable: string, fallback: string = '#000000'): string {
  if (typeof window === 'undefined') return fallback;
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  
  return value || fallback;
}

/**
 * 테마 색상을 차트용으로 가져옵니다
 */
export const chartColors = {
  // 기본 브랜드 색상
  primary: () => getCSSVariable('--color-primary', '#667eea'),
  secondary: () => getCSSVariable('--color-secondary', '#764ba2'),
  accent: () => getCSSVariable('--color-accent', '#4facfe'),
  
  // 상태 색상
  success: () => getCSSVariable('--color-success', '#10b981'),
  error: () => getCSSVariable('--color-error', '#ef4444'),
  warning: () => getCSSVariable('--color-warning', '#f59e0b'),
  info: () => getCSSVariable('--color-info', '#3b82f6'),
  
  // 텍스트/배경 색상
  textMuted: () => getCSSVariable('--color-text-muted', '#9ca3af'),
  border: () => getCSSVariable('--color-border', '#e5e7eb'),
};

/**
 * 배지 희귀도별 색상 매핑
 */
export const badgeRarityColors = {
  common: () => chartColors.textMuted(),
  rare: () => chartColors.info(),
  epic: () => chartColors.secondary(),
  legendary: () => chartColors.warning(),
};

/**
 * 차트용 색상 팔레트 (여러 시리즈용)
 */
export function getChartColorPalette(count: number = 5): string[] {
  const colors = [
    chartColors.primary(),
    chartColors.info(),
    chartColors.success(),
    chartColors.warning(),
    chartColors.secondary(),
    chartColors.error(),
    chartColors.accent(),
  ];
  
  // 필요한 만큼 색상 반복
  const palette: string[] = [];
  for (let i = 0; i < count; i++) {
    palette.push(colors[i % colors.length]);
  }
  
  return palette;
}

