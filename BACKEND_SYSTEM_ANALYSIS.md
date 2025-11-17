# Exam Platform Backend 시스템 분석

## 📋 시스템 개요

**Exam Platform**은 온라인 시험 관리 및 응시 시스템입니다. 관리자가 시험을 생성하고 관리하며, 사용자가 시험을 응시하고 결과를 확인할 수 있는 종합적인 플랫폼입니다.

### 핵심 목적
- **시험 생성 및 관리**: 템플릿 기반 시험 생성, 문제 풀 관리
- **시험 응시**: 실시간 시험 세션 관리, 답안 저장
- **결과 분석**: 채점, 통계, 학습 패턴 분석
- **학습 지원**: 단어장, 복습 시스템, 학습 추천

---

## 🏗️ 아키텍처 구조

### 기술 스택
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Real-time**: WebSocket (모니터링)

### 모듈 구조

```
backend/src/modules/
├── core/           # 핵심 시험 엔진
│   ├── exam/       # 시험 관리
│   ├── section/    # 섹션 관리
│   ├── question/   # 문제 관리
│   ├── session/    # 시험 세션 관리
│   └── result/     # 결과 관리
├── auth/           # 인증/인가
├── admin/          # 관리자 기능
│   ├── templates/  # 템플릿 관리
│   ├── question-pools/  # 문제 풀 관리
│   └── site-settings/   # 사이트 설정
├── license/        # 라이선스 키 시스템
├── report/         # 리포트 및 분석
├── wordbook/       # 단어장 및 복습
└── monitoring/     # 실시간 모니터링
```

---

## 🔄 핵심 비즈니스 플로우

### 1. 시험 생성 플로우

```
[관리자]
  ↓
1. Question Pool 생성
   - 문제들을 태그/난이도로 그룹화
   - questionIds 배열로 관리
  ↓
2. Template 생성
   - 섹션 구조 정의
   - 각 섹션에 questionPoolId 또는 tags/difficulty 지정
   - 구조: { sections: [{ type, questionCount, questionPoolId?, tags?, difficulty? }] }
  ↓
3. Template으로부터 Exam 생성
   - 템플릿 구조 기반으로 시험 생성
   - randomSeed로 결정적 랜덤 문제 선택
   - 우선순위: questionPoolId > tags/difficulty 필터링
```

**핵심 로직** (`template.service.ts`):
- `questionPoolId`가 있으면 → Pool의 `questionIds`로 문제 조회
- 없으면 → `tags`와 `difficulty`로 필터링
- `SeededRandom`으로 섹션별 결정적 랜덤 선택
- 각 섹션마다 `randomSeed + sectionOrder`로 고유 시드 사용

### 2. 시험 응시 플로우

```
[사용자]
  ↓
1. 시험 선택 및 라이선스 키 입력
  ↓
2. startExam()
   - ExamResult 생성 (status: 'in_progress')
   - UserExamSession 생성
   - 만료 시간 설정 (예상 시간 + 30분)
  ↓
3. 문제 풀이
   - saveAnswer(): 답안 저장 (session.answers JSON)
   - moveSection(): 섹션 이동
   - 실시간 모니터링 (WebSocket)
  ↓
4. submitExam()
   - 시험 제출
   - GradingService로 자동 채점
   - ExamResult 업데이트 (score, percentage, status: 'completed')
```

**핵심 로직** (`session.service.ts`):
- 세션 기반 상태 관리 (`UserExamSession`)
- JSON 형태로 답안 저장 (`answers: { questionId: answer }`)
- 만료 시간 관리로 시험 시간 제한

### 3. 채점 플로우

```
[GradingService]
  ↓
1. ExamResult 조회
   - Exam, Sections, Questions 포함
  ↓
2. UserExamSession에서 답안 조회
   - answers JSON 파싱
  ↓
3. 섹션별 채점
   - gradeSection(): 각 섹션의 문제 채점
   - QuestionResult 생성 (isCorrect, pointsEarned)
   - SectionResult 생성 (score, maxScore)
  ↓
4. 전체 점수 계산
   - totalScore, maxScore 합산
   - percentage 계산
   - ExamResult 업데이트
```

### 4. 결과 분석 플로우

```
[ReportService]
  ↓
1. ExamResult 데이터 수집
   - 사용자별, 시험별, 섹션별 통계
  ↓
2. 학습 패턴 분석
   - LearningCycleService: 학습 주기 분석
   - RecommendationService: 약점 분석 및 추천
  ↓
3. 리포트 생성
   - 섹션별 성취도
   - 약점 영역 식별
   - 학습 목표 설정
```

---

## 📊 데이터 모델 핵심 구조

### 시험 계층 구조

```
Exam (시험)
  ├── ExamConfig (시험 설정)
  ├── Section[] (섹션들)
  │     └── Question[] (문제들)
  ├── ExamTemplate? (템플릿 참조)
  └── ExamResult[] (응시 결과들)
```

### 템플릿 시스템

```
ExamTemplate (템플릿)
  ├── structure: {
  │     sections: [
  │       {
  │         type: string,
  │         questionCount: number,
  │         questionPoolId?: string,  // 우선순위 1
  │         tags?: string[],          // 우선순위 2
  │         difficulty?: string       // 우선순위 2
  │       }
  │     ]
  │   }
  └── questionPoolIds: string[]
```

### 문제 풀 시스템

```
QuestionPool (문제 풀)
  ├── name, description
  ├── tags: string[]
  ├── difficulty: 'easy' | 'medium' | 'hard'
  └── questionIds: string[]  // 직접 참조
```

### 시험 세션 구조

