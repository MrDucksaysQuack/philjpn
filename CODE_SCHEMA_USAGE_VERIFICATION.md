# 🔍 코드-스키마 사용 검증 보고서

## 📋 개요

이 문서는 Supabase 스키마에 정의된 필드들이 실제 코드베이스(Backend/Frontend)에서 올바르게 사용되고 있는지 검증한 보고서입니다.

**검증 일시**: 2024년  
**검증 범위**: Backend (NestJS), Frontend (Next.js/React)  
**스키마 기준**: `backend/prisma/schema.prisma`

---

## ✅ 필드별 사용 검증

### 1. User 모델 - 소셜 로그인 필드

#### 1.1 provider, providerId, providerData

**스키마 정의**:
```prisma
provider     String? // 'local', 'google', 'facebook'
providerId   String? // 소셜 제공자의 사용자 ID
providerData Json? // 소셜 제공자에서 받은 추가 데이터
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/auth/auth.service.ts` (291-350줄)
  - `socialLogin()` 메서드에서 사용
  - 사용자 생성/업데이트 시 필드 설정
- ✅ `backend/src/modules/auth/strategies/google.strategy.ts`
  - Google OAuth 프로필에서 `provider`, `providerId` 설정
- ✅ `backend/src/modules/auth/strategies/facebook.strategy.ts`
  - Facebook OAuth 프로필에서 `provider`, `providerId` 설정

**Frontend 사용 확인**:
- ⚠️ 직접 사용되지 않음 (인증은 Backend에서 처리)

**검증 결과**: ✅ **완전히 사용됨**

---

### 2. Exam 모델 - 워크플로우 필드

#### 2.1 reviewerId, approvedBy, reviewedAt, approvedAt, reviewComment, rejectionReason

**스키마 정의**:
```prisma
reviewerId        String? // 검수자 ID
approvedBy        String? // 승인자 ID
reviewedAt        DateTime? // 검수 일시
approvedAt        DateTime? // 승인 일시
reviewComment     String? // 검수 코멘트
rejectionReason   String? // 거부 사유
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/core/exam/services/exam-workflow.service.ts`
  - `assignReviewer()`: `reviewerId` 설정
  - `approve()`: `approvedBy`, `approvedAt`, `reviewComment` 설정
  - `reject()`: `rejectionReason` 설정
  - `getWorkflowStatus()`: 모든 필드 조회

**Frontend 사용 확인**:
- ✅ `frontend/client/lib/api.ts` (604-620줄)
  - `getWorkflowStatus()` API 타입 정의에 모든 필드 포함
- ✅ `frontend/client/app/admin/exams/[id]/page.tsx` (1369-1932줄)
  - `WorkflowModal` 컴포넌트에서 모든 필드 표시
  - `reviewedAt`, `approvedAt`, `reviewComment`, `rejectionReason` UI 표시

**검증 결과**: ✅ **완전히 사용됨**

---

### 3. Exam 모델 - 버전 관리 필드

#### 3.1 parentExamId, version, versionNumber

**스키마 정의**:
```prisma
parentExamId      String? // 원본 시험 ID (버전이 있는 경우)
version           String? // 버전 식별자 (예: "A", "B", "C")
versionNumber     Int? // 버전 번호 (1, 2, 3...)
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/core/exam/exam.service.ts` (264-474줄)
  - `clone()` 메서드에서 버전 관리 로직 사용
  - `parentExamId` 설정
  - `version`, `versionNumber` 계산 및 설정

**Frontend 사용 확인**:
- ⚠️ UI에서 직접 표시되지 않음 (백엔드 로직에서만 사용)

**Backend 사용 확인**:
- ✅ `backend/src/modules/core/exam/exam.service.ts` (264-474줄)
  - `clone()` 메서드에서 버전 관리 로직 사용
  - `parentExamId` 설정
  - `version`, `versionNumber` 계산 및 설정

