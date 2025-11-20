# 에러 해결 실행 체크리스트

이 문서는 시스템 전체 에러 관리 체계 구축을 위한 단계별 실행 체크리스트입니다.

---

## 📋 진행 상황 요약

- **전체 진행률**: 0% (0/6 단계 완료)
- **시작일**: 2025-11-20
- **최종 업데이트**: 2025-11-20

---

## 🧭 1️⃣ 즉시 해야 할 일 — 에러 로그를 정확히 찍히게 만들기

**목적**: 500 에러가 발생해도 Railway 로그에 아무것도 기록되지 않는 문제 해결

**예상 소요 시간**: 30분

### Step 1-1: 외부 서비스에서 정보 수집

- [ ] **Railway 로그 확인**
  - [ ] `EXTERNAL_SERVICES_DEBUG_GUIDE.md` 참조하여 Railway 로그 확인
  - [ ] 최근 에러 메시지 검색 (`error`, `Error`, `❌`, `500`)
  - [ ] 로그 파일 저장 (필요 시)

- [ ] **Railway 환경 변수 확인**
  - [ ] `DATABASE_URL` 확인
  - [ ] `JWT_SECRET` 확인
  - [ ] `OPENAI_API_KEY` 확인 (AI 기능 사용 시)
  - [ ] 기타 필수 환경 변수 확인

### Step 1-2: 모든 컨트롤러 메서드 catch 문 수정

**대상 파일들:**
- [ ] `backend/src/modules/admin/admin.controller.ts`
  - [ ] `getDashboard()` 메서드
  - [ ] `getExamStatistics()` 메서드
  - [ ] `getLicenseKeyStatistics()` 메서드
  - [ ] 기타 모든 메서드

- [ ] `backend/src/modules/ai/ai.controller.ts`
  - [ ] `getQueueStats()` 메서드
  - [ ] `checkAvailability()` 메서드
  - [ ] 기타 모든 메서드

- [ ] 기타 모든 컨트롤러 파일들

**수정 패턴:**
```typescript
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as { code?: string })?.code;
  const errorStack = error instanceof Error ? error.stack : undefined;
  const context = '[메서드명]'; // 예: '[getDashboard]'
  
  // Winston + console + stderr 병행 (Railway 환경 대응)
  this.logger.error(`${context} ${errorMessage}`, {
    code: errorCode,
    stack: errorStack,
  });
  console.error(`${context}`, {
    code: errorCode,
    msg: errorMessage,
    stack: errorStack,
    time: new Date().toISOString(),
  });
  // Railway가 인식할 수 있도록 stderr에 직접 출력
  process.stderr.write(
    `[ERROR] ${context} ${errorMessage}\n` +
    `Code: ${errorCode || 'N/A'}\n` +
    `Time: ${new Date().toISOString()}\n` +
    `Stack: ${errorStack || 'N/A'}\n\n`,
  );
  
  throw error; // 에러 재전파
}
```

### Step 1-3: Winston 로거 설정 확인

- [ ] **Winston 로거 설정 파일 확인**
  - [ ] `backend/src/common/logger/winston.config.ts` 또는 유사 파일 확인
  - [ ] Console transport가 활성화되어 있는지 확인

- [ ] **main.ts에서 로거 설정 확인**
  - [ ] `app.useLogger()` 호출 확인
  - [ ] Console 출력이 활성화되어 있는지 확인

**예상 설정:**
```typescript
const logger = WinstonModule.createLogger({
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});
app.useLogger(logger);
```

### Step 1-4: 서버 재배포 및 로그 확인

- [ ] **코드 수정 완료 후 커밋**
  ```bash
  git add .
  git commit -m "fix: Railway 환경 대응 - 에러 로깅 강화 (Winston + Console + stderr)"
  git push origin main
  ```

- [ ] **Railway 자동 배포 대기**
  - [ ] Railway 대시보드에서 배포 상태 확인
  - [ ] 배포 완료 대기 (약 2-3분)

- [ ] **Railway 로그 확인**
  ```bash
  # [ERROR] 태그로 검색 (가장 중요!)
  railway logs --tail | grep "\[ERROR\]"
  
  # 또는 일반적인 에러 키워드로 검색
  railway logs --tail | grep -i "error\|❌\|500"
  ```
  또는 Railway 대시보드에서 로그 확인

- [ ] **에러 메시지 확인**
  - [ ] `[ERROR]` 태그로 시작하는 메시지가 로그에 나타나는지 확인
  - [ ] 에러 코드, 메시지, 스택 트레이스가 모두 기록되는지 확인
  - [ ] 에러 메시지 내용 기록

