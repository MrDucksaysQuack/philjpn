# 📊 시스템 데이터 요구사항 분석

> 샘플 데이터 구성 전 필요한 데이터 구조 분석

**작성일**: 2024년 11월  
**목적**: 시스템의 모든 기능이 제대로 작동하기 위해 필요한 데이터 구조 파악

---

## 🎯 분석 범위

### 주요 페이지 및 기능
1. **메인 페이지** (`/`) - 랜딩 페이지
2. **사용자 대시보드** (`/dashboard`) - 개인화된 학습 정보
3. **시험 목록** (`/exams`) - 시험 목록 및 필터링
4. **시험 응시** (`/exams/[id]/take`) - 실제 시험 응시
5. **결과 상세** (`/results/[id]`) - 상세 피드백 및 분석
6. **통계** (`/statistics`) - 학습 통계 및 차트
7. **자기 분석** (`/analysis`) - 학습 패턴, 약점, 효율성 분석
8. **단어장** (`/wordbook`) - 학습 단어 관리
9. **추천 시험** (`/exams/recommended`) - 맞춤형 추천
10. **Admin 대시보드** (`/admin`) - 관리자 기능

---

## 📋 필수 데이터 모델별 요구사항

### 1. User (사용자) ⭐⭐⭐⭐⭐

**필요한 데이터**:
- **관리자 계정**: 1-2명 (시스템 관리용)
- **일반 사용자**: 3-5명 (다양한 학습 패턴 시연)
- **파트너 계정**: 1명 (선택사항)

**데이터 특성**:
- `role`: admin, user, partner
- `isActive`: true (활성화된 계정)
- `isEmailVerified`: true (이메일 인증 완료)
- `lastLoginAt`: 최근 로그인 시간 (다양한 시점)
- `createdAt`: 다양한 가입 시점 (30일 전 ~ 오늘)

**사용되는 곳**:
- 모든 페이지의 인증/인가
- 대시보드 개인화
- Admin 페이지의 사용자 관리

---

### 2. Exam (시험) ⭐⭐⭐⭐⭐

**필요한 데이터**:
- **최소 5-10개 시험** (다양한 유형 포함)
  - `mock`: 모의고사 3-5개
  - `practice`: 연습 시험 3-5개
  - `official`: 공식 시험 1-2개

**데이터 특성**:
- `examType`: mock, practice, official (균형 있게)
- `subject`: "일본어", "영어", "수학" 등
- `difficulty`: easy, medium, hard (모두 포함)
- `isActive`: true (활성화된 시험)
- `isPublic`: true/false (공개/비공개 혼합)
- `totalQuestions`: 10-50개 (다양한 문제 수)
- `totalSections`: 1-5개 (다양한 섹션 수)
- `estimatedTime`: 30-120분
- `passingScore`: 60-80점 (과목별 다양)
- `publishedAt`: 최근 30일 내 다양한 시점
- `createdBy`: 관리자 또는 사용자

**사용되는 곳**:
- 시험 목록 페이지 (`/exams`)
- 시험 응시 페이지 (`/exams/[id]/take`)
- 추천 시험 페이지 (`/exams/recommended`)
- Admin 시험 관리

---

### 3. ExamConfig (시험 설정) ⭐⭐⭐⭐

**필요한 데이터**:
- 각 Exam에 1:1로 연결된 설정

**데이터 특성**:
- `allowSectionNavigation`: true/false (혼합)
- `allowQuestionReview`: true (대부분)
- `showAnswerAfterSubmit`: true (대부분)
- `showScoreImmediately`: true (대부분)
- `timeLimitPerSection`: true/false (혼합)
- `shuffleQuestions`: false (대부분)
- `shuffleOptions`: false (대부분)
- `preventTabSwitch`: false (대부분)

**사용되는 곳**:
- 시험 응시 페이지의 동작 제어

---

### 4. Section (섹션) ⭐⭐⭐⭐⭐

**필요한 데이터**:
- 각 Exam에 1-5개 섹션

**데이터 특성**:
- `title`: "문법", "어휘", "독해", "리스닝" 등
- `order`: 1, 2, 3... (순서대로)
- `questionCount`: 5-20개 (섹션별 다양)
- `timeLimit`: 300-1800초 (섹션별 다양)

**사용되는 곳**:
- 시험 응시 페이지의 섹션 네비게이션
- 시험 결과 페이지의 섹션별 분석

---

### 5. Question (문제) ⭐⭐⭐⭐⭐

**필요한 데이터**:
- **최소 100-200개 문제** (다양한 유형 포함)

**데이터 특성**:
- `questionType`: 
  - `multiple_choice`: 60-70% (대부분)
  - `fill_blank`: 20-30%
  - `essay`: 5-10%
