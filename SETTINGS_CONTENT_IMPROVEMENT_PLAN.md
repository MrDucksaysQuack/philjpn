# Settings 컨텐츠 구성 개선 계획

## 현재 문제점 분석

### 1. **정보 위주 구성의 문제**
- ❌ 입력 필드만 나열되어 있어 실제 결과물을 상상하기 어려움
- ❌ 각 필드가 최종적으로 어떻게 표시되는지 불명확
- ❌ 예시나 가이드가 부족하여 작성 방법을 모름
- ❌ 실시간 미리보기가 없어 즉각적인 피드백 부족

### 2. **사용자 경험 문제**
- ❌ 팀원 카드, 회사 통계, 회사 가치 등이 어떻게 보일지 모름
- ❌ 이미지가 없을 때 어떻게 표시되는지 불명확
- ❌ 필수 필드와 선택 필드 구분이 명확하지 않음
- ❌ 각 섹션의 목적과 사용 방법이 불명확

## 개선 방안

### 🎯 Phase 1: 카드 기반 직접 편집 방식 (우선순위 높음) ⭐ **개선된 방식**

#### 1.1 **카드 형태로 직접 입력 (WYSIWYG 방식)**
입력 필드가 아닌 **실제 카드에 직접 정보를 입력**하는 방식

**핵심 개념:**
- 카드가 어떻게 생겼는지 **입력할 때부터 바로 보임**
- 카드에 정보를 입력하면 **실시간으로 카드가 업데이트됨**
- 저장하면 카드가 **미리보기 모드**로 전환
- 수정하려면 카드의 **"수정" 버튼** 클릭 → 다시 편집 모드

**적용 위치:**
- **CompanyTab**: 회사 통계 카드, 회사 가치 카드
- **TeamTab**: 팀원 카드, 팀 문화 카드
- **ServiceTab**: 서비스 기능 카드, 서비스 혜택, 서비스 프로세스
- **ContactTab**: 연락처 정보 카드

**구현 방식:**
```tsx
// 예시: 팀원 카드 직접 편집
{members.map((member, index) => (
  <div key={index}>
    {isEditing[index] ? (
      // 편집 모드: 카드 형태로 직접 입력
      <TeamMemberCardEditable
        member={member}
        onChange={(updated) => updateMember(index, updated)}
        onSave={() => setEditing({ ...isEditing, [index]: false })}
        onCancel={() => setEditing({ ...isEditing, [index]: false })}
      />
    ) : (
      // 미리보기 모드: 저장된 카드 표시
      <TeamMemberCardPreview
        member={member}
        onEdit={() => setEditing({ ...isEditing, [index]: true })}
        onDelete={() => deleteMember(index)}
      />
    )}
  </div>
))}
```

**카드 편집 모드 특징:**
- 카드 내부에 인라인 입력 필드
- 입력하는 즉시 카드가 업데이트됨
- 저장 버튼 클릭 시 편집 모드 종료
- 취소 버튼으로 변경사항 취소 가능

**카드 미리보기 모드 특징:**
- 실제 About 페이지와 동일한 스타일
- "수정" 버튼으로 편집 모드 진입
- "삭제" 버튼으로 카드 제거

### 🎯 Phase 2: 예시 및 가이드 추가 (우선순위 높음)

#### 2.1 **카드 내부 플레이스홀더 및 힌트**
카드 편집 모드에서 각 필드에 구체적인 예시와 힌트 표시

**구현 방식:**
```tsx
// 카드 내부 입력 필드에 플레이스홀더와 힌트
<TeamMemberCardEditable>
  <input 
    placeholder="예: 홍길동"
    className="card-input"
  />
  <span className="text-xs text-text-muted">
    💡 이름을 입력하세요
  </span>
</TeamMemberCardEditable>
```

#### 2.2 **빈 카드 템플릿**
새 카드 추가 시 미리 채워진 예시 템플릿 제공

**기능:**
- "+ 새 카드 추가" 버튼 클릭
- 빈 카드가 편집 모드로 생성
- 또는 "템플릿으로 추가" 옵션 제공

#### 2.2 **섹션별 가이드 메시지**
각 섹션 상단에 목적과 작성 가이드 표시

**예시:**
```tsx
<div className="mb-4 p-4 bg-theme-primary/5 border border-theme-primary/20 rounded-lg">
  <div className="flex items-start gap-2">
    <span className="text-lg">💡</span>
    <div>
      <h4 className="font-semibold mb-1">회사 통계 작성 가이드</h4>
      <ul className="text-sm text-text-secondary space-y-1">
        <li>• 회사의 주요 성과나 수치를 입력하세요</li>
        <li>• Value는 숫자만 입력 (예: 1000)</li>
        <li>• Suffix는 단위나 기호 (예: +, %, 명)</li>
        <li>• Label은 통계의 의미를 설명 (예: "만족한 고객")</li>
      </ul>
    </div>
  </div>
</div>
```

#### 2.3 **템플릿 제공**
빠른 시작을 위한 템플릿 버튼

**기능:**
- "템플릿 적용" 버튼 클릭 시 예시 데이터 자동 입력
- 각 섹션별로 적절한 템플릿 제공

### 🎯 Phase 3: 시각적 피드백 강화 (우선순위 중간)

