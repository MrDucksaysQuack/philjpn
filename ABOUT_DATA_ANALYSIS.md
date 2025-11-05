# 📊 About 페이지 데이터 구조 분석

## 현재 상황

### 1. 하드코딩된 데이터

#### 회사 소개 페이지 (`company/page.tsx`)
- ❌ 통계 카드 데이터 (활성 사용자, 시험 문제, 만족도) - 하드코딩
- ✅ 회사 소개 본문 - DB에서 관리 (`aboutCompany`)

#### 팀 소개 페이지 (`team/page.tsx`)
- ❌ 팀원 데이터 (이름, 역할, 설명) - 하드코딩
- ✅ 팀 소개 본문 - DB에서 관리 (`aboutTeam`)

#### 서비스 소개 페이지 (`service/page.tsx`)
- ❌ 기능 카드 데이터 (제목, 설명) - 하드코딩
- ❌ 혜택 리스트 - 하드코딩
- ❌ 프로세스 단계 - 하드코딩
- ✅ 서비스 소개 본문 - DB에서 관리 (`serviceInfo`)

### 2. 현재 Supabase/SiteSettings 구조

```prisma
model SiteSettings {
  // 기본 정보
  companyName String
  logoUrl     String?
  faviconUrl  String?
  
  // 색상 테마
  primaryColor   String?
  secondaryColor String?
  accentColor    String?
  colorScheme    Json?
  
  // 콘텐츠 (텍스트만)
  aboutCompany String? @db.Text // 마크다운
  aboutTeam    String? @db.Text // 마크다운
  serviceInfo  String? @db.Text // 마크다운
  contactInfo  Json?   // { email, phone, address, socialMedia }
}
```

## 문제점

1. **구조화된 데이터 관리 불가**
   - 통계, 팀원, 기능, 혜택, 프로세스가 하드코딩되어 Admin에서 관리 불가
   - 마크다운 텍스트만으로는 구조화된 데이터 표현 어려움

2. **확장성 부족**
   - 새로운 통계 추가 시 코드 수정 필요
   - 팀원 추가/삭제 시 코드 수정 필요
   - 기능/혜택/프로세스 변경 시 코드 수정 필요

3. **일관성 문제**
   - 일부는 DB에서 관리, 일부는 하드코딩으로 일관성 부족

## 개선 방안

### Option 1: Supabase 스키마 확장 (권장)

**장점:**
- 완전한 데이터 관리 가능
- Admin UI에서 모든 데이터 관리
- 확장성 우수

**단점:**
- 마이그레이션 필요
- 스키마 변경 필요

**추가 필드:**
```prisma
model SiteSettings {
  // ... 기존 필드 ...
  
  // 구조화된 데이터 (JSON)
  companyStats    Json? // { stats: [{ icon, value, suffix, label }] }
  teamMembers     Json? // { members: [{ name, role, description, imageUrl, socialLinks }] }
  serviceFeatures Json? // { features: [{ icon, title, description }] }
  serviceBenefits Json? // { benefits: [{ text }] }
  serviceProcess  Json? // { steps: [{ step, title, description }] }
}
```

### Option 2: 마크다운 확장 (간단)

**장점:**
- 스키마 변경 불필요
- 기존 구조 유지

**단점:**
- 마크다운 파싱 로직 필요
- 구조화된 데이터 관리 어려움
- 확장성 부족

**예시:**
```markdown
## Stats
- 활성 사용자: 1000+
- 시험 문제: 500+
- 만족도: 95%

## Team Members
- 김철수 | CEO & Founder | 10년 이상의 교육 기술 경험
...
```

### Option 3: 하이브리드 (현재 구조 유지 + 선택적 확장)

**장점:**
- 점진적 개선 가능
- 기존 데이터 유지
- 필요한 부분만 확장

**단점:**
- 일관성 약간 부족
- 두 가지 방식 병행

**구조:**
- 기본 텍스트: 기존 `aboutCompany`, `aboutTeam`, `serviceInfo` 사용
- 구조화된 데이터: 새 JSON 필드 추가 (선택적)

## 추천 방안

**Option 1 (Supabase 스키마 확장)** 을 권장합니다.

### 이유:
1. **완전한 관리**: Admin에서 모든 데이터 관리 가능
2. **확장성**: 새로운 필드 추가 용이
3. **일관성**: 모든 About 페이지 데이터를 DB에서 관리
4. **유지보수**: 코드 수정 없이 데이터만 변경 가능

### 구현 계획:

1. **Prisma 스키마 확장**
   ```prisma
   companyStats    Json?
   teamMembers     Json?
   serviceFeatures Json?
   serviceBenefits Json?
   serviceProcess  Json?
   ```

2. **DTO 확장**
   - `UpdateSiteSettingsDto`에 새 필드 추가
   - 타입 정의 추가

3. **Admin UI 개선**
   - 통계 관리 섹션
   - 팀원 관리 섹션 (CRUD)
   - 서비스 기능/혜택/프로세스 관리 섹션

4. **Frontend 페이지 수정**
   - 하드코딩된 데이터 제거
   - DB에서 로드한 데이터 사용

## 다음 단계

1. ✅ 현재 상황 분석 (완료)
2. ⏳ 스키마 확장 결정
3. ⏳ Prisma 스키마 수정
4. ⏳ 마이그레이션 생성
5. ⏳ DTO 및 API 확장
6. ⏳ Admin UI 개선
7. ⏳ Frontend 페이지 수정

