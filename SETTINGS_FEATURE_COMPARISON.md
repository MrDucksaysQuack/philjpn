# Settings 페이지 기능 비교 분석

## 📋 탭 구성 평가

### 현재 탭 구성 (총 9개)

| 탭명 | 주요 내용 | 평가 |
|------|----------|------|
| **기본 정보** | 회사명, 로고, 파비콘 | ✅ 적절 (색상 필드 제거됨) |
| **회사 소개** | aboutCompany, companyStats, companyValues | ✅ 적절 |
| **팀 소개** | aboutTeam, teamMembers, teamCulture | ✅ 적절 |
| **서비스 소개** | serviceInfo, serviceFeatures, serviceBenefits, serviceProcess | ✅ 적절 |
| **연락처** | contactInfo | ✅ 적절 |
| **언어별 콘텐츠** | homeContent, aboutContent (ko, en, ja) | ✅ 적절 |
| **미리보기** | SettingsPreview 컴포넌트 | ✅ 적절 (읽기 전용) |
| **버전 히스토리** | 버전 관리 및 롤백 | ✅ 적절 (읽기 전용) |
| **색상 테마** | colorTheme (22개 색상 필드) | ✅ 적절 |

### 중복 및 병합 가능성 분석

**결론**: 
- ✅ **탭 구성은 효율적이며 중복 없음**
- ✅ **각 탭이 명확한 목적을 가짐**
- ✅ **병합할 필요 없음** (각 About 페이지가 독립적으로 관리됨)

**상세 분석**:
- **기본 정보 탭**: 회사명, 로고, 파비콘만 관리 (색상 필드 제거됨 ✅)
- **About 관련 탭들**: 각 페이지별로 분리되어 있어 직관적 (병합 불필요)
- **언어별 콘텐츠 탭**: 메인/About 페이지 Hero 섹션 관리 (독립적)
- **색상 테마 탭**: 완전한 색상 시스템 (독립적)

**상세 평가**: `SETTINGS_TAB_EVALUATION.md` 참고

---

## 📊 시스템 준비 기능 vs Settings 페이지 구현 현황

### 1. 색상 테마 설정

#### ✅ ColorTheme 인터페이스 (총 22개 필드)

| 중요도 | 필드명 | Settings 페이지 | 상태 |
|--------|--------|----------------|------|
| **CRITICAL** | primary | ✅ | 구현됨 |
| | background | ✅ | 구현됨 |
| | textPrimary | ✅ | 구현됨 |
| **HIGH** | secondary | ✅ | 구현됨 |
| | **backgroundSecondary** | ❌ | **누락** |
| | surface | ✅ | 구현됨 |
| | textSecondary | ✅ | 구현됨 |
| | buttonPrimary | ✅ | 구현됨 |
| | **buttonText** | ❌ | **누락** |
| **MEDIUM** | accent | ✅ | 구현됨 |
| | success | ✅ | 구현됨 |
| | error | ✅ | 구현됨 |
| | warning | ✅ | 구현됨 |
| | info | ✅ | 구현됨 |
| | **textInverse** | ❌ | **누락** |
| | border | ✅ | 구현됨 |
| | link | ✅ | 구현됨 |
| | **buttonSecondary** | ❌ | **누락** |
| **LOW** | surfaceHover | ✅ | 구현됨 |
| | textMuted | ✅ | 구현됨 |
| | borderLight | ✅ | 구현됨 |
| | borderDark | ✅ | 구현됨 |
| | linkHover | ✅ | 구현됨 |

**결과**: 22개 중 19개 구현 (86%), **3개 누락**:
- `backgroundSecondary` (HIGH)
- `buttonText` (HIGH)
- `textInverse` (MEDIUM)
- `buttonSecondary` (MEDIUM)

---

### 2. 언어별 콘텐츠 설정

#### ✅ 현재 언어별 지원되는 필드

