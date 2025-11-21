# 문제 관리 CRUD 기능 분석

## 현재 구현 상태

### ✅ Read (조회) - 완전 구현
- **전체 문제 목록 조회**: `adminAPI.getQuestions()`
- **검색 기능**: 문제 내용 기반 검색
- **필터링 기능**: 
  - 난이도 필터 (easy, medium, hard)
  - 시험별 필터
- **문제 상세 정보 표시**: 내용, 난이도, 태그, 점수, 시험/섹션 정보

**위치**: `/admin/questions/page.tsx` (26-38줄)

### ✅ Delete (삭제) - 완전 구현
- **문제 삭제**: `questionAPI.deleteQuestion(id)`
- **삭제 버튼**: 각 문제 카드에 삭제 버튼 있음
- **확인 다이얼로그**: 삭제 전 확인 메시지 표시

**위치**: `/admin/questions/page.tsx` (53-71줄, 235-240줄)

### ❌ Create (생성) - 미구현
- **문제 관리 페이지에 생성 기능 없음**
- 문제 생성은 **섹션 페이지에서만 가능**
- 섹션 페이지: `/admin/exams/[id]/sections/[sectionId]/questions`
- API는 존재: `questionAPI.createQuestion(sectionId, data)`

**현재 상태**:
```tsx
// 문제 관리 페이지에는 "새 문제 생성" 버튼이 없음
// 섹션 페이지에서만 문제 생성 가능
```

**문제점**:
- 문제 관리 페이지에서 직접 문제를 생성할 수 없음
- 시험/섹션을 먼저 선택해야만 문제 생성 가능
- 독립적인 문제 생성이 불가능

### ⚠️ Update (수정) - 부분 구현
- **"수정" 버튼은 있지만 섹션 페이지로 링크만 걸려있음**
- 문제 관리 페이지에서 직접 수정 불가능
- 섹션 페이지로 이동해야 수정 가능

**현재 상태**:
```tsx
// 문제 관리 페이지 (228-233줄)
{question.section && (
  <Link
    href={`/admin/exams/${question.section.examId}/sections/${question.section.id}/questions`}
    className="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm border border-blue-600 rounded-md hover:bg-blue-50"
  >
    수정
  </Link>
)}
```

**문제점**:
- 문제 관리 페이지에서 직접 수정 불가능
- 섹션 페이지로 이동해야 수정 가능
- 문제가 섹션에 속하지 않으면 수정 버튼도 없음

---

## 요약

| 기능 | 상태 | 위치 | 비고 |
|------|------|------|------|
| **Create** | ❌ 미구현 | 섹션 페이지에서만 가능 | 문제 관리 페이지에 생성 기능 없음 |
| **Read** | ✅ 완전 구현 | `/admin/questions` | 검색, 필터링 모두 구현 |
| **Update** | ⚠️ 부분 구현 | 섹션 페이지로 링크만 | 직접 수정 불가능 |
| **Delete** | ✅ 완전 구현 | `/admin/questions` | 삭제 기능 완전 구현 |

---

## 개선 제안

### 1. Create 기능 추가
**문제 관리 페이지에 "새 문제 생성" 버튼 추가**

**옵션 A: 모달 방식**
- "새 문제 생성" 버튼 클릭
- 모달에서 시험/섹션 선택
- 문제 정보 입력
- 생성

**옵션 B: 별도 페이지**
- "새 문제 생성" 버튼 클릭
- `/admin/questions/create` 페이지로 이동
- 시험/섹션 선택 및 문제 정보 입력
- 생성

**옵션 C: 섹션 선택 후 생성**
- "새 문제 생성" 버튼 클릭
- 시험/섹션 선택 다이얼로그
- 선택 후 문제 생성 모달 표시

### 2. Update 기능 개선
**문제 관리 페이지에서 직접 수정 가능하도록**

**옵션 A: 인라인 수정**
- 문제 카드에서 "수정" 버튼 클릭
- 카드가 편집 모드로 전환
- 인라인으로 수정
- 저장

**옵션 B: 모달 수정**
- 문제 카드에서 "수정" 버튼 클릭
- 수정 모달 표시
- 문제 정보 수정
- 저장

**옵션 C: 별도 페이지**
- 문제 카드에서 "수정" 버튼 클릭
- `/admin/questions/[id]/edit` 페이지로 이동
- 문제 정보 수정
- 저장

---

## 권장 구현 방안

### Create 기능
1. **"새 문제 생성" 버튼 추가** (문제 관리 페이지 상단)
2. **시험/섹션 선택 다이얼로그**
   - 시험 선택
   - 해당 시험의 섹션 선택
3. **문제 생성 모달**
   - 문제 정보 입력 (내용, 선택지, 정답, 난이도, 태그 등)
   - 생성

### Update 기능
1. **"수정" 버튼 개선**
   - 현재: 섹션 페이지로 링크
   - 개선: 모달 또는 인라인 편집
2. **문제 수정 모달**
   - 문제 정보 수정
   - 시험/섹션 변경 가능 (선택사항)
   - 저장

---

## 구현 우선순위

1. **높음**: Create 기능 추가 (문제 관리의 핵심 기능)
2. **중간**: Update 기능 개선 (직접 수정 가능하도록)
3. **낮음**: UI/UX 개선 (현재 Read/Delete는 잘 작동)

---

## 참고 코드

### 문제 생성 API
```typescript
// frontend/client/lib/api.ts
questionAPI.createQuestion(sectionId, data)
```

### 문제 수정 API
```typescript
// frontend/client/lib/api.ts
questionAPI.updateQuestion(questionId, data)
```

### 섹션 페이지의 문제 생성/수정 모달
```typescript
// frontend/client/app/admin/exams/[id]/sections/[sectionId]/questions/page.tsx
// QuestionModal 컴포넌트 (196-584줄)
// 이미 구현되어 있으므로 참고 가능
```

