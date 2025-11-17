# 시험 시스템 아키텍처: Exams, Templates, Question Pools

## 📋 개요

시험 플랫폼의 세 가지 핵심 기능과 그들의 관계를 설명합니다.

---

## 🎯 각 기능의 의미

### 1. **Question Pools (문제 풀)** 
**위치**: `/admin/question-pools`

**의미**: 문제를 논리적으로 그룹화하여 관리하는 컨테이너

**주요 기능**:
- 문제들을 태그, 난이도, 주제별로 분류
- 문제 ID 목록(`questionIds`)으로 관리
- 재사용 가능한 문제 세트 생성

**데이터 구조**:
```typescript
{
  name: "문법 기초 문제 풀",
  description: "기초 문법 문제 모음",
  tags: ["문법", "시제", "기초"],
  difficulty: "easy",
  questionIds: ["uuid1", "uuid2", "uuid3", ...]
}
```

**사용 목적**:
- 유사한 특성의 문제들을 한 곳에서 관리
- 템플릿에서 문제 풀을 참조하여 시험 생성 시 자동으로 문제 선택
- 문제 재사용성 향상

---

### 2. **Templates (시험 템플릿)**
**위치**: `/admin/templates`

**의미**: 시험의 구조와 문제 선택 규칙을 정의하는 재사용 가능한 설계도

**주요 기능**:
- 시험 섹션 구조 정의 (타입, 문제 개수, 태그, 난이도)
- 문제 풀 참조 (`questionPoolIds`)
- 템플릿으로부터 실제 시험 생성

**데이터 구조**:
```typescript
{
  name: "TOEIC 실전 모의고사 템플릿",
  description: "TOEIC 형식의 모의고사 템플릿",
  structure: {
    sections: [
      { type: "reading", questionCount: 20, tags: ["문법"], difficulty: "medium" },
      { type: "listening", questionCount: 15, tags: ["어휘"], difficulty: "easy" }
    ]
  },
  questionPoolIds: ["pool-id-1", "pool-id-2"]
}
```

**사용 목적**:
- 동일한 형식의 시험을 빠르게 생성
- 시험 구조의 일관성 유지
- 문제 선택 규칙 자동화 (태그/난이도 기반)

---

### 3. **Exams (시험)**
**위치**: `/admin/exams`

**의미**: 사용자가 실제로 응시하는 최종 시험

**주요 기능**:
- 시험 제목, 설명, 유형 설정
- 섹션과 문제 포함
- 시험 설정 (시간 제한, 문제 섞기, 정답 표시 등)
- 사용자 응시 및 결과 관리

**데이터 구조**:
```typescript
{
  title: "2024년 11월 TOEIC 모의고사",
  description: "실전 형식의 TOEIC 모의고사",
  examType: "mock",
  subject: "TOEIC",
  difficulty: "medium",
  totalQuestions: 35,
  totalSections: 2,
  sections: [
    { id: "...", title: "Reading", questions: [...] },
    { id: "...", title: "Listening", questions: [...] }
  ],
  config: {
    allowSectionNavigation: true,
    shuffleQuestions: true,
    ...
  }
}
```

**생성 방법**:
1. **직접 생성**: `/admin/exams/create`에서 수동으로 생성
2. **템플릿으로 생성**: 템플릿을 선택하여 자동 생성

---

## 🔗 연결 관계

### 데이터 흐름 다이어그램

```
Question Pools (문제 풀)
    ↓ 참조
Templates (템플릿)
    ↓ 생성
Exams (시험)
    ↓ 응시
Exam Results (시험 결과)
```

### 상세 연결 구조

#### 1. **Question Pools → Templates**
```
Question Pool (태그: "문법", 난이도: "medium")
    ↓
Template (structure.sections[0]: { tags: ["문법"], difficulty: "medium" })
    ↓
템플릿 생성 시 해당 조건에 맞는 문제 자동 선택
```

**연결 방식**:
- 템플릿의 `structure.sections`에 태그와 난이도 지정
- 템플릿의 `questionPoolIds`에 문제 풀 ID 참조 (향후 확장)
- 템플릿으로 시험 생성 시 조건에 맞는 문제 자동 선택