**Frontend 사용 확인**:
- ✅ `frontend/client/app/exams/[id]/page.tsx`
  - 버전 정보 표시 UI 추가 (version, versionNumber, parentExamId)
- ✅ `frontend/client/app/admin/exams/[id]/page.tsx`
  - Admin 페이지에 버전 정보 표시 추가
- ✅ `frontend/client/lib/api.ts`
  - Exam 인터페이스에 버전 필드 추가

**검증 결과**: ✅ **완전히 사용됨** (Backend + Frontend UI)

---

### 4. QuestionPool 모델 - 자동 선택 필드

#### 4.1 autoSelectRules, isAutoSelect

**스키마 정의**:
```prisma
autoSelectRules Json? // 자동 선택 규칙
isAutoSelect    Boolean @default(false) // 자동 선택 활성화 여부
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/admin/services/question-pool.service.ts` (42-116줄)
  - `autoSelectQuestions()` 메서드에서 `autoSelectRules` 사용
- ✅ `backend/src/modules/core/exam/services/exam-validator.service.ts` (300-347줄)
  - `checkQuestionPoolAvailability()` 메서드에서 `isAutoSelect`, `autoSelectRules` 사용

**Frontend 사용 확인**:
- ✅ `frontend/client/lib/api.ts` (1530-1555줄)
  - `QuestionPool` 인터페이스에 필드 정의
- ✅ `frontend/client/app/admin/question-pools/page.tsx` (242-253줄)
  - `QuestionPoolModal`에서 `isAutoSelect`, `autoSelectRules` 상태 관리
  - UI에서 자동 선택 규칙 설정 가능

**검증 결과**: ✅ **완전히 사용됨**

---

### 5. SiteSettings 모델 - 색상 테마 필드

#### 5.1 colorTheme

**스키마 정의**:
```prisma
colorTheme Json? // 고급 색상 테마 (ColorTheme 인터페이스 구조)
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/admin/dto/update-site-settings.dto.ts` (131-161줄)
  - `UpdateSiteSettingsDto`에 `colorTheme` 필드 정의
- ✅ `backend/src/modules/admin/services/site-settings.service.ts`
  - 저장 및 조회 시 `colorTheme` 처리

**Frontend 사용 확인**:
- ✅ `frontend/client/lib/api.ts` (1136-1160줄, 1355-1379줄)
  - `SiteSettings`, `UpdateSiteSettingsDto` 인터페이스에 `colorTheme` 정의
- ✅ `frontend/client/app/admin/settings/page.tsx` (2217-2531줄)
  - `ColorThemeTab` 컴포넌트에서 `colorTheme` 편집 UI 제공
- ✅ `frontend/client/lib/theme.ts` (67-214줄)
  - `applyColorTheme()` 함수에서 `colorTheme` 적용

**검증 결과**: ✅ **완전히 사용됨**

---

### 6. QuestionStatistics 모델

**스키마 정의**:
```prisma
model QuestionStatistics {
  id                   String    @id @default(uuid())
  questionId           String    @unique
  totalAttempts        Int       @default(0)
  correctCount         Int       @default(0)
  incorrectCount       Int       @default(0)
  unansweredCount      Int       @default(0)
  averageTimeSpent     Int?
  calculatedDifficulty Decimal?  @db.Decimal(3, 2)
  correctRate          Decimal?  @db.Decimal(5, 2)
  commonMistakes       Json?
  lastCalculatedAt     DateTime?
  // ...
}
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/admin/services/question-statistics.service.ts`
  - 통계 계산 및 저장 로직 구현
- ✅ `backend/src/modules/admin/admin.controller.ts`
  - 통계 조회 API 엔드포인트
- ✅ `backend/src/modules/core/grading/grading.service.ts`
  - 채점 시 통계 업데이트

**Frontend 사용 확인**:
- ⚠️ 직접 사용되지 않음 (Admin 대시보드에서만 간접 사용 가능)

**검증 결과**: ✅ **Backend에서 완전히 사용됨**

---

### 7. ExamVersion 모델

