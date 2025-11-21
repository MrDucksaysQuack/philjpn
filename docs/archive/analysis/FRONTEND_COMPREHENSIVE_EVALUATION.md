# 프론트엔드 종합 평가 보고서

## 📋 평가 개요

본 문서는 백엔드에 구현된 기능들이 프론트엔드에서 얼마나 활용되고 있는지, 사용자 및 관리자의 인지패턴에 맞게 구성되어 있는지, 사용자 편의성이 잘 구성되어 있는지에 대한 종합적인 평가를 제공합니다.

**평가 일자**: 2024년
**평가 범위**: 
- 백엔드 API 활용도
- 사용자 경험(UX) 및 사용자 인터페이스(UI)
- 관리자 기능 완성도
- 사용자 편의성

---

## 1. 백엔드 기능 활용도 평가

### 1.1. 완전 구현된 기능 ✅

#### 인증 및 사용자 관리
- ✅ 로그인/회원가입 (`/auth/login`, `/auth/register`)
- ✅ JWT 토큰 관리 및 자동 갱신
- ✅ 사용자 정보 조회 (`/auth/me`)
- ✅ 관리자 사용자 관리 (`/admin/users`)

#### 시험 관리
- ✅ 시험 목록 조회 (`/exams`)
- ✅ 시험 상세 조회 (`/exams/:id`)
- ✅ 시험 섹션 조회 (`/sections/exams/:examId`)
- ✅ 관리자 시험 생성/수정/삭제 (`/admin/exams`)
- ✅ 시험 통계 및 분석 (`/admin/exams/statistics`, `/admin/exams/:id/analytics`)

#### 시험 진행
- ✅ 시험 시작 (`/exams/:examId/start`)
- ✅ 세션 조회 (`/sessions/:sessionId`)
- ✅ 답안 저장 (`/sessions/:sessionId/answers`)
- ✅ 섹션 이동 (`/sessions/:sessionId/sections/:sectionId`)
- ✅ 시험 제출 (`/sessions/:sessionId/submit`)
- ✅ 실시간 피드백 (`/sessions/:sessionId/submit-question`)

#### 결과 및 리포트
- ✅ 결과 목록 조회 (`/results`)
- ✅ 결과 상세 조회 (`/results/:id`)
- ✅ 리포트 조회 (`/results/:id/report`)
- ✅ 상세 피드백 (`/results/:id/feedback`)

#### 통계 및 분석
- ✅ 사용자 통계 (`/users/me/statistics`)
- ✅ 학습 패턴 분석 (`/users/me/learning-patterns`)
- ✅ 약점 분석 (`/users/me/weakness-analysis`) - **참고**: 백엔드 AI 약점 진단과는 다른 API
- ✅ 효율성 지표 (`/users/me/efficiency-metrics`)

#### 목표 관리
- ✅ 목표 생성/조회/수정/삭제 (`/users/me/goals`)
- ✅ 목표 진행 상황 (`/users/me/goals/progress`)

#### 단어장
- ✅ 단어 목록 조회/생성/수정/삭제 (`/word-books`)
- ✅ 단어 복습 (`/word-books/:id/review`)
- ✅ 단어 추출 (`/word-books/extract-from-result/:examResultId`)
- ✅ 퀴즈 생성 (`/word-books/quiz`)

#### 관리자 기능
- ✅ 템플릿 관리 (`/admin/templates`)
- ✅ 문제 풀 관리 (`/admin/question-pools`)
- ✅ 문제 관리 (`/admin/questions`)
- ✅ 사이트 설정 (`/admin/site-settings`)
- ✅ 이미지 업로드 (`/admin/upload/image`)
- ✅ 관리자 대시보드 (`/admin/dashboard`)

#### 모니터링
- ✅ 활성 세션 모니터링 (`/admin/monitoring/active-sessions`)

---

### 1.2. 부분 구현된 기능 ⚠️

#### AI 분석 기능
**백엔드 제공 기능**:
- ✅ 해설 생성 (동기/비동기) (`POST /api/ai/explanation`, `POST /api/ai/explanation-async`)
- ✅ 약점 진단 (동기/비동기) (`POST /api/ai/diagnose-weakness/:examResultId`, `POST /api/ai/diagnose-weakness-async/:examResultId`)
- ✅ 작업 상태 조회 (`GET /api/ai/job/:jobId`)
- ✅ 큐 통계 (`GET /api/ai/queue/stats`)
- ✅ AI 기능 활성화 확인 (`POST /api/ai/check-availability`)