- `content`: 실제 문제 내용 (일본어/영어 등)
- `options`: JSON 배열 (객관식의 경우)
- `correctAnswer`: 정답
- `explanation`: 해설 (상세한 설명)
- `points`: 1-5점 (대부분 1-2점)
- `difficulty`: easy, medium, hard (균형 있게)
- `tags`: ["문법", "시제", "조동사"], ["어휘", "동사"], ["독해"] 등
- `questionNumber`: 섹션 내 순서

**사용되는 곳**:
- 시험 응시 페이지의 문제 표시
- 시험 결과 페이지의 상세 피드백
- 약점 분석 (태그 기반)

---

### 6. ExamResult (시험 결과) ⭐⭐⭐⭐⭐

**필요한 데이터**:
- **각 사용자당 5-15개 결과** (시간적으로 분산)

**데이터 특성**:
- `userId`: 다양한 사용자
- `examId`: 다양한 시험
- `status`: 
  - `completed`: 80-90% (대부분)
  - `in_progress`: 5-10%
  - `abandoned`: 5-10%
- `totalScore`: 0 ~ maxScore 사이 (다양한 점수)
- `maxScore`: 시험의 총점
- `percentage`: 0-100 (다양한 성적)
- `timeSpent`: 600-7200초 (다양한 소요 시간)
- `startedAt`: 최근 90일 내 다양한 시점 (시간대도 다양하게)
- `submittedAt`: startedAt 이후 (시간 차이 다양)
- `extractedWords`: 단어 ID 배열 (일부 결과에만)
- `licenseKeyId`: 일부 결과에만 (라이선스 키 사용 시)

**시간 분포**:
- 오늘: 1-2개
- 이번 주: 3-5개
- 이번 달: 5-10개
- 2-3개월 전: 5-10개

**사용되는 곳**:
- 대시보드의 "오늘 응시한 시험" 카드
- 대시보드의 "최근 평균 점수" 카드
- 대시보드의 "최근 활동" 위젯
- 결과 목록 페이지 (`/results`)
- 결과 상세 페이지 (`/results/[id]`)
- 통계 페이지 (`/statistics`)
- 학습 패턴 분석 (시간대별, 요일별)
- 약점 분석 (태그별 정답률)
- 효율성 지표 계산

---

### 7. SectionResult (섹션 결과) ⭐⭐⭐⭐⭐

**필요한 데이터**:
- 각 ExamResult에 1:1로 Section에 연결

**데이터 특성**:
- `correctCount`: 0 ~ questionCount
- `incorrectCount`: 0 ~ questionCount
- `unansweredCount`: 0 ~ questionCount (일부)
- `score`: 섹션별 점수
- `maxScore`: 섹션별 최대 점수
- `timeSpent`: 섹션별 소요 시간

**사용되는 곳**:
- 결과 상세 페이지의 섹션별 분석
- 약점 분석의 섹션별 성과

---

### 8. QuestionResult (문제 결과) ⭐⭐⭐⭐⭐

**필요한 데이터**:
- 각 SectionResult에 포함된 모든 문제

**데이터 특성**:
- `userAnswer`: 사용자가 입력한 답안
- `isCorrect`: true/false (다양한 정답률)
- `pointsEarned`: 0 또는 points
- `pointsPossible`: 문제의 배점
- `timeSpent`: 문제별 소요 시간 (초)
- `answeredAt`: 응답 시점

**정답률 분포**:
- 쉬운 문제: 70-90% 정답률
- 중간 문제: 50-70% 정답률
- 어려운 문제: 30-50% 정답률

**사용되는 곳**:
- 결과 상세 페이지의 문제별 피드백
- 약점 분석 (태그별 정답률 계산)
- 학습 패턴 분석 (문제별 소요 시간)

---

### 9. WordBook (단어장) ⭐⭐⭐⭐

**필요한 데이터**:
- **각 사용자당 10-50개 단어**

**데이터 특성**:
- `word`: 단어 (일본어/영어)
- `meaning`: 의미 (한국어)
- `example`: 예문 (선택사항)
- `difficulty`: easy, medium, hard
- `source`: "exam_result", "manual" 등
- `sourceExamResultId`: 시험 결과에서 추출된 경우
- `masteryLevel`: 0-100 (다양한 수준)
- `reviewCount`: 0-20 (다양한 복습 횟수)
- `lastReviewedAt`: 최근 30일 내 (일부)
- `nextReviewAt`: 향후 날짜 (일부)
- `tags`: ["문법", "기초"], ["어휘", "중급"] 등
- `extractedAt`: 추출 시점

