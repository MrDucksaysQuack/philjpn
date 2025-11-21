# 📊 API 활용도 분석 보고서

## 📋 개요

백엔드에 구현된 API와 프론트엔드에서 실제로 사용하는 API를 비교하여, **API는 있지만 UI에서 활용되지 않는 기능들**을 찾아 정리한 보고서입니다.

---

## 🔍 분석 결과

### 1. Learning Cycle API ❌ 미사용

**백엔드 API**:
- `GET /api/users/me/learning-cycle` - 현재 학습 사이클 조회
- `PUT /api/users/me/learning-cycle/stage` - 학습 사이클 단계 업데이트
- `POST /api/users/me/learning-cycle/complete` - 학습 사이클 완료

**프론트엔드**:
- ✅ `learningCycleAPI` 정의됨 (`lib/api.ts`)
- ❌ **어떤 페이지에서도 사용하지 않음**

**영향도**: 🟡 중간
- 학습 사이클 추적 기능이 구현되어 있지만 UI에서 활용되지 않음
- 사용자 학습 진행 상황을 시각화할 수 있는 기회 상실

**권장 사항**:
- Dashboard나 Analysis 페이지에 학습 사이클 위젯 추가
- 현재 단계 표시 및 다음 단계 안내

---

### 2. Recommendation API - 부분 미사용

**백엔드 API**:
- `GET /api/exams/recommended` - 개인 맞춤형 시험 추천 ✅ 사용 중
- `GET /api/exams/by-wordbook` - 단어장 기반 시험 추천 ❌ 미사용

**프론트엔드**:
- ✅ `getRecommendedExams()` - 사용 중 (`/exams/recommended`, Dashboard)
- ❌ `getExamsByWordbook()` - **사용하지 않음**

**영향도**: 🟡 중간
- 단어장 기반 시험 추천 기능이 있지만 활용되지 않음
- Wordbook 페이지에서 관련 시험 추천 가능

**권장 사항**:
- Wordbook 페이지에 "단어장 기반 추천 시험" 섹션 추가
- 사용자가 학습 중인 단어와 관련된 시험 추천

---

### 3. Session Feedback API ❌ 미사용

**백엔드 API**:
- `POST /api/sessions/:sessionId/submit-question` - 문제별 실시간 피드백

**프론트엔드**:
- ✅ `sessionFeedbackAPI.submitQuestion()` 정의됨 (`lib/api.ts`)
- ❌ **어떤 페이지에서도 사용하지 않음**

**영향도**: 🟠 높음
- 실시간 피드백 기능이 구현되어 있지만 사용되지 않음
- 시험 중 문제를 풀 때마다 즉시 피드백을 받을 수 있는 기능 상실

**권장 사항**:
- 시험 페이지 (`/exams/[id]/take`)에서 문제 제출 시 실시간 피드백 표시
- 정답/오답 즉시 확인 및 해설 제공

---

### 4. AI API - 부분 미사용

**백엔드 API**:
- `POST /api/ai/explanation` - AI 해설 생성 (동기) ❌ 미사용
- `POST /api/ai/explanation-async` - AI 해설 생성 (비동기) ✅ 사용 중
- `POST /api/ai/diagnose-weakness/:examResultId` - 약점 진단 (동기) ❌ 미사용
- `POST /api/ai/diagnose-weakness-async/:examResultId` - 약점 진단 (비동기) ✅ 사용 중
- `GET /api/ai/job/:jobId` - 작업 상태 조회 ✅ 사용 중
- `GET /api/ai/queue/stats` - 큐 통계 ❌ 미사용
- `POST /api/ai/check-availability` - AI 기능 활성화 확인 ❌ 미사용

**프론트엔드**:
- ✅ 비동기 버전만 사용 중 (`results/[id]/page.tsx`)
- ❌ 동기 버전, 큐 통계, 가용성 확인 미사용