#### 3.1 **필수 필드 강조**
필수 필드와 선택 필드 시각적 구분

**구현:**
- 필수 필드: 빨간 별표(*) + 테두리 강조
- 선택 필드: 회색 텍스트 + "선택 사항" 라벨

#### 3.2 **입력 상태 표시**
- ✅ 완료된 필드: 초록색 체크 표시
- ⚠️ 불완전한 필드: 노란색 경고 표시
- ❌ 필수 필드 미입력: 빨간색 경고 표시

#### 3.3 **이미지 플레이스홀더**
이미지가 없을 때 어떻게 보일지 미리보기

**구현:**
```tsx
{imageUrl ? (
  <img src={imageUrl} />
) : (
  <div className="bg-surface-hover rounded-full flex items-center justify-center">
    <span className="text-4xl">{name.charAt(0)}</span>
  </div>
)}
```

### 🎯 Phase 4: 인터랙티브 가이드 (우선순위 낮음)

#### 4.1 **단계별 가이드**
처음 사용자를 위한 단계별 안내

#### 4.2 **툴팁 및 도움말**
각 필드에 마우스 오버 시 상세 설명 표시

#### 4.3 **비디오 튜토리얼**
복잡한 섹션에 대한 짧은 비디오 가이드

## 구현 우선순위

### 즉시 구현 (Phase 1 + Phase 2) ⭐ **개선된 방식**
1. ✅ 카드 편집 컴포넌트 생성 (Editable + Preview)
2. ✅ 각 탭에 카드 기반 편집 방식 적용
3. ✅ 편집/미리보기 모드 전환 기능
4. ✅ 카드 내부 플레이스홀더 및 힌트 추가
5. ✅ 빈 카드 템플릿 제공

### 단계적 구현 (Phase 3)
5. ✅ 필수/선택 필드 시각적 구분
6. ✅ 입력 상태 표시
7. ✅ 이미지 플레이스홀더

### 선택적 구현 (Phase 4)
8. ⏳ 단계별 가이드
9. ⏳ 툴팁 및 도움말
10. ⏳ 비디오 튜토리얼

## 기술 구현 세부사항

### 카드 편집 컴포넌트 구조
```
components/admin/
  ├── EditableCards/
  │   ├── TeamMemberCardEditable.tsx    // 편집 모드
  │   ├── TeamMemberCardPreview.tsx     // 미리보기 모드
  │   ├── StatCardEditable.tsx
  │   ├── StatCardPreview.tsx
  │   ├── FeatureCardEditable.tsx
  │   ├── FeatureCardPreview.tsx
  │   └── index.ts
```

### 카드 상태 관리
```tsx
// 각 카드의 편집 상태 관리
const [editingStates, setEditingStates] = useState<Record<number, boolean>>({});

// 편집 모드 토글
const toggleEdit = (index: number) => {
  setEditingStates(prev => ({
    ...prev,
    [index]: !prev[index]
  }));
};
```

### 예시 데이터
각 탭별로 적절한 예시 데이터 정의:
- CompanyTab: 회사 통계, 회사 가치 예시
- TeamTab: 팀원, 팀 문화 예시
- ServiceTab: 서비스 기능, 혜택, 프로세스 예시

### 스타일링
- 실제 About 페이지와 동일한 컴포넌트 재사용
- 테마 색상 적용
- 반응형 디자인

## 예상 효과

### 사용자 경험
- ⬆️ **이해도 300% 향상**: 실시간 미리보기로 즉각적인 피드백
- ⬆️ **작성 속도 향상**: 예시와 가이드로 빠른 작성
- ⬆️ **오류 감소**: 필수 필드 명확히 표시

### 개발자 경험
- ⬆️ **재사용성**: About 페이지 컴포넌트 재사용
- ⬆️ **일관성**: 실제 페이지와 동일한 스타일
- ⬆️ **유지보수성**: 중앙화된 미리보기 컴포넌트

## 다음 단계 ⭐ **개선된 방식**

1. 카드 편집 컴포넌트 생성 (Editable + Preview)
2. CompanyTab에 적용 (회사 통계 카드, 회사 가치 카드)
3. TeamTab에 적용 (팀원 카드, 팀 문화 카드)
4. ServiceTab에 적용 (서비스 기능 카드, 혜택, 프로세스)
5. ContactTab에 적용 (연락처 정보 카드)
6. 편집/미리보기 모드 전환 기능 구현
7. 카드 내부 플레이스홀더 및 힌트 추가
8. 테스트 및 피드백 반영

## 개선된 방식의 장점

### 사용자 경험
- ✅ **직관성**: 카드가 어떻게 생겼는지 입력할 때부터 바로 보임
- ✅ **실시간 피드백**: 입력하는 즉시 카드가 업데이트됨
- ✅ **시각적 이해도**: 텍스트 필드가 아닌 실제 카드에 입력
- ✅ **명확한 상태**: 편집 모드 vs 미리보기 모드 구분이 명확함

### 개발자 경험
- ✅ **재사용성**: About 페이지 컴포넌트를 그대로 활용
- ✅ **일관성**: 실제 페이지와 동일한 카드 스타일
- ✅ **유지보수성**: 카드 컴포넌트를 재사용하여 일관된 UX

