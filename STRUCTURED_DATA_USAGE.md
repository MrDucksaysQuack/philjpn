# 구조화된 데이터 사용 현황

Settings 페이지의 "구조화된 데이터" 탭에서 관리하는 데이터들이 실제로 어디에 어떻게 사용되는지 정리합니다.

## 📊 데이터 흐름

```
Admin Settings (구조화된 데이터 탭)
    ↓ (저장)
Supabase Database (site_settings 테이블)
    ↓ (조회)
About 페이지들 (/about/company, /about/team, /about/service)
```

## 📍 각 데이터의 사용 위치

### 1. **회사 통계 (companyStats)** 
**관리 위치**: Settings → 구조화된 데이터 → 회사 통계  
**사용 위치**: `/about/company` 페이지

```typescript
// frontend/client/app/about/company/page.tsx (41-73줄)
const stats = settings?.companyStats?.stats || [];

// 통계 섹션으로 렌더링
{stats.length > 0 && (
  <section className="py-16 md:py-24">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {stats.map((stat: any, index: number) => (
        <StatCard
          key={index}
          icon={getIconComponent(stat.icon, "w-7 h-7")}
          value={stat.value}
          suffix={stat.suffix}
          label={stat.label}
        />
      ))}
    </div>
  </section>
)}
```

**표시 내용**:
- 아이콘 (icon)
- 숫자 값 (value)
- 접미사 (suffix, 예: "+", "%")
- 라벨 (label)

---

### 2. **회사 가치 (companyValues)**
**관리 위치**: Settings → 구조화된 데이터 → 회사 가치  
**사용 위치**: `/about/company` 페이지

```typescript
// frontend/client/app/about/company/page.tsx (42, 76-95줄)
const companyValues = settings?.companyValues?.values || [];

// 미션/비전/가치 섹션으로 렌더링
{companyValues.length > 0 && (
  <section className="py-16 md:py-24 bg-gray-50">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {companyValues.map((value: any, index: number) => (
        <FeatureCard
          key={index}
          icon={getIconComponent(value.icon, "w-8 h-8")}
          title={value.title}
          description={value.description}
        />
      ))}
    </div>
  </section>
)}
```

**표시 내용**:
- 아이콘 (icon)
- 제목 (title, 예: "미션", "비전", "가치")
- 설명 (description)

---

### 3. **팀원 (teamMembers)**
**관리 위치**: Settings → 구조화된 데이터 → 팀원  
**사용 위치**: `/about/team` 페이지

```typescript
// frontend/client/app/about/team/page.tsx (40, 55-76줄)
const teamMembers = settings?.teamMembers?.members || [];

// 팀원 섹션으로 렌더링
{teamMembers.length > 0 && (
  <section className="py-16 md:py-24">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {teamMembers.map((member: any, index: number) => (
        <TeamMemberCard
          key={index}
          name={member.name}
          role={member.role}
          description={member.description}
          imageUrl={member.imageUrl}
          socialLinks={member.socialLinks}
        />
      ))}
    </div>
  </section>
)}
```

**표시 내용**:
- 이름 (name)
- 역할 (role)
- 설명 (description)
- 프로필 이미지 URL (imageUrl)
- 소셜 링크 (socialLinks: email, linkedin, github)

---

### 4. **팀 문화 (teamCulture)**
**관리 위치**: Settings → 구조화된 데이터 → 팀 문화  
**사용 위치**: `/about/team` 페이지

```typescript
// frontend/client/app/about/team/page.tsx (41, 79-98줄)
const teamCulture = settings?.teamCulture?.culture || [];

// 팀 문화 섹션으로 렌더링
{teamCulture.length > 0 && (
  <section className="py-16 md:py-24 bg-gray-50">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {teamCulture.map((culture: any, index: number) => (
        <FeatureCard
          key={index}
          icon={getIconComponent(culture.icon, "w-8 h-8")}
          title={culture.title}
          description={culture.description}
        />
      ))}
    </div>
  </section>
)}
```

**표시 내용**:
- 아이콘 (icon)
- 제목 (title)
- 설명 (description)

---

### 5. **서비스 기능 (serviceFeatures)**
**관리 위치**: Settings → 구조화된 데이터 → 서비스 기능  
**사용 위치**: `/about/service` 페이지

