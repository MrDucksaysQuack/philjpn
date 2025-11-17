# 시험 시스템 개선 계획

## 📊 현재 시스템 분석 결과

### ✅ 이미 잘 구현된 부분

1. **Exam Result 구조 (정규화 완료)**
   - `ExamResult` → `SectionResult` → `QuestionResult` 3단계 정규화 완료
   - 통계 분석 기능 이미 구현됨 (`AdminService.getExamAnalytics`, `ReportService`)
   - AI 추천 기능도 구현됨 (`RecommendationService`)
   - **결론**: 추가 개선 필요성 **낮음** ✅

2. **템플릿 삭제 보호**
   - 템플릿 삭제 시 사용 중인 시험이 있으면 삭제 불가
   - 기본적인 보호 메커니즘 존재

### ⚠️ 개선이 필요한 부분

1. **Question Pool → Template 연결 약함** (우선순위: **높음**)
2. **랜덤 문제 선택의 비결정성** (우선순위: **중간**)
3. **Template 버전 관리 미비** (우선순위: **중간**)
4. **Question Pool 통계 기능 부재** (우선순위: **낮음**)
5. **UI/UX 통합 마법사 부재** (우선순위: **낮음**)

---

## 🎯 개선 계획 (우선순위별)

### 🔴 Phase 1: 핵심 기능 개선 (즉시 필요)

#### 1.1 Question Pool → Template 직접 연결 구현

**현재 문제점**:
- `questionPoolIds` 필드는 있지만 실제로 사용되지 않음
- 템플릿이 태그/난이도 기반 필터링만 사용
- Pool의 의미가 "검색 필터"로만 작동

**개선 방안**:
```typescript
// Template 구조 개선
structure: {
  sections: [
    {
      type: "reading",
      questionCount: 20,
      // 옵션 1: Pool ID 직접 참조 (우선)
      questionPoolId: "uuid-pool-1",
      // 옵션 2: 태그/난이도 기반 (fallback)
      tags: ["문법"],
      difficulty: "medium"
    }
  ]
}
```

**구현 내용**:
1. **Prisma Schema 수정**
   - Template 구조는 JSON이므로 스키마 변경 불필요
   - DTO와 서비스 로직만 수정

2. **Template Service 로직 개선**
   ```typescript
   // 문제 선택 우선순위:
   // 1. questionPoolId가 있으면 → Pool의 questionIds에서 선택
   // 2. questionPoolId가 없으면 → 태그/난이도 기반 필터링 (기존 방식)
   ```

3. **성능 개선**
   - 현재: 모든 문제를 메모리에 로드 후 필터링 (비효율)
   - 개선: Pool ID 사용 시 해당 Pool의 문제만 조회

**예상 효과**:
- ✅ Pool의 의미가 "실제 문제 그룹"으로 명확해짐
- ✅ 문제 선택 속도 향상 (전체 문제 조회 불필요)
- ✅ 관리자 UX 개선 (Pool을 직접 선택 가능)

**작업량**: 중간 (2-3일)

---

#### 1.2 랜덤 시드 기반 문제 선택 구현

**현재 문제점**:
- `Math.random()` 사용으로 비결정적
- 동일 템플릿으로 생성한 시험이 매번 다른 문제 세트
- 재현성 없음

**개선 방안**:
```typescript
// Exam 모델에 randomSeed 추가
model Exam {
  // ... 기존 필드
  randomSeed Int? // 랜덤 시드 (템플릿 기반 생성 시 사용)
}

// Template Service 수정
async createExamFromTemplate(templateId, examData, seed?: number) {
  const randomSeed = seed || Date.now(); // 시드 미제공 시 타임스탬프 사용
  
  // 시드 기반 결정적 랜덤 생성
  const selectedQuestions = this.selectQuestionsWithSeed(
    filteredQuestions,
    questionCount,
    randomSeed
  );
  
  // Exam 생성 시 시드 저장
  const exam = await this.prisma.exam.create({
    data: {
      // ...
      randomSeed,
    }
  });
}

// 결정적 랜덤 선택 함수
selectQuestionsWithSeed(questions, count, seed) {
  // 시드 기반 의사 난수 생성기 사용
  const rng = new SeededRandom(seed);
  const shuffled = [...questions].sort(() => rng.next() - 0.5);
  return shuffled.slice(0, count);
}
```

**구현 내용**:
1. **Prisma Schema 수정**
   - `Exam` 모델에 `randomSeed Int?` 필드 추가

2. **SeededRandom 클래스 구현**
   - 시드 기반 의사 난수 생성기 (Linear Congruential Generator 등)

3. **Template Service 수정**
   - 문제 선택 로직을 시드 기반으로 변경

**예상 효과**:
- ✅ 동일 시드로 재생성 시 동일한 문제 세트 보장
- ✅ 디버깅 및 재현성 향상
- ✅ 평가 기준 통일 가능

