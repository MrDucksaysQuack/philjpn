# Exam Platform 아키텍처 분석

## 📋 개요

이 프로젝트는 **NestJS (Backend)**와 **Next.js 16 (Frontend)**로 구성된 풀스택 시험 플랫폼입니다.

---

## 🏗️ Backend 아키텍처 (NestJS)

### 기술 스택
- **Framework**: NestJS 11.x (Node.js 기반)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 6.x
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Real-time**: Socket.io (WebSocket)
- **Image Processing**: node-vibrant (로고 색상 추출)

### 프로젝트 구조

```
backend/
├── src/
│   ├── main.ts                    # 애플리케이션 진입점
│   ├── app.module.ts              # 루트 모듈
│   ├── config/                    # 설정 파일
│   │   ├── app.config.ts
│   │   └── database.config.ts
│   ├── common/                    # 공통 유틸리티
│   │   ├── decorators/            # 커스텀 데코레이터
│   │   ├── guards/                # 인증/권한 가드
│   │   ├── interceptors/          # 인터셉터
│   │   ├── filters/               # 예외 필터
│   │   ├── pipes/                 # 파이프 (데이터 변환)
│   │   ├── types/                 # 공통 타입
│   │   └── utils/
│   │       ├── prisma.module.ts   # Prisma 모듈
│   │       └── prisma.service.ts   # Prisma 서비스 (재시도 로직 포함)
│   └── modules/                   # 기능별 모듈 (도메인 주도 설계)
│       ├── auth/                  # 인증 모듈
│       ├── core/                  # 핵심 기능 (시험, 문제, 결과)
│       ├── license/               # 라이선스 키 관리
│       ├── admin/                 # 관리자 기능
│       ├── report/                # 리포트 & 학습 분석
│       ├── wordbook/              # 단어장
│       └── monitoring/            # 실시간 모니터링
├── prisma/
│   ├── schema.prisma             # 데이터베이스 스키마
│   └── migrations/               # 마이그레이션 파일
└── scripts/                      # 유틸리티 스크립트
    ├── seed-all.ts               # 샘플 데이터 생성
    └── seed-users.ts             # 사용자 시드
```

### 주요 모듈 설명

#### 1. **Auth Module** (`modules/auth/`)
- **역할**: 사용자 인증 및 권한 관리
- **구성요소**:
  - `auth.service.ts`: 로그인, 회원가입, 토큰 갱신
  - `auth.controller.ts`: 인증 API 엔드포인트
  - `strategies/jwt.strategy.ts`: JWT 전략 (Passport)
  - `guards/jwt-auth.guard.ts`: JWT 인증 가드
  - `guards/roles.guard.ts`: 역할 기반 권한 가드
  - `decorators/current-user.decorator.ts`: 현재 사용자 추출 데코레이터
  - `decorators/roles.decorator.ts`: 역할 지정 데코레이터

**인증 흐름**:
```
1. 사용자 로그인 → AuthService.login()
2. JWT 토큰 생성 (accessToken + refreshToken)
3. 클라이언트에 토큰 반환
4. 이후 요청: Authorization 헤더에 Bearer 토큰 포함
5. JwtAuthGuard가 토큰 검증
6. JwtStrategy가 사용자 정보 추출
7. RolesGuard가 권한 확인 (필요시)
```

#### 2. **Core Module** (`modules/core/`)
- **역할**: 시험 플랫폼의 핵심 기능
- **하위 모듈**:
  - `exam/`: 시험 관리 (생성, 조회, 수정, 삭제)
  - `section/`: 시험 섹션 관리
  - `question/`: 문제 관리
  - `result/`: 시험 결과 조회
  - `session/`: 시험 세션 관리 (진행 중인 시험)
  - `grading/`: 채점 로직

**데이터 흐름**:
```
Exam → Sections → Questions
         ↓
    ExamResult → SectionResult → QuestionResult
```

#### 3. **Admin Module** (`modules/admin/`)
- **역할**: 관리자 전용 기능
- **주요 기능**:
  - `admin.service.ts`: 사용자 관리
  - `site-settings.service.ts`: 사이트 설정 관리
  - `color-analysis.service.ts`: 로고 색상 분석
  - `template.service.ts`: 시험 템플릿 관리
  - `question-pool.service.ts`: 문제 풀 관리