**사용되는 곳**:
- 대시보드의 "학습 중인 단어" 카드
- 단어장 페이지 (`/wordbook`)
- 대시보드의 "단어장 요약" 위젯

---

### 10. UserGoal (사용자 목표) ⭐⭐⭐⭐

**필요한 데이터**:
- **각 사용자당 1-3개 목표**

**데이터 특성**:
- `goalType`:
  - `score_target`: 점수 목표 (예: 900점)
  - `weakness_recovery`: 약점 회복 (예: 문법 80% 달성)
  - `exam_count`: 시험 횟수 목표 (예: 20회)
  - `word_count`: 단어 학습 목표 (예: 100개)
- `targetValue`: 목표 값
- `currentValue`: 현재 값 (다양한 진행률)
- `deadline`: 향후 날짜 (30-90일 후)
- `status`:
  - `active`: 진행 중 (대부분)
  - `achieved`: 달성 완료 (1-2개)
  - `failed`: 실패 (선택사항)
  - `paused`: 일시정지 (선택사항)
- `milestones`: 중간 목표 JSON 배열

**사용되는 곳**:
- 대시보드의 "목표 진행률" 위젯
- 자기 분석 페이지의 목표 탭
- 목표 달성 축하 기능

---

### 11. LearningPattern (학습 패턴) ⭐⭐⭐⭐

**필요한 데이터**:
- **각 사용자당 30-60개 레코드** (최근 30일)

**데이터 특성**:
- `date`: 최근 30일 내 날짜
- `hour`: 0-23 (다양한 시간대)
- `dayOfWeek`: 0-6 (다양한 요일)
- `sessionLength`: 30-120분 (다양한 세션 길이)
- `score`: 70-100점 (다양한 성적)
- `focusLevel`: 0.7-1.0 (집중도)
- `efficiency`: 0.75-0.95 (효율성)
- `examResultId`: 연결된 시험 결과 ID

**패턴 특징**:
- 평일: 주로 오전 9-10시, 오후 2-4시, 저녁 8-9시
- 주말: 주로 오전 10-11시, 오후 2-3시
- 평균 세션 길이: 50-60분

**사용되는 곳**:
- 대시보드의 "학습 패턴 인사이트" 위젯
- 자기 분석 페이지의 학습 패턴 탭
- 시간대별 효율성 히트맵

---

### 12. LearningCycle (학습 사이클) ⭐⭐⭐

**필요한 데이터**:
- **각 사용자당 1-3개 사이클**

**데이터 특성**:
- `cycleType`: "weakness_focused", "vocabulary", "comprehensive"
- `stage`: "identify", "practice", "review", "test"
- `startDate`: 최근 30일 내
- `endDate`: null (진행 중) 또는 과거 날짜 (완료)
- `targetWords`: 단어 ID 배열
- `targetExams`: 시험 ID 배열
- `improvement`: 점수 향상 (완료된 경우)
- `wordsLearned`: 학습한 단어 수

**사용되는 곳**:
- 학습 사이클 관리 (현재는 직접 사용 안 함)

---

### 13. LicenseKey (라이선스 키) ⭐⭐⭐

**필요한 데이터**:
- **5-10개 라이선스 키**

**데이터 특성**:
- `key`: 고유 키 문자열
- `keyType`: ACCESS_KEY, TEST_KEY, ADMIN_KEY
- `examIds`: 시험 ID 배열
- `usageLimit`: null (무제한) 또는 숫자
- `usageCount`: 0-50 (다양한 사용 횟수)
- `validFrom`: 시작 날짜
- `validUntil`: 종료 날짜 (일부는 만료)
- `isActive`: true/false (혼합)
- `userId`: 할당된 사용자 (일부)
- `issuedBy`: 발행자 (관리자)

**사용되는 곳**:
- Admin 라이선스 키 관리
- 시험 응시 시 라이선스 검증

---

### 14. QuestionPool (문제 풀) ⭐⭐⭐

**필요한 데이터**:
- **3-5개 문제 풀**

**데이터 특성**:
- `name`: "문법 기초 문제 풀", "어휘 중급 문제 풀" 등
- `description`: 설명
- `tags`: ["문법", "기초"], ["어휘", "중급"] 등
- `difficulty`: easy, medium, hard
- `questionIds`: 문제 ID 배열
- `createdBy`: 관리자

**사용되는 곳**:
- Admin 문제 풀 관리
- 시험 템플릿 생성 시 참조

---

### 15. ExamTemplate (시험 템플릿) ⭐⭐⭐

**필요한 데이터**:
- **3-5개 템플릿**

