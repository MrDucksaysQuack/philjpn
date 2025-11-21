# Phase 1 개선 사항 검증 결과

## ✅ 검증 완료 항목

### 1. Question Pool → Template 직접 연결

#### 백엔드 구현 확인
- ✅ **DTO 업데이트**: `create-template.dto.ts`에 `questionPoolId` 필드 추가됨
- ✅ **Template Service 로직**: 
  - `questionPoolId` 우선순위 1로 문제 선택
  - 태그/난이도 필터링은 fallback으로 작동
  - Pool을 찾을 수 없을 때 자동 fallback
- ✅ **성능 개선**: Pool ID 사용 시 해당 Pool의 문제만 조회 (`id: { in: pool.questionIds }`)

#### 프론트엔드 구현 확인
- ✅ **UI 개선**: 템플릿 생성 모달에 Question Pool 선택 드롭다운 추가
- ✅ **조건부 표시**: Pool 선택 시 태그/난이도 필터 비활성화 안내
- ✅ **타입 정의**: `CreateTemplateData`와 `ExamTemplate` 인터페이스 업데이트

#### 작동 방식
```
섹션 정의:
{
  type: "reading",
  questionCount: 20,
  questionPoolId: "uuid-pool-1",  // 우선순위 1
  tags: ["문법"],                  // fallback (questionPoolId가 없을 때)
  difficulty: "medium"             // fallback
}

문제 선택 로직:
1. questionPoolId가 있으면 → Pool의 questionIds에서 문제 조회
2. questionPoolId가 없거나 Pool에 문제가 없으면 → 태그/난이도 기반 필터링
```

### 2. 랜덤 시드 기반 문제 선택

#### 데이터베이스 확인
- ✅ **Prisma Schema**: `Exam` 모델에 `randomSeed Int?` 필드 추가됨
- ✅ **DB 마이그레이션**: Supabase에 `randomSeed` 컬럼 추가 완료 (Prisma db pull 확인)

#### 백엔드 구현 확인
- ✅ **SeededRandom 클래스**: LCG 알고리즘 기반 의사 난수 생성기 구현
  - `next()`: 0과 1 사이의 난수 생성
  - `shuffle()`: 배열을 시드 기반으로 셔플
- ✅ **Template Service**: 
  - 시드 생성: `randomSeed = examData.overrides?.randomSeed || Date.now()`
  - 섹션별 시드: `sectionSeed = randomSeed + sectionOrder`
  - 시드 기반 셔플: `rng.shuffle(filteredQuestions)`
  - Exam 저장 시 시드 저장: `randomSeed: randomSeed`

#### 작동 방식
```
시험 생성:
- randomSeed가 제공되면 해당 시드 사용
- 제공되지 않으면 Date.now() 사용
- 각 섹션마다 다른 시드 사용 (randomSeed + sectionOrder)

재현성:
- 동일한 randomSeed로 동일한 템플릿에서 시험 생성 시
- 동일한 문제 세트가 생성됨 (결정적 랜덤)
```

## 📋 IMPROVEMENT_PLAN.md 대비 검증

### Phase 1.1: Question Pool → Template 직접 연결 ✅

**계획된 내용**:
- [x] Prisma Schema 검토 (변경 불필요 확인)
- [x] Template Service 로직 수정
- [x] DTO 업데이트
- [x] 프론트엔드 UI 개선 (Pool 선택 드롭다운)
- [ ] 테스트 (수동 테스트 필요)

**구현 상태**: ✅ 완료

### Phase 1.2: 랜덤 시드 기반 문제 선택 ✅

**계획된 내용**:
- [x] Prisma Schema 수정 (randomSeed 추가)
- [x] SeededRandom 클래스 구현
- [x] Template Service 수정
- [ ] 테스트 (수동 테스트 필요)

**구현 상태**: ✅ 완료

## 🔍 코드 검증 상세

### 1. Template Service 로직 검증

```typescript
// ✅ 우선순위 1: questionPoolId 사용
if (sectionDef.questionPoolId) {
  const pool = await this.questionPoolService.getQuestionPool(...);
  if (pool.questionIds && pool.questionIds.length > 0) {
    filteredQuestions = await this.prisma.question.findMany({
      where: { id: { in: pool.questionIds } }
    });
  }
}

// ✅ 우선순위 2: 태그/난이도 필터링 (fallback)
if (filteredQuestions.length === 0) {
  // 태그/난이도 기반 필터링
}

// ✅ 시드 기반 결정적 랜덤
const sectionSeed = randomSeed + sectionOrder;
const rng = new SeededRandom(sectionSeed);
const selectedQuestions = rng.shuffle(filteredQuestions).slice(0, questionCount);
```

### 2. 프론트엔드 UI 검증

```tsx
// ✅ Question Pool 선택 드롭다운
<select value={section.questionPoolId || ""} ...>
  <option value="">문제 풀 선택 안 함 (태그/난이도 필터 사용)</option>
  {pools.map((pool) => (
    <option key={pool.id} value={pool.id}>
      {pool.name} ({pool.questionIds?.length || 0}개 문제)
    </option>
  ))}
</select>

// ✅ 조건부 태그/난이도 필터 표시
{!section.questionPoolId && (
  <div>태그/난이도 필터 UI</div>
)}
```

## ⚠️ 주의사항

1. **Question Pool 권한 확인**: 
   - 현재 `getQuestionPool`에서 `userId`로 권한 확인
   - 관리자가 다른 사용자의 Pool을 사용할 수 있는지 확인 필요

2. **빈 Pool 처리**:
   - Pool에 문제가 없으면 자동으로 태그/난이도 필터로 fallback
   - 이는 의도된 동작이지만, 사용자에게 경고 메시지 표시 고려

3. **시드 재현성 테스트**:
   - 동일한 시드로 여러 번 시험 생성 시 동일한 문제 세트 생성되는지 수동 테스트 필요

## 🎯 다음 단계

1. **수동 테스트**:
   - 템플릿 생성 시 Question Pool 선택 테스트
   - 시드 기반 문제 선택 재현성 테스트
   - Fallback 로직 테스트

2. **에러 처리 개선** (선택사항):
   - Pool을 찾을 수 없을 때 사용자에게 명확한 에러 메시지
   - 빈 Pool 선택 시 경고 메시지

3. **Phase 2 계획** (선택사항):
   - Template 버전 관리
   - Question Pool 통계 기능

