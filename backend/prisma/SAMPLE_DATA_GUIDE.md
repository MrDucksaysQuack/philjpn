# 📚 인지 학습 기능 샘플 데이터 가이드

> Admin이 시스템을 이해하기 위한 샘플 데이터 설명서

**작성일**: 2024년 11월

---

## 🎯 개요

이 가이드는 새로 추가된 인지 학습 기능에 대한 샘플 데이터를 설명합니다. Admin이 시스템의 구조와 동작 방식을 이해할 수 있도록 구성되었습니다.

---

## 📦 생성되는 샘플 데이터

### 1. 문제 풀 (QuestionPool) - 3개

#### 📌 문법 기초 문제 풀
- **ID**: `sample-pool-grammar-basic`
- **이름**: 문법 기초 문제 풀
- **태그**: 문법, 기초, 시제, 조동사
- **난이도**: easy
- **문제 수**: 10개
- **용도**: 문법 기초 개념 연습

#### 📌 어휘 중급 문제 풀
- **ID**: `sample-pool-vocabulary-intermediate`
- **이름**: 어휘 중급 문제 풀
- **태그**: 어휘, 중급, 단어
- **난이도**: medium
- **문제 수**: 15개
- **용도**: 중급 수준 어휘력 향상

#### 📌 독해 고급 문제 풀
- **ID**: `sample-pool-reading-advanced`
- **이름**: 독해 고급 문제 풀
- **태그**: 독해, 고급, 이해
- **난이도**: hard
- **문제 수**: 12개
- **용도**: 고급 독해 능력 향상

---

### 2. 시험 템플릿 (ExamTemplate) - 3개

#### 📋 토익 모의고사 템플릿
- **ID**: `sample-template-toefl-mock`
- **이름**: 토익 모의고사 템플릿
- **구조**:
  - 섹션 1: 리스닝 (100문제, 중급)
  - 섹션 2: 리딩 (100문제, 중급)
- **총 문제 수**: 200문제
- **예상 시간**: 120분
- **사용 문제 풀**: 모든 풀 포함

#### 📋 문법 집중 연습 템플릿
- **ID**: `sample-template-grammar-focus`
- **이름**: 문법 집중 연습 템플릿
- **구조**:
  - 섹션 1: 문법 기초 (30문제, 쉬움)
  - 섹션 2: 문법 중급 (30문제, 중급)
  - 섹션 3: 문법 응용 (20문제, 어려움)
- **총 문제 수**: 80문제
- **예상 시간**: 60분
- **용도**: 문법 약점 개선 전용

#### 📋 어휘 마스터 템플릿
- **ID**: `sample-template-vocabulary-master`
- **이름**: 어휘 마스터 템플릿
- **구조**:
  - 섹션 1: 어휘 기초 (25문제)
  - 섹션 2: 어휘 중급 (25문제)
  - 섹션 3: 어휘 고급 (20문제)
- **총 문제 수**: 70문제
- **예상 시간**: 50분

---

### 3. 사용자 목표 (UserGoal) - 4개

#### 🎯 점수 목표 (진행 중)
- **ID**: `sample-goal-score-900`
- **사용자**: student@example.com
- **목표**: 900점 달성
- **현재**: 850점
- **마감일**: 2024-12-31
- **상태**: active (진행 중)
- **중간 목표**:
  - 2024-11-15: 850점
  - 2024-11-30: 875점
  - 2024-12-15: 890점

#### 🎯 약점 회복 목표
- **ID**: `sample-goal-weakness-grammar`
- **목표**: 문법 정답률 80% 달성
- **현재**: 65%
- **마감일**: 2024-12-15
- **상태**: active

#### 🎯 시험 횟수 목표
- **ID**: `sample-goal-exam-count`
- **목표**: 시험 20회 응시
- **현재**: 12회
- **마감일**: 2024-12-31
- **상태**: active

#### 🎯 단어 학습 목표 (달성 완료)
- **ID**: `sample-goal-word-achieved`
- **목표**: 단어 100개 학습
- **현재**: 100개 ✅
- **상태**: achieved (달성 완료)

---

### 4. 학습 패턴 (LearningPattern) - 30일치

#### 📊 생성되는 데이터
- **기간**: 최근 30일
- **레코드 수**: 약 60-90개 (하루 1-3회 세션)
- **포함 정보**:
  - 학습 시간대 (0-23시)
  - 요일 (0=일요일 ~ 6=토요일)
  - 세션 길이 (30-90분)
  - 점수 (70-100점)
  - 집중도 (0.7-1.0)
  - 효율성 (0.75-0.95)

#### 📈 패턴 특징
- **평일**: 주로 오전 9-10시, 오후 2-4시, 저녁 8-9시
- **주말**: 주로 오전 10-11시, 오후 2-3시
- **평균 세션 길이**: 약 50-60분

---

### 5. 학습 사이클 (LearningCycle) - 3개

#### 🔄 약점 집중 학습 사이클 (진행 중)
- **ID**: `sample-cycle-weakness-active`
- **사용자**: student@example.com
- **타입**: weakness_focused
- **단계**: practice (연습 단계)
- **시작일**: 2024-11-01
- **종료일**: null (진행 중)
- **목표 시험**: 2개

