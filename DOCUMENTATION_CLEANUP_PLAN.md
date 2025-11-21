# 문서 정리 계획 (Documentation Cleanup Plan)

## 현재 상황
- **총 문서 수**: 75개
- **위치**: 프로젝트 루트에 대부분 산재
- **문제점**: 중복, 구식 문서, 카테고리별 분류 부재

## 분류 체계

### 1. **핵심 문서 (Core Documentation)** - 유지 및 통합
이 문서들은 `docs/` 폴더로 이동하고 통합/정리 필요

#### 1.1 아키텍처 & 시스템 구조
- `EXAM_SYSTEM_ARCHITECTURE.md` ✅ 유지
- `SYSTEM_ARCHITECTURE_FLOW.md` ✅ 유지
- `ARCHITECTURE_ANALYSIS.md` → `docs/architecture/`로 이동
- `DATABASE_STRUCTURE.md` → `docs/architecture/`로 이동
- `STRUCTURED_DATA_USAGE.md` → `docs/architecture/`로 이동

#### 1.2 설정 & 테마
- `SETTINGS_IMPROVEMENT_SUMMARY.md` → 최신 버전만 유지
- `SETTINGS_FEATURE_COMPARISON.md` → 통합 가능
- `SETTINGS_TAB_EVALUATION.md` → 통합 가능
- `COLOR_SETTINGS_RELATIONSHIP.md` → `docs/settings/`로 이동
- `THEME_COLOR_IMPROVEMENT_SUMMARY.md` → `docs/settings/`로 이동
- `THEME_COLOR_APPLICATION.md` → `docs/settings/`로 이동
- `FRONTEND_COLOR_THEME_APPLICATION_ANALYSIS.md` → `docs/settings/`로 이동
- `SOCIAL_AUTH_AND_COLOR_THEME_PLAN.md` → `docs/settings/`로 이동
- `SETTINGS_ABOUT_VALIDATION.md` → `docs/settings/`로 이동
- `SYSTEM_SETTINGS_IMPROVEMENT_PLAN.md` → `docs/settings/`로 이동
- `SYSTEM_SETTINGS_IMPROVEMENT_VERIFICATION.md` → `docs/settings/`로 이동

#### 1.3 UI/UX 개선
- `UI_FLOW_IMPROVEMENT_SUMMARY.md` → `docs/ux/`로 이동
- `UI_FLOW_ISSUES_ANALYSIS.md` → `docs/ux/`로 이동
- `ADMIN_UX_IMPROVEMENT_PLAN.md` → `docs/ux/`로 이동
- `ADMIN_UX_REORGANIZATION_PLAN.md` → `docs/ux/`로 이동
- `FRONTEND_UX_ANALYSIS.md` → `docs/ux/`로 이동
- `ADMIN_DASHBOARD_IMPROVEMENT_PLAN.md` → `docs/ux/`로 이동

#### 1.4 콘텐츠 관리
- `CONTENT_MANAGEMENT_FEATURES.md` → `docs/features/`로 이동
- `CONTENT_MANAGEMENT_CLARIFICATION.md` → `docs/features/`로 이동
- `CONTENT_MANAGEMENT_IMPLEMENTATION_STATUS.md` → `docs/features/`로 이동
- `CONTENT_MANAGEMENT_IMPROVEMENT_PLAN.md` → `docs/features/`로 이동
- `QUESTION_MANAGEMENT_CRUD_ANALYSIS.md` → `docs/features/`로 이동

#### 1.5 Supabase 관련
- `SUPABASE_SCHEMA_VERIFICATION.md` → `docs/supabase/`로 이동
- `SUPABASE_SCHEMA_EXPORT_GUIDE.md` → `docs/supabase/`로 이동
- `SUPABASE_BACKEND_SYNC_GUIDE.md` → `docs/supabase/`로 이동
- `SUPABASE_DATA_DEBUGGING.md` → `docs/supabase/`로 이동
- `SUPABASE_BACKEND_SYNC_ANALYSIS.md` → `docs/supabase/`로 이동
- `SUPABASE_SAMPLE_DATA_GUIDE.md` → `docs/supabase/`로 이동
- `SUPABASE_VERIFICATION_CHECKLIST.md` → `docs/supabase/`로 이동
- `SUPABASE_SQL_SETUP_GUIDE.md` → `docs/supabase/`로 이동
- `FRONTEND_SUPABASE_SCHEMA_COMPARISON.md` → `docs/supabase/`로 이동