#### 4. **License Module** (`modules/license/`)
- **역할**: 라이선스 키 시스템
- **기능**:
  - 라이선스 키 생성/검증
  - 사용량 추적
  - 사용 로그 기록

#### 5. **Report Module** (`modules/report/`)
- **역할**: 학습 분석 및 리포트
- **기능**:
  - 학습 패턴 분석
  - 약점 분석
  - 목표 관리
  - 학습 사이클 관리
  - 시험 추천

#### 6. **WordBook Module** (`modules/wordbook/`)
- **역할**: 단어장 기능
- **기능**:
  - 단어 추가/수정/삭제
  - 시험에서 단어 자동 추출
  - SRS (Spaced Repetition System) 기반 복습
  - 단어 퀴즈

#### 7. **Monitoring Module** (`modules/monitoring/`)
- **역할**: 실시간 모니터링
- **기능**:
  - WebSocket을 통한 실시간 시험 진행 상황 모니터링
  - `exam-monitoring.gateway.ts`: Socket.io 게이트웨이

### 주요 설정 및 미들웨어

#### `main.ts` 설정
```typescript
1. CORS 설정 (환경 변수 기반)
2. Global Validation Pipe (class-validator)
3. Swagger API 문서 설정
4. 서버 시작
```

**CORS 처리**:
- 환경 변수 `CORS_ORIGIN`에서 허용 도메인 파싱
- 프로덕션에서 Vercel 도메인 자동 추가
- OPTIONS 프리플라이트 요청 처리

#### Prisma Service (`common/utils/prisma.service.ts`)
- **PgBouncer 호환**: Supabase 연결 풀 최적화
- **재시도 로직**: 연결 실패 시 자동 재시도 (최대 5회)
- **Prepared Statement 에러 처리**: 재연결 로직 포함
- **`executeWithRetry()`**: 데이터베이스 작업 재시도 헬퍼

### API 엔드포인트 구조

```
/api/auth/*          # 인증 (로그인, 회원가입, 토큰 갱신)
/api/exams/*         # 시험 관리
/api/sections/*      # 섹션 관리
/api/questions/*     # 문제 관리
/api/results/*       # 시험 결과
/api/sessions/*      # 시험 세션
/api/admin/*         # 관리자 기능
/api/license/*       # 라이선스 키
/api/reports/*       # 리포트 & 분석
/api/wordbook/*      # 단어장
/api/monitoring/*    # 실시간 모니터링
```

### 데이터베이스 연결

- **ORM**: Prisma Client
- **Connection Pooling**: PgBouncer (Supabase)
- **재시도 로직**: Railway cold start 대응
- **에러 처리**: Prepared statement 에러 자동 복구

---

## 🎨 Frontend 아키텍처 (Next.js 16)

### 기술 스택
- **Framework**: Next.js 16.0.1 (App Router)
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.x
- **State Management**: 
  - Zustand (전역 상태)
  - React Query (서버 상태)
- **HTTP Client**: Axios
- **Internationalization**: next-intl
- **Charts**: Recharts
- **Real-time**: Socket.io Client
- **Markdown**: react-markdown

### 프로젝트 구조

```
frontend/client/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 루트 레이아웃
│   ├── providers.tsx            # 전역 프로바이더
│   ├── page.tsx                 # 홈 페이지
│   ├── login/                   # 로그인 페이지
│   ├── register/                # 회원가입 페이지
│   ├── dashboard/               # 대시보드
│   │   ├── page.tsx
│   │   └── components/          # 대시보드 위젯
│   ├── exams/                   # 시험 목록/상세
│   │   ├── page.tsx
│   │   ├── [id]/                # 시험 상세
│   │   └── [id]/take/           # 시험 응시
│   ├── results/                 # 결과 목록/상세
│   ├── statistics/              # 통계 페이지
│   ├── analysis/                # 분석 페이지
│   ├── wordbook/                # 단어장
│   ├── admin/                   # 관리자 페이지
│   │   ├── page.tsx
│   │   ├── settings/            # 사이트 설정
│   │   ├── exams/               # 시험 관리
│   │   ├── users/               # 사용자 관리
│   │   ├── templates/           # 템플릿 관리
│   │   └── ...
│   └── about/                   # About 페이지
│       ├── company/
│       ├── team/
│       ├── service/
│       └── contact/
├── components/                   # 재사용 가능한 컴포넌트
│   ├── about/                   # About 페이지 컴포넌트
│   ├── charts/                  # 차트 컴포넌트
│   ├── common/                  # 공통 컴포넌트
│   ├── goals/                   # 목표 관련
│   ├── layout/                  # 레이아웃 컴포넌트
│   └── ThemeProvider.tsx        # 테마 프로바이더
├── lib/                         # 유틸리티 및 설정
│   ├── api.ts                   # API 클라이언트 (Axios)
│   ├── store.ts                 # Zustand 스토어
│   ├── theme.ts                 # 테마 설정
│   ├── socket.ts                # Socket.io 클라이언트
│   ├── i18n.ts                  # 국제화 설정
│   └── messages.ts              # 메시지 리소스
└── messages/                    # 다국어 메시지
    ├── ko.json
    └── en.json
```

