# 에러 분석 및 해결 가이드

## 📋 목차
1. [React Error #418 (Hydration Mismatch)](#1-react-error-418-hydration-mismatch)
2. [React Error #310 (Hooks 순서 변경)](#2-react-error-310-hooks-순서-변경)
3. [Backend 500 Internal Server Error](#3-backend-500-internal-server-error)
4. [Settings/Badge Notification Socket Timeout](#4-settingsbadge-notification-socket-timeout)
5. [Chrome Extension Errors](#5-chrome-extension-errors)

---

## 1. React Error #418 (Hydration Mismatch)

### 🔍 에러 의미
서버에서 렌더링된 HTML과 클라이언트에서 렌더링된 HTML이 일치하지 않을 때 발생합니다.

### 🎯 가능한 원인

#### 1.1 서버/클라이언트 값 불일치
- **번역 함수(`t()`) 호출**: 서버와 클라이언트에서 다른 locale 값 사용
- **날짜/시간**: `new Date()`, `Date.now()` 등 동적 값
- **랜덤 값**: `Math.random()`, UUID 생성 등
- **브라우저 전용 API**: `window`, `localStorage`, `navigator` 등

#### 1.2 조건부 렌더링 구조 차이
- 서버에서는 조건이 false, 클라이언트에서는 true (또는 그 반대)
- `useEffect` 내부에서만 변경되는 상태로 인한 렌더링 차이

#### 1.3 Suspense/동적 컴포넌트 문제
- `Suspense` fallback에서 번역 함수 사용
- 동적 import된 컴포넌트의 초기 렌더링 불일치

### 🔎 조사 방법

#### Step 1: 에러 발생 위치 확인
```bash
# 브라우저 콘솔에서 에러 스택 추적
# React DevTools에서 컴포넌트 트리 확인
```

#### Step 2: 서버/클라이언트 렌더링 비교
```typescript
// 문제가 되는 컴포넌트에 로깅 추가
console.log('Server:', typeof window === 'undefined');
console.log('Client:', typeof window !== 'undefined');
```

#### Step 3: 번역 함수 사용 확인
```bash
# 프로젝트 전체에서 t() 함수 사용 검색
grep -r "t(" frontend/client --include="*.tsx" --include="*.ts"
```

#### Step 4: 조건부 렌더링 확인
```typescript
// 조건부 렌더링이 있는 컴포넌트 확인
{condition && <Component />}
{condition ? <A /> : <B />}
```

### ✅ 해결 방법

#### 해결책 1: 번역 함수를 클라이언트 전용으로
```typescript
// ❌ 문제 코드
const label = t("header.title");

// ✅ 해결 코드
const [label, setLabel] = useState("");
useEffect(() => {
  setLabel(t("header.title"));
}, [locale]);
```

#### 해결책 2: 하드코딩된 값 사용
```typescript
// ❌ 문제 코드
const localeLabels = useMemo(() => ({
  ko: t("header.localeLabels.ko"),
  en: t("header.localeLabels.en"),
}), [t, locale]);

// ✅ 해결 코드
const localeLabels = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
};
```

#### 해결책 3: Suspense fallback에서 하드코딩
```typescript
// ❌ 문제 코드
<Suspense fallback={<LoadingSpinner message={t("loading")} />}>

// ✅ 해결 코드
<Suspense fallback={<LoadingSpinner message="로딩 중..." />}>
```

#### 해결책 4: 클라이언트 전용 컴포넌트로 분리
```typescript
// ❌ 문제 코드
export default function Component() {
  const value = typeof window !== 'undefined' ? window.innerWidth : 0;
  return <div>{value}</div>;
}

// ✅ 해결 코드
"use client";
export default function Component() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  return <div>{width}</div>;
}
```

### 📝 체크리스트
- [ ] `t()` 함수가 서버 렌더링 중 호출되는지 확인
- [ ] `Suspense` fallback에서 번역 함수 사용 여부 확인
- [ ] 동적 값(날짜, 랜덤)이 초기 렌더링에 포함되는지 확인
- [ ] 브라우저 전용 API가 서버 렌더링 중 호출되는지 확인
- [ ] 조건부 렌더링이 서버/클라이언트에서 다르게 동작하는지 확인

---

## 2. React Error #310 (Hooks 순서 변경)

### 🔍 에러 의미
이전 렌더링보다 더 많은 hooks가 호출되었습니다. React는 hooks가 항상 같은 순서로 호출되어야 합니다.

### 🎯 가능한 원인

#### 2.1 조건부 hooks 호출
```typescript
// ❌ 문제 코드
if (condition) {
  const value = useState(0); // 조건부 hooks 호출
}
```

#### 2.2 Early return 이후 hooks 호출
```typescript
// ❌ 문제 코드
if (!user) return null;
const data = useMemo(() => {...}, []); // early return 이후 hooks
```

#### 2.3 반복문/중첩 함수 내 hooks 호출
```typescript
// ❌ 문제 코드
items.map(item => {
  const value = useState(0); // 반복문 내 hooks
});
```

#### 2.4 컴포넌트 리렌더링 시 hooks 순서 변경
- 조건부로 다른 컴포넌트 렌더링
- 동적 컴포넌트 로딩

### 🔎 조사 방법

#### Step 1: Hooks 호출 순서 확인
```typescript
// React DevTools Profiler 사용
// 또는 각 hooks에 로깅 추가
console.log('Hook 1 called');
const value1 = useState(0);
console.log('Hook 2 called');
const value2 = useMemo(() => {...}, []);
```

#### Step 2: 조건부 렌더링 확인
```bash
# 조건부 hooks 호출 검색
grep -r "if.*useState\|if.*useEffect\|if.*useMemo" frontend/client --include="*.tsx"
```

#### Step 3: Early return 확인
```bash
# early return 이후 hooks 검색
grep -r "return.*;" frontend/client --include="*.tsx" -A 5
```

#### Step 4: 반복문 내 hooks 확인
```bash
# 반복문 내 hooks 검색
grep -r "\.map.*useState\|\.map.*useEffect\|\.map.*useMemo" frontend/client --include="*.tsx"
```

### ✅ 해결 방법

#### 해결책 1: 모든 hooks를 최상위에서 호출
```typescript
// ❌ 문제 코드
function Component() {
  if (!user) return null;
  const data = useMemo(() => {...}, []);
}

// ✅ 해결 코드
function Component() {
  const data = useMemo(() => {...}, []); // hooks를 먼저 호출
  if (!user) return null; // early return은 hooks 이후
}
```

#### 해결책 2: 조건부 로직을 hooks 내부로 이동
```typescript
// ❌ 문제 코드
if (condition) {
  const value = useState(0);
}

// ✅ 해결 코드
const [value, setValue] = useState(0);
if (!condition) {
  // 조건부 로직 처리
}
```

#### 해결책 3: 커스텀 hooks로 분리
```typescript
// ❌ 문제 코드
function Component() {
  if (condition) {
    const data = useQuery(...);
  }
}

// ✅ 해결 코드
function useConditionalQuery(condition) {
  return useQuery({
    enabled: condition,
    ...
  });
}
```

### 📝 체크리스트
- [ ] 모든 hooks가 컴포넌트 최상위에서 호출되는지 확인
- [ ] early return 전에 모든 hooks가 호출되는지 확인
- [ ] 조건문, 반복문, 중첩 함수 내 hooks 호출 여부 확인
- [ ] 동적 컴포넌트 로딩 시 hooks 순서가 변경되는지 확인
- [ ] `useMemo`, `useCallback` 의존성 배열이 올바른지 확인

---

## 3. Backend 500 Internal Server Error

### 🔍 에러 의미
서버에서 요청 처리 중 오류가 발생했습니다.

### 🎯 발생 엔드포인트
- `/api/admin/dashboard`
- `/api/admin/exams/statistics`
- `/api/admin/license-keys/statistics`
- `/api/ai/check-availability`
- `/api/ai/queue/stats`

### 🔎 가능한 원인

#### 3.1 Prisma 쿼리 실패
- **DB 연결 문제**: Supabase 연결 실패
- **스키마 불일치**: Prisma 스키마와 실제 DB 스키마 불일치
- **필드 누락**: 존재하지 않는 필드 접근
- **타입 불일치**: 필드 타입과 쿼리 타입 불일치

#### 3.2 Null/Undefined 접근
- 관계 데이터가 null인데 접근 시도
- 옵셔널 필드를 필수로 사용
- 배열이 비어있는데 인덱스 접근

#### 3.3 의존성 초기화 실패
- **AI Queue 미초기화**: Bull Queue가 제대로 초기화되지 않음
- **Prisma Client 미생성**: `npx prisma generate` 미실행
- **환경 변수 누락**: 필수 환경 변수가 설정되지 않음

#### 3.4 예외 처리 누락
- try-catch 블록이 없어서 에러가 상위로 전파
- 에러를 catch했지만 적절한 응답을 반환하지 않음

### 🔎 조사 방법

#### Step 1: Railway 로그 확인
```bash
# Railway 대시보드에서 로그 확인
# 또는 Railway CLI 사용
railway logs
```

#### Step 1.5: Railway 로그 분석 (2025-11-20 기준)
**로그 분석 결과:**
- ✅ 애플리케이션이 정상적으로 시작됨 (`Nest application successfully started`)
- ✅ 모든 모듈이 정상적으로 초기화됨 (PrismaModule, AuthModule, AdminModule 등)
- ✅ 데이터베이스 연결 성공 (`Database connection established`)
- ✅ 모든 라우트가 정상적으로 매핑됨
- ⚠️ OpenAI API Key가 설정되지 않음 (`OpenAI API Key가 설정되지 않았거나 AI 분석이 비활성화되어 있습니다`)
- ✅ API 요청들이 정상적으로 들어옴:
  - `/api/admin/dashboard` - 요청됨
  - `/api/admin/exams/statistics` - 요청됨
  - `/api/admin/license-keys/statistics` - 요청됨
  - `/api/ai/queue/stats` - 요청됨
  - `/api/ai/check-availability` - 요청됨

**중요 발견:**
- ❌ **에러 로그가 없음**: 500 에러가 발생했지만 Railway 로그에 에러 메시지가 기록되지 않음
- 이는 다음을 의미할 수 있습니다:
  1. 에러가 발생했지만 `this.logger.error`가 Winston 로거를 사용하는데, 로거 설정 문제로 로그가 출력되지 않음
  2. 에러가 발생했지만 `console.error`만 사용하는 부분만 로그에 나타남
  3. 에러가 발생하기 전에 요청이 타임아웃되었을 수 있음
  4. NestJS 전역 예외 필터가 에러를 잡아서 로깅하지 않음

**코드 검토 결과:**
- ✅ 모든 컨트롤러 메서드에 `try-catch` 블록이 있음:
  - `getDashboard()` - 에러 로깅: `this.logger.error`
  - `getExamStatistics()` - 에러 로깅: `this.logger.error`
  - `getLicenseKeyStatistics()` - 에러 로깅: `this.logger.error`
  - `getQueueStats()` - 에러 로깅: `console.error` (기본값 반환)
  - `checkAvailability()` - 에러 로깅: `console.error` (기본값 반환)

**문제점:**
- `this.logger.error`를 사용하는 메서드들은 Winston 로거를 사용하는데, Railway 로그에 나타나지 않음
- `console.error`를 사용하는 메서드들은 로그에 나타날 수 있음
- Winston 로거 설정이 Railway 환경에서 제대로 작동하지 않을 수 있음

**권장 조치:**
1. **Winston 로거 설정 확인**: Railway 환경에서 Winston 로거가 제대로 출력되는지 확인
2. **에러 로깅 통일**: `this.logger.error`와 `console.error`를 함께 사용하여 로그가 확실히 기록되도록 함
3. **NestJS 전역 예외 필터 확인**: 전역 예외 필터가 에러를 잡아서 로깅하는지 확인
4. **요청 타임아웃 확인**: Railway에서 요청 타임아웃 설정 확인

#### Step 2: 에러 로그 패턴 확인
```typescript
// 백엔드 코드에서 로깅 확인
console.error('❌ 에러 발생:', {
  code: error?.code,
  message: error?.message,
  stack: error?.stack,
});
```

#### Step 3: Prisma 쿼리 확인
```typescript
// 각 서비스에서 Prisma 쿼리 확인
// 특히 null 체크가 있는지 확인
const result = await this.prisma.model.findUnique({
  where: { id },
  include: { relation: true }, // relation이 null일 수 있음
});
```

#### Step 4: 의존성 초기화 확인
```typescript
// AI Queue 초기화 확인
if (!this.aiQueue) {
  this.logger.warn('AI Queue가 초기화되지 않았습니다.');
}
```

#### Step 5: 환경 변수 확인
```bash
# Railway 환경 변수 확인
# 필수 변수:
# - DATABASE_URL
# - JWT_SECRET
# - OPENAI_API_KEY (AI 기능 사용 시)
```

### ✅ 해결 방법

#### 해결책 1: Prisma 쿼리에 안전한 기본값 추가
```typescript
// ❌ 문제 코드
const count = await this.prisma.model.count();

// ✅ 해결 코드
const count = await this.prisma.model.count().catch(() => 0);
```

#### 해결책 2: Null 체크 강화
```typescript
// ❌ 문제 코드
const result = await this.prisma.model.findUnique({ where: { id } });
return result.relation.field; // relation이 null일 수 있음

// ✅ 해결 코드
const result = await this.prisma.model.findUnique({ 
  where: { id },
  include: { relation: true },
});
if (!result || !result.relation) {
  return defaultValue;
}
return result.relation.field;
```

#### 해결책 3: 의존성 초기화 확인
```typescript
// ❌ 문제 코드
async getQueueStats() {
  return await this.aiQueue.getWaitingCount();
}

// ✅ 해결 코드
async getQueueStats() {
  if (!this.aiQueue) {
    return { waiting: 0, active: 0, ... };
  }
  try {
    return await this.aiQueue.getWaitingCount();
  } catch (error) {
    return { waiting: 0, active: 0, ... };
  }
}
```

#### 해결책 4: Try-Catch로 감싸기
```typescript
// ❌ 문제 코드
async getData() {
  const result = await this.prisma.model.findMany();
  return result;
}

// ✅ 해결 코드
async getData() {
  try {
    const result = await this.prisma.model.findMany();
    return result;
  } catch (error) {
    console.error('❌ getData 에러:', error);
    return []; // 또는 적절한 기본값
  }
}
```

#### 해결책 5: 에러 로깅 강화 (Winston + Console)
```typescript
// ❌ 문제 코드 (Winston만 사용)
async getDashboard() {
  try {
    return await this.adminService.getDashboardData();
  } catch (error: unknown) {
    this.logger.error('❌ getDashboardData 에러:', error);
    throw error;
  }
}

// ✅ 해결 코드 (Winston + Console 함께 사용)
async getDashboard() {
  try {
    return await this.adminService.getDashboardData();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Winston 로거와 console.error를 함께 사용하여 로그가 확실히 기록되도록 함
    this.logger.error('❌ getDashboardData 에러:', {
      message: errorMessage,
      code: errorCode,
      stack: errorStack,
    });
    console.error('❌ getDashboardData 에러:', {
      message: errorMessage,
      code: errorCode,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });
    
    throw error;
  }
}
```

### 📝 체크리스트
- [ ] Railway 로그에서 정확한 에러 메시지 확인
- [ ] Prisma 쿼리에 `.catch()` 추가 여부 확인
- [ ] Null/undefined 체크가 모든 관계 데이터에 적용되었는지 확인
- [ ] AI Queue 초기화 확인 로직 추가 여부 확인
- [ ] 모든 서비스 메서드에 try-catch 블록 추가 여부 확인
- [ ] 환경 변수가 Railway에 올바르게 설정되었는지 확인
- [ ] Prisma Client가 최신 상태인지 확인 (`npx prisma generate`)

---

## 4. Settings/Badge Notification Socket Timeout

### 🔍 에러 의미
WebSocket 연결이 타임아웃되었습니다.

### 🎯 가능한 원인

#### 4.1 서버 WebSocket 미시작
- WebSocket Gateway가 제대로 초기화되지 않음
- Railway에서 WebSocket 서버가 시작되지 않음
- 포트 설정 문제

#### 4.2 네트워크 문제
- 클라이언트와 서버 간 네트워크 연결 문제
- 방화벽이 WebSocket 연결을 차단
- 프록시가 WebSocket을 지원하지 않음

#### 4.3 Railway 환경 설정 문제
- WebSocket 지원이 활성화되지 않음
- 포트 포워딩 설정 문제
- 환경 변수 누락

#### 4.4 클라이언트 연결 설정 문제
- 잘못된 WebSocket URL
- 인증 토큰 누락
- 연결 타임아웃 설정이 너무 짧음

### 🔎 조사 방법

#### Step 1: WebSocket Gateway 확인
```typescript
// backend/src/modules/admin/gateways/settings.gateway.ts
// WebSocket Gateway가 제대로 등록되었는지 확인
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/settings',
})
```

#### Step 2: Railway 로그 확인
```bash
# WebSocket 서버 시작 로그 확인
# "WebSocket Gateway initialized" 같은 로그 확인
```

#### Step 3: 클라이언트 연결 코드 확인
```typescript
// frontend/client/lib/socket.ts
// WebSocket URL이 올바른지 확인
const socket = io(`${API_URL}/settings`, {
  auth: { token },
  timeout: 5000, // 타임아웃 설정
});
```

#### Step 4: 네트워크 연결 테스트
```bash
# WebSocket 연결 테스트
# 브라우저 콘솔에서:
const socket = io('wss://philjpn-production.up.railway.app/settings');
socket.on('connect', () => console.log('Connected'));
socket.on('error', (err) => console.error('Error:', err));
```

### ✅ 해결 방법

#### 해결책 1: WebSocket Gateway 재등록
```typescript
// backend/src/modules/admin/admin.module.ts
// Gateway가 providers에 포함되어 있는지 확인
@Module({
  providers: [
    SettingsGateway, // Gateway 등록 확인
    ...
  ],
})
```

#### 해결책 2: 연결 타임아웃 증가
```typescript
// frontend/client/lib/socket.ts
const socket = io(url, {
  timeout: 10000, // 5초 -> 10초로 증가
  reconnection: true,
  reconnectionDelay: 1000,
});
```

#### 해결책 3: 에러 처리 개선
```typescript
// frontend/client/lib/socket.ts
socket.on('connect_error', (error) => {
  console.warn('WebSocket 연결 실패 (기능에 영향 없음):', error);
  // 치명적이지 않으므로 조용히 처리
});
```

#### 해결책 4: 폴백 메커니즘 추가
```typescript
// WebSocket이 실패해도 폴링으로 대체
if (!socket.connected) {
  // 폴링으로 설정 동기화
  setInterval(() => {
    fetchSettings();
  }, 5000);
}
```

### 📝 체크리스트
- [ ] WebSocket Gateway가 모듈에 등록되었는지 확인
- [ ] Railway에서 WebSocket 지원이 활성화되었는지 확인
- [ ] 클라이언트 WebSocket URL이 올바른지 확인
- [ ] 연결 타임아웃 설정이 적절한지 확인
- [ ] 에러 처리가 적절한지 확인 (치명적이지 않으므로 조용히 처리)
- [ ] 폴백 메커니즘(폴링)이 구현되어 있는지 확인

---

## 5. Chrome Extension Errors

### 🔍 에러 의미
브라우저 확장 프로그램 관련 에러입니다.

### 🎯 원인
- `chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/...` 확장 프로그램이 파일을 찾지 못함
- 확장 프로그램의 내부 오류

### ✅ 해결 방법
**무시 가능**: 애플리케이션 코드와 무관하며, 사용자의 브라우저 확장 프로그램 문제입니다.

### 📝 체크리스트
- [x] 애플리케이션 코드와 무관 (확인 완료)
- [ ] 사용자에게 확장 프로그램 비활성화 권장 (선택사항)

---

## 🎯 우선순위별 해결 계획

### Priority 1: Backend 500 에러 (치명적)
1. Railway 로그 확인하여 정확한 에러 메시지 파악
2. Prisma 쿼리 실패 원인 확인
3. Null/undefined 체크 강화
4. 모든 서비스 메서드에 try-catch 추가

### Priority 2: React Error #418 (사용자 경험 저하)
1. `t()` 함수가 서버 렌더링 중 호출되는 위치 찾기
2. `Suspense` fallback에서 번역 함수 제거
3. 하드코딩된 값으로 대체 또는 클라이언트 전용으로 분리

### Priority 3: React Error #310 (안정성 문제)
1. 조건부 hooks 호출 찾기
2. Early return 이후 hooks 호출 찾기
3. 모든 hooks를 컴포넌트 최상위로 이동

### Priority 4: WebSocket Timeout (비치명적)
1. WebSocket Gateway 등록 확인
2. 연결 타임아웃 증가
3. 에러 처리 개선 (치명적이지 않으므로 조용히 처리)

---

## 🔧 디버깅 도구

### 1. React DevTools
- 컴포넌트 트리 확인
- Hooks 호출 순서 확인
- Props/State 확인

### 2. Railway 로그
```bash
# Railway CLI 사용
railway logs --tail

# 또는 Railway 대시보드에서 확인
```

### 3. 브라우저 콘솔
- 네트워크 탭에서 API 요청 확인
- 콘솔 탭에서 에러 메시지 확인
- React DevTools에서 컴포넌트 확인

### 4. Prisma Studio
```bash
# 로컬에서 DB 확인
npx prisma studio
```

---

## 📚 참고 자료

- [React Error #418](https://react.dev/errors/418)
- [React Error #310](https://react.dev/errors/310)
- [Next.js Hydration](https://nextjs.org/docs/messages/react-hydration-error)
- [Prisma Error Handling](https://www.prisma.io/docs/concepts/components/prisma-client/error-handling)
- [Socket.io Error Handling](https://socket.io/docs/v4/client-api/#socket)

---

## 🔍 Railway 로그 분석 결과 (2025-11-20)

### 로그 분석 요약
- **애플리케이션 상태**: ✅ 정상 시작 및 실행 중
- **데이터베이스 연결**: ✅ 성공
- **API 요청**: ✅ 정상적으로 들어옴
- **에러 로그**: ❌ 없음 (500 에러 발생했지만 로그에 기록되지 않음)

### 발견된 문제
1. **Winston 로거 출력 문제**: `this.logger.error`를 사용하는 메서드들의 에러가 Railway 로그에 나타나지 않음
2. **에러 로깅 불일치**: 일부 메서드는 `console.error`, 일부는 `this.logger.error` 사용
3. **에러 처리 방식 불일치**: 일부는 기본값 반환, 일부는 에러를 다시 throw

### 즉시 적용 가능한 해결책
모든 컨트롤러 메서드에서 `this.logger.error`와 `console.error`를 함께 사용하여 로그가 확실히 기록되도록 수정:

```typescript
// 모든 컨트롤러 메서드에 적용
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as { code?: string })?.code;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // Winston과 Console 모두 사용
  this.logger.error('❌ [메서드명] 에러:', {
    message: errorMessage,
    code: errorCode,
    stack: errorStack,
  });
  console.error('❌ [메서드명] 에러:', {
    message: errorMessage,
    code: errorCode,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });
  
  throw error; // 또는 적절한 기본값 반환
}
```

## 📝 업데이트 이력

- 2025-01-XX: 초기 문서 작성
- 2025-11-20: Railway 로그 분석 결과 추가 및 에러 로깅 강화 가이드 추가
- 각 에러 해결 시 업데이트 예정