**프론트엔드 구현 상태**: ⚠️ **부분 구현** (약 20% 완성도)

**현재 상태**:
- ✅ 결과 페이지에서 해설 표시 (`question.explanation` 필드 사용)
- ❌ AI 해설 생성 버튼/기능 없음
- ❌ AI 약점 진단 버튼/기능 없음
- ❌ 비동기 AI 작업 상태 확인 UI 없음
- ❌ AI 큐 통계 모니터링 UI 없음
- ❌ AI 기능 활성화 확인 UI 없음

**API 연동 상태**:
- `lib/api.ts`에 AI 관련 API 함수가 전혀 없음
- 약점 분석은 `statisticsAPI.getWeaknessAnalysis()` 사용 (백엔드의 AI 약점 진단과는 다른 API)

**개선 필요 사항**:
1. **AI 해설 생성 UI** (높은 우선순위)
   - 결과 페이지의 문제별 "AI 해설 생성" 버튼 추가
   - 비동기 작업인 경우 진행 상황 표시 (폴링 또는 WebSocket)
   - 생성 완료 시 해설 표시
2. **AI 약점 진단 UI** (높은 우선순위)
   - 시험 결과 페이지에 "AI 약점 진단" 버튼 추가
   - 진단 진행 상황 표시
   - 진단 결과 시각화 (기존 약점 분석과 통합)
3. **AI 작업 상태 모니터링** (중간 우선순위)
   - 작업 ID로 상태 조회
   - 큐 대기 시간 표시
   - 작업 완료 알림
4. **AI 기능 활성화 확인** (낮은 우선순위)
   - AI 기능 사용 가능 여부 표시
   - 비활성화 시 안내 메시지

---

#### 적응형 시험 (Adaptive Testing)
**백엔드 제공 기능**:
- ✅ 적응형 시험 생성 (`Exam.isAdaptive`, `Exam.adaptiveConfig`)
- ✅ 다음 문제 가져오기 (`GET /api/sessions/:sessionId/next-question`)
- ✅ IRT 모델 기반 능력 추정
- ✅ 동적 난이도 조정

**프론트엔드 구현 상태**: ⚠️ **부분 구현** (약 10% 완성도)

**현재 상태**:
- ✅ 적응형 학습 경로 표시: `app/exams/recommended/page.tsx`에서 `adaptivePath` 표시
- ❌ 적응형 시험 생성 UI 없음 (Admin 페이지)
- ❌ 적응형 시험 진행 UI 없음 (`app/exams/[id]/take/page.tsx`에서 `getNextQuestion` 사용 안 함)
- ❌ 적응형 시험 설정 UI 없음
- ❌ 능력 추정 값 표시 없음
- ❌ 현재 난이도 표시 없음

**API 연동 상태**:
- `lib/api.ts`에 `sessionAPI.getNextQuestion()` 없음
- `sessionAPI`에는 일반 시험 진행 API만 있음

**개선 필요 사항**:
1. **적응형 시험 진행 로직** (높은 우선순위)
   - `lib/api.ts`에 `sessionAPI.getNextQuestion()` 추가
   - `app/exams/[id]/take/page.tsx`에서 적응형 시험인 경우 `getNextQuestion` 사용
   - 능력 추정 값 표시 (선택사항)
   - 현재 난이도 표시
2. **적응형 시험 생성 UI** (중간 우선순위)
   - 시험 생성 시 "적응형 시험" 옵션
   - 적응형 설정 (초기 난이도, 조정 속도 등)
3. **적응형 시험 결과 분석** (낮은 우선순위)
   - 능력 추정 그래프
   - 난이도 변화 추이

---

### 1.3. 미구현된 기능 ❌

#### 대량 배포 모드 (Bulk Deployment Mode)
**백엔드 제공 기능**:
- ✅ 배치 라이선스 키 생성 (`POST /api/license-keys/batch`)
- ✅ 배치 통계 조회 (`GET /api/license-keys/batch/:id/stats`)
- ✅ CSV 내보내기 (`GET /api/license-keys/batch/:id/export`)
- ✅ 대시보드 (`GET /api/license-keys/dashboard`)
- ✅ 만료 예정 배치 조회 (`GET /api/license-keys/batches/expiring`)
- ✅ 사용량 예측 (`GET /api/license-keys/batch/:id/predict`)
- ✅ 수동 만료 알림 (`POST /api/license-keys/batch/:id/notify-expiration`)

