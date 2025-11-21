# Admin 페이지 UX 개선 계획

## 🔍 현재 문제점 분석

### 1. Settings 페이지 (`/admin/settings`)

#### 문제점:
- ❌ **색상 입력**: Hex 코드를 직접 입력해야 함 (예: `#667eea`)
- ❌ **태그 입력**: 쉼표로 구분된 텍스트 입력 (예: `문법, 어휘, 독해`)
- ❌ **구조화된 데이터**: 배열 항목 추가/수정이 복잡함
  - 통계, 가치, 팀원, 기능 등 항목 추가 시 수동 입력
- ❌ **Markdown 텍스트**: 큰 텍스트 영역에 직접 입력
- ❌ **아이콘 선택**: 아이콘 이름을 텍스트로 입력해야 함

### 2. Templates 페이지 (`/admin/templates`)

#### 문제점:
- ❌ **섹션 타입**: 자유 텍스트 입력 (예: `reading`, `grammar`)
  - 오타 가능성, 일관성 부족
- ❌ **태그 입력**: 쉼표로 구분된 텍스트 입력
- ❌ **문제 개수**: 숫자만 입력 가능하지만 범위 검증 없음

### 3. Question Pools 페이지 (`/admin/question-pools`)

#### 문제점:
- ❌ **문제 ID 입력**: UUID를 쉼표로 구분하여 직접 입력
  - 매우 불편하고 오류 발생 가능성 높음
  - 문제를 찾아서 ID를 복사해야 함
- ❌ **태그 입력**: 쉼표로 구분된 텍스트 입력
- ✅ **난이도**: 드롭다운으로 잘 구현됨

### 4. Exams 페이지 (`/admin/exams`)

#### 문제점:
- ❌ **시험 제목/설명**: 자유 텍스트 입력
- ✅ **시험 유형**: 드롭다운으로 잘 구현됨
- ❌ **과목**: 자유 텍스트 입력 (일관성 부족)

---

## 🎯 개선 방안

### Phase 1: 즉시 개선 (우선순위 높음)

#### 1.1 색상 피커 추가 (Settings)

**현재**:
```tsx
<input
  type="text"
  value={formData.primaryColor}
  placeholder="#667eea"
/>
```

**개선**:
```tsx
<div className="flex gap-2">
  <input
    type="color"
    value={formData.primaryColor || "#667eea"}
    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
    className="w-16 h-10 rounded border"
  />
  <input
    type="text"
    value={formData.primaryColor}
    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
    className="flex-1 px-4 py-2 border rounded-lg"
    placeholder="#667eea"
    pattern="^#[0-9A-Fa-f]{6}$"
  />
</div>
```

**효과**:
- ✅ 시각적 색상 선택 가능
- ✅ Hex 코드도 직접 입력 가능
- ✅ 실시간 미리보기

---

#### 1.2 태그 입력 개선 (모든 페이지)

**현재**:
```tsx
<input
  type="text"
  value={tags.join(", ")}
  placeholder="문법, 어휘, 독해"
/>
```

**개선**: 태그 칩 컴포넌트
```tsx
<TagInput
  tags={tags}
  onChange={setTags}
  suggestions={["문법", "어휘", "독해", "작문", "청해"]}
  placeholder="태그를 입력하고 Enter를 누르세요"
/>
```

**기능**:
- ✅ 태그를 칩 형태로 표시
- ✅ Enter로 태그 추가
- ✅ X 버튼으로 태그 삭제
- ✅ 자동완성 제안
- ✅ 중복 방지

---

#### 1.3 문제 ID 선택 개선 (Question Pools)

**현재**:
```tsx
<textarea
  value={questionIds.join(", ")}
  placeholder="uuid1, uuid2, uuid3"
/>
```

**개선**: 문제 검색 및 선택 UI
```tsx
<QuestionSelector
  selectedIds={questionIds}
  onChange={setQuestionIds}
  filters={{
    tags: [],
    difficulty: null,
    examId: null
  }}
/>
```

**기능**:
- ✅ 문제 검색 (제목, 내용, 태그)
- ✅ 필터링 (태그, 난이도, 시험)
- ✅ 체크박스로 다중 선택
- ✅ 선택된 문제 목록 표시
- ✅ 문제 미리보기

---

#### 1.4 섹션 타입 드롭다운 (Templates)

**현재**:
```tsx
<input
  type="text"
  value={section.type}
  placeholder="예: reading, grammar"
/>
```

**개선**:
```tsx
<select value={section.type}>
  <option value="reading">독해 (Reading)</option>
  <option value="listening">청해 (Listening)</option>
  <option value="grammar">문법 (Grammar)</option>
  <option value="vocabulary">어휘 (Vocabulary)</option>
  <option value="writing">작문 (Writing)</option>
  <option value="speaking">회화 (Speaking)</option>
  <option value="custom">사용자 정의</option>
</select>
```

**효과**:
- ✅ 일관성 보장
- ✅ 오타 방지
- ✅ 사용자 정의 옵션도 제공

---

### Phase 2: 중기 개선 (우선순위 중간)

#### 2.1 구조화된 데이터 관리 UI 개선 (Settings)

**현재**: 각 항목을 수동으로 추가하고 필드를 입력

**개선**: 드래그 앤 드롭 + 폼 빌더
```tsx
<StructuredDataEditor
  items={companyStats.stats}
  schema={{
    icon: { type: "icon-picker" },
    value: { type: "number", required: true },
    suffix: { type: "text" },
    label: { type: "text", required: true }
  }}
  onAdd={() => ({ icon: "", value: 0, suffix: "", label: "" })}
  onReorder={(newOrder) => setCompanyStats({ stats: newOrder })}
/>
```