**작업량**: 낮음 (1-2일)

---

### 🟡 Phase 2: 안정성 및 관리 기능 개선 (중기)

#### 2.1 Template 버전 관리

**현재 문제점**:
- 템플릿 수정 시 기존 Exam에 영향 가능성
- 버전 추적 불가

**개선 방안**:
```typescript
model ExamTemplate {
  id              String   @id @default(uuid())
  name            String
  version         Int      @default(1)
  baseTemplateId  String?  // 원본 템플릿 ID (버전 관리용)
  // ... 기존 필드
}

// 템플릿 수정 시 새 버전 생성
async updateTemplate(templateId, updateData) {
  const template = await this.getTemplate(templateId);
  
  // 기존 템플릿을 사용하는 시험이 있으면 새 버전 생성
  if (template._count.exams > 0) {
    return this.createTemplateVersion(templateId, updateData);
  } else {
    // 시험이 없으면 기존 템플릿 수정
    return this.updateExistingTemplate(templateId, updateData);
  }
}
```

**구현 내용**:
1. **Prisma Schema 수정**
   - `version Int @default(1)` 추가
   - `baseTemplateId String?` 추가 (원본 템플릿 참조)

2. **템플릿 수정 로직 개선**
   - 사용 중인 템플릿 수정 시 새 버전 생성
   - 기존 Exam은 기존 버전 참조 유지

**예상 효과**:
- ✅ 기존 Exam의 구조 보존
- ✅ 템플릿 변경 이력 추적 가능
- ✅ 안전한 템플릿 관리

**작업량**: 중간 (2-3일)

---

#### 2.2 Question Pool 통계 기능

**현재 문제점**:
- Pool 내부 데이터 통계 없음
- 중복 문제, 난이도 불균형 파악 어려움

**개선 방안**:
```typescript
model QuestionPool {
  // ... 기존 필드
  // 통계 필드 (계산된 값, DB에 저장)
  totalQuestions    Int      @default(0)
  tagDistribution   Json?   // { "문법": 80, "독해": 90 }
  difficultyStats   Json?   // { "easy": 45, "medium": 40, "hard": 15 }
  lastCalculatedAt   DateTime?
}

// Pool 통계 계산 함수
async calculatePoolStatistics(poolId: string) {
  const pool = await this.getQuestionPool(poolId);
  const questions = await this.prisma.question.findMany({
    where: { id: { in: pool.questionIds } }
  });
  
  // 통계 계산
  const stats = {
    totalQuestions: questions.length,
    tagDistribution: this.calculateTagDistribution(questions),
    difficultyStats: this.calculateDifficultyStats(questions),
    lastCalculatedAt: new Date()
  };
  
  // Pool 업데이트
  return this.updateQuestionPool(poolId, { ...stats });
}
```

**구현 내용**:
1. **Prisma Schema 수정**
   - 통계 필드 추가 (계산된 값)

2. **통계 계산 로직 구현**
   - Pool의 문제들을 조회하여 통계 계산
   - 문제 추가/제거 시 자동 재계산

3. **UI 개선**
   - Pool 목록에 통계 표시
   - Pool 상세 페이지에 통계 차트 추가

**예상 효과**:
- ✅ Pool 품질 한눈에 파악
- ✅ 중복 문제, 불균형 자동 감지
- ✅ 관리 효율성 향상

**작업량**: 낮음 (1-2일)

---

### 🟢 Phase 3: UX 개선 (장기)

#### 3.1 통합 시험 생성 마법사

**현재 문제점**:
- Question Pool → Template → Exam이 각각 다른 페이지
- 인지 부하 높음

**개선 방안**:
```
Step 1: 문제 풀 선택/생성
  → 기존 Pool 선택 또는 새 Pool 생성
  → Pool에 문제 추가

Step 2: 템플릿 구조 정의
  → 섹션 추가/수정
  → 각 섹션에 Pool 할당
  → 문제 개수 설정

Step 3: 미리보기
  → 템플릿 구조 확인
  → 예상 문제 수 확인
  → Pool 통계 확인

Step 4: 시험 생성
  → 시험 제목, 설명 입력
  → 설정 옵션 선택
  → 생성
```

**구현 내용**:
1. **새 페이지 생성**: `/admin/exams/create/wizard`
2. **다단계 폼 구현** (React Hook Form + Zustand)
3. **각 단계별 검증 및 미리보기**

**예상 효과**:
- ✅ 관리자 UX 대폭 개선
- ✅ 시험 생성 시간 단축
- ✅ 실수 감소

**작업량**: 높음 (5-7일)

---

## 📋 우선순위별 작업 계획

### 즉시 시작 (Phase 1)