### 주요 아키텍처 패턴

#### 1. **App Router 구조**
- **파일 기반 라우팅**: `app/` 폴더 구조가 URL 경로가 됨
- **서버 컴포넌트 기본**: 클라이언트 컴포넌트는 `"use client"` 지시어 필요
- **레이아웃 중첩**: `layout.tsx`로 공통 레이아웃 관리

#### 2. **상태 관리**

**Zustand (전역 상태)**:
```typescript
// lib/store.ts
- useAuthStore: 인증 상태 (user, tokens)
- localStorage와 동기화
```

**React Query (서버 상태)**:
```typescript
// providers.tsx
- QueryClient 설정
- 캐싱 전략 (staleTime: 1분)
- 자동 재시도 설정
```

#### 3. **API 클라이언트** (`lib/api.ts`)

**주요 기능**:
- **자동 URL 정규화**: `/api` 접두사 자동 추가
- **JWT 토큰 자동 주입**: 요청 인터셉터
- **토큰 갱신**: 401 에러 시 자동 refresh
- **타입 안전성**: TypeScript 인터페이스 정의

**API 함수 구조**:
```typescript
// lib/api.ts
export const siteSettingsAPI = {
  getPublic: () => apiClient.get<SiteSettings>('/admin/site-settings/public'),
  update: (data: UpdateSiteSettingsDto) => 
    apiClient.put('/admin/site-settings', data),
};

// 사용 예시
const { data } = useQuery({
  queryKey: ['siteSettings'],
  queryFn: siteSettingsAPI.getPublic,
});
```

#### 4. **테마 시스템**

**동적 테마 적용**:
- `ThemeProvider`: 사이트 설정에서 색상 로드
- `lib/theme.ts`: 테마 유틸리티
- Tailwind CSS 동적 클래스 적용

**사용 예시**:
```typescript
const settings = useQuery({ queryKey: ['siteSettings'], ... });
const primaryColor = settings?.data?.primaryColor || '#667eea';

<div style={{ backgroundColor: primaryColor }}>
  {/* 동적 색상 적용 */}
</div>
```

#### 5. **컴포넌트 구조**

**재사용 가능한 컴포넌트**:
- `components/common/`: 공통 UI (Toast, Loading, Modal 등)
- `components/charts/`: 차트 컴포넌트 (Recharts)
- `components/about/`: About 페이지 전용 컴포넌트
- `components/layout/`: 레이아웃 컴포넌트 (Header 등)

**페이지별 컴포넌트**:
- `app/dashboard/components/`: 대시보드 위젯
- 각 페이지는 필요한 경우 자체 컴포넌트 폴더 보유

### 주요 기능 구현

#### 1. **인증 플로우**
```
1. 로그인 페이지 → AuthService.login()
2. JWT 토큰 받아서 localStorage 저장
3. Zustand store에 사용자 정보 저장
4. 이후 API 요청: Axios 인터셉터가 자동으로 토큰 추가
5. 401 에러 시: 자동으로 refresh token으로 갱신 시도
6. 갱신 실패 시: 로그인 페이지로 리다이렉트
```

#### 2. **동적 테마 적용**
```
1. 사이트 설정 API에서 색상 정보 로드
2. ThemeProvider가 전역적으로 색상 제공
3. 각 페이지/컴포넌트에서 동적 색상 적용
4. Tailwind CSS 클래스 또는 inline style 사용
```

