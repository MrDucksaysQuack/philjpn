# 시험 플랫폼 시스템 구조 및 순서

## 📊 시스템 구성 요소 및 계층 구조

### 전체 시스템 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│                   1. Questions (문제)                        │
│              가장 기본 단위 - 개별 문제                      │
│  - content, options, correctAnswer, explanation              │
│  - tags, difficulty, questionType                           │
│  - questionBankId (선택적)                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ 2. Question Banks │          │ 3. Question Pools │
│   (문제 은행)     │          │   (문제 풀)       │
│                   │          │                   │
│ - 카테고리/레벨별 │          │ - 태그/난이도별   │
│   그룹화          │          │   그룹화          │
│ - 출처 관리       │          │ - questionIds[]   │
│ - questions[]     │          │ - autoSelectRules│
└──────────────────┘          └─────────┬─────────┘
                                         │
                                         ▼
                            ┌──────────────────────┐
                            │ 4. Templates         │
                            │    (시험 템플릿)      │
                            │                      │
                            │ - structure (섹션 정의)│
                            │ - questionPoolIds[]  │
                            │ - 문제 선택 규칙      │
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ 5. Exams             │
                            │    (시험)             │
                            │                      │
                            │ - sections[]         │
                            │ - questions[]        │
                            │ - templateId (선택적)│
                            └──────────────────────┘