```
UserExamSession (시험 세션)
  ├── examResultId: string
  ├── currentSectionId: string?
  ├── currentQuestionNumber: number
  ├── answers: { [questionId]: answer }  // JSON
  └── expiresAt: DateTime
```

---

## 🔑 핵심 기능 상세

### 1. 템플릿 기반 시험 생성

**목적**: 동일한 구조의 시험을 빠르게 생성

**특징**:
- **Question Pool 직접 연결**: 섹션에서 `questionPoolId`로 Pool 직접 참조
- **결정적 랜덤 선택**: `randomSeed`로 동일 시드면 동일 문제 구성 재현
- **Fallback 메커니즘**: Pool이 없으면 태그/난이도 기반 필터링

**코드 위치**: `admin/services/template.service.ts::createExamFromTemplate()`

### 2. 라이선스 키 시스템

**목적**: 시험 접근 제어 및 사용량 관리

**특징**:
- 키 타입별 제한 (`examIds`, `usageLimit`)
- 사용 로그 기록 (`KeyUsageLog`)
- 만료 시간 관리 (`validUntil`)

**코드 위치**: `license/services/license-key.service.ts`

### 3. 실시간 모니터링

**목적**: 시험 중 부정행위 감지 및 모니터링

**특징**:
- WebSocket 기반 실시간 이벤트 전송
- 탭 전환, 시간 초과 등 이벤트 추적

**코드 위치**: `monitoring/gateway/exam-monitoring.gateway.ts`

### 4. 단어장 및 복습 시스템

**목적**: 학습 지원 및 간격 반복 학습

**특징**:
- **SRS (Spaced Repetition System)**: SM-2 알고리즘 기반
- **자동 복습 스케줄링**: `nextReviewAt` 계산
- **숙련도 관리**: `masteryLevel` (0-100)
- **문제 추출**: 시험 결과에서 자동 단어 추출

**코드 위치**: 
- `wordbook/services/wordbook.service.ts`
- `wordbook/services/srs-enhanced.service.ts`

### 5. 학습 분석 및 추천

**목적**: 사용자 맞춤 학습 추천

**특징**:
- **학습 패턴 분석**: `LearningPattern`, `LearningCycle`
- **약점 분석**: 섹션별, 태그별 성취도 분석
- **목표 설정**: `UserGoal` 관리

**코드 위치**: `report/services/recommendation.service.ts`

---

## 🔐 보안 및 인증

### 인증 구조
- **JWT 기반**: Access Token + Refresh Token
- **Role-based Access Control**: `user`, `admin`, `partner`
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `LicenseKeyGuard`

### 데이터 보안
- **Soft Delete**: `deletedAt` 필드로 논리 삭제
- **세션 만료**: `expiresAt`로 자동 만료
- **입력 검증**: `class-validator`로 DTO 검증

---

## 📈 확장성 고려사항

### 현재 구조의 장점
1. **모듈화**: 기능별 명확한 분리
2. **템플릿 시스템**: 재사용 가능한 시험 구조
3. **문제 풀 시스템**: 문제 재사용 및 관리 용이
4. **결정적 랜덤**: 재현 가능한 시험 생성

### 개선 가능 영역
1. **캐싱**: 자주 조회되는 데이터 (템플릿, 문제 풀)
2. **배치 처리**: 대량 시험 생성 시 성능 최적화
3. **이벤트 기반**: 시험 제출 후 비동기 처리
4. **분산 처리**: 대규모 채점 작업 분산

---

## 🎯 시스템 특징 요약

### 1. **템플릿 기반 아키텍처**
- Question Pool → Template → Exam 계층 구조
- 재사용 가능한 시험 구조 정의

### 2. **결정적 랜덤 선택**
- `randomSeed`로 재현 가능한 문제 선택
- 디버깅 및 평가 기준 통일 가능

### 3. **세션 기반 상태 관리**
- JSON 형태로 답안 저장
- 섹션 이동, 문제 복습 지원

### 4. **종합적인 학습 지원**
- 단어장, 복습 시스템 (SRS)
- 학습 패턴 분석 및 추천

### 5. **관리자 중심 설계**
- 템플릿, 문제 풀 관리
- 사이트 설정 동적 관리
- 사용자 및 라이선스 관리

---

## 📝 주요 API 엔드포인트

### Core APIs
- `GET /api/exams` - 시험 목록
- `GET /api/exams/:id` - 시험 상세
- `POST /api/exams/:id/start` - 시험 시작
- `POST /api/sessions/:id/submit` - 시험 제출

### Admin APIs
- `POST /api/admin/templates` - 템플릿 생성
- `POST /api/admin/exams/from-template` - 템플릿으로 시험 생성
- `GET /api/admin/question-pools` - 문제 풀 목록
- `PUT /api/admin/site-settings` - 사이트 설정

### Report APIs
- `GET /api/results` - 결과 목록
- `GET /api/results/:id` - 결과 상세
- `GET /api/reports/analysis` - 분석 리포트

---

## 🔧 최근 개선사항

### 1. SRS 알고리즘 중복 제거
- `WordBookService`가 `SRSEnhancedService` 사용
- 코드 중복 제거로 유지보수성 향상

### 2. 컨트롤러 경로 일관성
- `QuestionController`: `@Controller('api/questions')`
- `SectionController`: `@Controller('api/sections')`
- RESTful 패턴 일관성 확보

### 3. 템플릿 시스템 개선
- Question Pool 직접 연결 (`questionPoolId`)
- 결정적 랜덤 선택 (`randomSeed`)

---

## 📚 참고 문서

- `BACKEND_EVALUATION.md`: Backend 완성도 평가
- `README.md`: 설치 및 실행 가이드
- `prisma/schema.prisma`: 데이터베이스 스키마

---

**작성일**: 2024년 11월  
**버전**: 1.0.0

