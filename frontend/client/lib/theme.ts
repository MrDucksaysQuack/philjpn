import { SiteSettings } from "./api";

/**
 * 사이트 설정의 색상 테마를 CSS 변수로 적용
 */
export function applyTheme(settings: SiteSettings | null) {
  if (!settings || typeof document === "undefined") return;

  const root = document.documentElement;

  // Primary 색상
  if (settings.primaryColor) {
    root.style.setProperty("--color-primary", settings.primaryColor);
    // RGB 값 추출 (투명도 조절용)
    const rgb = hexToRgb(settings.primaryColor);
    if (rgb) {
      root.style.setProperty("--color-primary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  // Secondary 색상
  if (settings.secondaryColor) {
    root.style.setProperty("--color-secondary", settings.secondaryColor);
    const rgb = hexToRgb(settings.secondaryColor);
    if (rgb) {
      root.style.setProperty("--color-secondary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  // Accent 색상
  if (settings.accentColor) {
    root.style.setProperty("--color-accent", settings.accentColor);
    const rgb = hexToRgb(settings.accentColor);
    if (rgb) {
      root.style.setProperty("--color-accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  // 그라데이션 생성
  if (settings.primaryColor && settings.secondaryColor) {
    root.style.setProperty(
      "--gradient-primary",
      `linear-gradient(to right, ${settings.primaryColor}, ${settings.secondaryColor})`
    );
  }

  if (settings.secondaryColor && settings.accentColor) {
    root.style.setProperty(
      "--gradient-secondary",
      `linear-gradient(to right, ${settings.secondaryColor}, ${settings.accentColor})`
    );
  }
}

/**
 * HEX 색상을 RGB로 변환
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 테마 초기화 (기본값으로 복원)
 */
export function resetTheme() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.removeProperty("--color-primary");
  root.style.removeProperty("--color-secondary");
  root.style.removeProperty("--color-accent");
  root.style.removeProperty("--color-primary-rgb");
  root.style.removeProperty("--color-secondary-rgb");
  root.style.removeProperty("--color-accent-rgb");
  root.style.removeProperty("--gradient-primary");
  root.style.removeProperty("--gradient-secondary");
}