| 필드 | 언어별 지원 | 상태 |
|------|------------|------|
| `homeContent` | ✅ ko, en, ja | 구현됨 |
| `aboutContent` | ✅ ko, en, ja | 구현됨 |

#### ❌ 언어별 지원이 필요한 필드 (현재 단일 언어만 지원)

| 필드 | 현재 상태 | 필요한 언어별 지원 |
|------|----------|-------------------|
| `aboutCompany` | 단일 언어 (마크다운) | ❌ ko, en, ja |
| `aboutTeam` | 단일 언어 (마크다운) | ❌ ko, en, ja |
| `serviceInfo` | 단일 언어 (마크다운) | ❌ ko, en, ja |
| `companyStats.stats[].label` | 단일 언어 | ❌ ko, en, ja |
| `companyValues.values[].title` | 단일 언어 | ❌ ko, en, ja |
| `companyValues.values[].description` | 단일 언어 | ❌ ko, en, ja |
| `teamMembers.members[].role` | 단일 언어 | ❌ ko, en, ja |
| `teamMembers.members[].description` | 단일 언어 | ❌ ko, en, ja |
| `teamCulture.culture[].title` | 단일 언어 | ❌ ko, en, ja |
| `teamCulture.culture[].description` | 단일 언어 | ❌ ko, en, ja |
| `serviceFeatures.features[].title` | 단일 언어 | ❌ ko, en, ja |
| `serviceFeatures.features[].description` | 단일 언어 | ❌ ko, en, ja |
| `serviceBenefits.benefits[].text` | 단일 언어 | ❌ ko, en, ja |
| `serviceProcess.steps[].title` | 단일 언어 | ❌ ko, en, ja |
| `serviceProcess.steps[].description` | 단일 언어 | ❌ ko, en, ja |

**결과**: 15개 필드가 언어별 지원 필요

---

### 3. Backend 지원 현황

#### ✅ Backend DTO (`UpdateSiteSettingsDto`)

- `colorTheme?: any` - ✅ 모든 ColorTheme 필드 지원
- `homeContent` - ✅ 언어별 지원 (ko, en, ja)
- `aboutContent` - ✅ 언어별 지원 (ko, en, ja)
- `aboutCompany` - ✅ 단일 언어 (마크다운)
- `aboutTeam` - ✅ 단일 언어 (마크다운)
- `serviceInfo` - ✅ 단일 언어 (마크다운)
- `companyStats` - ✅ JSON (언어별 미지원)
- `companyValues` - ✅ JSON (언어별 미지원)
- `teamMembers` - ✅ JSON (언어별 미지원)
- `teamCulture` - ✅ JSON (언어별 미지원)
- `serviceFeatures` - ✅ JSON (언어별 미지원)
- `serviceBenefits` - ✅ JSON (언어별 미지원)
- `serviceProcess` - ✅ JSON (언어별 미지원)

**Backend는 모든 필드를 지원하지만, 언어별 구조는 Frontend에서 구현 필요**

---

## 📋 개선 필요 사항 요약

### 1. 색상 테마 (우선순위: 높음)

**누락된 색상 필드 추가**:
- [ ] `backgroundSecondary` (HIGH) - 보조 배경 색상
- [ ] `buttonText` (HIGH) - 버튼 텍스트 색상
- [ ] `textInverse` (MEDIUM) - 역전 텍스트 (다크 배경용)
- [ ] `buttonSecondary` (MEDIUM) - 보조 버튼 색상

**위치**: `ColorThemeTab` 컴포넌트의 HIGH 및 MEDIUM 섹션에 추가

---

### 2. 언어별 콘텐츠 (우선순위: 매우 높음)

**언어별 입력 UI 추가 필요**:

#### 2.1 마크다운 콘텐츠 (3개)
- [ ] `aboutCompany` - 회사 소개 (마크다운 에디터)
- [ ] `aboutTeam` - 팀 소개 (마크다운 에디터)
- [ ] `serviceInfo` - 서비스 소개 (마크다운 에디터)

