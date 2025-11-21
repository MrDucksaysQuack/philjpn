# React Hooks 순서 수정 검토 보고서

## 개요
React Error #310 (hydration mismatch)를 해결하기 위해 프로젝트 전체에서 early return 이후 hooks 호출 패턴을 찾아 수정했습니다.

## React Hooks 규칙
1. **모든 hooks는 항상 같은 순서로 호출되어야 함**
2. **조건부로 호출되거나 early return 이후에 호출되면 안 됨**
3. **서버와 클라이언트에서 다른 수의 hooks가 호출되면 hydration mismatch 발생**

## 수정 완료된 컴포넌트

### 1. ✅ `admin/page.tsx`
- **문제**: `useMemo`, `useCallback`이 early return 이후에 호출됨
- **수정**: 모든 hooks를 early return 전으로 이동
- **상태**: 완료

### 2. ✅ `dashboard/components/RecentActivityWidget.tsx`
- **문제**: `useMemo`가 early return 이후에 호출됨
- **수정**: `useMemo`를 early return 전으로 이동
- **상태**: 완료

### 3. ✅ `results/page.tsx`
- **문제**: `useMemo`가 여러 early return 이후에 호출됨
- **수정**: `useMemo`를 모든 early return 전으로 이동
- **상태**: 완료

### 4. ✅ `exams/page.tsx`
- **문제**: `useMemo`가 early return 이후에 호출됨, 핸들러 함수들이 메모이제이션되지 않음
- **수정**:
  - `useMemo`를 early return 전으로 이동
  - `handleCategorySelect`, `handleSubcategorySelect`를 `useCallback`으로 메모이제이션
- **상태**: 완료

### 5. ✅ `admin/license-keys/page.tsx`
- **문제**: 여러 핸들러 함수들이 early return 이후에 정의됨
- **수정**:
  - 모든 핸들러 함수들을 `useCallback`으로 메모이제이션
  - 모든 핸들러를 early return 전으로 이동
  - 수정된 핸들러: `handleCreate`, `validateBatchForm`, `handleCreateBatch`, `toggleKeyStatus`, `toggleKeySelection`, `selectAllKeys`, `handleBulkActivate`, `handleBulkDeactivate`
- **상태**: 완료

### 6. ✅ `admin/components/TrendChartWidget.tsx`
- **문제**: `useMemo`가 `if (isLoading)` early return 이후에 호출됨
- **수정**: `useMemo`를 모든 early return 전으로 이동
- **상태**: 완료

### 7. ✅ `dashboard/components/ScoreTrendWidget.tsx`
- **문제**: `new Date().toLocaleDateString()`을 early return 이후에 사용하여 hydration mismatch 가능성
- **수정**:
  - `chartData` 계산을 `useMemo`로 감싸고 `isMounted` 패턴 적용
  - `useMemo`를 early return 전으로 이동
- **상태**: 완료

## 검토 완료된 컴포넌트 (문제 없음)

### 1. ✅ `results/[id]/page.tsx`
- 모든 hooks가 early return 전에 호출됨
- 문제 없음

### 2. ✅ `analysis/page.tsx`
- 모든 hooks가 early return 전에 호출됨
- 문제 없음

### 3. ✅ `exams/[id]/page.tsx`
- 모든 hooks가 early return 전에 호출됨
- 문제 없음

### 4. ✅ `admin/exams/[id]/page.tsx`
- `useMemo`가 early return 전에 호출됨
- 문제 없음

### 5. ✅ `dashboard/components/LearningInsightsWidget.tsx`
- early return 이후에 변수 계산이 있지만 hooks는 아님
- 문제 없음

### 6. ✅ `dashboard/components/GoalProgressWidget.tsx`
- early return 이후에 변수 계산이 있지만 hooks는 아님
- 문제 없음

### 7. ✅ `dashboard/components/BadgesWidget.tsx`
- early return 이후에 변수 계산이 있지만 hooks는 아님
- 문제 없음

## 권장 패턴

### 1. Hooks 호출 순서
```typescript
export default function MyComponent() {
  // 1. 모든 hooks를 먼저 호출
  const [state, setState] = useState();
  const { data } = useQuery(...);
  const memoizedValue = useMemo(...);
  const callback = useCallback(...);
  useEffect(...);

  // 2. 그 다음 early return
  if (isLoading) {
    return <Loading />;
  }

  // 3. 마지막으로 JSX 반환
  return <div>...</div>;
}
```

### 2. `isMounted` 패턴 (날짜 포맷팅 등)
```typescript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

const formattedDate = useMemo(() => {
  if (!isMounted) {
    return ""; // 서버 렌더링 시 기본값
  }
  return new Date().toLocaleDateString("ko-KR");
}, [isMounted]);
```

### 3. 핸들러 함수 메모이제이션
```typescript
const handleClick = useCallback(() => {
  // 핸들러 로직
}, [dependencies]);
```

## 예방 방법

1. **ESLint 규칙 사용**: `react-hooks/rules-of-hooks` 규칙을 활성화하여 hooks 순서 위반을 자동으로 감지
2. **코드 리뷰**: 새로운 컴포넌트 작성 시 hooks 호출 순서 확인
3. **테스트**: SSR 환경에서 hydration mismatch 테스트 수행

## 검토 완료 날짜
2025-11-20

