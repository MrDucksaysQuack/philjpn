# 🎨 동적 테마 적용 가이드

> 하드코딩된 색상을 동적 테마로 변경하는 방법

---

## 📋 개요

이 가이드는 기존에 하드코딩된 색상 클래스들을 동적 테마 클래스로 변경하는 방법을 안내합니다.

---

## 🎯 적용 완료된 페이지

다음 페이지들은 이미 동적 테마가 적용되었습니다:

- ✅ `components/layout/Header.tsx` - 헤더 컴포넌트
- ✅ `app/page.tsx` - 메인 페이지
- ✅ `app/about/company/page.tsx` - 회사 소개
- ✅ `app/about/team/page.tsx` - 팀 소개
- ✅ `app/about/service/page.tsx` - 서비스 소개
- ✅ `app/admin/settings/page.tsx` - 사이트 설정 페이지

---

## 🔄 색상 클래스 매핑

### 배경색 (Background)

| 기존 하드코딩 | 동적 테마 클래스 |
|------------|----------------|
| `bg-blue-600` | `bg-theme-primary` |
| `bg-purple-600` | `bg-theme-secondary` |
| `bg-indigo-600` | `bg-theme-accent` |
| `bg-blue-50` | `bg-theme-primary-light` |
| `bg-purple-50` | `bg-theme-secondary-light` |

### 텍스트 색상 (Text)

| 기존 하드코딩 | 동적 테마 클래스 |
|------------|----------------|
| `text-blue-600` | `text-theme-primary` |
| `text-purple-600` | `text-theme-secondary` |
| `text-indigo-600` | `text-theme-accent` |

### 그라데이션 (Gradient)

| 기존 하드코딩 | 동적 테마 클래스 |
|------------|----------------|
| `bg-gradient-to-r from-blue-600 to-purple-600` | `bg-theme-gradient-primary` |
| `bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700` | `bg-theme-gradient-diagonal` |
| `bg-gradient-to-r from-purple-600 to-indigo-600` | `bg-theme-gradient-secondary` |

### 테두리 (Border)

| 기존 하드코딩 | 동적 테마 클래스 |
|------------|----------------|
| `border-blue-500` | `border-theme-primary` |
| `border-purple-500` | `border-theme-secondary` |

### Focus Ring

| 기존 하드코딩 | 동적 테마 클래스 |
|------------|----------------|
| `focus:ring-blue-500` | `focus:ring-theme-primary` |
| `focus:border-blue-500` | `focus:border-theme-primary` |

---

## 📝 사용 예시

### 예시 1: 버튼 스타일 변경

**변경 전:**
```tsx
<button className="bg-blue-600 text-white hover:bg-blue-700">
  클릭
</button>
```

**변경 후:**
```tsx
<button className="bg-theme-primary text-white hover:opacity-90">
  클릭
</button>
```

### 예시 2: 그라데이션 배경 변경

**변경 전:**
```tsx
<div className="bg-gradient-to-r from-blue-600 to-purple-600">
  내용
</div>
```

**변경 후:**
```tsx
<div className="bg-theme-gradient-primary">
  내용
</div>
```

### 예시 3: 카드 스타일 변경

**변경 전:**
```tsx
<div className="bg-blue-50 border border-blue-200 text-blue-600">
  카드 내용
</div>
```

**변경 후:**
```tsx
<div className="bg-theme-primary-light border border-theme-primary text-theme-primary">
  카드 내용
</div>
```

---

## 🎨 사용 가능한 테마 클래스

### 배경색
- `.bg-theme-primary` - Primary 색상 배경
- `.bg-theme-secondary` - Secondary 색상 배경
- `.bg-theme-accent` - Accent 색상 배경
- `.bg-theme-primary-light` - Primary 색상 배경 (10% 투명도)
- `.bg-theme-secondary-light` - Secondary 색상 배경 (10% 투명도)
- `.bg-theme-accent-light` - Accent 색상 배경 (10% 투명도)

### 텍스트 색상
- `.text-theme-primary` - Primary 색상 텍스트
- `.text-theme-secondary` - Secondary 색상 텍스트
- `.text-theme-accent` - Accent 색상 텍스트

### 그라데이션
- `.bg-theme-gradient-primary` - Primary → Secondary (가로)
- `.bg-theme-gradient-secondary` - Secondary → Accent (가로)
- `.bg-theme-gradient-horizontal` - Primary → Secondary (가로)
- `.bg-theme-gradient-diagonal` - Primary → Secondary → Accent (대각선)
- `.bg-theme-gradient-radial` - Primary → Secondary (원형)

### 테두리
- `.border-theme-primary` - Primary 색상 테두리
- `.border-theme-secondary` - Secondary 색상 테두리

### Hover 효과
- `.hover:bg-theme-primary:hover` - Primary 색상 배경 (hover)
- `.hover:bg-theme-secondary:hover` - Secondary 색상 배경 (hover)

### Focus 효과
- `.focus:ring-theme-primary:focus` - Primary 색상 focus ring
- `.focus:ring-theme-secondary:focus` - Secondary 색상 focus ring
- `.focus:ring-theme-accent:focus` - Accent 색상 focus ring
- `.focus:border-theme-primary:focus` - Primary 색상 focus border

---

## 🔍 남은 작업 페이지

다음 페이지들은 아직 하드코딩된 색상이 남아있을 수 있습니다. 필요시 수동으로 변경하세요:

- `app/dashboard/page.tsx` - 대시보드
- `app/dashboard/components/*.tsx` - 대시보드 위젯들
- `app/exams/*.tsx` - 시험 관련 페이지들
- `app/results/*.tsx` - 결과 페이지들
- `app/statistics/page.tsx` - 통계 페이지
- `app/analysis/page.tsx` - 분석 페이지
- `app/admin/*.tsx` - 관리자 페이지들

---

## 💡 팁

1. **일괄 변경**: VS Code의 Find & Replace 기능을 사용하여 여러 파일을 한 번에 변경할 수 있습니다.
2. **단계별 적용**: 중요한 페이지부터 우선적으로 변경하세요.
3. **테스트**: 각 페이지 변경 후 브라우저에서 테마가 올바르게 적용되는지 확인하세요.

---

## 📚 참고

- **테마 적용 유틸리티**: `frontend/client/lib/theme.ts`
- **테마 Provider**: `frontend/client/components/ThemeProvider.tsx`
- **CSS 클래스 정의**: `frontend/client/app/globals.css`

---

**작성일**: 2024년 11월  
**목적**: 하드코딩된 색상을 동적 테마로 전환