#### 2. **Templates → Exams**
```
Template (시험 구조 정의)
    ↓ createExamFromTemplate()
Exam (실제 시험 인스턴스)
```

**연결 방식**:
- `POST /api/admin/exams/from-template` 엔드포인트 사용
- 템플릿의 구조를 기반으로 시험 생성
- 템플릿의 섹션 정의에 따라 문제 자동 선택 및 배치
- 생성된 시험은 `templateId`로 원본 템플릿 참조

**생성 과정** (백엔드 로직):
1. 템플릿 구조(`structure.sections`) 읽기
2. 각 섹션의 조건(태그, 난이도)에 맞는 문제 필터링
3. 무작위로 문제 선택 (섹션별 `questionCount`만큼)
4. 시험, 섹션, 문제 생성
5. 시험의 `templateId`에 템플릿 ID 저장

#### 3. **Question Pools → Exams (간접 연결)**
```
Question Pool
    ↓ (템플릿을 통해)
Template
    ↓
Exam
```

**현재 상태**:
- 문제 풀은 템플릿을 통해 간접적으로 사용됨
- 템플릿의 `questionPoolIds` 필드가 있지만, 현재는 태그/난이도 기반 필터링 사용
- 향후 문제 풀 ID를 직접 참조하는 기능 확장 가능

---

## 🔄 실제 사용 워크플로우

### 시나리오 1: 템플릿을 사용한 시험 생성 (권장)

```
1. 문제 풀 생성
   → "문법 기초 문제 풀" 생성 (태그: "문법", 난이도: "easy")

2. 템플릿 생성
   → "TOEIC 기초 모의고사 템플릿" 생성
   → 섹션 1: { type: "reading", questionCount: 20, tags: ["문법"], difficulty: "easy" }
   → 섹션 2: { type: "listening", questionCount: 15, tags: ["어휘"], difficulty: "easy" }

3. 템플릿으로 시험 생성
   → "2024년 11월 TOEIC 기초 모의고사" 생성
   → 템플릿의 구조에 따라 자동으로 문제 선택 및 배치
   → 섹션 1: 문법 태그 + easy 난이도 문제 20개 자동 선택
   → 섹션 2: 어휘 태그 + easy 난이도 문제 15개 자동 선택

4. 사용자 응시
   → 생성된 시험을 사용자가 응시
```

### 시나리오 2: 직접 시험 생성

```
1. 시험 직접 생성
   → "/admin/exams/create"에서 수동으로 시험 생성
   → 제목, 설명, 설정 등 직접 입력
   → 섹션과 문제는 나중에 수동으로 추가

2. 사용자 응시
   → 생성된 시험을 사용자가 응시
```

---

## 📊 비교표

| 항목 | Question Pools | Templates | Exams |
|------|---------------|-----------|-------|
| **목적** | 문제 그룹화 및 관리 | 시험 구조 재사용 | 실제 응시 시험 |
| **데이터** | 문제 ID 목록 | 섹션 구조 정의 | 완전한 시험 데이터 |
| **재사용성** | 높음 (여러 템플릿에서 사용) | 높음 (여러 시험 생성) | 낮음 (1회성) |
| **생성 방법** | 수동 생성 | 수동 생성 | 직접 생성 또는 템플릿으로 생성 |
| **문제 포함** | 문제 ID 참조만 | 문제 선택 규칙만 | 실제 문제 복제 |
| **사용자 접근** | 관리자만 | 관리자만 | 공개 시험은 모든 사용자 |

---

## 🎯 각 기능의 장점

### Question Pools의 장점
- ✅ 문제 관리 체계화
- ✅ 태그/난이도별 분류로 검색 용이
- ✅ 문제 재사용성 향상
- ✅ 대량 문제 관리 효율성

### Templates의 장점
- ✅ 동일 형식 시험 빠른 생성
- ✅ 시험 구조 일관성 유지
- ✅ 문제 선택 자동화
- ✅ 시험 생성 시간 단축

