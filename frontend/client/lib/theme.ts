import { SiteSettings } from "./api";
import { ColorTheme } from "./color-harmony";

/**
 * 사이트 설정의 색상 테마를 CSS 변수로 적용
 */
export function applyTheme(settings: SiteSettings | null) {
  if (!settings || typeof document === "undefined") return;

  const root = document.documentElement;

  // colorTheme이 있으면 우선 사용 (고급 색상 테마)
  if (settings.colorTheme && typeof settings.colorTheme === 'object') {
    const theme = settings.colorTheme as ColorTheme;
    applyColorTheme(theme);
    return;
  }

  // 기존 방식 (하위 호환성)
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
 * 고급 색상 테마 적용
 */
function applyColorTheme(theme: ColorTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // 기본 브랜드 색상
  if (theme.primary) {
    root.style.setProperty("--color-primary", theme.primary);
    const rgb = hexToRgb(theme.primary);
    if (rgb) {
      root.style.setProperty("--color-primary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  if (theme.secondary) {
    root.style.setProperty("--color-secondary", theme.secondary);
    const rgb = hexToRgb(theme.secondary);
    if (rgb) {
      root.style.setProperty("--color-secondary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  if (theme.accent) {
    root.style.setProperty("--color-accent", theme.accent);
    const rgb = hexToRgb(theme.accent);
    if (rgb) {
      root.style.setProperty("--color-accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  // 상태 색상
  if (theme.success) {
    root.style.setProperty("--color-success", theme.success);
    const rgb = hexToRgb(theme.success);
    if (rgb) {
      root.style.setProperty("--color-success-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  if (theme.error) {
    root.style.setProperty("--color-error", theme.error);
    const rgb = hexToRgb(theme.error);
    if (rgb) {
      root.style.setProperty("--color-error-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  if (theme.warning) {
    root.style.setProperty("--color-warning", theme.warning);
    const rgb = hexToRgb(theme.warning);
    if (rgb) {
      root.style.setProperty("--color-warning-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  if (theme.info) {
    root.style.setProperty("--color-info", theme.info);
    const rgb = hexToRgb(theme.info);
    if (rgb) {
      root.style.setProperty("--color-info-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  // 배경 색상
  if (theme.background) {
    root.style.setProperty("--color-background", theme.background);
    root.style.setProperty("--background", theme.background);
  }

  if (theme.backgroundSecondary) {
    root.style.setProperty("--color-background-secondary", theme.backgroundSecondary);
  }

  if (theme.surface) {
    root.style.setProperty("--color-surface", theme.surface);
  }

  if (theme.surfaceHover) {
    root.style.setProperty("--color-surface-hover", theme.surfaceHover);
  }

  // 텍스트 색상
  if (theme.textPrimary) {
    root.style.setProperty("--color-text-primary", theme.textPrimary);
    root.style.setProperty("--foreground", theme.textPrimary);
  }

  if (theme.textSecondary) {
    root.style.setProperty("--color-text-secondary", theme.textSecondary);
  }

  if (theme.textMuted) {
    root.style.setProperty("--color-text-muted", theme.textMuted);
  }

  if (theme.textInverse) {
    root.style.setProperty("--color-text-inverse", theme.textInverse);
  }

  // 테두리 색상
  if (theme.border) {
    root.style.setProperty("--color-border", theme.border);
  }

  if (theme.borderLight) {
    root.style.setProperty("--color-border-light", theme.borderLight);
  }

  if (theme.borderDark) {
    root.style.setProperty("--color-border-dark", theme.borderDark);
  }

  // 링크 색상
  if (theme.link) {
    root.style.setProperty("--color-link", theme.link);
  }

  if (theme.linkHover) {
    root.style.setProperty("--color-link-hover", theme.linkHover);
  }

  // 버튼 색상
  if (theme.buttonPrimary) {
    root.style.setProperty("--color-button-primary", theme.buttonPrimary);
  }

  if (theme.buttonSecondary) {
    root.style.setProperty("--color-button-secondary", theme.buttonSecondary);
  }

  if (theme.buttonText) {
    root.style.setProperty("--color-button-text", theme.buttonText);
  }

  // 그라데이션 생성
  if (theme.primary && theme.secondary) {
    root.style.setProperty(
      "--gradient-primary",
      `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`
    );
  }

  if (theme.secondary && theme.accent) {
    root.style.setProperty(
      "--gradient-secondary",
      `linear-gradient(to right, ${theme.secondary}, ${theme.accent})`
    );
  }

  // 대각선 그라데이션 (히어로 섹션용)
  if (theme.primary && theme.secondary && theme.accent) {
    root.style.setProperty(
      "--gradient-diagonal",
      `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary}, ${theme.accent})`
    );
  } else if (theme.primary && theme.secondary) {
    root.style.setProperty(
      "--gradient-diagonal",
      `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`
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