**데이터 특성**:
- `name`: "토익 모의고사 템플릿", "문법 집중 연습 템플릿" 등
- `description`: 설명
- `structure`: JSON 구조 (섹션별 설정)
- `questionPoolIds`: 문제 풀 ID 배열
- `createdBy`: 관리자

**사용되는 곳**:
- Admin 템플릿 관리
- 템플릿으로 시험 생성

---

## 🔗 데이터 관계 및 종속성

### 핵심 관계 체인

```
User
  ↓
  ├─→ ExamResult (시험 결과)
  │     ├─→ SectionResult (섹션 결과)
  │     │     └─→ QuestionResult (문제 결과)
  │     │           └─→ Question (문제)
  │     └─→ Exam (시험)
  │           ├─→ ExamConfig (시험 설정)
  │           └─→ Section (섹션)
  │                 └─→ Question (문제)
  │
  ├─→ WordBook (단어장) ← ExamResult (추출된 단어)
  ├─→ UserGoal (목표)
  ├─→ LearningPattern (학습 패턴) ← ExamResult
  └─→ LicenseKey (라이선스 키)
```

### 생성 순서 (중요!)

1. **User** (사용자) - 가장 먼저 생성
2. **Question** (문제) - 문제 풀에 포함
3. **Section** (섹션) - 문제를 포함
4. **Exam** (시험) - 섹션을 포함
5. **ExamConfig** (시험 설정) - Exam과 1:1
6. **QuestionPool** (문제 풀) - 문제 참조
7. **ExamTemplate** (템플릿) - 문제 풀 참조
8. **LicenseKey** (라이선스 키) - Exam 참조
9. **ExamResult** (시험 결과) - User, Exam, LicenseKey 참조
10. **SectionResult** (섹션 결과) - ExamResult, Section 참조
11. **QuestionResult** (문제 결과) - SectionResult, Question 참조
12. **WordBook** (단어장) - User, ExamResult 참조
13. **UserGoal** (목표) - User 참조
14. **LearningPattern** (학습 패턴) - User, ExamResult 참조

---

## 📊 데이터 규모 권장사항

### 최소 규모 (기능 테스트용)
- Users: 3명 (admin 1명, user 2명)
- Exams: 5개
- Questions: 50개
- ExamResults: 10개 (사용자당 3-5개)
- WordBooks: 20개 (사용자당 5-10개)
- UserGoals: 3개 (사용자당 1개)
- LearningPatterns: 30개 (사용자당 10개)

### 권장 규모 (시연용)
- Users: 5명 (admin 1명, user 4명)
- Exams: 10개
- Questions: 150개
- ExamResults: 30개 (사용자당 5-10개)
- WordBooks: 50개 (사용자당 10-15개)
- UserGoals: 8개 (사용자당 1-2개)
- LearningPatterns: 60개 (사용자당 10-15개)

### 이상적 규모 (완전한 시연용)
- Users: 8명 (admin 1명, user 6명, partner 1명)
- Exams: 15개
- Questions: 200개
- ExamResults: 60개 (사용자당 7-10개)
- WordBooks: 100개 (사용자당 10-20개)
- UserGoals: 15개 (사용자당 2-3개)
- LearningPatterns: 120개 (사용자당 15-20개)

---

## ⚠️ 주의사항

### 데이터 품질 요구사항

1. **시간적 분산**
   - 시험 결과는 최근 90일 내 다양한 시점에 분산
   - 학습 패턴은 최근 30일 내 일일 분산
   - 시간대와 요일도 다양하게 분산

2. **정답률 분포**
   - 쉬운 문제: 70-90% 정답률
   - 중간 문제: 50-70% 정답률
   - 어려운 문제: 30-50% 정답률
   - 전체적으로 점진적 향상 패턴 보여주기

3. **관계 무결성**
   - 모든 외래 키 관계가 올바르게 연결
   - ExamResult의 totalScore는 SectionResult의 합계와 일치
   - SectionResult의 score는 QuestionResult의 합계와 일치

4. **현실성**
   - 실제 학습 시나리오를 반영
   - 시간 소요, 점수 분포가 자연스러움
   - 약점 패턴이 일관성 있게 나타남

---

## 🎯 다음 단계

1. ✅ **데이터 요구사항 분석 완료** (이 문서)
2. ⏭️ **샘플 데이터 스크립트 작성**
3. ⏭️ **Supabase 데이터베이스 구조 확인**
4. ⏭️ **데이터 생성 및 검증**
5. ⏭️ **시스템 테스트 및 조정**

---

## 📝 참고

- 모든 샘플 데이터는 실제 사용 가능한 형태로 생성
- 비밀번호는 해시화되어 저장
- 날짜와 시간은 현재 시점 기준으로 계산
- UUID는 실제 형식으로 생성