**영향도**: 🟡 중간
- 동기 버전은 빠른 응답이 필요한 경우에 유용
- 큐 통계는 관리자 대시보드에 유용
- 가용성 확인은 AI 기능 사용 전 체크에 유용

**권장 사항**:
- AI 기능 사용 전 `checkAvailability()` 호출하여 활성화 여부 확인
- 관리자 대시보드에 큐 통계 표시
- 빠른 응답이 필요한 경우 동기 버전 옵션 제공

---

### 5. Exam Workflow API ✅ 사용 중

**백엔드 API**:
- `GET /api/exams/:id/workflow` - 워크플로우 상태 조회 ✅ 사용 중
- `POST /api/exams/:id/workflow/submit-for-review` - 검수 요청 ✅ 사용 중
- `POST /api/exams/:id/workflow/assign-reviewer` - 검수자 할당 ❌ 미사용
- `POST /api/exams/:id/workflow/approve` - 승인 ✅ 사용 중
- `POST /api/exams/:id/workflow/reject` - 거부 ✅ 사용 중
- `POST /api/exams/:id/workflow/publish` - 발행 ✅ 사용 중
- `POST /api/exams/:id/workflow/archive` - 보관 ✅ 사용 중
- `POST /api/exams/:id/workflow/return-to-draft` - 초안 복귀 ✅ 사용 중

**프론트엔드**:
- ✅ `admin/exams/[id]/page.tsx`에서 WorkflowModal 컴포넌트로 대부분 사용 중
- ❌ `assignReviewer` - **사용하지 않음**

**영향도**: 🟡 중간
- 대부분의 워크플로우 기능은 사용 중
- 검수자 할당 기능만 미사용

**권장 사항**:
- WorkflowModal에 검수자 할당 기능 추가
- Admin이 검수자를 직접 지정할 수 있는 UI 추가

---

### 6. Word Extraction API - 부분 미사용

**백엔드 API**:
- `POST /api/word-books/extract-from-result/:examResultId` - 시험 결과에서 단어 추출 ✅ 사용 중
- `POST /api/word-books/add-extracted` - 추출된 단어 일괄 추가 ✅ 사용 중

**프론트엔드**:
- ✅ 모두 사용 중 (`results/[id]/page.tsx`)

**영향도**: ✅ 모두 활용 중

---

### 7. Result API ✅ 사용 중

**백엔드 API**:
- `GET /api/results` - 결과 목록 ✅ 사용 중
- `GET /api/results/:id` - 결과 상세 ✅ 사용 중
- `GET /api/results/:id/report` - 시험 결과 리포트 ✅ 사용 중
- `GET /api/results/:id/feedback` - 다층적 피드백 ✅ 사용 중

**프론트엔드**:
- ✅ `resultAPI.getResults()`, `resultAPI.getResult()` 사용 중
- ✅ `resultAPI.getReport()`, `resultAPI.getDetailedFeedback()` 사용 중 (`results/[id]/page.tsx`)

**영향도**: ✅ 모두 활용 중

---

### 8. Goal API - 부분 미사용

**백엔드 API**:
- `POST /api/users/me/goals` - 목표 생성 ✅ 사용 중 (`CreateGoalModal`)
- `GET /api/users/me/goals` - 목표 목록 조회 ❌ 미사용
- `GET /api/users/me/goals/progress` - 목표 진행 상황 ✅ 사용 중
- `GET /api/users/me/goals/:id` - 목표 상세 조회 ❌ 미사용
- `PUT /api/users/me/goals/:id` - 목표 업데이트 ❌ 미사용
- `DELETE /api/users/me/goals/:id` - 목표 삭제 ❌ 미사용

**프론트엔드**:
- ✅ `goalAPI.createGoal()` 사용 중 (`CreateGoalModal`)
- ✅ `goalAPI.getGoalProgress()` 사용 중 (`analysis/page.tsx`)
- ❌ `goalAPI.getGoals()` - 목표 목록 조회 미사용
- ❌ `goalAPI.updateGoal()` - 목표 수정 미사용
- ❌ `goalAPI.deleteGoal()` - 목표 삭제 미사용
- ❌ `goalAPI.getGoal()` - 목표 상세 조회 미사용

