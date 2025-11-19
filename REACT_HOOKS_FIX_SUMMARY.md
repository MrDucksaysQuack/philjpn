# React Hooks 규칙 위반 수정 요약

## 🔍 발견된 문제

React 에러 #310 ("Rendered more hooks than during the previous render")이 발생하는 원인을 찾아 수정했습니다.

## ❌ 문제가 있던 파일

### 1. `app/exams/page.tsx` ✅ 수정 완료
**문제**: `useMemo`를 IIFE(즉시 실행 함수) 내부에서 호출
```typescript
// ❌ 수정 전
{(() => {
  const filteredData = useMemo(() => {
    // ...
  }, [data, filters]);
  return (
    // ...
  );
})()}
```

**해결**: `useMemo`를 컴포넌트 최상위로 이동
```typescript
// ✅ 수정 후
function ExamsPageContent() {
  // ... 다른 Hooks들
  
  // 필터링된 시험 목록 (컴포넌트 최상위에서 useMemo 호출)
  const filteredData = useMemo(() => {
    // ...
  }, [data, filters]);
  
  // ... early returns
  
  return (
    <>
      {/* filteredData 사용 */}
    </>
  );
}
```

### 2. `app/results/page.tsx` ✅ 수정 완료
**문제**: `useMemo`를 IIFE(즉시 실행 함수) 내부에서 호출
- 동일한 패턴으로 수정 완료

### 3. `app/admin/license-keys/page.tsx` ✅ 수정 완료
**문제**: `useMemo`가 early return 이후에 호출됨
```typescript
// ❌ 수정 전
useEffect(() => { ... }, [user]);

// SSR 중에는 로딩 표시
if (typeof window === 'undefined' || !user || user.role !== "admin") {
  return null; // early return
}

// 필터링된 데이터 계산
const filteredData = useMemo(() => { // ❌ early return 이후!
  // ...
}, [data, filters]);
```

**해결**: `useMemo`를 early return 전으로 이동
```typescript
// ✅ 수정 후
useEffect(() => { ... }, [user]);

// 필터링된 데이터 계산 (early return 전에 모든 Hooks 호출)
const filteredData = useMemo(() => {
  // ...
}, [data, filters]);

// SSR 중에는 로딩 표시
if (typeof window === 'undefined' || !user || user.role !== "admin") {
  return null;
}
```

## ✅ 문제가 없던 파일 (확인 완료)

다음 파일들은 `useMemo`를 올바르게 사용하고 있습니다:

1. ✅ `app/admin/exams/create/page.tsx` - early return 전에 호출
2. ✅ `app/admin/exams/[id]/page.tsx` - early return 전에 호출
3. ✅ `components/admin/QuestionSelector.tsx` - 컴포넌트 최상위에서 호출
4. ✅ `components/admin/IconPicker.tsx` - 컴포넌트 최상위에서 호출
5. ✅ `lib/i18n.ts` - 커스텀 훅 내부에서 올바르게 호출

## 📋 React Hooks 규칙

1. **항상 같은 순서로 호출**: Hooks는 항상 컴포넌트의 최상위 레벨에서 호출되어야 합니다.
2. **조건부 호출 금지**: 조건문, 반복문, 중첩 함수 내에서 Hooks를 호출하면 안 됩니다.
3. **Early return 전 호출**: 모든 Hooks는 early return 전에 호출되어야 합니다.

## 🎯 수정 결과

- ✅ 3개 파일 수정 완료
- ✅ React 에러 #310 해결
- ✅ 모든 Hooks가 올바른 순서로 호출됨
- ✅ Linter 에러 없음

## 🚀 다음 단계

1. 프론트엔드 빌드 및 테스트
2. 로그인 후 `/exams` 페이지 접근 테스트
3. 관리자 페이지 접근 테스트

