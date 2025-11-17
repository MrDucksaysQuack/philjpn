# Supabase 데이터베이스 구조 분석

## 📊 전체 테이블 목록

### 1. 사용자 관리 (User Management)
#### `users` 테이블
- **용도**: 사용자 계정 정보
- **주요 필드**:
  - `id`, `email`, `password`, `name`
  - `role` (user, admin, partner)
  - `phone`, `profileImage`
  - `isActive`, `isEmailVerified`
  - `lastLoginAt`, `createdAt`

### 2. 시험 시스템 (Exam System)
#### `exams` 테이블
- **용도**: 시험 기본 정보
- **주요 필드**:
  - `title`, `description`
  - `examType` (mock, practice, official)
  - `subject`, `difficulty`
  - `totalQuestions`, `totalSections`
  - `estimatedTime`, `passingScore`
  - `isActive`, `isPublic`

#### `sections` 테이블
- **용도**: 시험 섹션 정보
- **주요 필드**:
  - `title`, `description`
  - `order`, `questionCount`
  - `timeLimit`

#### `questions` 테이블
- **용도**: 문제 정보
- **주요 필드**:
  - `content`, `questionType`
  - `options` (JSON), `correctAnswer`
  - `explanation`, `points`
  - `difficulty`, `tags`

#### `exam_configs` 테이블
- **용도**: 시험 설정
- **주요 필드**:
  - `allowSectionNavigation`
  - `allowQuestionReview`
  - `showAnswerAfterSubmit`
  - `shuffleQuestions`, `shuffleOptions`

### 3. 시험 결과 (Exam Results)
#### `exam_results` 테이블
- **용도**: 시험 결과 요약
- **주요 필드**:
  - `totalScore`, `maxScore`, `percentage`
  - `timeSpent`, `status`
  - `startedAt`, `submittedAt`, `gradedAt`
  - `extractedWords` (단어 ID 배열)
  - `learningInsights` (JSON)

#### `section_results` 테이블
- **용도**: 섹션별 결과
- **주요 필드**:
  - `correctCount`, `incorrectCount`, `unansweredCount`
  - `score`, `maxScore`, `timeSpent`

#### `question_results` 테이블
- **용도**: 문제별 결과
- **주요 필드**:
  - `userAnswer`, `isCorrect`
  - `pointsEarned`, `pointsPossible`
  - `timeSpent`, `answeredAt`

#### `user_exam_sessions` 테이블
- **용도**: 진행 중인 시험 세션
- **주요 필드**:
  - `currentSectionId`, `currentQuestionNumber`
  - `answers` (JSON)
  - `startTime`, `lastActivityAt`, `expiresAt`

### 4. 학습 데이터 (Learning Data)
#### `word_books` 테이블
- **용도**: 사용자 단어장
- **주요 필드**:
  - `word`, `meaning`, `example`
  - `difficulty`, `source`, `sourceId`
  - `masteryLevel` (0-100)
  - `reviewCount`, `lastReviewedAt`, `nextReviewAt`
  - `tags`

#### `learning_patterns` 테이블
- **용도**: 학습 패턴 분석
- **주요 필드**:
  - `date`, `hour` (0-23), `dayOfWeek` (0-6)
  - `sessionLength`, `score`
  - `focusLevel`, `efficiency`
  - `examResultId`

#### `learning_cycles` 테이블
- **용도**: 학습 사이클 관리
- **주요 필드**:
  - `cycleType`, `stage`
  - `startDate`, `endDate`
  - `targetWords`, `targetExams`
  - `improvement`, `wordsLearned`

#### `user_goals` 테이블
- **용도**: 사용자 목표
- **주요 필드**:
  - `goalType` (score_target, weakness_recovery, exam_count, word_count)
  - `targetValue`, `currentValue`
  - `deadline`, `status`
  - `milestones` (JSON)

### 5. 라이선스 관리 (License Management)
#### `license_keys` 테이블
- **용도**: 라이선스 키 관리
- **주요 필드**:
  - `key`, `keyType` (ACCESS_KEY, TEST_KEY, ADMIN_KEY)
  - `examIds` (시험 ID 배열)
  - `usageLimit`, `usageCount`
  - `validFrom`, `validUntil`
  - `isActive`