**완료 조건**: Railway 로그에서 실제 에러 메시지를 확인할 수 있어야 함

---

## 🧠 2️⃣ React Error #418 (Hydration Mismatch) 해결

**목적**: 서버와 클라이언트 렌더링 차이로 인한 Hydration Mismatch 해결

**예상 소요 시간**: 1-2시간

### Step 2-1: 빠른 진단

- [ ] **의심되는 컴포넌트에 진단 코드 추가**
  ```tsx
  console.log('isServer:', typeof window === 'undefined');
  ```
  - [ ] `frontend/client/components/layout/Header.tsx`
  - [ ] `frontend/client/app/exams/page.tsx`
  - [ ] 기타 의심되는 컴포넌트들

- [ ] **브라우저 콘솔과 서버 로그 비교**
  - [ ] 서버 로그에서 `isServer: true` 확인
  - [ ] 브라우저 콘솔에서 `isServer: false` 확인
  - [ ] 차이점 기록

### Step 2-2: 문제 원인 찾기

- [ ] **번역 함수(`t()`) 사용 확인**
  ```bash
  grep -r "t(" frontend/client --include="*.tsx" --include="*.ts" | grep -v "useTranslation"
  ```
  - [ ] 서버 렌더링 중 호출되는 `t()` 함수 찾기
  - [ ] Suspense fallback에서 `t()` 사용 여부 확인

- [ ] **동적 값 사용 확인**
  - [ ] `Date.now()`, `new Date()` 사용 확인
  - [ ] `Math.random()`, UUID 생성 확인
  - [ ] `window`, `localStorage`, `navigator` 사용 확인

- [ ] **조건부 렌더링 확인**
  - [ ] 서버와 클라이언트에서 다른 조건 확인
  - [ ] `useEffect` 내부에서만 변경되는 상태 확인

### Step 2-3: 해결 방법 적용

- [ ] **Suspense fallback에서 번역 함수 제거**
  - [ ] `frontend/client/app/exams/page.tsx` 확인
  - [ ] 하드코딩된 문자열로 대체

- [ ] **동적 값을 useEffect로 분리**
  - [ ] 문제가 되는 컴포넌트 수정
  - [ ] `useState` + `useEffect` 패턴 적용

- [ ] **클라이언트 전용 컴포넌트로 분리**
  - [ ] `"use client"` 디렉티브 추가
  - [ ] 서버 렌더링 불가능한 코드 분리

**수정 대상 파일들:**
- [ ] `frontend/client/components/layout/Header.tsx`
- [ ] `frontend/client/app/exams/page.tsx`
- [ ] 기타 Hydration Mismatch 발생 컴포넌트

### Step 2-4: 테스트 및 확인

- [ ] **로컬에서 테스트**
  ```bash
  cd frontend/client
  npm run dev
  ```
  - [ ] 브라우저 콘솔에서 Hydration Mismatch 에러 확인
  - [ ] 에러가 사라졌는지 확인

- [ ] **Vercel 배포 후 확인**
  - [ ] Vercel 대시보드에서 빌드 성공 확인
  - [ ] 프로덕션 환경에서 Hydration Mismatch 에러 확인

**완료 조건**: 브라우저 콘솔에서 React Error #418이 더 이상 나타나지 않아야 함

---

## 🔄 3️⃣ Backend 500 Internal Server Error

**목적**: 실제 500 에러 원인 파악 및 해결

**예상 소요 시간**: 2-3시간 (에러 원인에 따라 다름)

### Step 3-1: 에러 로그 확인 (1단계 완료 후)

- [ ] **Railway 로그에서 실제 에러 메시지 확인**
  ```bash
  railway logs --tail | grep -i "error\|❌\|500"
  ```
  - [ ] 에러 메시지 내용 기록
  - [ ] 에러 스택 트레이스 확인

- [ ] **에러 유형 분류**
  - [ ] Prisma 관련 에러 (`P2002`, `P2025`, `P1001` 등)
  - [ ] 타입 에러 (`TypeError`, `Cannot read property`)
  - [ ] Null/Undefined 접근 에러
  - [ ] 기타 에러

### Step 3-2: Prisma 관련 에러 해결

**Prisma 에러 코드별 해결 방법:**

- [ ] **P1001: Can't reach database server**
  - [ ] `DATABASE_URL` 확인
  - [ ] Supabase Connection Pooling URL 확인
  - [ ] 네트워크 연결 확인

- [ ] **P2002: Unique constraint violation**
  - [ ] 중복 데이터 확인
  - [ ] Unique 제약 조건 확인

