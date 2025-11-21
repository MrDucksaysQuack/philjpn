# 외부 서비스 디버깅 가이드

이 가이드는 Supabase, Railway, Vercel 등 외부 서비스에서 정보를 취득하기 위한 단계별 가이드입니다.

---

## 📋 목차
1. [Railway 로그 확인](#1-railway-로그-확인)
2. [Railway 환경 변수 확인](#2-railway-환경-변수-확인)
3. [Supabase 연결 및 스키마 확인](#3-supabase-연결-및-스키마-확인)
4. [Vercel 빌드 로그 확인](#4-vercel-빌드-로그-확인)
5. [Vercel 환경 변수 확인](#5-vercel-환경-변수-확인)
6. [데이터베이스 연결 테스트](#6-데이터베이스-연결-테스트)

---

## 1. Railway 로그 확인

### 목적
백엔드 서버에서 발생하는 실제 에러 메시지를 확인합니다.

### 방법 1: Railway 대시보드 사용

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - 로그인 후 프로젝트 선택

2. **서비스 선택**
   - 백엔드 서비스 클릭 (예: `backend` 또는 `exam-platform-backend`)

3. **로그 탭 클릭**
   - 왼쪽 메뉴에서 "Logs" 탭 클릭
   - 또는 서비스 페이지에서 "View Logs" 버튼 클릭

4. **에러 검색**
   - 로그 창에서 다음 키워드로 검색:
     - `[ERROR]` (Railway가 인식하는 에러 표시)
     - `error`, `Error`, `❌`, `500`
     - `PrismaClientKnownRequestError`, `P2002`, `P2025` (Prisma 에러 코드)
   - 또는 스크롤하여 최근 에러 메시지 확인
   - **중요**: Railway 환경에서는 `console.error`가 로그에 나타나지 않을 수 있으므로, `[ERROR]` 태그로 시작하는 메시지를 확인하세요

### 방법 2: Railway CLI 사용

1. **Railway CLI 설치** (미설치 시)
   ```bash
   npm i -g @railway/cli
   ```

2. **Railway 로그인**
   ```bash
   railway login
   ```

3. **프로젝트 연결**
   ```bash
   cd backend
   railway link
   ```

4. **실시간 로그 확인**
   ```bash
   railway logs --tail
   ```

5. **특정 키워드로 필터링**
   ```bash
   # Railway가 인식하는 에러 태그로 검색
   railway logs --tail | grep -i "\[ERROR\]"
   
   # 또는 일반적인 에러 키워드로 검색
   railway logs --tail | grep -i "error\|❌\|500\|PrismaClientKnownRequestError"
   ```

### 확인할 항목

- ✅ **애플리케이션 시작 로그**: `Nest application successfully started`
- ✅ **데이터베이스 연결**: `Database connection established`
- ❌ **에러 메시지**: 
  - `[ERROR]` (Railway가 인식하는 에러 태그 - 가장 중요!)
  - `Error:`, `❌`, `500`
  - `PrismaClientKnownRequestError`, `P2002`, `P2025` (Prisma 에러 코드)
- ⚠️ **경고 메시지**: `warn`, `WARN`
- 📝 **참고**: Railway 환경에서는 `console.error`가 로그에 나타나지 않을 수 있으므로, `[ERROR]` 태그로 시작하는 메시지를 우선 확인하세요

### 로그 저장 방법

1. **Railway 대시보드에서**
   - 로그 창 우측 상단 "Download" 또는 "Export" 버튼 클릭
   - CSV 또는 텍스트 파일로 저장

2. **Railway CLI로**
   ```bash
   railway logs > railway-logs-$(date +%Y%m%d-%H%M%S).txt
   ```

---

## 2. Railway 환경 변수 확인

### 목적
백엔드 서버에 필요한 환경 변수가 올바르게 설정되어 있는지 확인합니다.

### 방법 1: Railway 대시보드 사용

1. **Railway 대시보드 접속**
   - 프로젝트 선택 → 백엔드 서비스 선택

2. **Variables 탭 클릭**
   - 왼쪽 메뉴에서 "Variables" 탭 클릭

3. **환경 변수 확인**
   - 다음 필수 변수들이 있는지 확인:
     - `DATABASE_URL` ✅
     - `JWT_SECRET` ✅
     - `OPENAI_API_KEY` (선택, AI 기능 사용 시)
     - `REDIS_HOST` (선택, Bull Queue 사용 시)
     - `REDIS_PORT` (선택)
     - `REDIS_PASSWORD` (선택)

### 방법 2: Railway CLI 사용

```bash
cd backend
railway variables
```

### 필수 환경 변수 체크리스트

| 변수명 | 필수 여부 | 설명 | 확인 방법 |
|--------|----------|------|----------|
| `DATABASE_URL` | ✅ 필수 | Supabase PostgreSQL 연결 문자열 | Railway Variables 탭에서 확인 |
| `JWT_SECRET` | ✅ 필수 | JWT 토큰 서명용 시크릿 키 | Railway Variables 탭에서 확인 |
| `OPENAI_API_KEY` | ⚠️ 선택 | AI 기능 사용 시 필요 | Railway Variables 탭에서 확인 |
| `REDIS_HOST` | ⚠️ 선택 | Bull Queue 사용 시 필요 | Railway Variables 탭에서 확인 |
| `REDIS_PORT` | ⚠️ 선택 | Bull Queue 사용 시 필요 | Railway Variables 탭에서 확인 |
| `REDIS_PASSWORD` | ⚠️ 선택 | Bull Queue 사용 시 필요 | Railway Variables 탭에서 확인 |

### 환경 변수 값 확인 (보안 주의)

⚠️ **주의**: 환경 변수 값은 민감한 정보이므로 절대 공유하지 마세요.

```bash
# Railway CLI로 특정 변수 값 확인 (마스킹됨)
railway variables get DATABASE_URL
railway variables get JWT_SECRET
```

---

## 3. Supabase 연결 및 스키마 확인

### 목적
데이터베이스 연결 상태와 스키마 일치 여부를 확인합니다.

### 방법 1: Supabase 대시보드 사용

1. **Supabase 대시보드 접속**
   - https://supabase.com 접속
   - 로그인 후 프로젝트 선택

2. **Database → Tables 확인**
   - 왼쪽 메뉴에서 "Database" → "Tables" 클릭
   - 필요한 테이블들이 모두 있는지 확인:
     - `users`, `exams`, `categories`, `questions`, `sections`, `results`, `word_books` 등

3. **Database → Connection Pooling 확인**
   - 왼쪽 메뉴에서 "Database" → "Connection Pooling" 클릭
   - **Connection String (Pooler)** 복사
   - 이 값이 `DATABASE_URL`과 일치하는지 확인

### 방법 2: SQL Editor 사용

1. **Supabase 대시보드 → SQL Editor**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭

2. **스키마 확인 쿼리 실행**
   ```sql
   -- 모든 테이블 목록 확인
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

3. **특정 테이블 스키마 확인**
   ```sql
   -- users 테이블 스키마 확인
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'users'
   ORDER BY ordinal_position;
   ```

4. **Prisma 스키마와 비교**
   - `backend/prisma/schema.prisma` 파일과 비교
   - 누락된 테이블이나 필드 확인

### 방법 3: Prisma Studio 사용 (로컬)

1. **로컬에서 Prisma Studio 실행**
   ```bash
   cd backend
   npx prisma studio
   ```

2. **브라우저에서 확인**
   - http://localhost:5555 접속
   - 테이블 목록과 데이터 확인

### 방법 4: Prisma Migrate Status 확인

```bash
cd backend
npx prisma migrate status
```

**예상 결과:**
- ✅ `Database schema is up to date!` → 정상
- ❌ `X migrations found in prisma/migrations that are not applied` → 마이그레이션 적용 필요

### 데이터베이스 연결 테스트

1. **Railway 로그에서 확인**
   - `Database connection established` 메시지 확인
   - `PrismaClientKnownRequestError` 에러 확인

2. **Supabase 대시보드 → Database → Connection Pooling**
   - Active connections 수 확인
   - Connection errors 확인

---

## 4. Vercel 빌드 로그 확인

### 목적
프론트엔드 빌드 과정에서 발생하는 에러를 확인합니다.

### 방법 1: Vercel 대시보드 사용

1. **Vercel 대시보드 접속**
   - https://vercel.com 접속
   - 로그인 후 프로젝트 선택

2. **Deployments 탭 클릭**
   - 최근 배포 목록 확인
   - 실패한 배포(빨간색) 클릭

3. **Build Logs 확인**
   - 배포 상세 페이지에서 "Build Logs" 탭 클릭
   - 에러 메시지 확인:
     - `Type error:`
     - `Module not found:`
     - `Failed to compile:`

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치** (미설치 시)
   ```bash
   npm i -g vercel
   ```

2. **Vercel 로그인**
   ```bash
   vercel login
   ```

3. **프로젝트 연결**
   ```bash
   cd frontend/client
   vercel link
   ```

4. **빌드 로그 확인**
   ```bash
   vercel logs [deployment-url]
   ```

### 확인할 항목

- ❌ **TypeScript 에러**: `Type error:`, `TS2345`, `TS2307`
- ❌ **모듈 누락**: `Module not found:`, `Can't resolve`
- ❌ **빌드 실패**: `Failed to compile`, `Build failed`
- ⚠️ **경고**: `Warning:`, `warn`

---

## 5. Vercel 환경 변수 확인

### 목적
프론트엔드에 필요한 환경 변수가 올바르게 설정되어 있는지 확인합니다.

### 방법 1: Vercel 대시보드 사용

1. **Vercel 대시보드 접속**
   - 프로젝트 선택

2. **Settings → Environment Variables**
   - 왼쪽 메뉴에서 "Settings" → "Environment Variables" 클릭

3. **환경 변수 확인**
   - 다음 필수 변수들이 있는지 확인:
     - `NEXT_PUBLIC_API_URL` ✅ (백엔드 API URL)
     - 기타 `NEXT_PUBLIC_*` 변수들

### 방법 2: Vercel CLI 사용

```bash
cd frontend/client
vercel env ls
```

### 필수 환경 변수 체크리스트

| 변수명 | 필수 여부 | 설명 | 확인 방법 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_API_URL` | ✅ 필수 | 백엔드 API URL (예: `https://philjpn-production.up.railway.app`) | Vercel Settings → Environment Variables |

---

## 6. 데이터베이스 연결 테스트

### 목적
Railway 백엔드에서 Supabase 데이터베이스로의 연결이 정상인지 확인합니다.

### 방법 1: Railway 로그 확인

1. **Railway 로그에서 다음 메시지 확인:**
   ```
   ✅ Database connection established
   ✅ PrismaService initialized
   ```

2. **에러 메시지 확인:**
   ```
   ❌ PrismaClientKnownRequestError
   ❌ P1001: Can't reach database server
   ❌ P1000: Authentication failed
   ```

### 방법 2: Supabase 대시보드 확인

1. **Database → Connection Pooling**
   - Active connections 수 확인
   - Connection errors 확인

2. **Database → Logs**
   - 최근 쿼리 로그 확인
   - 에러 로그 확인

### 방법 3: 백엔드 Health Check 엔드포인트 호출

```bash
# Railway 백엔드 URL로 Health Check
curl https://philjpn-production.up.railway.app/health

# 예상 응답:
# {"status":"ok","database":"connected"}
```

---

## 🔍 문제 해결 체크리스트

### Railway 관련

- [ ] Railway 로그에서 에러 메시지 확인 완료
- [ ] Railway 환경 변수 (`DATABASE_URL`, `JWT_SECRET`) 확인 완료
- [ ] Railway 서비스가 실행 중인지 확인 완료

### Supabase 관련

- [ ] Supabase 대시보드에서 테이블 목록 확인 완료
- [ ] Supabase Connection Pooling URL 확인 완료
- [ ] Prisma 스키마와 Supabase 스키마 일치 확인 완료
- [ ] `npx prisma migrate status` 실행 완료

### Vercel 관련

- [ ] Vercel 빌드 로그에서 에러 확인 완료
- [ ] Vercel 환경 변수 (`NEXT_PUBLIC_API_URL`) 확인 완료
- [ ] Vercel 배포가 성공했는지 확인 완료

### 연결 테스트

- [ ] Railway → Supabase 연결 테스트 완료
- [ ] Vercel → Railway 연결 테스트 완료
- [ ] Health Check 엔드포인트 호출 완료

---

## 📝 정보 수집 후 다음 단계

이 가이드를 통해 수집한 정보를 바탕으로:

1. **에러 로그 파일 저장**
   - Railway 로그를 파일로 저장
   - Vercel 빌드 로그를 파일로 저장

2. **환경 변수 목록 작성**
   - Railway 환경 변수 목록
   - Vercel 환경 변수 목록

3. **스키마 불일치 목록 작성**
   - Prisma 스키마와 Supabase 스키마 차이점

4. **에러 원인 분석**
   - `ERROR_ANALYSIS_AND_RESOLUTION.md` 문서 참조
   - 수집한 정보를 바탕으로 원인 분석

---

## 🆘 문제 발생 시

### Railway 로그가 보이지 않는 경우

1. Railway CLI 재설치
2. Railway 대시보드에서 직접 확인
3. Railway 지원팀에 문의

### Supabase 연결이 안 되는 경우

1. Connection Pooling URL 확인
2. Supabase 프로젝트 상태 확인 (일시 중지 여부)
3. IP 화이트리스트 확인 (필요 시)

### Vercel 빌드가 계속 실패하는 경우

1. 로컬에서 `npm run build` 실행하여 에러 확인
2. Vercel 빌드 로그에서 정확한 에러 메시지 확인
3. TypeScript 에러 수정 후 재배포

---

## 📚 참고 자료

- [Railway Documentation](https://docs.railway.app/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 📝 업데이트 이력

- 2025-11-20: 초기 가이드 작성