**스키마 정의**:
```prisma
model ExamVersion {
  id            String   @id @default(uuid())
  examId        String   @unique
  version       String   @db.VarChar(10)
  versionNumber Int
  questionOrder Json?
  // ...
}
```

**Backend 사용 확인**:
- ✅ `exam.service.ts`의 `clone()` 메서드 (457-464줄)
  - 버전 생성 시 `ExamVersion` 레코드 생성
  - 버전별 문제 순서(`questionOrder`) 저장
- ✅ `exam.service.ts`의 `findOne()` 메서드 (104줄)
  - `examVersion: true`로 ExamVersion 정보 포함
- ✅ `exam.service.ts`의 `getVersions()` 메서드 (518-543줄)
  - 버전 목록과 함께 ExamVersion 정보 반환

**Frontend 사용 확인**:
- ✅ `admin/exams/[id]/page.tsx`의 `ExamVersionInfo` 컴포넌트 (796-857줄)
  - 버전 정보 표시 (버전 식별자, 버전 번호, 원본 시험 ID)
  - 버전별 문제 순서 정보 표시
  - 생성일/수정일 표시
- ✅ `lib/api.ts`의 `Exam` 인터페이스 (237-243줄)
  - `examVersion` 필드 타입 정의

**검증 결과**: ✅ **완전히 사용됨**

---

### 8. ContentVersion 모델

**스키마 정의**:
```prisma
model ContentVersion {
  id                String           @id @default(uuid())
  contentType       String           @db.VarChar(20)
  contentId         String
  versionNumber     Int
  versionLabel      String?
  snapshot          Json
  changeDescription String?
  changedBy         String?
  parentVersionId   String?
  // ...
}
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/admin/services/content-version.service.ts`
  - 버전 생성, 조회, 비교 로직 구현
- ✅ `backend/src/modules/admin/admin.controller.ts`
  - 버전 관리 API 엔드포인트

**Frontend 사용 확인**:
- ⚠️ 직접 사용되지 않음 (Admin 기능으로만 사용 가능)

**검증 결과**: ✅ **Backend에서 완전히 사용됨**

---

### 9. Question 모델 - 미디어 필드

#### 9.1 imageUrl, audioUrl, audioPlayLimit

**스키마 정의**:
```prisma
imageUrl          String? // 문제 이미지 URL
audioUrl          String? // 오디오 파일 URL
audioPlayLimit    Int?    @default(2) // 오디오 재생 횟수 제한
```

**Backend 사용 확인**:
- ✅ `backend/src/modules/core/question/dto/create-question.dto.ts`
  - DTO에 필드 정의
- ✅ `backend/src/modules/core/exam/exam.service.ts`
  - 시험 복제 시 미디어 필드 복사
- ✅ `backend/src/modules/admin/services/content-version.service.ts`
  - 버전 관리 시 스냅샷에 포함

**Frontend 사용 확인**:
- ✅ `frontend/client/app/exams/[id]/take/page.tsx`
  - 시험 응시 페이지에서 이미지/오디오 표시
- ✅ `frontend/client/app/admin/questions/page.tsx`
  - 문제 생성/수정 시 미디어 필드 편집
- ✅ `frontend/client/lib/api.ts`
  - API 인터페이스에 필드 정의

**검증 결과**: ✅ **완전히 사용됨**

---

## 📊 종합 검증 결과

### 필드 사용 현황

| 카테고리 | 필드 그룹 | Backend | Frontend | 상태 |
|---------|----------|---------|----------|------|
| User | 소셜 로그인 (provider, providerId, providerData) | ✅ | N/A | ✅ 완전 |
| Exam | 워크플로우 (reviewerId, approvedBy, etc.) | ✅ | ✅ | ✅ 완전 |
| Exam | 버전 관리 (parentExamId, version, versionNumber) | ✅ | ✅ | ✅ 완전 |
| QuestionPool | 자동 선택 (autoSelectRules, isAutoSelect) | ✅ | ✅ | ✅ 완전 |
| SiteSettings | 색상 테마 (colorTheme) | ✅ | ✅ | ✅ 완전 |
| QuestionStatistics | 전체 모델 | ✅ | ⚠️ | ✅ Backend만 |
| ExamVersion | 전체 모델 | ✅ | ✅ | ✅ 완전 |
| ContentVersion | 전체 모델 | ✅ | ⚠️ | ✅ Backend만 |
| Question | 미디어 (imageUrl, audioUrl, audioPlayLimit) | ✅ | ✅ | ✅ 완전 |