- [ ] **P2025: Record not found**
  - [ ] 존재하지 않는 레코드 접근 확인
  - [ ] Null 체크 추가

- [ ] **P3006: Migration failed**
  - [ ] `npx prisma migrate status` 실행
  - [ ] 마이그레이션 파일 확인

### Step 3-3: 환경 변수 확인

- [ ] **Railway 환경 변수 재확인**
  - [ ] `DATABASE_URL` 값 확인
  - [ ] `JWT_SECRET` 값 확인
  - [ ] `OPENAI_API_KEY` 값 확인 (AI 기능 사용 시)

- [ ] **환경 변수 누락 확인**
  - [ ] `.env.example` 파일과 비교
  - [ ] 필수 환경 변수 모두 설정되었는지 확인

### Step 3-4: Prisma Client 재생성

- [ ] **Prisma Client 재생성**
  ```bash
  cd backend
  npx prisma generate
  ```

- [ ] **Prisma Migrate Status 확인**
  ```bash
  npx prisma migrate status
  ```
  - [ ] `Database schema is up to date!` 확인
  - [ ] 미적용 마이그레이션 있으면 적용

### Step 3-5: Null 접근 방어 코드 추가

- [ ] **관계 데이터 Null 체크 추가**
  - [ ] `admin.service.ts`의 모든 Prisma 쿼리 확인
  - [ ] `?.` 연산자 또는 기본값 추가

- [ ] **배열 접근 방어**
  - [ ] 배열이 비어있는지 확인
  - [ ] 인덱스 접근 전 길이 확인

**수정 대상 파일들:**
- [ ] `backend/src/modules/admin/services/admin.service.ts`
- [ ] `backend/src/modules/ai/services/ai-queue.service.ts`
- [ ] 기타 서비스 파일들

### Step 3-6: 테스트 및 확인

- [ ] **로컬에서 테스트**
  ```bash
  cd backend
  npm run start:dev
  ```
  - [ ] API 엔드포인트 호출 테스트
  - [ ] 에러 발생 여부 확인

- [ ] **Railway 배포 후 확인**
  - [ ] Railway 대시보드에서 배포 성공 확인
  - [ ] 프로덕션 환경에서 API 호출 테스트
  - [ ] 500 에러가 사라졌는지 확인

**완료 조건**: 
- Railway 로그에서 실제 에러 메시지 확인 가능
- 500 에러가 발생하지 않거나, 발생 시 적절한 에러 메시지 반환

---

## ⚙️ 4️⃣ WebSocket Timeout 문제

**목적**: WebSocket 연결 타임아웃 문제 해결 (비치명적)

**예상 소요 시간**: 30분-1시간

### Step 4-1: Gateway 등록 확인

- [ ] **WebSocket Gateway 확인**
  - [ ] `backend/src/modules/admin/gateways/settings.gateway.ts` 확인
  - [ ] `@WebSocketGateway` 데코레이터 확인
  - [ ] Gateway가 모듈에 등록되어 있는지 확인

- [ ] **모듈 등록 확인**
  - [ ] `backend/src/modules/admin/admin.module.ts` 확인
  - [ ] `SettingsGateway`가 `providers`에 포함되어 있는지 확인

### Step 4-2: 프론트엔드 연결 설정 수정

- [ ] **연결 타임아웃 증가**
  - [ ] `frontend/client/lib/socket.ts` 확인
  - [ ] `timeout: 5000` → `timeout: 10000` 변경

- [ ] **에러 처리 추가**
  ```typescript
  socket.on('connect_error', () => {
    console.log('WebSocket 연결 실패 - 무시');
  });
  ```

### Step 4-3: 폴백 메커니즘 추가

- [ ] **폴링 메커니즘 구현**
  - [ ] WebSocket 연결 실패 시 폴링으로 대체
  - [ ] `setInterval`을 사용한 주기적 데이터 동기화

### Step 4-4: 테스트 및 확인

- [ ] **로컬에서 테스트**
  - [ ] WebSocket 연결 테스트
  - [ ] 타임아웃 시 폴백 동작 확인

- [ ] **프로덕션 환경에서 확인**
  - [ ] Railway에서 WebSocket 서버 실행 확인
  - [ ] 브라우저 콘솔에서 타임아웃 에러 확인
  - [ ] 폴백 메커니즘이 작동하는지 확인

**완료 조건**: 
- WebSocket 타임아웃 에러가 발생해도 애플리케이션이 정상 작동
- 폴백 메커니즘이 작동하여 기능에 영향 없음

---

## 🧩 5️⃣ React Error #310 (Hooks 순서)

**목적**: Hooks 순서 변경으로 인한 React 에러 해결