**영향도**: 🟡 중간
- 목표 생성은 가능하지만 수정/삭제 기능이 없음
- 목표 목록을 직접 조회하지 않고 진행 상황만 조회
- 목표 상세 정보를 볼 수 없음

**권장 사항**:
- Analysis 페이지에 목표 수정/삭제 UI 추가
- 목표 목록을 별도로 조회하여 표시
- 목표 상세 정보 표시 기능 추가

---

## 📊 우선순위별 개선 권장 사항

### 우선순위 1 (높음) 🔴

1. **Session Feedback API 활용**
   - 시험 페이지에서 문제 제출 시 실시간 피드백 표시
   - 정답/오답 즉시 확인 및 해설 제공
   - **영향도**: 🟠 높음 - 사용자 경험 향상

2. **Exam Workflow API 확장**
   - WorkflowModal에 검수자 할당 기능 추가
   - **영향도**: 🟡 중간 - Admin 기능 완성도 향상

### 우선순위 2 (중간) 🟡

3. **Learning Cycle API 활용**
   - Dashboard나 Analysis 페이지에 학습 사이클 위젯 추가
   - 현재 단계 표시 및 다음 단계 안내
   - **영향도**: 🟡 중간 - 학습 진행 상황 시각화

4. **Recommendation API 확장**
   - Wordbook 페이지에 "단어장 기반 추천 시험" 섹션 추가
   - **영향도**: 🟡 중간 - 개인화된 추천 강화

5. **AI API 확장**
   - AI 기능 사용 전 가용성 확인
   - 관리자 대시보드에 큐 통계 표시
   - **영향도**: 🟡 중간 - AI 기능 안정성 및 모니터링


### 우선순위 3 (낮음) 🟢

6. **Goal API 확장**
   - Analysis 페이지에 목표 수정/삭제 UI 추가
   - 목표 목록을 별도로 조회하여 표시
   - 목표 상세 정보 표시 기능 추가
   - **영향도**: 🟡 중간 - 목표 관리 기능 완성도 향상

---

## 📈 예상 개선 효과

### 사용자 경험 향상
- ✅ 실시간 피드백으로 학습 효과 향상
- ✅ 학습 사이클 추적으로 학습 진행 상황 파악
- ✅ 개인화된 추천으로 학습 효율성 향상

### 관리자 기능 강화
- ✅ 시험 워크플로우 관리로 검수 프로세스 효율화
- ✅ AI 큐 모니터링으로 시스템 안정성 향상

### 기능 활용도 향상
- ✅ 구현된 API 기능의 100% 활용
- ✅ 사용자에게 더 많은 기능 제공

---

## 🎯 결론

현재 **약 7개의 주요 API 그룹**에서 **부분적 또는 완전히 미사용**인 기능들이 발견되었습니다.

**가장 우선적으로 개선해야 할 항목**:
1. **Session Feedback API** - 실시간 피드백 기능 (완전 미사용) 🔴
2. **Learning Cycle API** - 학습 사이클 추적 (완전 미사용) 🔴
3. **Recommendation API** - 단어장 기반 추천 (부분 미사용) 🟡
4. **Goal API** - 목표 수정/삭제/목록 조회 기능 (부분 미사용) 🟡
5. **AI API** - 동기 버전, 큐 통계, 가용성 확인 (부분 미사용) 🟡
6. **Exam Workflow API** - 검수자 할당 기능 (부분 미사용) 🟡

이러한 기능들을 UI에 통합하면 **사용자 경험과 시스템 활용도가 크게 향상**될 것입니다.

---

**작성일**: 2024년
**목적**: API 활용도 분석 및 개선 권장 사항 제시

