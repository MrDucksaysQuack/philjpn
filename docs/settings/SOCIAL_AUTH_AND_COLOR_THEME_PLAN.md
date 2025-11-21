# 소셜 로그인 및 색상 테마 관리 개선 계획

## 📋 개요

두 가지 주요 기능을 추가합니다:
1. **소셜 로그인**: Google, Facebook 계정으로 회원가입/로그인
2. **고급 색상 테마 관리**: 프론트엔드 색상을 특성별로 분류하여 관리자가 설정 페이지에서 변경 가능

---

## 🎨 Part 1: 색상 테마 관리 시스템 개선

### 현재 상태 분석

**현재 구현:**
- `SiteSettings`에 `primaryColor`, `secondaryColor`, `accentColor` 3개만 있음
- `globals.css`에서 CSS 변수로 사용
- `theme.ts`에서 동적 적용

**문제점:**
- 색상이 너무 제한적 (3개만)
- UI 요소별 색상 관리 불가 (버튼, 링크, 배경, 텍스트 등)
- 상태별 색상 없음 (success, error, warning, info)

### 개선 방안

#### 1.1 색상 카테고리 분류 및 중요도 시스템

```typescript
// 색상 중요도 레벨
enum ColorImportance {
  CRITICAL = 'critical',    // 최우선 (primary, background, textPrimary)
  HIGH = 'high',            // 높음 (secondary, surface, textSecondary)
  MEDIUM = 'medium',        // 중간 (accent, border, link)
  LOW = 'low',              // 낮음 (hover, muted, light variants)
}

interface ColorTheme {
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
const COLOR_IMPORTANCE_MAP: Record<keyof ColorTheme, ColorImportance> = {
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
```

#### 1.2 데이터베이스 스키마 확장

**Prisma Schema 변경:**
```prisma
model SiteSettings {
  // ... 기존 필드 ...
  
  // 기존 색상 (하위 호환성 유지)
  primaryColor      String?
  secondaryColor    String?
  accentColor       String?
  
  // 새로운 색상 테마 (JSON)
  colorTheme        Json?  // ColorTheme 인터페이스 구조
}
```

#### 1.3 프론트엔드 색상 시스템 확장

**globals.css 확장:**
```css
:root {
  /* 기본 브랜드 색상 */
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-accent: #4facfe;
  
  /* 상태 색상 */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;
  
  /* 배경 색상 */
  --color-background: #fafafa;
  --color-background-secondary: #ffffff;
  --color-surface: #ffffff;
  --color-surface-hover: #f9fafb;
  
  /* 텍스트 색상 */
  --color-text-primary: #171717;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  --color-text-inverse: #ffffff;
  
  /* 테두리 색상 */
  --color-border: #e5e7eb;
  --color-border-light: #f3f4f6;
  --color-border-dark: #d1d5db;
  
  /* 링크 색상 */
  --color-link: #3b82f6;
  --color-link-hover: #2563eb;
  
  /* 버튼 색상 */
  --color-button-primary: var(--color-primary);
  --color-button-secondary: var(--color-secondary);
  --color-button-text: #ffffff;
}
```

#### 1.4 색상 조화 감지 및 자동 조정 시스템

**핵심 기능:**

1. **WCAG 대비율 검증**
   - 텍스트와 배경의 대비율 계산 (최소 4.5:1, 권장 7:1)
   - 실시간 경고 표시
   - 자동 대체 색상 제안

2. **색상 조화 이론 적용**
   - 색상환 기반 조화 색상 생성
   - 보색, 유사색, 삼원색 조화
   - HSL 색공간 기반 조화 계산

3. **중요도 기반 자동 색상 생성**
   - CRITICAL 색상(primary, background, textPrimary) 설정 시
   - 나머지 색상 자동 생성 및 제안
   - HIGH/MEDIUM/LOW 색상은 CRITICAL에 맞춰 조정

4. **색상 선택 제한**
   - 중요도 높은 색상에 맞춰 낮은 색상의 선택지 필터링
   - 접근성 기준을 만족하는 색상만 표시
   - 실시간 색상 유효성 검증

**구현 예시:**

