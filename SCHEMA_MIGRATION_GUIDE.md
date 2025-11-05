# 🔄 SiteSettings 스키마 확장 마이그레이션 가이드

## 📋 추가된 필드

다음 JSON 필드들이 `site_settings` 테이블에 추가되었습니다:

- `companyStats` (JSONB) - 회사 통계 데이터
- `teamMembers` (JSONB) - 팀원 데이터
- `serviceFeatures` (JSONB) - 서비스 기능 데이터
- `serviceBenefits` (JSONB) - 서비스 혜택 데이터
- `serviceProcess` (JSONB) - 서비스 프로세스 데이터

## 🚀 Supabase에서 수동 마이그레이션

### SQL 쿼리 실행

Supabase SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- ============================================
-- SITE_SETTINGS 테이블에 구조화된 데이터 필드 추가
-- ============================================

-- 회사 통계 데이터
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "companyStats" JSONB;

-- 팀원 데이터
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "teamMembers" JSONB;

-- 서비스 기능 데이터
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "serviceFeatures" JSONB;

-- 서비스 혜택 데이터
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "serviceBenefits" JSONB;

-- 서비스 프로세스 데이터
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "serviceProcess" JSONB;

-- 성공 메시지
SELECT '✅ site_settings 테이블에 구조화된 데이터 필드가 성공적으로 추가되었습니다!' AS message;
```

### 데이터 구조 예시

#### companyStats
```json
{
  "stats": [
    {
      "icon": "BuildingIcon",
      "value": 1000,
      "suffix": "+",
      "label": "활성 사용자"
    },
    {
      "icon": "TargetIcon",
      "value": 500,
      "suffix": "+",
      "label": "시험 문제"
    },
    {
      "icon": "HeartIcon",
      "value": 95,
      "suffix": "%",
      "label": "만족도"
    }
  ]
}
```

#### teamMembers
```json
{
  "members": [
    {
      "name": "김철수",
      "role": "CEO & Founder",
      "description": "10년 이상의 교육 기술 경험을 보유하고 있습니다.",
      "imageUrl": null,
      "socialLinks": {
        "email": "ceo@example.com",
        "linkedin": "https://linkedin.com/in/...",
        "github": null
      }
    }
  ]
}
```

#### serviceFeatures
```json
{
  "features": [
    {
      "icon": "TargetIcon",
      "title": "맞춤형 학습",
      "description": "개인별 학습 패턴을 분석하여 최적화된 시험을 추천합니다."
    }
  ]
}
```

#### serviceBenefits
```json
{
  "benefits": [
    { "text": "개인 맞춤형 학습 경험 제공" },
    { "text": "실시간 성과 분석 및 피드백" }
  ]
}
```

#### serviceProcess
```json
{
  "steps": [
    {
      "step": 1,
      "title": "시험 선택",
      "description": "목표에 맞는 시험을 선택하거나 AI 추천을 받습니다."
    }
  ]
}
```

## ✅ 확인 방법

마이그레이션 후 다음 쿼리로 확인:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name IN ('companyStats', 'teamMembers', 'serviceFeatures', 'serviceBenefits', 'serviceProcess')
ORDER BY column_name;
```

## 📝 참고사항

- 모든 필드는 `NULL` 허용 (선택적)
- JSON 형식으로 데이터 저장
- Admin UI에서 관리 가능
- 기존 데이터는 그대로 유지됨