**예상 소요 시간**: 30분-1시간

### Step 5-1: 문제 원인 찾기

- [ ] **조건부 hooks 호출 찾기**
  ```bash
  grep -r "if.*useState\|if.*useEffect\|if.*useMemo" frontend/client --include="*.tsx"
  ```

- [ ] **Early return 이후 hooks 호출 찾기**
  ```bash
  grep -r "return.*;" frontend/client --include="*.tsx" -A 5
  ```

- [ ] **반복문 내 hooks 호출 찾기**
  ```bash
  grep -r "\.map.*useState\|\.map.*useEffect\|\.map.*useMemo" frontend/client --include="*.tsx"
  ```

### Step 5-2: 해결 방법 적용

- [ ] **조건부 hooks 제거**
  - [ ] 모든 hooks를 컴포넌트 최상위로 이동
  - [ ] 조건부 로직을 hooks 내부로 이동

- [ ] **Early return 위치 변경**
  - [ ] 모든 hooks 호출 후 early return
  - [ ] 조건부 렌더링은 hooks 이후에 처리

**수정 대상 파일들:**
- [ ] `frontend/client/components/layout/AboutUsDropdown.tsx` (이미 수정됨)
- [ ] 기타 Hooks 순서 문제 발생 컴포넌트

### Step 5-3: 테스트 및 확인

- [ ] **로컬에서 테스트**
  - [ ] 브라우저 콘솔에서 React Error #310 확인
  - [ ] 에러가 사라졌는지 확인

- [ ] **프로덕션 환경에서 확인**
  - [ ] Vercel 배포 후 확인
  - [ ] 브라우저 콘솔에서 에러 확인

**완료 조건**: 브라우저 콘솔에서 React Error #310이 더 이상 나타나지 않아야 함

---

## 📊 진행 상황 추적

### 전체 진행률

| 단계 | 상태 | 완료일 | 비고 |
|------|------|--------|------|
| 1️⃣ 에러 로그 정확히 찍히게 만들기 | ⏳ 진행 중 | - | - |
| 2️⃣ React Error #418 해결 | ⏸️ 대기 | - | 1단계 완료 후 진행 |
| 3️⃣ Backend 500 에러 해결 | ⏸️ 대기 | - | 1단계 완료 후 진행 |
| 4️⃣ WebSocket Timeout 해결 | ⏸️ 대기 | - | 비치명적, 나중에 진행 가능 |
| 5️⃣ React Error #310 해결 | ⏸️ 대기 | - | - |

### 우선순위별 실행 순서

| 순서 | 작업 | 목적 | 상태 |
|------|------|------|------|
| 1 | `this.logger.error` + `console.error` 병행 | 로그 가시화 | ⏳ 진행 중 |
| 2 | Railway 로그 확인 | 실제 원인 파악 | ⏸️ 대기 |
| 3 | Prisma null·타입 에러 수정 | 500 방지 | ⏸️ 대기 |
| 4 | Hydration mismatch 컴포넌트 점검 | UX 안정화 | ⏸️ 대기 |
| 5 | Hooks 순서 점검 | React 안정성 | ⏸️ 대기 |
| 6 | WebSocket Timeout 폴백 | 비치명적 보완 | ⏸️ 대기 |

---

## 📝 작업 기록

### 2025-11-20

- [x] `ERROR_ANALYSIS_AND_RESOLUTION.md` 문서 작성
- [x] `EXTERNAL_SERVICES_DEBUG_GUIDE.md` 가이드 작성
- [x] `ERROR_RESOLUTION_CHECKLIST.md` 체크리스트 작성
- [ ] 1단계: 에러 로깅 강화 작업 시작

---

## 🆘 문제 발생 시

### Railway 로그가 여전히 보이지 않는 경우

1. Railway CLI 재설치
2. Railway 대시보드에서 직접 확인
3. `EXTERNAL_SERVICES_DEBUG_GUIDE.md` 참조

### 에러 해결이 어려운 경우

1. `ERROR_ANALYSIS_AND_RESOLUTION.md` 문서 참조
2. 에러 메시지를 정확히 기록
3. 단계별로 하나씩 해결

---

## 📚 참고 문서

- [ERROR_ANALYSIS_AND_RESOLUTION.md](./ERROR_ANALYSIS_AND_RESOLUTION.md) - 에러 분석 및 해결 가이드
- [EXTERNAL_SERVICES_DEBUG_GUIDE.md](./EXTERNAL_SERVICES_DEBUG_GUIDE.md) - 외부 서비스 디버깅 가이드

---

## 📝 업데이트 이력

- 2025-11-20: 초기 체크리스트 작성