**구현 방법**: `content` 탭과 유사하게 언어 선택 후 마크다운 에디터 표시

#### 2.2 구조화된 데이터 (12개 필드)
- [ ] `companyStats.stats[].label` - 통계 라벨
- [ ] `companyValues.values[].title` - 가치 제목
- [ ] `companyValues.values[].description` - 가치 설명
- [ ] `teamMembers.members[].role` - 팀원 역할
- [ ] `teamMembers.members[].description` - 팀원 설명
- [ ] `teamCulture.culture[].title` - 문화 제목
- [ ] `teamCulture.culture[].description` - 문화 설명
- [ ] `serviceFeatures.features[].title` - 기능 제목
- [ ] `serviceFeatures.features[].description` - 기능 설명
- [ ] `serviceBenefits.benefits[].text` - 혜택 내용
- [ ] `serviceProcess.steps[].title` - 프로세스 제목
- [ ] `serviceProcess.steps[].description` - 프로세스 설명

**구현 방법**: 각 섹션에 언어 선택 탭 추가 후 언어별 입력 필드 표시

---

## 🎯 권장 구현 순서

### Phase 1: 색상 테마 완성 (빠른 구현)
1. `backgroundSecondary` 추가 (HIGH)
2. `buttonText` 추가 (HIGH)
3. `textInverse` 추가 (MEDIUM)
4. `buttonSecondary` 추가 (MEDIUM)

**예상 시간**: 30분

---

### Phase 2: 마크다운 콘텐츠 언어별 지원 (중간 난이도)
1. `aboutCompany` 언어별 입력 UI
2. `aboutTeam` 언어별 입력 UI
3. `serviceInfo` 언어별 입력 UI

**구현 방법**: `content` 탭의 패턴 재사용

**예상 시간**: 1-2시간

---

### Phase 3: 구조화된 데이터 언어별 지원 (높은 난이도)
1. 각 섹션에 언어 선택 UI 추가
2. 언어별 입력 필드 동적 렌더링
3. 데이터 구조 변경 (단일 언어 → 다국어 객체)

**예상 시간**: 3-4시간

---

## 📝 데이터 구조 변경 예시

### Before (단일 언어)
```typescript
companyValues: {
  values: [
    {
      icon: "mission",
      title: "미션",
      description: "우리의 미션은..."
    }
  ]
}
```

### After (다국어)
```typescript
companyValues: {
  values: [
    {
      icon: "mission",
      title: {
        ko: "미션",
        en: "Mission",
        ja: "ミッション"
      },
      description: {
        ko: "우리의 미션은...",
        en: "Our mission is...",
        ja: "私たちのミッションは..."
      }
    }
  ]
}
```

---

## ✅ 체크리스트

### 색상 테마
- [ ] `backgroundSecondary` 추가
- [ ] `buttonText` 추가
- [ ] `textInverse` 추가
- [ ] `buttonSecondary` 추가

### 언어별 콘텐츠
- [ ] `aboutCompany` 언어별 입력
- [ ] `aboutTeam` 언어별 입력
- [ ] `serviceInfo` 언어별 입력
- [ ] `companyStats` 언어별 라벨
- [ ] `companyValues` 언어별 제목/설명
- [ ] `teamMembers` 언어별 역할/설명
- [ ] `teamCulture` 언어별 제목/설명
- [ ] `serviceFeatures` 언어별 제목/설명
- [ ] `serviceBenefits` 언어별 내용
- [ ] `serviceProcess` 언어별 제목/설명

---

## 🔍 참고사항

1. **Backend 호환성**: Backend는 이미 모든 필드를 지원하므로, Frontend만 수정하면 됨
2. **하위 호환성**: 기존 단일 언어 데이터는 유지하고, 언어별 데이터로 점진적 마이그레이션 필요
3. **UI/UX**: 언어 선택은 `content` 탭과 동일한 패턴 사용 권장
4. **데이터 검증**: 언어별 필드가 모두 채워지지 않아도 저장 가능하도록 (선택적)