1. **Question Pool → Template 직접 연결** (2-3일)
   - [ ] Prisma Schema 검토 (변경 불필요 확인)
   - [ ] Template Service 로직 수정
   - [ ] DTO 업데이트
   - [ ] 프론트엔드 UI 개선 (Pool 선택 드롭다운)
   - [ ] 테스트

2. **랜덤 시드 기반 문제 선택** (1-2일)
   - [ ] Prisma Schema 수정 (randomSeed 추가)
   - [ ] SeededRandom 클래스 구현
   - [ ] Template Service 수정
   - [ ] 테스트

### 중기 계획 (Phase 2)

3. **Template 버전 관리** (2-3일)
   - [ ] Prisma Schema 수정
   - [ ] 템플릿 수정 로직 개선
   - [ ] 버전 히스토리 UI
   - [ ] 테스트

4. **Question Pool 통계** (1-2일)
   - [ ] Prisma Schema 수정
   - [ ] 통계 계산 로직 구현
   - [ ] UI 개선
   - [ ] 테스트

### 장기 계획 (Phase 3)

5. **통합 시험 생성 마법사** (5-7일)
   - [ ] 마법사 페이지 설계
   - [ ] 다단계 폼 구현
   - [ ] 각 단계별 검증
   - [ ] 미리보기 기능
   - [ ] 테스트

---

## 🔍 각 개선 사항의 실제 필요성 평가

### ✅ 높은 우선순위 (즉시 구현 권장)

1. **Question Pool → Template 직접 연결**
   - **필요성**: 매우 높음
   - **이유**: 
     - 현재 Pool의 의미가 모호함
     - 성능 문제 (전체 문제 조회)
     - 관리자 혼란 가능성
   - **영향**: 시스템 핵심 기능 개선

2. **랜덤 시드 기반 문제 선택**
   - **필요성**: 높음
   - **이유**:
     - 재현성 필요 (디버깅, 평가)
     - 동일 시험 재생성 시 일관성
   - **영향**: 시스템 안정성 향상

### ⚠️ 중간 우선순위 (필요 시 구현)

3. **Template 버전 관리**
   - **필요성**: 중간
   - **이유**:
     - 현재는 템플릿 삭제 보호로 어느 정도 해결됨
     - 하지만 수정 시 영향 가능성은 여전히 존재
   - **영향**: 안정성 향상, 하지만 현재 시스템에서 긴급하지 않음

4. **Question Pool 통계**
   - **필요성**: 중간
   - **이유**:
     - Pool 관리 편의성 향상
     - 하지만 필수 기능은 아님
   - **영향**: UX 개선, 핵심 기능은 아님

### 🟢 낮은 우선순위 (선택적 구현)

5. **통합 시험 생성 마법사**
   - **필요성**: 낮음
   - **이유**:
     - 현재도 각 페이지에서 기능 사용 가능
     - UX 개선이지만 필수는 아님
   - **영향**: UX 개선, 하지만 현재 시스템도 사용 가능

---

## 💡 구현 시 고려사항

### 1. 하위 호환성
- 기존 템플릿은 태그/난이도 기반 필터링 계속 지원
- Pool ID 참조는 선택적 (fallback 로직)

### 2. 성능 최적화
- Pool ID 사용 시 해당 Pool의 문제만 조회
- 통계는 캐싱 또는 비동기 계산 고려

### 3. 데이터 마이그레이션
- 기존 Exam의 `randomSeed`는 null 허용
- 기존 템플릿은 `version: 1`로 기본값 설정

### 4. 테스트 전략
- 단위 테스트: 각 서비스 로직
- 통합 테스트: 템플릿 → 시험 생성 플로우
- E2E 테스트: 관리자 시험 생성 시나리오

---

## 📊 예상 작업 일정

### Phase 1 (즉시 시작)
- **Week 1**: Question Pool → Template 연결
- **Week 1-2**: 랜덤 시드 구현
- **총 기간**: 1-2주

### Phase 2 (중기)
- **Week 3**: Template 버전 관리
- **Week 4**: Question Pool 통계
- **총 기간**: 2주

### Phase 3 (장기)
- **Week 5-6**: 통합 마법사 설계 및 구현
- **총 기간**: 2주

**전체 예상 기간**: 5-6주 (Phase 1만 진행 시 1-2주)

---

## 🎯 결론 및 권장사항

### 즉시 구현 권장 (Phase 1)
1. **Question Pool → Template 직접 연결**: 핵심 기능 개선, 성능 향상
2. **랜덤 시드 기반 문제 선택**: 재현성 및 안정성 향상

### 선택적 구현 (Phase 2-3)
- 현재 시스템도 충분히 사용 가능
- 사용자 피드백 수집 후 우선순위 재조정 권장
- Phase 1 완료 후 필요성 재평가

### 최종 권장사항
**Phase 1만 우선 구현**하여 핵심 기능을 개선하고, 실제 사용 경험을 바탕으로 Phase 2-3의 필요성을 재평가하는 것을 권장합니다.