**프론트엔드 구현 상태**: ❌ **미구현** (0% 완성도)

**현재 상태**:
- `app/admin/license-keys/page.tsx`에서 단일 키 생성만 지원
- 배치 생성 기능 없음
- 배치 통계/대시보드 UI 없음
- CSV 내보내기 기능 없음
- 만료 예정 배치 조회 UI 없음
- 사용량 예측 UI 없음

**API 연동 상태**:
- `lib/api.ts`에 배치 관련 API 함수 없음

**개선 필요 사항** (높은 우선순위):
1. **배치 생성 UI**
   - 배치 이름, 설명 입력
   - 생성할 키 개수 입력
   - 일괄 설정 (keyType, examIds, usageLimit, validDays)
   - 진행 상황 표시
2. **배치 관리 페이지** (`/admin/license-keys/batches`)
   - 배치 목록 표시
   - 배치별 통계 카드
   - 배치 상세 정보 모달
3. **배치 통계 대시보드**
   - 일별 사용량 차트
   - 사용량 분포 그래프
   - 만료 예정 배치 알림
4. **CSV 내보내기 버튼**
5. **사용량 예측 차트**

---

#### Prometheus 메트릭 대시보드
**백엔드 제공 기능**:
- ✅ Prometheus 메트릭 수집 (`GET /metrics`)
- ✅ HTTP 요청 메트릭 (카운터, 히스토그램)
- ✅ 데이터베이스 쿼리 메트릭
- ✅ 비즈니스 메트릭 (시험 생성/완료, 라이선스 키 생성/사용)
- ✅ 활성 사용자/세션 게이지

**프론트엔드 구현 상태**: ❌ **미구현** (0% 완성도)

**개선 필요 사항** (중간 우선순위):
1. **메트릭 대시보드 페이지** (`/admin/metrics`)
   - HTTP 요청 메트릭 차트
   - 데이터베이스 쿼리 메트릭
   - 비즈니스 메트릭
   - 활성 사용자/세션 게이지
   - Grafana 연동 (선택사항)

---

#### 자동 만료 알림 시스템
**백엔드 제공 기능**:
- ✅ Cron 기반 자동 실행
- ✅ 수동 알림 전송 API (`POST /api/license-keys/batch/:id/notify-expiration`)

**프론트엔드 구현 상태**: ❌ **미구현** (0% 완성도)

**개선 필요 사항** (낮은 우선순위):
1. **알림 설정/관리 UI**
   - 알림 목록
   - 알림 설정
   - 알림 히스토리
   - 수동 알림 전송 버튼

---

## 2. 사용자 및 관리자 인지패턴 평가

### 2.1. 사용자 인지패턴 ✅

#### 학습 흐름
- ✅ **대시보드 중심 접근**: 사용자는 대시보드에서 모든 정보를 한눈에 확인 가능
- ✅ **명확한 네비게이션**: 헤더를 통한 주요 기능 접근이 용이
- ✅ **점진적 정보 공개**: 결과 페이지에서 요약 → 문제별 → 섹션별 → 종합 인사이트 순서로 정보 제공
- ✅ **시각적 피드백**: 진행률 바, 통계 카드, 차트 등을 통한 직관적 정보 전달

#### 학습 동기 부여
- ✅ **목표 진행 상황 강조**: 대시보드 최상단에 목표 진행 상황 위젯 배치
- ✅ **성취감 제공**: 축하 모달, 배지, 진행률 표시
- ✅ **긍정적 피드백**: 감정적 토스트 메시지 (`emotionalToast`)

#### 학습 효율성
- ✅ **추천 시험 제공**: 학습 패턴 기반 추천
- ✅ **약점 분석**: 약점 영역 시각화 및 개선 계획 제시
- ✅ **단어 학습 연계**: 시험 결과에서 단어 추출 및 단어장 연동

---

### 2.2. 관리자 인지패턴 ⚠️

#### 관리 효율성
- ✅ **대시보드 중심 접근**: 관리자 대시보드에서 주요 통계 확인 가능
- ✅ **빠른 링크**: 주요 관리 기능에 대한 빠른 접근 링크 제공
- ⚠️ **배치 작업 부재**: 대량 라이선스 키 생성이 불가능하여 비효율적
- ✅ **템플릿 활용**: 시험 템플릿을 통한 빠른 시험 생성

