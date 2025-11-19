/**
 * 색상 조화 감지 및 자동 조정 서비스
 * WCAG 접근성 가이드라인 및 색상 조화 이론 적용
 */

// 색상 중요도 레벨
export enum ColorImportance {
  CRITICAL = 'critical',    // 최우선 (primary, background, textPrimary)
  HIGH = 'high',            // 높음 (secondary, surface, textSecondary)
  MEDIUM = 'medium',        // 중간 (accent, border, link)
  LOW = 'low',              // 낮음 (hover, muted, light variants)
}

// 색상 테마 인터페이스
export interface ColorTheme {
  // 기본 브랜드 색상
  primary: string;        // 메인 브랜드 색상 [CRITICAL]
  secondary: string;      // 보조 브랜드 색상 [HIGH]
  accent: string;         // 강조 색상 [MEDIUM]
  
  // 상태 색상
  success: string;        // 성공 (초록) [MEDIUM]
  error: string;          // 에러 (빨강) [MEDIUM]
  warning: string;        // 경고 (노랑) [MEDIUM]
  info: string;          // 정보 (파랑) [MEDIUM]
  
  // 배경 색상
  background: string;     // 메인 배경 [CRITICAL]
  backgroundSecondary: string; // 보조 배경 [HIGH]
  surface: string;        // 카드/표면 배경 [HIGH]
  surfaceHover: string;  // 호버 배경 [LOW]
  
  // 텍스트 색상
  textPrimary: string;    // 주요 텍스트 [CRITICAL]
  textSecondary: string;  // 보조 텍스트 [HIGH]
  textMuted: string;     // 비활성 텍스트 [LOW]
  textInverse: string;   // 역전 텍스트 (다크 배경용) [MEDIUM]
  
  // 테두리 색상
  border: string;         // 기본 테두리 [MEDIUM]
  borderLight: string;    // 연한 테두리 [LOW]
  borderDark: string;     // 진한 테두리 [LOW]
  
  // 링크 색상
  link: string;           // 기본 링크 [MEDIUM]
  linkHover: string;      // 링크 호버 [LOW]
  
  // 버튼 색상
  buttonPrimary: string;  // 주요 버튼 [HIGH]
  buttonSecondary: string; // 보조 버튼 [MEDIUM]
  buttonText: string;     // 버튼 텍스트 [HIGH]
}

// 색상 중요도 매핑
export const COLOR_IMPORTANCE_MAP: Record<keyof ColorTheme, ColorImportance> = {
  primary: ColorImportance.CRITICAL,
  background: ColorImportance.CRITICAL,
  textPrimary: ColorImportance.CRITICAL,
  secondary: ColorImportance.HIGH,
  backgroundSecondary: ColorImportance.HIGH,
  surface: ColorImportance.HIGH,
  textSecondary: ColorImportance.HIGH,
  buttonPrimary: ColorImportance.HIGH,
  buttonText: ColorImportance.HIGH,
  accent: ColorImportance.MEDIUM,
  success: ColorImportance.MEDIUM,
  error: ColorImportance.MEDIUM,
  warning: ColorImportance.MEDIUM,
  info: ColorImportance.MEDIUM,
  textInverse: ColorImportance.MEDIUM,
  border: ColorImportance.MEDIUM,
  link: ColorImportance.MEDIUM,
  buttonSecondary: ColorImportance.MEDIUM,
  surfaceHover: ColorImportance.LOW,
  textMuted: ColorImportance.LOW,
  borderLight: ColorImportance.LOW,
  borderDark: ColorImportance.LOW,
  linkHover: ColorImportance.LOW,
};

// 색상 검증 결과
export interface ColorValidationResult {
  isValid: boolean;
  contrastRatio: number;
  level: 'AA' | 'AAA' | 'FAIL';
  warnings: string[];
  suggestions?: string[]; // 자동 수정 제안 색상
}

// HSL 색상 표현
interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

// RGB 색상 표현
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 색상 조화 감지 및 자동 조정 서비스
 */
