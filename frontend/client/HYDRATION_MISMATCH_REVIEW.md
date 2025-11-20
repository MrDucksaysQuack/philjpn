# Hydration Mismatch 검토 보고서

## 수정 완료된 항목

### 1. ✅ `admin/page.tsx`
- **문제**: Zustand store 값(`groupOrder`, `favorites`)이 서버와 클라이언트에서 달라 `useMemo`가 다른 결과 생성
- **해결**: `isMounted` 상태 추가하여 클라이언트에서만 실행되도록 수정
- **상태**: 수정 완료

### 2. ✅ `admin/badges/page.tsx`
- **문제**: `useMemo`에서 `t` 함수를 의존성으로 사용하여 hydration mismatch 발생 가능
- **해결**: `locale`을 의존성 배열에 추가
- **상태**: 수정 완료

### 3. ✅ `lib/i18n.ts`
- **문제**: `t` 함수의 참조가 불안정할 수 있음
- **해결**: `useCallback`의 의존성을 `messageSet`에서 `locale`로 변경하여 안정적인 참조 보장
- **상태**: 수정 완료

### 4. ✅ `admin/components/TrendChartWidget.tsx`
- **문제**: `new Date()`와 `toLocaleDateString`을 직접 사용하여 서버와 클라이언트에서 다른 결과 생성
- **해결**: `isMounted` 상태 추가하여 클라이언트에서만 날짜 계산 및 포맷팅 수행
- **상태**: 수정 완료

## 검토된 항목 (문제 없음)

### 1. ✅ `components/layout/Header.tsx`
- `localeLabels`는 하드코딩된 객체로 hydration mismatch 없음
- `useMemo` 사용 없음

### 2. ✅ `admin/license-keys/page.tsx`
- `useMemo`는 `data`와 `filters`에만 의존하여 안전
- `toLocaleDateString`은 데이터 로딩 후에만 렌더링됨

### 3. ✅ `admin/exams/[id]/page.tsx`
- `useMemo`는 `examsResponse`에만 의존하여 안전

### 4. ✅ 기타 컴포넌트의 `toLocaleDateString` 사용
- 대부분의 경우 `useQuery`의 결과를 기다린 후에만 렌더링되므로 문제 없음
- 서버 렌더링 시 데이터가 없어서 렌더링되지 않음

## 주의사항

### 1. `toLocaleDateString` 사용
- 여러 컴포넌트에서 `toLocaleDateString`을 사용하고 있지만, 대부분은 데이터 로딩 후에만 렌더링되므로 문제 없음
- 향후 새로운 컴포넌트를 만들 때는 `isMounted` 체크를 고려해야 함

### 2. Zustand Store 사용
- Zustand store 값은 서버와 클라이언트에서 다를 수 있음
- `useMemo`에서 store 값을 사용할 때는 `isMounted` 체크를 추가해야 함

### 3. Date 객체 사용
- `new Date()`를 직접 사용하는 경우 서버와 클라이언트에서 다른 결과를 만들 수 있음
- 클라이언트에서만 실행되도록 `isMounted` 체크를 추가해야 함

## 권장 패턴

### 1. `isMounted` 패턴
```typescript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

const memoizedValue = useMemo(() => {
  if (!isMounted) {
    return defaultValue; // 서버 렌더링 시 기본값
  }
  // 클라이언트에서만 실행되는 로직
  return computedValue;
}, [isMounted, dependencies]);
```

### 2. `toLocaleDateString` 사용 시
- 데이터 로딩 후에만 렌더링되는 경우: 문제 없음
- 직접 계산하는 경우: `isMounted` 체크 필요

### 3. Zustand Store 사용 시
- `useMemo`에서 store 값을 사용할 때는 `isMounted` 체크 추가
- 또는 `useEffect`를 사용하여 클라이언트에서만 상태 업데이트

## 검토 완료 날짜
2025-11-20