### 통계

- ✅ **완전히 사용됨**: 7개 그룹
- ⚠️ **부분적으로 사용됨**: 2개 그룹 (Backend만 사용)
- ✅ **미사용**: 0개 그룹

---

## ⚠️ 발견된 문제점

### 1. ~~ExamVersion 모델 미사용~~ ✅ 해결됨

**상태**: 
- ✅ `ExamVersion` 모델이 완전히 사용되고 있음
- ✅ `exam.service.ts`의 `clone()` 메서드에서 버전 생성 시 `ExamVersion` 레코드 생성
- ✅ `exam.service.ts`의 `findOne()` 및 `getVersions()` 메서드에서 ExamVersion 정보 포함
- ✅ Frontend의 `ExamVersionInfo` 컴포넌트에서 버전 정보 및 문제 순서 표시

### 2. ~~Question 미디어 필드 사용 확인 필요~~ ✅ 해결됨

**상태**: 
- ✅ 모든 미디어 필드가 Backend와 Frontend에서 완전히 사용됨

---

## ✅ 권장 사항

### 즉시 조치 (선택사항)
1. ⚠️ **ExamVersion 모델**: 사용 여부 결정 (제거 또는 구현)

### 개선 사항
1. ✅ **Exam 버전 관리 UI**: Frontend에 버전 정보 표시 추가 (완료)
   - `exams/[id]/page.tsx`: 일반 사용자용 상세 페이지에 버전 정보 표시 추가
   - `admin/exams/[id]/page.tsx`: Admin 상세 페이지에 버전 정보 표시 추가
2. ✅ **ExamVersion 모델 활용**: ExamVersion 모델을 완전히 사용하도록 개선 (완료)
   - Backend: `clone()` 메서드에서 ExamVersion 레코드 생성
   - Backend: `findOne()` 및 `getVersions()` 메서드에서 ExamVersion 정보 포함
   - Frontend: `ExamVersionInfo` 컴포넌트에서 버전 정보 및 문제 순서 표시
   - `lib/api.ts`: Exam 인터페이스에 `parentExamId`, `version`, `versionNumber` 필드 추가
   - 번역 키 추가: `exam.detail.versionInfo`, `exam.detail.version`, `exam.detail.versionNumber`, `exam.detail.isVersion`
2. ✅ **QuestionStatistics UI**: Admin 대시보드에 통계 표시 추가 (이미 구현됨)
   - `admin/questions/page.tsx`에 `QuestionStatisticsModal` 컴포넌트 존재
3. ✅ **ContentVersion UI**: Admin에서 버전 히스토리 확인 UI 추가 (이미 구현됨)
   - `admin/exams/[id]/page.tsx`에 `VersionHistoryModal` 컴포넌트 존재

---

## 📝 결론

**대부분의 필드가 올바르게 사용되고 있습니다.**

- ✅ **핵심 필드**: 100% 사용 중
- ✅ **부가 기능 필드**: 대부분 사용 중
- ✅ **버전 관리 UI**: 개선 완료 (Frontend에 버전 정보 표시 추가)
- ✅ **ExamVersion 모델**: 완전히 사용 중 (버전별 문제 순서 저장 및 표시)
- ✅ **미사용 필드**: 0개

**시스템은 스키마와 코드가 잘 일치하는 상태이며, 개선 사항이 적용되었습니다.** 🎉

---

**마지막 업데이트**: 2024년  
**문서 버전**: 1.0