export class ColorHarmonyService {
  /**
   * WCAG 대비율 계산
   * @param color1 첫 번째 색상 (HEX)
   * @param color2 두 번째 색상 (HEX)
   * @returns 대비율 (1.0 ~ 21.0)
   */
  static calculateContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * 상대 휘도 계산 (WCAG 기준)
   */
  static getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * HEX를 RGB로 변환
   */
  static hexToRgb(hex: string): RGB | null {
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
   * RGB를 HEX로 변환
   */
  static rgbToHex(rgb: RGB): string {
    return `#${[rgb.r, rgb.g, rgb.b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')}`;
  }

  /**
   * HEX를 HSL로 변환
   */
  static hexToHsl(hex: string): HSL | null {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * HSL을 HEX로 변환
   */
  static hslToHex(hsl: HSL): string {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return this.rgbToHex({
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    });
  }

  /**
   * 색상 조화 색상 생성 (색상환 기반)
   * @param baseColor 기준 색상
   * @param harmonyType 조화 유형 (complementary, analogous, triadic)
   */
  static generateHarmoniousColors(
    baseColor: string,
    harmonyType: 'complementary' | 'analogous' | 'triadic'
  ): string[] {
    const hsl = this.hexToHsl(baseColor);
    if (!hsl) return [];

    const colors: string[] = [];

    switch (harmonyType) {
      case 'complementary':
        // 보색 (180도 차이)
        colors.push(this.hslToHex({ ...hsl, h: (hsl.h + 180) % 360 }));
        break;
      case 'analogous':
        // 유사색 (±30도)
        colors.push(this.hslToHex({ ...hsl, h: (hsl.h + 30) % 360 }));
        colors.push(this.hslToHex({ ...hsl, h: (hsl.h - 30 + 360) % 360 }));
        break;
      case 'triadic':
        // 삼원색 (120도 간격)
        colors.push(this.hslToHex({ ...hsl, h: (hsl.h + 120) % 360 }));
        colors.push(this.hslToHex({ ...hsl, h: (hsl.h + 240) % 360 }));
        break;
    }

    return colors;
  }

  /**
   * 중요도 기반 자동 색상 생성
   * @param criticalColors CRITICAL 색상들
   * @returns 전체 색상 테마
   */
  static generateThemeFromCritical(
    criticalColors: {
      primary: string;
      background: string;
      textPrimary: string;
    }
  ): ColorTheme {
    const theme: Partial<ColorTheme> = {
      primary: criticalColors.primary,
      background: criticalColors.background,
      textPrimary: criticalColors.textPrimary,
    };

    // Secondary 색상: Primary의 조화 색상
    const secondaryOptions = this.generateHarmoniousColors(
      criticalColors.primary,
      'analogous'
    );
    theme.secondary = this.selectBestContrast(
      secondaryOptions,
      criticalColors.background
    ) || secondaryOptions[0] || '#764ba2';

    // Accent 색상: Primary의 보색
    const accentOptions = this.generateHarmoniousColors(
      criticalColors.primary,
      'complementary'
    );
    theme.accent = accentOptions[0] || '#4facfe';

    // 배경 색상들: Background 기반
    theme.backgroundSecondary = this.adjustBrightness(
      criticalColors.background,
      0.95
    );
    theme.surface = this.adjustBrightness(criticalColors.background, 1.05);
    theme.surfaceHover = this.adjustBrightness(criticalColors.background, 0.9);

    // 텍스트 색상들: TextPrimary 기반
    theme.textSecondary = this.adjustBrightness(
      criticalColors.textPrimary,
      0.7
    );
    theme.textMuted = this.adjustBrightness(criticalColors.textPrimary, 0.5);
    theme.textInverse = this.getContrastColor(criticalColors.background);

    // 테두리 색상: Background와 TextPrimary 사이
    theme.border = this.mixColors(
      criticalColors.background,
      criticalColors.textPrimary,
      0.2
    );
    theme.borderLight = this.adjustBrightness(theme.border, 1.2);
    theme.borderDark = this.adjustBrightness(theme.border, 0.8);

    // 링크 색상: Primary 기반
    theme.link = criticalColors.primary;
    theme.linkHover = this.adjustBrightness(criticalColors.primary, 0.8);

    // 버튼 색상
    theme.buttonPrimary = criticalColors.primary;
    theme.buttonSecondary = theme.secondary;
    theme.buttonText = this.getContrastColor(criticalColors.primary);

    // 상태 색상: 표준 색상 (접근성 고려)
    theme.success = '#10b981';
    theme.error = '#ef4444';
    theme.warning = '#f59e0b';
    theme.info = '#3b82f6';

    return theme as ColorTheme;
  }

  /**
   * 배경에 대한 최적 대비 색상 선택
   */
  static selectBestContrast(
    colorOptions: string[],
    background: string
  ): string | null {
    if (colorOptions.length === 0) return null;

    let bestColor = colorOptions[0];
    let bestContrast = 0;

    for (const color of colorOptions) {
      const contrast = this.calculateContrastRatio(color, background);
      if (contrast > bestContrast) {
        bestContrast = contrast;
        bestColor = color;
      }
    }

    return bestColor;
  }

  /**
   * 색상 밝기 조정
   */
  static adjustBrightness(hex: string, factor: number): string {
    const hsl = this.hexToHsl(hex);
    if (!hsl) return hex;

    hsl.l = Math.min(100, Math.max(0, hsl.l * factor));
    return this.hslToHex(hsl);
  }

  /**
   * 대비 색상 생성 (밝은 배경 → 어두운 텍스트, 어두운 배경 → 밝은 텍스트)
   */
  static getContrastColor(background: string): string {
    const luminance = this.getLuminance(background);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * 두 색상 혼합
   */
  static mixColors(color1: string, color2: string, ratio: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1;

    return this.rgbToHex({
      r: Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio),
      g: Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio),
      b: Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio),
    });
  }

