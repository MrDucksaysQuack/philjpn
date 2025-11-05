import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
// node-vibrant는 Node.js 환경에서 named import 사용
import { Vibrant } from 'node-vibrant/node';

export interface ColorAnalysisResult {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    gradients: {
      primary: string;
      secondary: string;
      accent: string;
    };
    textColors: {
      primary: string;
      secondary: string;
    };
    bgColors: {
      primary: string;
      secondary: string;
    };
  };
  confidence: number;
}

@Injectable()
export class ColorAnalysisService {
  private readonly logger = new Logger(ColorAnalysisService.name);

  constructor(private httpService: HttpService) {}

  /**
   * 이미지 URL에서 색상 분석
   */
  async analyzeImageColors(imageUrl: string): Promise<ColorAnalysisResult> {
    try {
      // 1. 이미지 다운로드
      const imageBuffer = await this.downloadImage(imageUrl);

      // 2. 색상 추출
      const palette = await Vibrant.from(imageBuffer).getPalette();

      // 3. 주요 색상 선택
      const primaryColor =
        palette.Vibrant?.hex || palette.Muted?.hex || '#667eea';
      const secondaryColor =
        palette.DarkVibrant?.hex ||
        palette.LightVibrant?.hex ||
        palette.Muted?.hex ||
        '#764ba2';
      const accentColor =
        palette.LightVibrant?.hex ||
        palette.DarkMuted?.hex ||
        palette.Vibrant?.hex ||
        '#4facfe';

      // 4. Tailwind CSS 클래스로 변환
      const colorScheme = this.generateColorScheme(
        primaryColor,
        secondaryColor,
        accentColor,
      );

      // 5. 신뢰도 계산
      const confidence = this.calculateConfidence(palette);

      return {
        primaryColor,
        secondaryColor,
        accentColor,
        colorScheme,
        confidence,
      };
    } catch (error: any) {
      this.logger.error('색상 분석 실패:', error.message);
      throw new BadRequestException(
        `색상 분석에 실패했습니다: ${error.message}`,
      );
    }
  }

  /**
   * 이미지 다운로드
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
          timeout: 10000, // 10초 타임아웃
          maxContentLength: 5 * 1024 * 1024, // 5MB 제한
        }),
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error('이미지 다운로드 실패:', error.message);
      throw new BadRequestException(
        `이미지를 다운로드할 수 없습니다: ${error.message}`,
      );
    }
  }

  /**
   * 색상 스키마 생성 (Tailwind CSS 클래스 매핑)
   */
  private generateColorScheme(
    primary: string,
    secondary: string,
    accent: string,
  ) {
    return {
      primary: this.hexToTailwind(primary),
      secondary: this.hexToTailwind(secondary),
      accent: this.hexToTailwind(accent),
      gradients: {
        primary: `from-${this.hexToTailwind(primary)} to-${this.hexToTailwind(secondary)}`,
        secondary: `from-${this.hexToTailwind(secondary)} to-${this.hexToTailwind(accent)}`,
        accent: `from-${this.hexToTailwind(accent)} to-${this.hexToTailwind(primary)}`,
      },
      textColors: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
      },
      bgColors: {
        primary: `${this.hexToTailwind(primary)}-50`,
        secondary: `${this.hexToTailwind(secondary)}-50`,
      },
    };
  }

  /**
   * HEX 코드를 Tailwind CSS 클래스로 변환
   * 간단한 매핑: 가장 가까운 Tailwind 색상 찾기
   */
  private hexToTailwind(hex: string): string {
    // HEX를 RGB로 변환
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Tailwind 색상 팔레트 (주요 색상만)
    const tailwindColors: Record<
      string,
      Array<{ r: number; g: number; b: number }>
    > = {
      blue: [
        { r: 59, g: 130, b: 246 }, // blue-500
        { r: 37, g: 99, b: 235 }, // blue-600
        { r: 29, g: 78, b: 216 }, // blue-700
      ],
      purple: [
        { r: 168, g: 85, b: 247 }, // purple-500
        { r: 147, g: 51, b: 234 }, // purple-600
        { r: 126, g: 34, b: 206 }, // purple-700
      ],
      indigo: [
        { r: 99, g: 102, b: 241 }, // indigo-500
        { r: 79, g: 70, b: 229 }, // indigo-600
        { r: 67, g: 56, b: 202 }, // indigo-700
      ],
      pink: [
        { r: 236, g: 72, b: 153 }, // pink-500
        { r: 219, g: 39, b: 119 }, // pink-600
        { r: 190, g: 24, b: 93 }, // pink-700
      ],
      red: [
        { r: 239, g: 68, b: 68 }, // red-500
        { r: 220, g: 38, b: 38 }, // red-600
        { r: 185, g: 28, b: 28 }, // red-700
      ],
      orange: [
        { r: 249, g: 115, b: 22 }, // orange-500
        { r: 234, g: 88, b: 12 }, // orange-600
        { r: 194, g: 65, b: 12 }, // orange-700
      ],
      green: [
        { r: 34, g: 197, b: 94 }, // green-500
        { r: 22, g: 163, b: 74 }, // green-600
        { r: 21, g: 128, b: 61 }, // green-700
      ],
      teal: [
        { r: 20, g: 184, b: 166 }, // teal-500
        { r: 15, g: 118, b: 110 }, // teal-600
        { r: 13, g: 148, b: 136 }, // teal-700
      ],
    };

    // 가장 가까운 색상 찾기
    let minDistance = Infinity;
    let closestColor = 'blue-600'; // 기본값

    for (const [colorName, shades] of Object.entries(tailwindColors)) {
      for (const shade of shades) {
        const distance = Math.sqrt(
          Math.pow(r - shade.r, 2) +
            Math.pow(g - shade.g, 2) +
            Math.pow(b - shade.b, 2),
        );

        if (distance < minDistance) {
          minDistance = distance;
          const shadeIndex = shades.indexOf(shade);
          const shadeNumber = shadeIndex === 0 ? '500' : shadeIndex === 1 ? '600' : '700';
          closestColor = `${colorName}-${shadeNumber}`;
        }
      }
    }

    return closestColor;
  }

  /**
   * 색상 분석 신뢰도 계산
   */
  private calculateConfidence(palette: any): number {
    let confidence = 0.5; // 기본값

    // 다양한 색상이 추출되었는지 확인
    const colorCount = Object.values(palette).filter(
      (color) => color !== null,
    ).length;

    if (colorCount >= 3) {
      confidence += 0.2;
    }
    if (colorCount >= 5) {
      confidence += 0.2;
    }

    // Vibrant 색상이 있으면 신뢰도 증가
    if (palette.Vibrant) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }
}