```

## 🔄 시스템 구성 순서 및 관계

### 1단계: Questions (문제) - 기본 단위
**위치**: `/admin/questions`

**역할**: 
- 시스템의 가장 기본 단위
- 모든 시험의 구성 요소

**특징**:
- `questionBankId` (선택적): 문제 은행에 속할 수 있음
- `tags[]`: 태그 배열로 분류
- `difficulty`: 난이도 (easy, medium, hard)
- `questionType`: 문제 유형 (multiple_choice, fill_blank, essay)

**데이터 구조**:
```typescript
{
  id: string;
  content: string;
  options: Json;
  correctAnswer: string;
  explanation?: string;
  tags: string[];
  difficulty?: "easy" | "medium" | "hard";
  questionBankId?: string; // Question Bank 참조
}
```

---

### 2단계: Question Banks (문제 은행) - 카테고리별 그룹화
**위치**: `/admin/question-banks`

**역할**:
- 문제를 카테고리, 레벨, 출처별로 그룹화
- 교재나 출처 기반 관리

**특징**:
- `category`, `subcategory`: 카테고리 분류
- `level`: 레벨 (예: "N5", "N4", "초급", "중급")
- `source`, `sourceYear`: 출처 정보
- `questions[]`: 속한 문제들 (1:N 관계)

**데이터 구조**:
```typescript
{
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  level?: string;
  source?: string;
  sourceYear?: number;
  questions: Question[]; // 1:N 관계
}
```

**사용 목적**:
- 교재별 문제 관리
- 레벨별 문제 분류
- 출처 추적

---

### 3단계: Question Pools (문제 풀) - 태그/난이도별 그룹화
**위치**: `/admin/question-pools`

**역할**:
- 문제를 태그, 난이도별로 논리적으로 그룹화
- 템플릿에서 참조하여 자동 문제 선택

**특징**:
- `tags[]`: 태그 배열
- `difficulty`: 난이도 필터
- `questionIds[]`: 문제 ID 배열 (직접 참조)
- `autoSelectRules`: 규칙 기반 자동 선택 설정
- `isAutoSelect`: 자동 선택 활성화 여부

**데이터 구조**:
```typescript
{
  id: string;
  name: string;
  tags: string[];
  difficulty?: "easy" | "medium" | "hard";
  questionIds: string[]; // 문제 ID 배열
  autoSelectRules?: {
    minDifficulty?: string;
    maxDifficulty?: string;
    tags?: string[];
    excludeTags?: string[];
    questionBankId?: string;
    maxCount?: number;
  };
  isAutoSelect: boolean;
}
```

**사용 목적**:
- 유사한 특성의 문제들을 한 곳에서 관리
- 템플릿에서 문제 풀을 참조하여 시험 생성 시 자동으로 문제 선택
- 문제 재사용성 향상

---

### 4단계: Templates (시험 템플릿) - 시험 구조 정의
**위치**: `/admin/templates`

**역할**:
- 시험의 구조와 문제 선택 규칙을 정의하는 재사용 가능한 설계도
- 템플릿으로부터 실제 시험을 빠르게 생성

**특징**:
- `structure`: 섹션 구조 정의 (JSON)
- `questionPoolIds[]`: 참조하는 문제 풀 ID 배열
- 섹션별 문제 선택 규칙 정의

**데이터 구조**:
```typescript
{
  id: string;
  name: string;
  description?: string;
  structure: {
    sections: [
      {
        type: string; // "reading", "listening" 등
        questionCount: number;
        questionPoolId?: string; // 우선순위 1: 문제 풀 직접 참조
        tags?: string[]; // 우선순위 2: 태그 기반 필터
        difficulty?: string; // 우선순위 2: 난이도 필터
        questionBankId?: string; // 우선순위 3: 문제 은행 필터
      }
    ];
  };
  questionPoolIds: string[]; // 전체 템플릿에서 참조하는 풀 목록
}
```

**문제 선택 우선순위** (템플릿으로 시험 생성 시):
1. **우선순위 1**: `questionPoolId`가 있으면 → 해당 Pool의 `questionIds`에서 선택
2. **우선순위 2**: Pool이 없거나 문제가 부족하면 → `tags` + `difficulty` 기반 필터링
3. **우선순위 3**: `questionBankId`가 있으면 → 문제 은행 필터 추가

**사용 목적**:
- 동일한 형식의 시험을 빠르게 생성
- 시험 구조의 일관성 유지
- 문제 선택 자동화

---

### 5단계: Exams (시험) - 최종 제품
**위치**: `/admin/exams`

**역할**:
- 사용자가 실제로 응시하는 최종 시험
- 템플릿으로부터 생성되거나 직접 생성 가능

**특징**:
- `templateId` (선택적): 템플릿으로부터 생성된 경우 참조
- `sections[]`: 섹션 배열
- `questions[]`: 실제 문제들 (섹션에 속함)
- `config`: 시험 설정 (시간 제한, 문제 섞기 등)

**데이터 구조**:
```typescript
{
  id: string;
  title: string;
  description?: string;
  examType: "mock" | "practice" | "final";
  templateId?: string; // 템플릿 참조
  sections: [
    {
      id: string;
      title: string;
      questions: Question[]; // 실제 문제 복제
    }
  ];
  config: {
    allowQuestionReview: boolean;
    shuffleQuestions: boolean;
    // ... 기타 설정
  };
}
```

**생성 방법**:
1. **직접 생성**: `/admin/exams/create`에서 수동으로 생성
2. **템플릿으로 생성**: 템플릿을 선택하여 자동 생성

---

## 🔗 전체 데이터 흐름

### 시나리오 1: 템플릿 기반 시험 생성 (권장 워크플로우)

```
1. Questions 생성
   └─> /admin/questions에서 개별 문제 생성
       └─> questionBankId 설정 (선택적)

2. Question Banks 생성 (선택적)
   └─> /admin/question-banks에서 문제 은행 생성
       └─> 문제들을 카테고리/레벨별로 그룹화

3. Question Pools 생성
   └─> /admin/question-pools에서 문제 풀 생성
       └─> 태그/난이도별로 문제 그룹화
       └─> questionIds에 문제 ID 추가
       └─> 또는 autoSelectRules로 자동 선택 설정

4. Templates 생성
   └─> /admin/templates에서 템플릿 생성
       └─> structure.sections에 섹션 정의
       └─> 각 섹션에 questionPoolId 또는 tags/difficulty 지정
       └─> questionPoolIds에 참조할 풀 ID 추가

5. Exams 생성
   └─> /admin/exams에서 "템플릿으로 생성" 선택
       └─> 템플릿의 구조에 따라 자동으로 문제 선택 및 배치
       └─> 실제 시험 인스턴스 생성 (문제 복제)