### 2. **기술 문서 (Technical Documentation)** - 통합 필요

#### 2.1 에러 해결 & 디버깅
- `ERROR_RESOLUTION_CHECKLIST.md` → `docs/troubleshooting/`로 이동
- `ERROR_ANALYSIS_AND_RESOLUTION.md` → `docs/troubleshooting/`로 이동
- `ERROR_PREVENTION_STRATEGY.md` → `docs/troubleshooting/`로 이동
- `RAILWAY_ERROR_LOGGING_FIX.md` → `docs/troubleshooting/`로 이동
- `LOGIN_400_ERROR_ANALYSIS.md` → `docs/troubleshooting/`로 이동
- `REACT_ERROR_310_ANALYSIS.md` → `docs/troubleshooting/`로 이동
- `EXTERNAL_SERVICES_DEBUG_GUIDE.md` → `docs/troubleshooting/`로 이동

#### 2.2 React & Frontend 이슈
- `frontend/client/HOOKS_ORDER_FIX_REVIEW.md` → `docs/frontend/`로 이동
- `frontend/client/HYDRATION_MISMATCH_REVIEW.md` → `docs/frontend/`로 이동
- `frontend/client/MEMOIZATION_OPTIMIZATION.md` → `docs/frontend/`로 이동
- `frontend/client/I18N_COMPLETION_REPORT.md` → `docs/frontend/`로 이동
- `REACT_HOOKS_COMPREHENSIVE_CHECK.md` → `docs/frontend/`로 이동
- `REACT_HOOKS_FIX_SUMMARY.md` → `docs/frontend/`로 이동
- `FRONTEND_I18N_ANALYSIS.md` → `docs/frontend/`로 이동

#### 2.3 Backend 관련
- `backend/AI_SETUP.md` → `docs/backend/`로 이동
- `BACKEND_EVALUATION.md` → `docs/backend/`로 이동
- `BACKEND_EXPANSION_PLAN.md` → `docs/backend/`로 이동
- `BACKEND_EXPANSION_STATUS.md` → `docs/backend/`로 이동
- `BACKEND_FRONTEND_CONNECTION_ANALYSIS.md` → `docs/backend/`로 이동
- `BACKEND_ISSUES_ANALYSIS.md` → `docs/backend/`로 이동
- `BACKEND_SYSTEM_ANALYSIS.md` → `docs/backend/`로 이동
- `DEEP_BACKEND_FRONTEND_ANALYSIS.md` → `docs/backend/`로 이동

### 3. **평가 & 분석 문서 (Analysis Documents)** - 아카이브

#### 3.1 완료된 평가 문서 → `docs/archive/analysis/`로 이동
- `COMPREHENSIVE_COMPLETENESS_EVALUATION.md`
- `COMPLETENESS_EVALUATION.md`
- `FRONTEND_COMPREHENSIVE_EVALUATION.md`
- `FRONTEND_EVALUATION.md`
- `TECHNICAL_VALUE_ASSESSMENT.md`
- `ADMIN_MANAGEMENT_ANALYSIS.md`
- `API_UTILIZATION_ANALYSIS.md`
- `BUG_PREVENTION_ANALYSIS.md`
- `BUTTON_COLOR_ANALYSIS.md`
- `BUTTON_FUNCTIONALITY_CHECK.md`
- `FRONTEND_CONNECTIVITY_CHECK.md`
- `FRONTEND_SQL_DATA_INTEGRATION_CHECK.md`
- `WORDBOOK_UTILIZATION_EVALUATION.md`
- `CODE_SCHEMA_USAGE_VERIFICATION.md`
- `DEPLOYMENT_INTEGRATION_STATUS.md`