#### 모니터링
- ✅ **실시간 세션 모니터링**: 진행 중인 시험 세션 모니터링 가능
- ❌ **시스템 메트릭 부재**: Prometheus 메트릭 대시보드 없음
- ❌ **알림 관리 부재**: 알림 설정 및 관리 UI 없음

#### 데이터 분석
- ✅ **시험 통계**: 시험별 상세 분석 제공
- ✅ **사용자 학습 패턴**: 사용자별 학습 패턴 분석 제공
- ⚠️ **배치 통계 부재**: 배치별 상세 통계 및 예측 기능 없음

---

### 2.3. 개선 필요 사항

#### 사용자 경험 개선
1. **적응형 시험 진행 경험**
   - 현재: 일반 시험과 동일한 UI
   - 개선: 적응형 시험의 경우 능력 추정 값, 현재 난이도 표시
2. **AI 해설 생성 경험**
   - 현재: 해설이 이미 있는 경우만 표시
   - 개선: 해설이 없는 경우 "AI 해설 생성" 버튼 제공

#### 관리자 경험 개선
1. **배치 작업 효율성**
   - 현재: 단일 키만 생성 가능
   - 개선: 배치 생성 UI로 대량 키 생성 가능
2. **모니터링 강화**
   - 현재: 활성 세션만 모니터링
   - 개선: 시스템 메트릭, 큐 상태 등 종합 모니터링

---

## 3. 사용자 편의성 평가

### 3.1. 잘 구현된 편의 기능 ✅

#### 접근성
- ✅ **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- ✅ **로딩 상태 표시**: 모든 비동기 작업에 로딩 상태 표시
- ✅ **에러 처리**: 명확한 에러 메시지 및 컨텍스트 제공
- ✅ **인증 보호**: 인증이 필요한 페이지 자동 리다이렉트

#### 사용성
- ✅ **자동 저장**: 답안 자동 저장 기능
- ✅ **진행 상황 표시**: 진행률 바를 통한 시각적 피드백
- ✅ **단어 추출**: 시험 결과에서 단어 자동 추출 및 단어장 연동
- ✅ **목표 관리**: 목표 설정 및 진행 상황 추적

#### 피드백
- ✅ **감정적 토스트**: 성공/실패에 대한 감정적 피드백
- ✅ **축하 모달**: 목표 달성 시 축하 모달
- ✅ **상세 피드백**: 문제별, 섹션별, 종합 인사이트 제공

---

### 3.2. 개선이 필요한 편의 기능 ⚠️

#### AI 기능 접근성
- ⚠️ **AI 해설 생성**: 해설이 없는 경우 생성 버튼이 없음
- ⚠️ **AI 약점 진단**: 진단 버튼이 없어 수동으로 접근 불가
- ⚠️ **작업 상태 확인**: 비동기 작업의 진행 상황을 확인할 수 없음

#### 적응형 시험 경험
- ⚠️ **능력 추정 표시**: 적응형 시험에서 능력 추정 값이 표시되지 않음
- ⚠️ **난이도 표시**: 현재 난이도가 표시되지 않음
- ⚠️ **적응형 시험 생성**: 관리자가 적응형 시험을 생성할 수 없음

#### 관리자 효율성
- ⚠️ **배치 작업**: 대량 라이선스 키 생성이 불가능
- ⚠️ **CSV 내보내기**: 배치 키를 CSV로 내보낼 수 없음
- ⚠️ **사용량 예측**: 배치 사용량 예측 기능이 없음

---

### 3.3. 추가 개선 제안 💡

#### 키보드 단축키
- 시험 진행 중 키보드 단축키 지원 (예: `N` - 다음 문제, `P` - 이전 문제)

#### 오프라인 지원
- 시험 진행 중 네트워크 오류 시 답안 임시 저장 및 복구

#### 다국어 지원
- 현재 한국어/영어 지원이 있으나, 일부 메시지가 하드코딩되어 있음

#### 접근성 향상
- 스크린 리더 지원
- 고대비 모드
- 폰트 크기 조절

---

## 4. 종합 평가 및 점수

### 4.1. 기능 완성도 점수