  /**
   * 색상 검증 및 경고
   */
  static validateColorCombination(
    foreground: string,
    background: string
  ): ColorValidationResult {
    const contrast = this.calculateContrastRatio(foreground, background);
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let level: 'AA' | 'AAA' | 'FAIL' = 'FAIL';

    if (contrast >= 7) {
      level = 'AAA';
    } else if (contrast >= 4.5) {
      level = 'AA';
    } else {
      warnings.push(
        `대비율이 너무 낮습니다 (${contrast.toFixed(2)}:1). 최소 4.5:1이 필요합니다.`
      );
      
      // 자동 수정 제안
      const suggestedColor = this.getContrastColor(background);
      const suggestedContrast = this.calculateContrastRatio(suggestedColor, background);
      suggestions.push(suggestedColor);
      
      if (suggestedContrast >= 7) {
        warnings.push(
          `제안: ${suggestedColor} (대비율 ${suggestedContrast.toFixed(2)}:1, AAA 등급)`
        );
      } else if (suggestedContrast >= 4.5) {
        warnings.push(
          `제안: ${suggestedColor} (대비율 ${suggestedContrast.toFixed(2)}:1, AA 등급)`
        );
      }
    }

    return {
      isValid: contrast >= 4.5,
      contrastRatio: contrast,
      level,
      warnings,
      suggestions,
    };
  }

  /**
   * 중요도 기반 색상 제한 (접근성 기준을 만족하는 색상만 반환)
   */
  static getValidColorRange(
    baseColor: string,
    importance: ColorImportance,
    criticalColors: {
      primary?: string;
      background?: string;
      textPrimary?: string;
    }
  ): string[] {
    // CRITICAL 색상은 제한 없음
    if (importance === ColorImportance.CRITICAL) {
      return [baseColor];
    }

    const validColors: string[] = [];
    
    // Background와의 대비 확인
    if (criticalColors.background) {
      const contrast = this.calculateContrastRatio(baseColor, criticalColors.background);
      if (contrast >= 4.5) {
        validColors.push(baseColor);
      }
    }

    // TextPrimary와의 대비 확인 (배경 색상인 경우)
    if (criticalColors.textPrimary && importance === ColorImportance.HIGH) {
      const contrast = this.calculateContrastRatio(criticalColors.textPrimary, baseColor);
      if (contrast >= 4.5) {
        validColors.push(baseColor);
      }
    }

    return validColors.length > 0 ? validColors : [baseColor];
  }
}