#### 3. **실시간 기능**
- Socket.io 클라이언트 (`lib/socket.ts`)
- 실시간 시험 모니터링
- 관리자 페이지에서 진행 중인 시험 추적

#### 4. **다국어 지원**
- next-intl 사용
- `messages/ko.json`, `messages/en.json`
- 언어 전환 기능 (향후 확장 가능)

### 스타일링 전략

- **Tailwind CSS 4.x**: 유틸리티 퍼스트 CSS
- **반응형 디자인**: 모바일/태블릿/데스크톱 대응
- **다크 모드**: (향후 확장 가능)
- **커스텀 애니메이션**: `globals.css`에 fade-in-up 등 정의

---

## 🔄 Backend-Frontend 통신

### API 통신 흐름

```
Frontend (Next.js)
    ↓
lib/api.ts (Axios Client)
    ↓
HTTP Request (JWT Token 포함)
    ↓
Backend (NestJS)
    ↓
Controller → Service → Prisma → PostgreSQL
    ↓
Response (JSON)
    ↓
Frontend (React Query 캐싱)
```

### 인증 메커니즘

1. **로그인**:
   ```
   POST /api/auth/login
   → { accessToken, refreshToken, user }
   → localStorage 저장
   ```

2. **인증된 요청**:
   ```
   Authorization: Bearer <accessToken>
   → JwtAuthGuard 검증
   → JwtStrategy가 사용자 정보 추출
   ```

3. **토큰 갱신**:
   ```
   401 에러 발생
   → POST /api/auth/refresh (refreshToken)
   → 새로운 accessToken 받아서 재요청
   ```

### CORS 설정

- **Backend**: `main.ts`에서 CORS 미들웨어 설정
- **허용 도메인**: 환경 변수 `CORS_ORIGIN`에서 관리
- **프로덕션**: Vercel 도메인 자동 허용

---

## 📦 의존성 관리

### Backend 주요 의존성
```json
{
  "@nestjs/core": "^11.0.1",
  "@prisma/client": "^6.18.0",
  "@nestjs/jwt": "^11.0.1",
  "@nestjs/passport": "^11.0.5",
  "bcrypt": "^6.0.0",
  "class-validator": "^0.14.2",
  "socket.io": "^4.8.1",
  "node-vibrant": "^4.0.3"
}
```

### Frontend 주요 의존성
```json
{
  "next": "16.0.1",
  "react": "19.2.0",
  "@tanstack/react-query": "^5.90.5",
  "axios": "^1.13.1",
  "zustand": "^5.0.8",
  "tailwindcss": "^4",
  "recharts": "^3.3.0",
  "socket.io-client": "^4.8.1"
}
```

---

## 🚀 배포 환경

### Backend
- **플랫폼**: Railway
- **데이터베이스**: Supabase (PostgreSQL)
- **환경 변수**: Railway 대시보드에서 관리

### Frontend
- **플랫폼**: Vercel
- **빌드**: Next.js 빌드 시스템
- **환경 변수**: Vercel 대시보드에서 관리

---

## 🔧 개발 워크플로우

### Backend 개발
```bash
# 개발 서버 실행
npm run start:dev

# Prisma 마이그레이션
npx prisma migrate dev

# Prisma Studio (DB GUI)
npx prisma studio

# 샘플 데이터 생성
npm run seed:all
```

### Frontend 개발
```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm run start
```

---

## 📝 주요 설계 원칙

1. **모듈화**: NestJS 모듈 기반 구조
2. **타입 안전성**: TypeScript 전면 사용
3. **검증**: class-validator로 DTO 검증
4. **에러 처리**: 일관된 에러 응답 형식
5. **재사용성**: 공통 컴포넌트/유틸리티 분리
6. **성능**: React Query 캐싱, Prisma 연결 풀링
7. **보안**: JWT 인증, bcrypt 비밀번호 해싱, CORS 설정

---

## 🎯 향후 개선 가능 영역

1. **테스트**: Unit/E2E 테스트 추가
2. **로깅**: 구조화된 로깅 시스템 (Winston 등)
3. **모니터링**: APM 도구 통합
4. **캐싱**: Redis 도입 검토
5. **파일 업로드**: 이미지/파일 업로드 기능
6. **이메일**: 이메일 인증/알림 시스템
7. **다국어**: 더 많은 언어 지원