#### `key_usage_logs` 테이블
- **용도**: 키 사용 로그
- **주요 필드**:
  - `action`, `status` (success, failed, rejected)
  - `ipAddress`, `userAgent`
  - `examId`, `examResultId`

### 6. 관리 및 감사 (Admin & Audit)
#### `audit_logs` 테이블
- **용도**: 시스템 감사 로그
- **주요 필드**:
  - `action`, `entityType`, `entityId`
  - `changes` (JSON)
  - `ipAddress`, `userAgent`

### 7. 템플릿 및 문제 풀 (Templates & Pools)
#### `exam_templates` 테이블
- **용도**: 시험 템플릿
- **주요 필드**:
  - `name`, `description`
  - `structure` (JSON)
  - `questionPoolIds`

#### `question_pools` 테이블
- **용도**: 문제 풀 관리
- **주요 필드**:
  - `name`, `description`
  - `tags`, `difficulty`
  - `questionIds` (문제 ID 배열)

#### `question_banks` 테이블
- **용도**: 문제 은행
- **주요 필드**:
  - `name`, `description`, `category`

### 8. 사이트 설정 (Site Settings)
#### `site_settings` 테이블
- **용도**: 사이트 전역 설정
- **주요 필드**:
  - `companyName`, `logoUrl`, `faviconUrl`
  - `primaryColor`, `secondaryColor`, `accentColor`
  - `aboutCompany`, `aboutTeam`, `serviceInfo`
  - `contactInfo` (JSON)
  - `companyStats` (JSON) - 통계
  - `companyValues` (JSON) - 미션/비전/가치
  - `teamMembers` (JSON) - 팀원
  - `teamCulture` (JSON) - 팀 문화
  - `serviceFeatures` (JSON) - 서비스 기능
  - `serviceBenefits` (JSON) - 서비스 혜택
  - `serviceProcess` (JSON) - 프로세스

## 📈 샘플 데이터가 필요한 주요 테이블

### 필수 데이터 (시스템 작동을 위해)
1. **users** - 최소 1명의 admin 사용자
2. **site_settings** - 기본 사이트 설정

### 권장 데이터 (데모/테스트용)
3. **exams** - 2-3개의 시험
4. **sections** - 각 시험당 2-3개 섹션
5. **questions** - 각 섹션당 5-10개 문제
6. **exam_results** - 사용자별 시험 결과 5-10개
7. **word_books** - 사용자별 단어 10-20개
8. **user_goals** - 사용자 목표 2-3개
9. **learning_patterns** - 학습 패턴 데이터 (최근 30일)
10. **license_keys** - 테스트용 라이선스 키 2-3개

### 선택 데이터 (고급 기능)
11. **exam_templates** - 템플릿 1-2개
12. **question_pools** - 문제 풀 2-3개
13. **learning_cycles** - 학습 사이클 1-2개

## 🔗 테이블 간 관계

```
users
  ├── exams (createdExams)
  ├── exam_results
  ├── word_books
  ├── user_goals
  ├── learning_patterns
  ├── learning_cycles
  ├── license_keys
  └── site_settings (updatedSiteSettings)

exams
  ├── sections
  ├── exam_results
  ├── exam_configs
  └── user_exam_sessions

sections
  └── questions

exam_results
  ├── section_results
  └── user_exam_sessions

section_results
  └── question_results

questions
  ├── question_results
  └── question_pools (questionIds)
```

## 📝 샘플 데이터 생성 우선순위

1. **1단계: 기본 설정** (필수)
   - users (admin 1명)
   - site_settings (기본 설정)

2. **2단계: 시험 데이터** (권장)
   - exams (2-3개)
   - sections (시험당 2-3개)
   - questions (섹션당 5-10개)
   - exam_configs

3. **3단계: 사용자 활동 데이터** (권장)
   - exam_results (5-10개)
   - word_books (10-20개)
   - user_goals (2-3개)

4. **4단계: 학습 분석 데이터** (선택)
   - learning_patterns (30일치)
   - learning_cycles (1-2개)

5. **5단계: 관리 도구** (선택)
   - exam_templates
   - question_pools
   - license_keys


