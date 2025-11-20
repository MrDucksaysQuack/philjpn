# UI 흐름 문제점 분석 및 수정 계획

## 🔍 발견된 문제점

### 현재 UI 흐름 (잘못됨)

```
Question 생성 시:
  → Exam 선택 필요 ❌
  → Section 선택 필요 ❌
  → Question 생성

Pool 생성 시:
  → Question 선택 ✅ (올바름)

Template 생성 시:
  → Pool 선택 ✅ (올바름)

Exam 생성 시:
  → Template 선택 ✅ (올바름)
```

### 올바른 아키텍처 흐름

```
Question (독립적 생성)
  ↓ 선택
Pool (Question들을 선택)
  ↓ 선택
Template (Pool들을 선택)
  ↓ 선택
Exam (Template 선택 또는 직접 생성)
```

## ❌ 문제점 상세

### 1. Question 생성 시 Section 선택 강제

**위치**: `frontend/client/app/admin/questions/page.tsx`

**문제**:
- Question 생성 시 `SectionSelectModal`에서 Exam과 Section을 선택해야 함
- 이는 Question이 Exam의 하위 요소(Section)에 속해야 한다는 의미
- 하지만 아키텍처 흐름상 Question은 독립적으로 생성되어야 함

**현재 코드**:
```typescript
// 문제 생성 버튼 클릭 시
<Button onClick={() => setShowSectionSelectModal(true)}>
  + 새 문제 생성
</Button>

// Section 선택 모달
{showSectionSelectModal && (
  <SectionSelectModal
    exams={exams}
    sections={sections}
    // Exam과 Section 선택 필수
  />
)}

// Question 생성 모달 (sectionId 필수)
{showCreateModal && selectedSectionId && (
  <QuestionModal sectionId={selectedSectionId} />
)}
```

### 2. 백엔드 API 구조 문제

**위치**: `backend/src/modules/core/question/question.controller.ts`

**문제**:
- `POST /api/questions/sections/:sectionId` - sectionId가 URL 파라미터로 필수
- Question 생성 시 sectionId가 반드시 필요

**현재 코드**:
```typescript
@Post('sections/:sectionId')
create(
  @Param('sectionId') sectionId: string,
  @Body() createQuestionDto: CreateQuestionDto,
) {
  return this.questionService.create(sectionId, createQuestionDto);
}
```

### 3. Prisma 스키마 문제

**위치**: `backend/prisma/schema.prisma`

**문제**:
- `sectionId String` - 필수 필드
- Question이 Section에 속해야 하는 구조

**현재 스키마**:
```prisma
model Question {
  id                String              @id @default(uuid())
  sectionId         String  // ❌ 필수 필드
  questionBankId    String? // ✅ 선택적 (올바름)
  // ...
  section           Section             @relation(fields: [sectionId], references: [id], onDelete: Cascade)
}
```

## ✅ 수정 계획

### 1단계: Prisma 스키마 수정

**변경 사항**:
- `sectionId`를 선택적 필드로 변경
- 독립적인 Question 생성 허용

```prisma
model Question {
  id                String              @id @default(uuid())
  sectionId         String?  // ✅ 선택적 필드로 변경
  questionBankId    String?
  // ...
  section           Section?            @relation(fields: [sectionId], references: [id], onDelete: Cascade)
}
```

### 2단계: 백엔드 API 수정

**변경 사항**:
1. 독립적인 Question 생성 엔드포인트 추가
2. 기존 Section 기반 생성 엔드포인트 유지 (하위 호환성)

```typescript
// 새로운 엔드포인트: 독립적인 Question 생성
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
createStandalone(@Body() createQuestionDto: CreateQuestionDto) {
  return this.questionService.createStandalone(createQuestionDto);
}

// 기존 엔드포인트: Section에 속한 Question 생성 (유지)
@Post('sections/:sectionId')
createInSection(
  @Param('sectionId') sectionId: string,
  @Body() createQuestionDto: CreateQuestionDto,
) {
  return this.questionService.createInSection(sectionId, createQuestionDto);
}
```