```typescript
// 색상 유틸리티 클래스
class ColorHarmonyService {
  /**
   * WCAG 대비율 계산
   * @param color1 첫 번째 색상 (HEX)
   * @param color2 두 번째 색상 (HEX)
   * @returns 대비율 (1.0 ~ 21.0)
   */
  calculateContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * 상대 휘도 계산 (WCAG 기준)
   */
  getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * 색상 조화 색상 생성 (색상환 기반)
   * @param baseColor 기준 색상
   * @param harmonyType 조화 유형 (complementary, analogous, triadic)
   */
  generateHarmoniousColors(
    baseColor: string,
    harmonyType: 'complementary' | 'analogous' | 'triadic'
  ): string[] {
    const hsl = this.hexToHsl(baseColor);
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
  generateThemeFromCritical(
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
    );

    // Accent 색상: Primary의 보색
    const accentOptions = this.generateHarmoniousColors(
      criticalColors.primary,
      'complementary'
    );
    theme.accent = accentOptions[0];

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
  selectBestContrast(
    colorOptions: string[],
    background: string
  ): string {
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
  adjustBrightness(hex: string, factor: number): string {
    const hsl = this.hexToHsl(hex);
    hsl.l = Math.min(100, Math.max(0, hsl.l * factor));
    return this.hslToHex(hsl);
  }

  /**
   * 대비 색상 생성 (밝은 배경 → 어두운 텍스트, 어두운 배경 → 밝은 텍스트)
   */
  getContrastColor(background: string): string {
    const luminance = this.getLuminance(background);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * 색상 검증 및 경고
   */
  validateColorCombination(
    foreground: string,
    background: string
  ): {
    isValid: boolean;
    contrastRatio: number;
    level: 'AA' | 'AAA' | 'FAIL';
    warnings: string[];
  } {
    const contrast = this.calculateContrastRatio(foreground, background);
    const warnings: string[] = [];
    let level: 'AA' | 'AAA' | 'FAIL' = 'FAIL';

    if (contrast >= 7) {
      level = 'AAA';
    } else if (contrast >= 4.5) {
      level = 'AA';
    } else {
      warnings.push(
        `대비율이 너무 낮습니다 (${contrast.toFixed(2)}:1). 최소 4.5:1이 필요합니다.`
      );
    }

    return {
      isValid: contrast >= 4.5,
      contrastRatio: contrast,
      level,
      warnings,
    };
  }
}
```

#### 1.5 관리자 설정 페이지 UI

**설정 페이지에 "색상 테마" 탭 추가:**

1. **중요도 기반 색상 설정**
   - CRITICAL 색상부터 설정 (Primary, Background, TextPrimary)
   - 설정 시 나머지 색상 자동 생성 및 제안
   - 자동 생성된 색상 수정 가능

2. **실시간 색상 검증**
   - 색상 선택 시 대비율 표시
   - 접근성 레벨 표시 (AA/AAA/FAIL)
   - 경고 메시지 및 자동 수정 제안

3. **색상 피커 고급 기능**
   - 조화 색상 자동 제안
   - 선택 가능한 색상 범위 제한 (중요도 기반)
   - HSL/RGB/HEX 입력 지원

4. **실시간 미리보기**
   - 다양한 UI 컴포넌트 미리보기
   - 다크/라이트 모드 미리보기
   - 접근성 시뮬레이션 (색맹 모드)

5. **프리셋 테마**
   - 기본, 다크, 밝은, 커스텀
   - 프리셋 적용 시 자동 조화 색상 생성
   - 커스텀 테마 저장/불러오기

---

## 🔐 Part 2: 소셜 로그인 구현

### 2.1 백엔드 구현

#### 필요한 패키지
```bash
npm install @nestjs/passport passport-google-oauth20 passport-facebook
npm install --save-dev @types/passport-google-oauth20 @types/passport-facebook
```

#### 데이터베이스 스키마 변경

**User 모델 확장:**
```prisma
model User {
  // ... 기존 필드 ...
  
  // 소셜 로그인 필드
  provider          String?  // 'local', 'google', 'facebook'
  providerId        String?  // 소셜 제공자의 사용자 ID
  providerData      Json?    // 소셜 제공자에서 받은 추가 데이터
  
  @@unique([provider, providerId]) // provider + providerId 조합은 유니크
  @@index([provider])
  @@index([providerId])
}
```

#### Passport 전략 구현

**Google Strategy:**
```typescript
// backend/src/modules/auth/strategies/google.strategy.ts
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, emails, displayName, photos } = profile;
    return {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      name: displayName,
      picture: photos[0].value,
      accessToken,
    };
  }
}
```