| 영역 | 완성도 | 점수 |
|------|--------|------|
| 인증 및 사용자 관리 | ✅ 완전 구현 | 100% |
| 시험 관리 | ✅ 완전 구현 | 100% |
| 시험 진행 | ⚠️ 부분 구현 | 60% |
| 결과 및 리포트 | ✅ 완전 구현 | 100% |
| 통계 및 분석 | ⚠️ 부분 구현 | 70% |
| 목표 관리 | ✅ 완전 구현 | 100% |
| 단어장 | ✅ 완전 구현 | 100% |
| 관리자 기능 | ⚠️ 부분 구현 | 70% |
| AI 분석 | ⚠️ 부분 구현 | 20% |
| 적응형 시험 | ⚠️ 부분 구현 | 10% |
| 배치 관리 | ❌ 미구현 | 0% |
| 모니터링 | ⚠️ 부분 구현 | 50% |

**전체 평균**: 약 **65%**

---

### 4.2. 사용자 경험 점수

| 항목 | 점수 | 평가 |
|------|------|------|
| 직관성 | 85/100 | 대부분의 기능이 직관적으로 사용 가능 |
| 접근성 | 80/100 | 반응형 디자인 및 기본 접근성 지원 |
| 피드백 | 90/100 | 명확한 피드백 및 감정적 토스트 제공 |
| 효율성 | 70/100 | 일부 기능(배치 작업, AI 기능) 접근이 비효율적 |
| 일관성 | 85/100 | 대부분의 UI가 일관된 디자인 시스템 사용 |

**전체 평균**: **82/100**

---

### 4.3. 관리자 경험 점수

| 항목 | 점수 | 평가 |
|------|------|------|
| 효율성 | 60/100 | 배치 작업 부재로 인한 비효율성 |
| 모니터링 | 50/100 | 기본 모니터링만 제공, 시스템 메트릭 부재 |
| 데이터 분석 | 75/100 | 시험/사용자 분석은 잘 제공되나 배치 통계 부재 |
| 작업 자동화 | 40/100 | 템플릿 기능은 있으나 배치 작업 부재 |

**전체 평균**: **56/100**

---

## 5. 우선순위별 개선 권장 사항

### 🔴 높은 우선순위 (즉시 구현 권장)

1. **배치 라이선스 키 생성 UI**
   - **영향**: 관리자 효율성 대폭 향상
   - **예상 작업 시간**: 2-3일
   - **구현 위치**: `app/admin/license-keys/page.tsx`

2. **AI 해설 생성 버튼**
   - **영향**: 사용자 경험 향상
   - **예상 작업 시간**: 1-2일
   - **구현 위치**: `app/results/[id]/page.tsx`

3. **적응형 시험 진행 로직**
   - **영향**: 백엔드 기능 활용도 향상
   - **예상 작업 시간**: 2-3일
   - **구현 위치**: `app/exams/[id]/take/page.tsx`, `lib/api.ts`

---

### 🟡 중간 우선순위 (단계적 구현 권장)

4. **배치 관리 페이지**
   - 배치 목록, 통계, CSV 내보내기
   - **예상 작업 시간**: 3-4일

5. **AI 약점 진단 UI**
   - 결과 페이지에 진단 버튼 추가
   - **예상 작업 시간**: 1-2일

6. **Prometheus 메트릭 대시보드**
   - 시스템 메트릭 시각화
   - **예상 작업 시간**: 2-3일

---

### 🟢 낮은 우선순위 (선택적 구현)

7. **알림 시스템 UI**
   - 알림 설정 및 관리
   - **예상 작업 시간**: 2-3일

8. **사용량 예측 차트**
   - 배치 사용량 예측 시각화
   - **예상 작업 시간**: 1-2일

9. **적응형 시험 생성 UI**
   - 관리자가 적응형 시험 생성 가능
   - **예상 작업 시간**: 2-3일

---

## 6. 결론

### 전체 평가 요약

**전체 평가**: ⚠️ **양호하나 개선 필요** (약 65% 완성도)

프론트엔드는 기본적인 기능들은 잘 구현되어 있으며, 사용자 경험도 전반적으로 양호합니다. 그러나 백엔드에 구현된 고급 기능들(배치 생성, AI 분석, 적응형 시험)이 프론트엔드에서 제대로 활용되지 않고 있어, 백엔드의 잠재력을 최대한 활용하지 못하고 있습니다.

### 주요 강점