### 3단계: 백엔드 서비스 수정

**변경 사항**:
- 독립적인 Question 생성 메서드 추가
- sectionId가 없어도 생성 가능하도록 수정

```typescript
async createStandalone(createQuestionDto: CreateQuestionDto) {
  const { options, ...questionData } = createQuestionDto;
  
  // sectionId가 없으면 독립적인 Question 생성
  const question = await this.prisma.question.create({
    data: {
      ...questionData,
      sectionId: null, // 독립적인 Question
      questionNumber: 1, // 기본값
      options: options ? (options as any) : null,
      usageCount: 0, // 아직 사용되지 않음
    },
  });
  
  return question;
}

async createInSection(sectionId: string, createQuestionDto: CreateQuestionDto) {
  // 기존 로직 유지
  // ...
}
```

### 4단계: 프론트엔드 UI 수정

**변경 사항**:
1. Section 선택 모달 제거
2. 독립적인 Question 생성 UI 제공
3. QuestionBank 선택만 허용 (선택적)

```typescript
// 수정 전
<Button onClick={() => setShowSectionSelectModal(true)}>
  + 새 문제 생성
</Button>

// 수정 후
<Button onClick={() => setShowCreateModal(true)}>
  + 새 문제 생성
</Button>

// Question 생성 모달 (sectionId 없이)
{showCreateModal && (
  <QuestionModal
    // sectionId 제거
    questionBankId={selectedQuestionBankId} // 선택적
    onClose={() => setShowCreateModal(false)}
    onSuccess={() => {
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    }}
  />
)}
```

### 5단계: Question 생성 모달 수정

**변경 사항**:
- sectionId 제거
- questionBankId 선택 추가 (선택적)
- questionNumber는 자동 생성 또는 기본값

```typescript
function QuestionModal({
  questionBankId, // 선택적
  question,
  onClose,
  onSuccess,
}: {
  questionBankId?: string;
  question?: Question | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateQuestionDto>({
    questionNumber: 1, // 기본값 (독립적인 Question)
    questionType: question?.questionType || 'multiple_choice',
    content: question?.content || '',
    // ...
    questionBankId: questionBankId || question?.questionBankId, // 선택적
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateQuestionDto) => {
      if (question) {
        await questionAPI.updateQuestion(question.id, data);
      } else {
        // 독립적인 Question 생성
        await questionAPI.createQuestion(data); // sectionId 없이
      }
    },
    // ...
  });
}
```

## 📋 수정 우선순위

1. **높음**: 프론트엔드 UI 수정 (Section 선택 제거)
2. **높음**: 백엔드 API 수정 (독립적인 Question 생성 엔드포인트 추가)
3. **중간**: Prisma 스키마 수정 (sectionId 선택적)
4. **중간**: 백엔드 서비스 수정 (독립적인 Question 생성 로직)
5. **낮음**: 마이그레이션 생성 및 적용

## 🎯 예상 효과

### Before
- ❌ Question 생성 시 Exam/Section 선택 강제
- ❌ 아키텍처 흐름과 불일치
- ❌ 독립적인 Question 생성 불가능

### After
- ✅ Question 독립적으로 생성 가능
- ✅ QuestionBank 선택만 허용 (선택적)
- ✅ 아키텍처 흐름과 일치
- ✅ Question → Pool → Template → Exam 흐름 준수

## ⚠️ 주의사항

1. **하위 호환성**: 기존 Section 기반 Question 생성 기능 유지
2. **데이터 마이그레이션**: 기존 Question들의 sectionId는 유지
3. **QuestionNumber**: 독립적인 Question의 경우 기본값 1 사용
4. **UsageCount**: 독립적인 Question은 0으로 시작 (Pool에 추가되면 증가)