#### 🔄 어휘 학습 사이클 (완료됨)
- **ID**: `sample-cycle-vocabulary-completed`
- **타입**: vocabulary
- **단계**: test (테스트 단계)
- **시작일**: 2024-10-01
- **종료일**: 2024-10-15
- **개선**: +12.5점 향상
- **학습 단어**: 35개

#### 🔄 종합 학습 사이클 (진행 중)
- **ID**: `sample-cycle-comprehensive`
- **타입**: comprehensive
- **단계**: review (복습 단계)
- **시작일**: 2024-11-05
- **종료일**: null (진행 중)

---

## 🚀 실행 방법

### 1. 샘플 데이터 생성

```bash
cd backend
npm run seed:cognitive
```

### 2. 데이터 확인

#### Prisma Studio 사용
```bash
npm run prisma:studio
```
브라우저에서 각 모델의 데이터를 시각적으로 확인할 수 있습니다.

#### 데이터베이스 직접 확인
```bash
# PostgreSQL 접속
psql -h localhost -U your_user -d your_database

# 테이블 조회
SELECT * FROM question_pools;
SELECT * FROM exam_templates;
SELECT * FROM user_goals;
SELECT * FROM learning_patterns;
SELECT * FROM learning_cycles;
```

---

## 📊 데이터 구조 이해하기

### 문제 풀 → 시험 템플릿 → 시험 생성 플로우

```
1. 문제 풀 생성 (QuestionPool)
   ↓
2. 템플릿 생성 (ExamTemplate)
   - 문제 풀들을 참조하여 구조 정의
   ↓
3. 템플릿으로 시험 생성
   - 템플릿의 구조대로 문제 자동 선택
   ↓
4. 시험 응시 및 결과 분석
   ↓
5. 학습 패턴 기록 (LearningPattern)
   ↓
6. 학습 사이클 생성/업데이트 (LearningCycle)
```

### 사용자 목표 → 학습 사이클 연계

```
1. 사용자가 목표 설정 (UserGoal)
   예: "900점 달성"
   ↓
2. 시스템이 약점 분석
   ↓
3. 학습 사이클 생성 (LearningCycle)
   - 약점 개선을 위한 단계별 학습
   ↓
4. 사이클 단계 진행
   - identify → practice → review → test
   ↓
5. 목표 진행 상황 업데이트
   ↓
6. 목표 달성 시 축하!
```

---

## 🔍 샘플 데이터로 테스트할 수 있는 기능

### 1. 시험 템플릿 관리
- `/admin/templates` 페이지에서 템플릿 목록 확인
- 템플릿 수정 및 삭제 테스트
- 템플릿으로 새 시험 생성

### 2. 문제 풀 관리
- 문제 풀별 문제 수 확인
- 태그/난이도로 필터링 검증

### 3. 사용자 목표 추적
- `/analysis?tab=goals` 페이지에서 목표 확인
- 진행률 및 마일스톤 확인
- 목표 달성 감지 테스트

### 4. 학습 패턴 분석
- `/analysis?tab=patterns` 페이지에서 패턴 확인
- 시간대별 학습 효율성 히트맵
- 평균 세션 길이, 선호 요일 확인

### 5. 학습 사이클 관리
- 현재 사이클 단계 확인
- 사이클 단계 업데이트
- 사이클 완료 처리

---

## 💡 Admin을 위한 팁

### 시험 템플릿 활용
1. **빠른 시험 생성**: 템플릿을 사용하면 몇 번의 클릭으로 시험 생성 가능
2. **표준화**: 동일한 형식의 시험을 일괄 생성
3. **문제 풀 연동**: 문제 풀을 업데이트하면 템플릿의 시험도 자동 반영

### 학습 패턴 활용
- 사용자의 **최적 학습 시간대** 파악
- **집중도 하락 시점** 확인하여 적절한 휴식 제안
- **학습 효율성** 추적하여 개선점 도출

### 목표 관리
- 사용자가 설정한 목표의 **달성 가능성** 평가
- **중간 목표(마일스톤)** 설정으로 동기 부여
- **목표 달성률** 모니터링

---

## 🧹 데이터 초기화

샘플 데이터를 삭제하려면:

```typescript
// Prisma Studio 또는 직접 SQL로 삭제
await prisma.learningCycle.deleteMany({
  where: { id: { startsWith: 'sample-' } },
});
await prisma.learningPattern.deleteMany({
  where: { userId: 'sample-user-id' },
});
// ... 등등
```

또는:

```sql
DELETE FROM learning_cycles WHERE id LIKE 'sample-%';
DELETE FROM learning_patterns WHERE user_id = 'sample-user-id';
DELETE FROM user_goals WHERE id LIKE 'sample-%';
DELETE FROM exam_templates WHERE id LIKE 'sample-%';
DELETE FROM question_pools WHERE id LIKE 'sample-%';
```

---

## 📝 참고

- 모든 샘플 데이터의 ID는 `sample-` 접두사로 시작합니다
- 실제 프로덕션에서는 이 접두사를 제거하고 실제 UUID를 사용하세요
- 샘플 사용자: `student@example.com` / `student123`