```

### 시나리오 2: 직접 시험 생성

```
1. Questions 생성
   └─> /admin/questions에서 개별 문제 생성

2. Exams 직접 생성
   └─> /admin/exams/create에서 수동으로 시험 생성
       └─> 섹션과 문제를 수동으로 추가
       └─> Question Banks나 Pools 사용 안 함
```

---

## 📋 각 시스템의 역할 요약

| 시스템 | 역할 | 데이터 | 재사용성 | 생성 순서 |
|--------|------|--------|----------|-----------|
| **Questions** | 기본 단위 | 개별 문제 | 낮음 | 1순위 |
| **Question Banks** | 카테고리별 그룹화 | 문제 은행 (카테고리/레벨) | 중간 | 2순위 (선택적) |
| **Question Pools** | 태그/난이도별 그룹화 | 문제 풀 (태그/난이도) | 높음 | 3순위 |
| **Templates** | 시험 구조 정의 | 템플릿 (섹션 구조) | 매우 높음 | 4순위 |
| **Exams** | 최종 시험 | 실제 시험 (문제 복제) | 낮음 | 5순위 |

---

## 🎯 권장 사용 순서

### 효율적인 워크플로우

```
1️⃣ Questions 생성
   ↓
2️⃣ Question Banks 생성 (교재/출처별 관리 시)
   ↓
3️⃣ Question Pools 생성 (태그/난이도별 그룹화)
   ↓
4️⃣ Templates 생성 (시험 구조 정의)
   ↓
5️⃣ Exams 생성 (템플릿 사용 또는 직접 생성)
```

### 빠른 시작 (최소 구성)

```
1️⃣ Questions 생성
   ↓
2️⃣ Exams 직접 생성 (템플릿/풀 없이)
```

---

## 💡 실제 사용 예시

### 예시: TOEIC 모의고사 시리즈 생성

```
1. Questions 생성
   - "TOEIC Reading 문제 1" (tags: ["reading", "toeic"], difficulty: "medium")
   - "TOEIC Reading 문제 2" (tags: ["reading", "toeic"], difficulty: "medium")
   - "TOEIC Listening 문제 1" (tags: ["listening", "toeic"], difficulty: "easy")
   - ...

2. Question Banks 생성 (선택적)
   - "2024 TOEIC Official Guide" (source: "Official Guide", sourceYear: 2024)
   - → 위 문제들을 이 은행에 추가

3. Question Pools 생성
   - "TOEIC Reading Pool" (tags: ["reading", "toeic"], questionIds: [...])
   - "TOEIC Listening Pool" (tags: ["listening", "toeic"], questionIds: [...])

4. Templates 생성
   - "TOEIC 실전 모의고사 템플릿"
   - 섹션 1: { type: "reading", questionCount: 20, questionPoolId: "reading-pool-id" }
   - 섹션 2: { type: "listening", questionCount: 15, questionPoolId: "listening-pool-id" }

5. Exams 생성
   - "2024년 11월 TOEIC 모의고사" (템플릿 사용)
   - "2024년 12월 TOEIC 모의고사" (템플릿 사용)
   - → 동일한 구조로 빠르게 생성 가능
```

---

## 🔍 핵심 포인트

1. **Questions는 모든 것의 기반**: 모든 시스템이 문제를 기반으로 함
2. **Question Banks는 선택적**: 교재/출처 관리가 필요할 때만 사용
3. **Question Pools는 템플릿과 강하게 연결**: 템플릿에서 문제 풀을 참조하여 자동 문제 선택
4. **Templates는 재사용성의 핵심**: 동일한 형식의 시험을 빠르게 생성
5. **Exams는 최종 제품**: 사용자가 실제로 응시하는 시험

---

## 📝 요약

**시스템 구성 순서**:
```
Questions → Question Banks (선택) → Question Pools → Templates → Exams
```

**데이터 흐름**:
```
Questions (기본 단위)
    ↓
Question Banks (카테고리별) / Question Pools (태그/난이도별)
    ↓
Templates (시험 구조 정의, Pools 참조)
    ↓
Exams (실제 시험, 템플릿으로 생성 또는 직접 생성)
```

