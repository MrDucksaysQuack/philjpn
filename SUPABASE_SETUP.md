# Supabase 데이터베이스 설정 가이드

> **Prisma 마이그레이션을 Supabase에 적용하기**

---

## 🎯 목표

로컬 개발 환경에서 Supabase PostgreSQL 데이터베이스에 Prisma 스키마를 마이그레이션합니다.

---

## Step 1: Supabase 프로젝트 생성 (아직 안 했다면)

1. **Supabase 접속**
   - https://supabase.com 접속
   - GitHub로 로그인

2. **새 프로젝트 생성**
   - "New Project" 클릭
   - 프로젝트 이름: `exam-platform` (또는 원하는 이름)
   - 데이터베이스 비밀번호 설정 (중요! 기억하세요)
   - Region: `Northeast Asia (Seoul)` 권장
   - Pricing Plan: Free 선택 가능
   - "Create new project" 클릭

3. **프로젝트 생성 대기**
   - 약 2-3분 소요

---

## Step 2: 연결 정보 확인

1. **Database 연결 문자열 확인**
   - Supabase Dashboard → Settings → Database
   - "Connection string" 섹션에서 "URI" 선택
   - 연결 문자열 복사

2. **연결 문자열 형식**
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

   또는 Direct connection:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

---

## Step 3: 환경 변수 설정

### Backend `.env` 파일에 추가

```bash
cd backend
nano .env  # 또는 원하는 에디터
```

다음 내용 추가/수정:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15"

# JWT
JWT_SECRET=your-secret-key-change-this-min-32-chars
JWT_EXPIRES_IN=1h

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

**중요**: 
- `[YOUR-PASSWORD]`: Supabase에서 설정한 데이터베이스 비밀번호
- `[PROJECT-REF]`: Supabase 프로젝트 참조 ID (예: `abcdefghijklmnop`)
- `?pgbouncer=true`를 추가하면 연결 풀링 사용 (권장)

---

## Step 4: Prisma 마이그레이션 실행

### 로컬에서 실행

```bash
cd backend

# 1. Prisma Client 생성
npx prisma generate

# 2. 마이그레이션 적용 (프로덕션 모드)
npx prisma migrate deploy

# 또는 개발 모드 (새 마이그레이션 생성 시)
# npx prisma migrate dev
```

### 예상 출력

```
✅ Prisma Client generated
✅ Applied migration: 20251101061942_init
```

---

## Step 5: 연결 테스트

```bash
# Prisma Studio로 데이터베이스 확인 (선택사항)
npx prisma studio
```

브라우저에서 `http://localhost:5555` 접속하여 테이블 구조 확인

---

## Step 6: 애플리케이션 테스트

```bash
# Backend 서버 실행
npm run start:dev
```

Swagger 문서 확인:
- http://localhost:3001/api 접속

---

## 🐛 문제 해결

### 1. 연결 실패 오류

**문제**: `P1001: Can't reach database server`

**해결**:
- Supabase Dashboard → Settings → Database → Connection pooling 확인
- Direct connection 사용 시 포트 5432 사용
- Connection pooling 사용 시 포트 6543 사용
- 방화벽 설정 확인 (Supabase는 기본적으로 모든 IP 허용)

**연결 문자열 예시**:
```env
# Direct Connection (개발용)
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Connection Pooling (권장, 프로덕션)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 2. SSL 오류

**문제**: `P1001: SSL connection required`

**해결**: 연결 문자열에 SSL 파라미터 추가
```env
DATABASE_URL="postgresql://...?sslmode=require"
```

### 3. 마이그레이션 오류

**문제**: `Migration engine error`

**해결**:
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 문제가 있다면 리셋 (주의: 모든 데이터 삭제)
npx prisma migrate reset
npx prisma migrate deploy
```

---

## 📋 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] DATABASE_URL 환경 변수 설정
- [ ] `npx prisma generate` 실행 성공
- [ ] `npx prisma migrate deploy` 실행 성공
- [ ] Prisma Studio로 테이블 확인
- [ ] Backend 서버 실행 성공

---

## 🔐 보안 주의사항

⚠️ **절대 `.env` 파일을 GitHub에 커밋하지 마세요!**

- `.env`는 `.gitignore`에 포함되어 있음
- `.env.example`만 커밋 (비밀번호 없이)
- Supabase 비밀번호는 안전하게 보관

---

**작성일**: 2024년 11월