**Facebook Strategy:**
```typescript
// backend/src/modules/auth/strategies/facebook.strategy.ts
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID'),
      clientSecret: configService.get('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL'),
      scope: ['email'],
      profileFields: ['id', 'email', 'name', 'picture'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, emails, name, photos } = profile;
    return {
      provider: 'facebook',
      providerId: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
      accessToken,
    };
  }
}
```

#### Auth Service 확장

```typescript
// 소셜 로그인 처리
async socialLogin(provider: 'google' | 'facebook', profile: any) {
  const { providerId, email, name, picture } = profile;
  
  // 기존 사용자 확인
  let user = await this.prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { provider, providerId },
      ],
    },
  });
  
  if (user) {
    // 기존 사용자 업데이트
    if (!user.provider || user.provider !== provider) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider,
          providerId,
          providerData: profile,
          profileImage: picture || user.profileImage,
        },
      });
    }
  } else {
    // 새 사용자 생성
    user = await this.prisma.user.create({
      data: {
        email,
        name,
        provider,
        providerId,
        providerData: profile,
        profileImage: picture,
        password: '', // 소셜 로그인은 비밀번호 없음
        isEmailVerified: true, // 소셜 이메일은 검증됨
        role: 'user',
        isActive: true,
      },
    });
  }
  
  // JWT 토큰 생성 및 반환
  return this.generateTokens(user);
}
```

#### Auth Controller 확장

```typescript
@Get('google')
@UseGuards(AuthGuard('google'))
async googleAuth() {
  // Passport가 리다이렉트 처리
}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleAuthCallback(@Req() req) {
  const user = await this.authService.socialLogin('google', req.user);
  // 프론트엔드로 리다이렉트 (토큰 포함)
  return { accessToken: user.accessToken, user: user.user };
}

@Get('facebook')
@UseGuards(AuthGuard('facebook'))
async facebookAuth() {
  // Passport가 리다이렉트 처리
}

@Get('facebook/callback')
@UseGuards(AuthGuard('facebook'))
async facebookAuthCallback(@Req() req) {
  const user = await this.authService.socialLogin('facebook', req.user);
  return { accessToken: user.accessToken, user: user.user };
}
```

### 2.2 프론트엔드 구현

#### 로그인/회원가입 페이지 수정

```typescript
// app/login/page.tsx, app/register/page.tsx
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">
        또는 소셜 계정으로 계속하기
      </span>
    </div>
  </div>

  <div className="mt-6 grid grid-cols-2 gap-3">
    <button
      onClick={() => window.location.href = '/api/auth/google'}
      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Google Icon */}
      </svg>
      <span className="ml-2">Google</span>
    </button>

    <button
      onClick={() => window.location.href = '/api/auth/facebook'}
      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Facebook Icon */}
      </svg>
      <span className="ml-2">Facebook</span>
    </button>
  </div>
</div>
```

---

## 📝 구현 단계

### Phase 1: 색상 테마 관리 시스템 (우선순위 높음)

1. **데이터베이스 마이그레이션**
   - `SiteSettings`에 `colorTheme` JSON 필드 추가
   - 기존 `primaryColor`, `secondaryColor`, `accentColor` 유지 (하위 호환성)

2. **백엔드 API 확장**
   - `UpdateSiteSettingsDto`에 `colorTheme` 추가
   - 색상 검증 로직 추가
   - 색상 조화 계산 API 엔드포인트

3. **프론트엔드 색상 시스템 확장**
   - `globals.css`에 모든 색상 변수 추가
   - `theme.ts` 확장하여 모든 색상 적용
   - `ColorHarmonyService` 구현 (색상 조화 계산)

4. **색상 조화 감지 시스템 구현**
   - WCAG 대비율 계산 함수
   - 색상환 기반 조화 색상 생성
   - 중요도 기반 자동 색상 생성
   - 색상 검증 및 경고 시스템

5. **관리자 설정 페이지 UI**
   - "색상 테마" 탭 추가
   - 중요도 기반 색상 설정 UI
   - 색상 피커 컴포넌트 (조화 색상 제안 포함)
   - 실시간 색상 검증 표시
   - 자동 생성 색상 미리보기 및 수정
   - 실시간 미리보기 (다양한 UI 컴포넌트)
   - 프리셋 테마

