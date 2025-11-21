# React 에러 #310 분석 및 해결 방법

## 🔍 에러 내용

```
Uncaught Error: Minified React error #310
```

React 에러 #310은 **"Rendered more hooks than during the previous render"** 에러입니다.

## 📋 원인 분석

### 1. React Hooks 규칙 위반

React Hooks는 다음 규칙을 따라야 합니다:
- ✅ **항상 같은 순서로 호출되어야 함**
- ✅ **조건문, 반복문, 중첩 함수 내에서 호출하면 안 됨**
- ✅ **조건부 early return 전에 모든 Hooks를 호출해야 함**

### 2. 가능한 원인

#### 원인 1: 로그인 성공 후 리다이렉트 과정에서의 Hooks 순서 변경

로그인 페이지 (`/login`)와 시험 목록 페이지 (`/exams`)에서 Header 컴포넌트가 다르게 렌더링될 수 있습니다:

```typescript
// Header.tsx
export default function Header() {
  const { user, clearAuth } = useAuthStore(); // ✅ 항상 호출
  const { locale, setLocale } = useLocaleStore(); // ✅ 항상 호출
  const router = useRouter(); // ✅ 항상 호출
  const [isMenuOpen, setIsMenuOpen] = useState(false); // ✅ 항상 호출
  const [showOnboarding, setShowOnboarding] = useState(false); // ✅ 항상 호출
  const { resetOnboarding } = useOnboarding(); // ✅ 항상 호출
  
  // ... useQuery 호출들
  
  // ❌ 문제: user 상태에 따라 조건부 렌더링
  {user ? (
    // 로그인된 사용자용 UI
  ) : (
    // 비로그인 사용자용 UI
  )}
}
```

#### 원인 2: OnboardingModal의 조건부 렌더링

Header에서 OnboardingModal을 항상 렌더링하지만, 내부에서 early return을 사용:

```typescript
// OnboardingModal.tsx
export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0); // ✅ Hooks 호출
  useEffect(() => { ... }, [isOpen]); // ✅ Hooks 호출
  
  if (!isOpen) return null; // ✅ Hooks 호출 후 early return (문제 없음)
  
  // ...
}
```

이것은 문제가 아닙니다. Hooks는 early return 전에 호출되기 때문입니다.

#### 원인 3: 로그인 성공 후 상태 업데이트 타이밍

로그인 성공 후:
1. `setAuth(user, accessToken, refreshToken)` 호출
2. `router.push("/exams")` 호출
3. Header 컴포넌트가 재렌더링됨
4. 이 과정에서 Hooks 순서가 바뀔 수 있음

### 3. Badge 데이터 추가와의 관련성

**Badge 데이터 추가는 직접적인 원인이 아닙니다.**

- Badge 데이터는 백엔드 데이터베이스에만 영향을 줌
- 프론트엔드의 React 컴포넌트 렌더링과는 무관
- 단, **타이밍 이슈**로 인해 Badge 데이터 추가 후 첫 로그인 시 에러가 발생했을 수 있음

## 🔧 해결 방법

### 방법 1: OnboardingModal을 조건부 렌더링으로 변경

Header에서 OnboardingModal을 조건부로 렌더링:

```typescript
// Header.tsx
{showOnboarding && (
  <OnboardingModal
    isOpen={showOnboarding}
    onClose={() => setShowOnboarding(false)}
    onComplete={() => setShowOnboarding(false)}
  />
)}
```

### 방법 2: OnboardingModal의 early return 제거

OnboardingModal에서 early return을 제거하고 항상 렌더링:

```typescript
// OnboardingModal.tsx
export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ❌ 제거: if (!isOpen) return null;
  
  // ✅ 대신 조건부 렌더링 사용
  if (!isOpen) {
    return null; // 또는 빈 fragment
  }

  // ... 나머지 코드
}
```

**주의**: 이것도 문제가 아닙니다. Hooks는 early return 전에 호출되기 때문입니다.

### 방법 3: 로그인 성공 후 리다이렉트 지연

로그인 성공 후 상태 업데이트가 완료된 후 리다이렉트:

```typescript
// login/page.tsx
try {
  const response = await authAPI.login({ 
    email: trimmedEmail, 
    password: trimmedPassword 
  });
  const { accessToken, refreshToken, user } = response.data;

  setAuth(user, accessToken, refreshToken);
  
  // ✅ 상태 업데이트 완료 후 리다이렉트
  setTimeout(() => {
    router.push("/exams");
  }, 0);
} catch (err) {
  // ...
}
```

### 방법 4: 개발 환경에서 상세 에러 확인

프로덕션 빌드가 아닌 개발 환경에서 실행하여 상세한 에러 메시지 확인:

```bash
cd frontend/client
npm run dev
```

개발 환경에서는 React가 더 상세한 에러 메시지를 제공합니다.

## 🎯 권장 해결 방법

**가장 가능성 높은 원인**: 로그인 성공 후 리다이렉트 과정에서 Header 컴포넌트가 재렌더링되면서 Hooks 순서가 바뀌는 것

**권장 해결 방법**:

1. **Header에서 OnboardingModal을 조건부 렌더링으로 변경**
2. **로그인 성공 후 상태 업데이트 완료 확인 후 리다이렉트**

## 📝 확인 사항

1. 브라우저 콘솔에서 더 상세한 에러 메시지 확인
2. 개발 환경에서 실행하여 에러 재현
3. React DevTools로 컴포넌트 렌더링 순서 확인
4. 로그인 전후 Header 컴포넌트의 Hooks 호출 순서 비교

## 🔍 디버깅 팁

1. **React DevTools 설치**: 컴포넌트 렌더링 순서 확인
2. **콘솔 로그 추가**: 각 Hooks 호출 시점 확인
3. **에러 경로 추적**: 스택 트레이스에서 문제가 되는 컴포넌트 확인

## ✅ 결론

- **Badge 데이터 추가는 직접적인 원인이 아님**
- **로그인 성공 후 리다이렉트 과정에서 Hooks 순서 변경 가능성**
- **Header 컴포넌트의 조건부 렌더링이 원인일 수 있음**
- **개발 환경에서 상세 에러 확인 후 정확한 원인 파악 필요**