**기능**:
- ✅ 항목 추가/삭제 버튼
- ✅ 드래그 앤 드롭으로 순서 변경
- ✅ 스키마 기반 자동 폼 생성
- ✅ 아이콘 피커 통합

---

#### 2.2 아이콘 선택기 (Settings)

**현재**: 아이콘 이름을 텍스트로 입력

**개선**: 아이콘 갤러리
```tsx
<IconPicker
  value={item.icon}
  onChange={(icon) => updateItem({ ...item, icon })}
  library="heroicons" // 또는 lucide-react
/>
```

**기능**:
- ✅ 아이콘 갤러리 표시
- ✅ 검색 기능
- ✅ 카테고리별 필터링
- ✅ 미리보기

---

#### 2.3 Markdown 에디터 (Settings)

**현재**: 일반 textarea

**개선**: WYSIWYG 또는 Markdown 에디터
```tsx
<MarkdownEditor
  value={aboutCompany}
  onChange={setAboutCompany}
  preview={true}
  toolbar={["bold", "italic", "link", "list", "heading"]}
/>
```

**옵션**:
- **옵션 1**: React Markdown Editor (간단)
- **옵션 2**: Tiptap (고급 기능)
- **옵션 3**: MDX Editor (코드 블록 지원)

---

#### 2.4 과목 선택 개선 (Exams)

**현재**: 자유 텍스트 입력

**개선**: 드롭다운 + 자동완성
```tsx
<AutocompleteSelect
  value={subject}
  onChange={setSubject}
  options={["영어", "수학", "국어", "과학", "사회"]}
  allowCustom={true}
  placeholder="과목을 선택하거나 입력하세요"
/>
```

---

### Phase 3: 장기 개선 (선택적)

#### 3.1 템플릿 생성 마법사

**현재**: 모달에서 모든 정보를 한 번에 입력

**개선**: 단계별 마법사
```
Step 1: 기본 정보 (이름, 설명)
Step 2: 섹션 구성 (드래그 앤 드롭)
Step 3: 문제 풀/필터 설정
Step 4: 미리보기 및 확인
```

---

#### 3.2 문제 관리 통합

**현재**: 문제 ID를 직접 입력해야 함

**개선**: 문제 관리 페이지와 통합
- Question Pools에서 문제 추가 시 문제 관리 페이지로 이동
- 문제 선택 모달에서 직접 문제 생성 가능

---

## 📋 구현 우선순위

### 즉시 구현 (1-2일)
1. ✅ 색상 피커 (Settings)
2. ✅ 태그 입력 컴포넌트 (모든 페이지)
3. ✅ 섹션 타입 드롭다운 (Templates)

### 중기 구현 (3-5일)
4. ✅ 문제 선택 UI (Question Pools)
5. ✅ 구조화된 데이터 관리 UI (Settings)
6. ✅ 아이콘 선택기 (Settings)

### 장기 구현 (선택적)
7. ⚠️ Markdown 에디터 (Settings)
8. ⚠️ 템플릿 생성 마법사
9. ⚠️ 과목 자동완성 (Exams)

---

## 🛠️ 필요한 컴포넌트

### 1. `ColorPicker` 컴포넌트
```tsx
// components/admin/ColorPicker.tsx
export function ColorPicker({ value, onChange, label }) {
  return (
    <div>
      <label>{label}</label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={...} />
        <input type="text" value={value} onChange={...} />
      </div>
    </div>
  );
}
```

### 2. `TagInput` 컴포넌트
```tsx
// components/admin/TagInput.tsx
export function TagInput({ tags, onChange, suggestions }) {
  // 태그 칩 표시
  // Enter로 추가
  // 자동완성
}
```

### 3. `QuestionSelector` 컴포넌트
```tsx
// components/admin/QuestionSelector.tsx
export function QuestionSelector({ selectedIds, onChange, filters }) {
  // 문제 검색
  // 필터링
  // 다중 선택
}
```

### 4. `IconPicker` 컴포넌트
```tsx
// components/admin/IconPicker.tsx
export function IconPicker({ value, onChange, library }) {
  // 아이콘 갤러리
  // 검색
  // 카테고리 필터
}
```

### 5. `StructuredDataEditor` 컴포넌트
```tsx
// components/admin/StructuredDataEditor.tsx
export function StructuredDataEditor({ items, schema, onAdd, onReorder }) {
  // 항목 목록
  // 드래그 앤 드롭
  // 스키마 기반 폼
}
```

---

## 💡 추가 개선 아이디어

1. **자동 저장**: 변경사항을 자동으로 임시 저장
2. **미리보기**: 실시간 미리보기 (특히 Settings)
3. **템플릿**: 자주 사용하는 설정을 템플릿으로 저장
4. **검증 피드백**: 실시간 검증 및 에러 메시지
5. **키보드 단축키**: 빠른 작업을 위한 단축키
6. **일괄 작업**: 여러 항목을 한 번에 수정

---

## 📊 예상 효과

### 사용자 경험
- ⏱️ **입력 시간 단축**: 50-70% 감소
- ❌ **오류 감소**: 80-90% 감소
- 😊 **사용자 만족도**: 크게 향상

### 관리 효율성
- 📈 **생산성 향상**: 2-3배 증가
- 🎯 **일관성 향상**: 표준화된 입력 방식
- 🔍 **검색 가능성**: 태그, 아이콘 등으로 검색 가능

---

## 🚀 시작하기

1. **Phase 1부터 시작**: 색상 피커, 태그 입력, 섹션 타입 드롭다운
2. **재사용 가능한 컴포넌트**: 공통 컴포넌트로 만들어 여러 페이지에서 사용
3. **점진적 개선**: 한 번에 모든 것을 바꾸지 않고 단계적으로 개선