1. ✅ **기본 기능 완성도 높음**: 인증, 시험 관리, 결과 조회 등 핵심 기능이 잘 구현됨
2. ✅ **사용자 경험 우수**: 직관적인 UI, 명확한 피드백, 학습 동기 부여 요소가 잘 구성됨
3. ✅ **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
4. ✅ **에러 처리**: 명확한 에러 메시지 및 컨텍스트 제공

### 주요 약점

1. ❌ **배치 작업 부재**: 대량 라이선스 키 생성이 불가능하여 관리자 효율성 저하
2. ❌ **AI 기능 미활용**: AI 해설 생성 및 약점 진단 기능이 UI에 없음
3. ❌ **적응형 시험 미활용**: 적응형 시험 진행 로직이 구현되지 않음
4. ⚠️ **모니터링 부족**: 시스템 메트릭 대시보드 부재

### 즉시 개선이 필요한 영역

1. **배치 라이선스 키 생성 및 관리** (관리자 효율성 향상)
2. **AI 해설 생성 UI** (사용자 경험 향상)
3. **적응형 시험 진행 로직** (백엔드 기능 활용도 향상)

이 세 가지를 우선적으로 구현하면 백엔드의 핵심 기능들이 프론트엔드에서 완전히 활용될 수 있으며, 전체 시스템의 가치가 크게 향상될 것입니다.

---

## 부록: API 매핑 체크리스트

### 완전 구현된 API ✅

- [x] `POST /auth/login`
- [x] `POST /auth/register`
- [x] `GET /auth/me`
- [x] `GET /exams`
- [x] `GET /exams/:id`
- [x] `POST /exams/:examId/start`
- [x] `GET /sessions/:sessionId`
- [x] `PUT /sessions/:sessionId/answers`
- [x] `POST /sessions/:sessionId/submit`
- [x] `GET /results`
- [x] `GET /results/:id`
- [x] `GET /results/:id/report`
- [x] `GET /results/:id/feedback`
- [x] `GET /users/me/statistics`
- [x] `GET /users/me/learning-patterns`
- [x] `GET /users/me/weakness-analysis`
- [x] `GET /users/me/efficiency-metrics`
- [x] `POST /users/me/goals`
- [x] `GET /users/me/goals`
- [x] `GET /word-books`
- [x] `POST /word-books`
- [x] `POST /word-books/extract-from-result/:examResultId`
- [x] `GET /admin/users`
- [x] `GET /admin/exams/statistics`
- [x] `GET /admin/exams/:id/analytics`
- [x] `GET /admin/dashboard`
- [x] `GET /admin/templates`
- [x] `POST /admin/templates`
- [x] `GET /admin/question-pools`
- [x] `GET /admin/site-settings`
- [x] `PUT /admin/site-settings`
- [x] `POST /admin/upload/image`
- [x] `GET /admin/monitoring/active-sessions`

### 부분 구현된 API ⚠️

- [ ] `GET /sessions/:sessionId/next-question` (적응형 시험용, API 함수 없음)
- [ ] `POST /api/ai/explanation` (API 함수 없음)
- [ ] `POST /api/ai/explanation-async` (API 함수 없음)
- [ ] `POST /api/ai/diagnose-weakness/:examResultId` (API 함수 없음)
- [ ] `POST /api/ai/diagnose-weakness-async/:examResultId` (API 함수 없음)
- [ ] `GET /api/ai/job/:jobId` (API 함수 없음)
- [ ] `GET /api/ai/queue/stats` (API 함수 없음)
- [ ] `POST /api/ai/check-availability` (API 함수 없음)

### 미구현된 API ❌

- [ ] `POST /api/license-keys/batch` (배치 생성)
- [ ] `GET /api/license-keys/batch/:id/stats` (배치 통계)
- [ ] `GET /api/license-keys/batch/:id/export` (CSV 내보내기)
- [ ] `GET /api/license-keys/dashboard` (대시보드)
- [ ] `GET /api/license-keys/batches/expiring` (만료 예정 배치)
- [ ] `GET /api/license-keys/batch/:id/predict` (사용량 예측)
- [ ] `POST /api/license-keys/batch/:id/notify-expiration` (수동 알림)
- [ ] `GET /metrics` (Prometheus 메트릭)

---

**문서 작성일**: 2024년
**다음 검토 예정일**: 주요 개선 사항 구현 후