### Exams의 장점
- ✅ 실제 응시 가능한 완전한 시험
- ✅ 개별 시험 설정 가능
- ✅ 시험 결과 및 분석 가능
- ✅ 사용자별 맞춤 시험 생성

---

## 🔮 향후 개선 방향

### 현재 제한사항
1. **Question Pools → Templates 연결이 약함**
   - 현재는 태그/난이도 기반 필터링만 사용
   - `questionPoolIds` 필드는 있지만 완전히 활용되지 않음

2. **문제 풀에서 직접 문제 선택 불가**
   - 템플릿을 통해서만 간접 사용
   - 문제 풀 ID를 직접 참조하는 기능 부재

### 개선 제안
1. **템플릿에서 문제 풀 직접 참조**
   ```typescript
   // 템플릿 구조 개선
   structure: {
     sections: [
       {
         type: "reading",
         questionCount: 20,
         questionPoolId: "pool-id-1", // 문제 풀 직접 참조
         // 또는
         tags: ["문법"], // 태그 기반 (현재 방식)
         difficulty: "medium"
       }
     ]
   }
   ```

2. **문제 풀 관리 UI 개선**
   - 문제 풀에 문제를 직접 추가/제거하는 UI
   - 문제 풀에서 문제 미리보기
   - 문제 풀 통계 (난이도 분포, 태그 분포 등)

3. **시험 생성 시 문제 풀 선택 옵션**
   - 직접 생성 시에도 문제 풀에서 문제 선택 가능
   - 템플릿 없이도 문제 풀 기반 시험 생성

---

## 📝 요약

### 핵심 개념
- **Question Pools**: 문제를 그룹화하여 관리하는 저장소
- **Templates**: 시험 구조와 문제 선택 규칙을 정의하는 설계도
- **Exams**: 사용자가 실제로 응시하는 최종 제품

### 연결 흐름
```
문제 생성 → Question Pool에 추가
    ↓
Question Pool → Template에서 참조 (태그/난이도 기반)
    ↓
Template → Exam 생성 (자동 문제 선택)
    ↓
Exam → 사용자 응시 → 결과 생성
```

### 실용성
- **효율성**: 템플릿을 사용하면 시험 생성 시간이 크게 단축됨
- **일관성**: 동일한 템플릿으로 생성된 시험은 구조가 일관됨
- **재사용성**: 문제 풀과 템플릿을 재사용하여 관리 비용 절감
- **확장성**: 새로운 시험 형식을 빠르게 추가 가능

---

## 💡 사용 예시

### 예시 1: TOEIC 모의고사 시리즈 생성

1. **문제 풀 생성**
   - "TOEIC Reading 문제 풀" (태그: "reading", "toeic")
   - "TOEIC Listening 문제 풀" (태그: "listening", "toeic")

2. **템플릿 생성**
   - "TOEIC 실전 모의고사 템플릿"
   - 섹션 1: Reading (문제 풀 참조)
   - 섹션 2: Listening (문제 풀 참조)

3. **시험 생성**
   - "2024년 11월 TOEIC 모의고사" (템플릿 사용)
   - "2024년 12월 TOEIC 모의고사" (템플릿 사용)
   - → 동일한 구조로 빠르게 생성 가능

### 예시 2: 난이도별 시험 생성

1. **문제 풀 생성**
   - "기초 문법 문제 풀" (난이도: easy)
   - "중급 문법 문제 풀" (난이도: medium)
   - "고급 문법 문제 풀" (난이도: hard)

2. **템플릿 생성**
   - "기초 문법 시험 템플릿" (난이도: easy)
   - "중급 문법 시험 템플릿" (난이도: medium)
   - "고급 문법 시험 템플릿" (난이도: hard)

3. **시험 생성**
   - 각 템플릿으로 난이도별 시험 생성
   - → 학습 단계에 맞는 시험 제공

---

이 세 가지 기능은 서로 보완적으로 작동하여 효율적이고 일관된 시험 관리 시스템을 구성합니다.