#### 3.2 개선 계획 문서 → `docs/archive/plans/`로 이동
- `IMPROVEMENT_PLAN.md`
- `IMPLEMENTATION_REVIEW_REPORT.md`
- `PHASE1_MIGRATION_SQL.md`
- `PHASE1_VERIFICATION.md`
- `TEMPLATE_POOL_BIDIRECTIONAL_IMPROVEMENT.md`
- `AUTH_VALIDATION_STANDARDIZATION.md`
- `FILE_UPLOAD_IMPLEMENTATION.md`

### 4. **README 파일** - 유지
- `backend/README.md` ✅ 유지
- `frontend/client/README.md` ✅ 유지
- `backend/prisma/SAMPLE_DATA_GUIDE.md` → `docs/database/`로 이동

## 제안하는 폴더 구조

```
exam-platform/
├── README.md (새로 생성 - 프로젝트 개요 및 문서 인덱스)
├── docs/
│   ├── README.md (문서 인덱스)
│   ├── architecture/
│   │   ├── README.md
│   │   ├── system-architecture.md (통합)
│   │   └── database-structure.md
│   ├── settings/
│   │   ├── README.md
│   │   ├── settings-overview.md (통합)
│   │   └── theme-colors.md (통합)
│   ├── ux/
│   │   ├── README.md
│   │   └── ui-improvements.md (통합)
│   ├── features/
│   │   ├── README.md
│   │   └── content-management.md (통합)
│   ├── supabase/
│   │   ├── README.md
│   │   ├── setup-guide.md (통합)
│   │   └── schema-guide.md (통합)
│   ├── frontend/
│   │   ├── README.md
│   │   ├── react-issues.md (통합)
│   │   └── i18n.md (통합)
│   ├── backend/
│   │   ├── README.md
│   │   └── ai-setup.md
│   ├── troubleshooting/
│   │   ├── README.md
│   │   └── error-resolution.md (통합)
│   ├── database/
│   │   └── sample-data-guide.md
│   └── archive/
│       ├── analysis/
│       └── plans/
├── backend/
│   └── README.md (유지)
└── frontend/
    └── client/
        └── README.md (유지)
```

## 실행 계획

### Phase 1: 폴더 구조 생성
1. `docs/` 폴더 및 하위 폴더 생성
2. 각 카테고리별 `README.md` 생성

### Phase 2: 문서 이동
1. 카테고리별로 문서를 해당 폴더로 이동
2. 중복/구식 문서는 `archive/`로 이동

### Phase 3: 문서 통합
1. 유사한 주제의 문서들을 하나로 통합
2. 최신 정보만 유지하고 구식 정보는 제거

### Phase 4: 인덱스 생성
1. 루트 `README.md` 생성
2. `docs/README.md`에 전체 문서 인덱스 작성

### Phase 5: 정리 완료
1. 프로젝트 루트의 모든 .md 파일 제거 (docs/로 이동 완료)
2. Git 커밋 및 푸시

## 우선순위

### 높음 (즉시 처리)
- 프로젝트 루트의 75개 파일을 `docs/`로 이동
- 핵심 문서 통합 (Settings, Architecture)

### 중간 (단계적 처리)
- 평가/분석 문서 아카이브
- 구식 문서 정리

### 낮음 (선택적 처리)
- 문서 내용 개선 및 업데이트
- 다이어그램 추가

## 예상 결과

- **현재**: 75개 파일이 프로젝트 루트에 산재
- **목표**: 
  - 핵심 문서: ~15개 (docs/ 하위)
  - 아카이브: ~30개 (docs/archive/)
  - README: 3개 (루트, backend, frontend)
  - **총 프로젝트 루트 .md 파일: 1개 (README.md)**

## 다음 단계

이 계획을 승인하시면 단계별로 실행하겠습니다.