```typescript
// frontend/client/app/about/service/page.tsx (42, 65-84줄)
const features = settings?.serviceFeatures?.features || [];

// 주요 기능 섹션으로 렌더링
<section className="py-16 md:py-24">
  {features.length > 0 && (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {features.map((feature: any, index: number) => (
        <FeatureCard
          key={index}
          icon={getIconComponent(feature.icon, "w-8 h-8")}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  )}
</section>
```

**표시 내용**:
- 아이콘 (icon)
- 제목 (title)
- 설명 (description)

---

### 6. **서비스 혜택 (serviceBenefits)**
**관리 위치**: Settings → 구조화된 데이터 → 서비스 혜택  
**사용 위치**: `/about/service` 페이지

```typescript
// frontend/client/app/about/service/page.tsx (43, 87-97줄)
const benefits = settings?.serviceBenefits?.benefits || [];

// 혜택 섹션으로 렌더링
{benefits.length > 0 && (
  <section className="py-16 md:py-24 bg-gray-50">
    <BenefitList benefits={benefits} />
  </section>
)}
```

**표시 내용**:
- 텍스트 (text) - 각 혜택 항목

---

### 7. **서비스 프로세스 (serviceProcess)**
**관리 위치**: Settings → 구조화된 데이터 → 서비스 프로세스  
**사용 위치**: `/about/service` 페이지

```typescript
// frontend/client/app/about/service/page.tsx (44, 100-120줄)
const processSteps = settings?.serviceProcess?.steps || [];

// 프로세스 섹션으로 렌더링
{processSteps.length > 0 && (
  <section className="py-16 md:py-24">
    <div className="space-y-8 md:space-y-12">
      {processSteps.map((step: any, index: number) => (
        <ProcessStep
          key={index}
          step={step.step || index + 1}
          title={step.title}
          description={step.description}
          isLast={index === processSteps.length - 1}
        />
      ))}
    </div>
  </section>
)}
```

**표시 내용**:
- 단계 번호 (step)
- 제목 (title)
- 설명 (description)

---

## 🔄 데이터 흐름 상세

### 1. 저장 과정
1. Admin이 Settings 페이지에서 구조화된 데이터 입력
2. "저장" 버튼 클릭
3. `adminAPI.updateSiteSettings()` 호출
4. 백엔드에서 Supabase `site_settings` 테이블에 JSONB 형식으로 저장

### 2. 조회 과정
1. About 페이지 로드 시 `siteSettingsAPI.getPublicSettings()` 호출
2. 백엔드에서 `site_settings` 테이블에서 데이터 조회
3. JSONB 필드를 JavaScript 객체로 파싱
4. 각 페이지에서 필요한 데이터 추출하여 렌더링

### 3. 렌더링
- 각 데이터는 조건부 렌더링 (`{data.length > 0 && ...}`)
- 데이터가 없으면 해당 섹션이 표시되지 않음
- 각 데이터는 적절한 컴포넌트로 렌더링:
  - `StatCard`: 통계 카드
  - `FeatureCard`: 기능/가치 카드
  - `TeamMemberCard`: 팀원 카드
  - `BenefitList`: 혜택 리스트
  - `ProcessStep`: 프로세스 단계

---

## 📝 요약

| 데이터 | 관리 위치 | 사용 페이지 | 컴포넌트 |
|--------|----------|------------|---------|
| companyStats | Settings → 구조화된 데이터 → 회사 통계 | `/about/company` | StatCard |
| companyValues | Settings → 구조화된 데이터 → 회사 가치 | `/about/company` | FeatureCard |
| teamMembers | Settings → 구조화된 데이터 → 팀원 | `/about/team` | TeamMemberCard |
| teamCulture | Settings → 구조화된 데이터 → 팀 문화 | `/about/team` | FeatureCard |
| serviceFeatures | Settings → 구조화된 데이터 → 서비스 기능 | `/about/service` | FeatureCard |
| serviceBenefits | Settings → 구조화된 데이터 → 서비스 혜택 | `/about/service` | BenefitList |
| serviceProcess | Settings → 구조화된 데이터 → 서비스 프로세스 | `/about/service` | ProcessStep |

---

## ✅ 확인 사항

모든 구조화된 데이터는 실제로 About 페이지에서 사용되고 있으며, 데이터가 없으면 해당 섹션이 표시되지 않습니다. Settings에서 입력한 내용이 즉시 About 페이지에 반영됩니다.

