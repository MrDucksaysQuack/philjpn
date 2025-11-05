# 🎨 사이트 설정 기능 설계 문서

> About Us 드롭다운 메뉴 및 사이트 설정 관리 시스템

**작성일**: 2024년 11월  
**목적**: 회사 정보, 로고, 색상 테마를 관리하고 헤더에 동적으로 적용

---

## 📋 목차

1. [개요](#개요)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [API 설계](#api-설계)
4. [프론트엔드 구조](#프론트엔드-구조)
5. [로고 색상 분석 및 테마 적용](#로고-색상-분석-및-테마-적용)
6. [Admin UI 설계](#admin-ui-설계)
7. [헤더 드롭다운 메뉴](#헤더-드롭다운-메뉴)
8. [구현 우선순위](#구현-우선순위)

---

## 🎯 개요

### 기능 요약
- **About Us 드롭다운 메뉴**: 헤더에 추가하여 회사 정보 접근
- **사이트 설정 관리**: Admin 페이지에서 회사 정보, 로고, 색상 테마 관리
- **동적 테마 적용**: 로고 색상 분석 후 사이트 전체 색상 자동 조정
- **콘텐츠 관리**: 회사 소개, 팀 소개, 연락처, 서비스 소개

### 사용자 흐름

```
사용자:
1. 헤더에서 "About Us" 클릭
2. 드롭다운 메뉴 표시
3. 원하는 섹션 선택 (회사 소개, 팀 소개, 연락처, 서비스 소개)
4. 해당 페이지로 이동하여 정보 확인

관리자:
1. Admin 페이지 → "사이트 설정" 섹션 접근
2. 회사 정보 편집 (회사명, 로고 업로드, 각 섹션 내용)
3. 로고 업로드 시 자동 색상 분석
4. 색상 테마 미리보기 및 적용
5. 저장 후 헤더 및 사이트 전체에 반영
```

---

## 🗄️ 데이터베이스 스키마

### 1. SiteSettings 모델

```prisma
// ============================================
// SITE_SETTINGS
// ============================================

model SiteSettings {
  id              String   @id @default(uuid())
  companyName     String   @default("Exam Platform")
  logoUrl         String?  @db.VarChar(500) // Supabase Storage URL
  faviconUrl      String?  @db.VarChar(500)
  
  // 색상 테마 (로고 분석 결과 또는 수동 설정)
  primaryColor    String?  @db.VarChar(7) // HEX 코드 (예: #667eea)
  secondaryColor  String?  @db.VarChar(7) // HEX 코드
  accentColor     String?  @db.VarChar(7) // HEX 코드
  colorScheme     Json?    // { primary, secondary, accent, gradients } 등 상세 정보
  
  // 각 섹션 콘텐츠
  aboutCompany    String?  @db.Text // 회사 소개 (마크다운 지원)
  aboutTeam       String?  @db.Text // 팀 소개 (마크다운 지원)
  contactInfo     Json?    // { email, phone, address, socialMedia: {...} }
  serviceInfo     String?  @db.Text // 서비스 소개 (마크다운 지원)
  
  // 메타 정보
  isActive        Boolean  @default(true)
  updatedBy       String?
  updatedAt       DateTime @updatedAt
  createdAt       DateTime @default(now())
  
  // Relations
  updater         User?    @relation("SiteSettingsUpdater", fields: [updatedBy], references: [id], onDelete: SetNull)
  
  @@index([isActive])
  @@map("site_settings")
}
```

### 2. User 모델에 Relation 추가

```prisma
model User {
  // ... 기존 필드들 ...
  
  // Relations
  updatedSiteSettings SiteSettings[] @relation("SiteSettingsUpdater")
  
  // ... 나머지 관계들 ...
}
```

### 3. 마이그레이션 계획

```sql
-- SiteSettings 테이블 생성
CREATE TABLE "site_settings" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL DEFAULT 'Exam Platform',
  "logoUrl" VARCHAR(500),
  "faviconUrl" VARCHAR(500),
  "primaryColor" VARCHAR(7),
  "secondaryColor" VARCHAR(7),
  "accentColor" VARCHAR(7),
  "colorScheme" JSONB,
  "aboutCompany" TEXT,
  "aboutTeam" TEXT,
  "contactInfo" JSONB,
  "serviceInfo" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedBy" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- 인덱스
CREATE INDEX "site_settings_isActive_idx" ON "site_settings"("isActive");

-- 외래 키
ALTER TABLE "site_settings" 
  ADD CONSTRAINT "site_settings_updatedBy_fkey" 
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 초기 데이터 삽입 (기본값)
INSERT INTO "site_settings" ("id", "companyName", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Exam Platform', NOW(), NOW());
```

---

## 🔌 API 설계

### 1. 엔드포인트 구조

#### Public (인증 불필요)
```
GET  /api/site-settings          - 사이트 설정 조회 (공개 정보만)
GET  /api/site-settings/about    - About Us 섹션별 정보 조회
```

#### Admin Only (인증 + Admin 권한 필요)
```
GET    /api/admin/site-settings       - 사이트 설정 전체 조회 (관리자용)
PUT    /api/admin/site-settings       - 사이트 설정 업데이트
POST   /api/admin/site-settings/logo  - 로고 업로드
POST   /api/admin/site-settings/favicon - 파비콘 업로드
POST   /api/admin/site-settings/analyze-colors - 로고 색상 분석
PUT    /api/admin/site-settings/colors - 색상 테마 수동 설정
```

### 2. DTO 설계

#### UpdateSiteSettingsDto
```typescript
export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  accentColor?: string;

  @IsOptional()
  @IsString()
  aboutCompany?: string;

  @IsOptional()
  @IsString()
  aboutTeam?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    socialMedia?: {
      website?: string;
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  };

  @IsOptional()
  @IsString()
  serviceInfo?: string;
}
```

#### ColorAnalysisResponseDto
```typescript
export class ColorAnalysisResponseDto {
  primaryColor: string;      // HEX 코드
  secondaryColor: string;    // HEX 코드
  accentColor: string;       // HEX 코드
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    gradients: {
      primary: string;       // "from-blue-600 to-purple-600"
      secondary: string;
      accent: string;
    };
    textColors: {
      primary: string;       // "text-gray-900"
      secondary: string;    // "text-gray-600"
    };
    bgColors: {
      primary: string;      // "bg-blue-50"
      secondary: string;    // "bg-purple-50"
    };
  };
  confidence: number;        // 0-1, 색상 분석 신뢰도
}
```

### 3. 서비스 로직

#### SiteSettingsService
```typescript
@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  // 공개 사이트 설정 조회
  async getPublicSettings() {
    const settings = await this.prisma.siteSettings.findFirst({
      where: { isActive: true },
      select: {
        companyName: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        colorScheme: true,
        aboutCompany: true,
        aboutTeam: true,
        contactInfo: true,
        serviceInfo: true,
      },
    });
    
    return settings || this.getDefaultSettings();
  }

  // 관리자용 전체 설정 조회
  async getAdminSettings() {
    return await this.prisma.siteSettings.findFirst({
      where: { isActive: true },
    });
  }

  // 설정 업데이트
  async updateSettings(userId: string, data: UpdateSiteSettingsDto) {
    // Admin 권한 확인은 Controller에서 처리
    
    const existing = await this.prisma.siteSettings.findFirst({
      where: { isActive: true },
    });

    if (existing) {
      return await this.prisma.siteSettings.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });
    } else {
      return await this.prisma.siteSettings.create({
        data: {
          ...data,
          updatedBy: userId,
        },
      });
    }
  }

  // 로고 색상 분석 (외부 라이브러리 사용)
  async analyzeLogoColors(logoUrl: string): Promise<ColorAnalysisResponseDto> {
    // 구현: 이미지에서 주요 색상 추출
    // 라이브러리: 'color-thief-node' 또는 'node-vibrant'
  }

  // 기본 설정 반환
  private getDefaultSettings() {
    return {
      companyName: "Exam Platform",
      logoUrl: null,
      primaryColor: "#667eea",
      secondaryColor: "#764ba2",
      accentColor: "#4facfe",
      // ... 기타 기본값
    };
  }
}
```

---

## 🎨 프론트엔드 구조

### 1. 파일 구조

```
frontend/client/
├── app/
│   ├── about/
│   │   ├── page.tsx              # About Us 메인 페이지
│   │   ├── company/page.tsx      # 회사 소개
│   │   ├── team/page.tsx         # 팀 소개
│   │   ├── contact/page.tsx      # 연락처
│   │   └── service/page.tsx      # 서비스 소개
│   └── admin/
│       └── settings/
│           ├── page.tsx          # 사이트 설정 페이지
│           └── components/
│               ├── SiteInfoForm.tsx
│               ├── LogoUpload.tsx
│               ├── ColorThemeEditor.tsx
│               ├── ContentEditor.tsx
│               └── ThemePreview.tsx
├── components/
│   └── layout/
│       └── AboutUsDropdown.tsx   # 헤더 드롭다운 컴포넌트
├── lib/
│   ├── api.ts                    # API 클라이언트 추가
│   └── theme.ts                  # 동적 테마 적용 유틸리티
└── hooks/
    └── useSiteSettings.ts        # 사이트 설정 훅
```

### 2. API 클라이언트

```typescript
// lib/api.ts에 추가
export const siteSettingsAPI = {
  // Public
  getPublicSettings: () => 
    apiClient.get<SiteSettings>("/site-settings"),
  
  getAboutSection: (section: string) =>
    apiClient.get(`/site-settings/about?section=${section}`),
  
  // Admin
  getAdminSettings: () =>
    apiClient.get<SiteSettings>("/admin/site-settings"),
  
  updateSettings: (data: UpdateSiteSettingsDto) =>
    apiClient.put<SiteSettings>("/admin/site-settings", data),
  
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return apiClient.post<{ logoUrl: string }>(
      "/admin/site-settings/logo",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
  
  analyzeColors: (logoUrl: string) =>
    apiClient.post<ColorAnalysisResponseDto>(
      "/admin/site-settings/analyze-colors",
      { logoUrl }
    ),
  
  updateColors: (colors: ColorScheme) =>
    apiClient.put("/admin/site-settings/colors", colors),
};
```

### 3. React Hook

```typescript
// hooks/useSiteSettings.ts
export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: () => siteSettingsAPI.getPublicSettings(),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

export function useAdminSiteSettings() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: () => siteSettingsAPI.getAdminSettings(),
    enabled: user?.role === "admin",
  });
}
```

---

## 🎨 로고 색상 분석 및 테마 적용

### 1. 색상 분석 라이브러리 선택

**옵션 A: node-vibrant (추천)**
- 이미지에서 주요 색상 추출
- Vibrant, Muted, DarkVibrant, LightVibrant 등 다양한 팔레트 제공
- 설치: `npm install node-vibrant @types/node-vibrant`

**옵션 B: color-thief-node**
- 간단한 색상 추출
- 설치: `npm install color-thief-node`

**옵션 C: sharp + 커스텀 알고리즘**
- 더 세밀한 제어 가능
- 설치: `npm install sharp`

### 2. 색상 분석 알고리즘

```typescript
// backend/src/modules/admin/services/color-analysis.service.ts
import Vibrant from 'node-vibrant';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ColorAnalysisService {
  constructor(private httpService: HttpService) {}

  async analyzeImageColors(imageUrl: string): Promise<ColorAnalysisResponseDto> {
    // 1. 이미지 다운로드
    const imageBuffer = await this.downloadImage(imageUrl);
    
    // 2. 색상 추출
    const palette = await Vibrant.from(imageBuffer).getPalette();
    
    // 3. 주요 색상 선택
    const primaryColor = palette.Vibrant?.hex || palette.Muted?.hex || '#667eea';
    const secondaryColor = palette.DarkVibrant?.hex || palette.LightVibrant?.hex || '#764ba2';
    const accentColor = palette.LightVibrant?.hex || palette.DarkMuted?.hex || '#4facfe';
    
    // 4. Tailwind CSS 클래스로 변환
    const colorScheme = this.generateColorScheme(primaryColor, secondaryColor, accentColor);
    
    return {
      primaryColor,
      secondaryColor,
      accentColor,
      colorScheme,
      confidence: this.calculateConfidence(palette),
    };
  }

  private generateColorScheme(primary: string, secondary: string, accent: string) {
    // HEX → Tailwind CSS 클래스 매핑
    // 예: #667eea → "blue-600"
    return {
      primary: this.hexToTailwind(primary),
      secondary: this.hexToTailwind(secondary),
      accent: this.hexToTailwind(accent),
      gradients: {
        primary: `from-${this.hexToTailwind(primary)} to-${this.hexToTailwind(secondary)}`,
        secondary: `from-${this.hexToTailwind(secondary)} to-${this.hexToTailwind(accent)}`,
        accent: `from-${this.hexToTailwind(accent)} to-${this.hexToTailwind(primary)}`,
      },
      // ... 기타 색상 정보
    };
  }

  private hexToTailwind(hex: string): string {
    // HEX 코드를 Tailwind CSS 클래스로 변환
    // 간단한 매핑 또는 Nearest Color 라이브러리 사용
    // 예: #667eea → "blue-600"
  }

  private calculateConfidence(palette: any): number {
    // 색상 분석 신뢰도 계산 (0-1)
    // 색상 다양성, 명도 대비 등을 고려
  }
}
```

### 3. 동적 테마 적용 (프론트엔드)

#### 방법 A: CSS 변수 사용 (추천)
```typescript
// lib/theme.ts
export function applyTheme(settings: SiteSettings) {
  if (!settings.colorScheme) return;
  
  const root = document.documentElement;
  root.style.setProperty('--color-primary', settings.primaryColor);
  root.style.setProperty('--color-secondary', settings.secondaryColor);
  root.style.setProperty('--color-accent', settings.accentColor);
  
  // Tailwind CSS 동적 클래스 생성
  // 또는 CSS 변수를 활용한 커스텀 클래스 사용
}
```

#### 방법 B: Tailwind CSS 동적 클래스
```typescript
// 컴포넌트에서 동적 클래스 사용
function Header({ settings }) {
  const primaryClass = settings.colorScheme?.primary || 'blue-600';
  const secondaryClass = settings.colorScheme?.secondary || 'purple-600';
  
  return (
    <div className={`bg-gradient-to-r from-${primaryClass} to-${secondaryClass}`}>
      {/* ... */}
    </div>
  );
}
```

#### 방법 C: Tailwind Config 동적 생성
```typescript
// tailwind.config.js 동적 수정
// 런타임에 설정을 불러와서 Tailwind 테마 확장
```

### 4. 테마 적용 우선순위

1. **로고 색상 분석 결과** (자동)
2. **관리자 수동 설정** (우선순위 높음)
3. **기본 테마** (fallback)

---

## 🎛️ Admin UI 설계

### 1. 사이트 설정 페이지 구조

```
/admin/settings
├── 탭 구조
│   ├── 기본 정보
│   │   ├── 회사명 입력
│   │   ├── 로고 업로드 (드래그 앤 드롭)
│   │   ├── 파비콘 업로드
│   │   └── 색상 분석 버튼
│   │
│   ├── 색상 테마
│   │   ├── 자동 분석 결과 표시
│   │   ├── Primary Color 선택기
│   │   ├── Secondary Color 선택기
│   │   ├── Accent Color 선택기
│   │   └── 실시간 미리보기
│   │
│   ├── 콘텐츠
│   │   ├── 회사 소개 (마크다운 에디터)
│   │   ├── 팀 소개 (마크다운 에디터)
│   │   ├── 연락처 정보 (폼)
│   │   └── 서비스 소개 (마크다운 에디터)
│   │
│   └── 미리보기
│       └── 실제 사이트 미리보기 (iframe 또는 새 창)
```

### 2. 컴포넌트 설계

#### SiteInfoForm.tsx
- 회사명 입력
- 로고 업로드 (드래그 앤 드롭)
- 파비콘 업로드
- 업로드 후 색상 분석 버튼

#### ColorThemeEditor.tsx
- 색상 선택기 (Color Picker)
- 자동 분석 결과 표시
- 수동 색상 입력
- 실시간 미리보기

#### ContentEditor.tsx
- 마크다운 에디터 (예: react-markdown-editor-lite)
- 미리보기 탭
- 저장 기능

#### ThemePreview.tsx
- 현재 설정으로 적용된 헤더 미리보기
- 주요 컴포넌트 색상 미리보기
- 적용/취소 버튼

---

## 📱 헤더 드롭다운 메뉴

### 1. 컴포넌트 구조

```typescript
// components/layout/AboutUsDropdown.tsx
export default function AboutUsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  
  const menuItems = [
    { href: "/about/company", label: "회사 소개", icon: "🏢" },
    { href: "/about/team", label: "팀 소개", icon: "👥" },
    { href: "/about/contact", label: "연락처", icon: "📧" },
    { href: "/about/service", label: "서비스 소개", icon: "🚀" },
  ];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
      >
        About Us
        <ChevronDownIcon className="inline ml-1 w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. 헤더 통합

```typescript
// components/layout/Header.tsx
<nav className="hidden md:flex items-center gap-1">
  <AboutUsDropdown />
  <Link href="/exams">시험 목록</Link>
</nav>
```

---

## 📊 구현 우선순위

### Phase 1: 기본 구조 (최우선)
1. ✅ 데이터베이스 스키마 생성
2. ✅ API 엔드포인트 기본 구조
3. ✅ Admin 페이지 기본 레이아웃
4. ✅ 헤더 드롭다운 메뉴

### Phase 2: 콘텐츠 관리
1. ✅ 회사 정보 입력/수정
2. ✅ 각 섹션 콘텐츠 편집 (마크다운 에디터)
3. ✅ About Us 페이지들 생성

### Phase 3: 로고 및 색상
1. ✅ 로고 업로드 기능
2. ✅ 색상 분석 라이브러리 통합
3. ✅ 색상 테마 편집 UI
4. ✅ 동적 테마 적용

### Phase 4: 고급 기능
1. ✅ 실시간 미리보기
2. ✅ 테마 저장/불러오기
3. ✅ 색상 분석 고도화
4. ✅ 성능 최적화

---

## 🔧 기술 스택

### Backend
- **이미지 업로드**: Supabase Storage 또는 AWS S3
- **색상 분석**: `node-vibrant` 또는 `sharp` + 커스텀 알고리즘
- **파일 처리**: `multer` (NestJS)

### Frontend
- **마크다운 에디터**: `react-markdown-editor-lite` 또는 `@uiw/react-md-editor`
- **색상 선택기**: `react-color` 또는 `@uiw/react-color`
- **이미지 업로드**: `react-dropzone`
- **테마 적용**: CSS 변수 + Tailwind CSS

---

## 📝 참고사항

### 보안
- 로고 업로드: 파일 크기 제한 (5MB), 이미지 형식만 허용
- Admin 권한: JWT + Role Guard로 보호
- XSS 방지: 마크다운 렌더링 시 sanitize

### 성능
- 사이트 설정 캐싱: 5분 TTL
- 이미지 최적화: 업로드 시 자동 리사이즈
- 색상 분석: 비동기 처리, 진행률 표시

### 접근성
- 드롭다운 메뉴: 키보드 네비게이션 지원
- 색상 대비: WCAG AA 기준 준수
- 스크린 리더: ARIA 레이블 추가

---

## ✅ 설계 검토 체크리스트

- [x] 데이터베이스 스키마 설계 완료
- [x] API 엔드포인트 설계 완료
- [x] 프론트엔드 구조 설계 완료
- [x] 로고 색상 분석 방법 결정
- [x] 동적 테마 적용 방법 결정
- [x] Admin UI 구조 설계 완료
- [x] 헤더 드롭다운 메뉴 설계 완료
- [x] 구현 우선순위 정의 완료

---

**설계 완료일**: 2024년 11월  
**다음 단계**: 설계 검토 후 구현 시작