### Phase 2: 소셜 로그인

1. **백엔드 구현**
   - Passport Google/Facebook 전략 추가
   - User 모델 확장
   - Auth Service 확장
   - Auth Controller 라우트 추가

2. **프론트엔드 구현**
   - 로그인/회원가입 페이지에 소셜 버튼 추가
   - 콜백 처리
   - 토큰 저장 및 리다이렉트

3. **환경 변수 설정**
   - Google OAuth 클라이언트 ID/Secret
   - Facebook App ID/Secret
   - 콜백 URL 설정

---

## 🔧 기술 스택

### 소셜 로그인
- **Backend**: `@nestjs/passport`, `passport-google-oauth20`, `passport-facebook`
- **Frontend**: 기존 인증 플로우 활용

### 색상 테마
- **Backend**: 기존 SiteSettings 구조 활용
- **Frontend**: CSS 변수, React Color Picker (또는 커스텀)

---

## 📋 체크리스트

### 색상 테마 관리
- [ ] 데이터베이스 마이그레이션
- [ ] 백엔드 DTO 확장
- [ ] 백엔드 서비스 로직
- [ ] 프론트엔드 CSS 변수 확장
- [ ] theme.ts 확장
- [ ] ColorHarmonyService 구현
  - [ ] WCAG 대비율 계산
  - [ ] 색상환 기반 조화 색상 생성
  - [ ] 중요도 기반 자동 색상 생성
  - [ ] 색상 검증 및 경고
- [ ] 설정 페이지 UI 구현
  - [ ] 중요도 기반 색상 설정 UI
  - [ ] 색상 피커 컴포넌트 (조화 제안)
  - [ ] 실시간 색상 검증 표시
  - [ ] 자동 생성 색상 미리보기
  - [ ] 색상 선택 범위 제한 기능
- [ ] 실시간 미리보기
- [ ] 프리셋 테마

### 소셜 로그인
- [ ] Google OAuth 앱 생성
- [ ] Facebook 앱 생성
- [ ] 데이터베이스 마이그레이션
- [ ] Google Strategy 구현
- [ ] Facebook Strategy 구현
- [ ] Auth Service 확장
- [ ] Auth Controller 라우트
- [ ] 프론트엔드 소셜 버튼
- [ ] 콜백 처리
- [ ] 환경 변수 설정

---

## 🎯 예상 소요 시간

- **색상 테마 관리**: 6-8시간
  - 기본 색상 시스템: 2-3시간
  - 색상 조화 감지 시스템: 3-4시간
  - UI 구현: 1-2시간
- **소셜 로그인**: 6-8시간
- **총합**: 12-16시간

## 💡 색상 조화 시스템 작동 방식

### 예시 시나리오

1. **관리자가 Primary 색상을 #667eea (보라색)로 설정**
   - 시스템이 자동으로:
     - Secondary: 유사색 생성 (예: #764ba2)
     - Accent: 보색 생성 (예: #eaa667)
     - Background: 밝은 회색 자동 선택 (#fafafa)
     - TextPrimary: Background와 대비되는 색상 자동 선택 (#171717)

2. **관리자가 Background를 흰색(#ffffff)으로 변경**
   - 시스템이 자동으로:
     - TextPrimary: 검은색(#000000)으로 자동 조정
     - TextSecondary: 회색 계열로 자동 조정
     - Border: 연한 회색으로 자동 조정
     - Surface: 약간 어두운 흰색으로 자동 조정

3. **관리자가 TextPrimary를 밝은 색(#ffff00)으로 선택 시도**
   - 시스템이 경고:
     - "Background(#ffffff)와 TextPrimary(#ffff00)의 대비율이 1.2:1로 너무 낮습니다"
     - "최소 4.5:1이 필요합니다"
     - 자동 제안: "#000000 (대비율 21:1, AAA 등급)"

4. **중요도 기반 색상 제한**
   - CRITICAL 색상(primary, background, textPrimary) 설정 시
   - MEDIUM/LOW 색상 선택 시 접근성 기준을 만족하는 색상만 표시
   - 색상 피커에서 유효하지 않은 색상 영역 비활성화

---

## 📚 참고 자료

- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Passport.js Facebook Strategy](http://www.passportjs.org/packages/passport-facebook/)
- [NestJS Passport Integration](https://docs.nestjs.com/security/authentication)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

