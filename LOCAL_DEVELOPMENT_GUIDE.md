# 로컬 개발 환경 가이드

> **백엔드와 프론트엔드를 동시에 실행하여 개발하는 방법**

---

## 📋 사전 준비

### 1. Node.js 설치 확인

```bash
node --version  # v20.x 이상 권장
npm --version
```

### 2. 데이터베이스 준비

**옵션 A: Supabase 사용 (권장)**
- Supabase 프로젝트 생성 및 연결 문자열 복사

**옵션 B: 로컬 PostgreSQL**
- PostgreSQL 설치 및 실행
- 데이터베이스 생성: `createdb exam_platform`

---

## 🚀 빠른 시작 (3단계)

### Step 1: 데이터베이스 설정

#### Supabase 사용 시:

1. **Supabase Dashboard**에서 연결 문자열 복사
2. `backend/.env` 파일 생성/수정:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="your-development-secret-key-min-32-chars"
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### 로컬 PostgreSQL 사용 시:

```env
DATABASE_URL="postgresql://[USERNAME]:[PASSWORD]@localhost:5432/exam_platform?schema=public"
JWT_SECRET="your-development-secret-key-min-32-chars"
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Step 2: 데이터베이스 마이그레이션

```bash
cd backend

# Prisma Client 생성
npx prisma generate

# 마이그레이션 적용 (개발 모드)
npx prisma migrate dev
```

### Step 3: 프론트엔드 환경 변수 설정

`frontend/client/.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 💻 실행 방법

### 방법 1: 터미널 2개 사용 (권장)

#### 터미널 1: 백엔드 실행

```bash
cd backend
npm install
npm run start:dev
```

백엔드가 `http://localhost:3001`에서 실행됩니다.

#### 터미널 2: 프론트엔드 실행

```bash
cd frontend/client
npm install
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

---

### 방법 2: 동시 실행 스크립트 (한 터미널)

프로젝트 루트에 `dev.sh` 생성:

```bash
#!/bin/bash

# 백엔드 실행 (백그라운드)
cd backend && npm run start:dev &
BACKEND_PID=$!

# 프론트엔드 실행 (백그라운드)
cd ../frontend/client && npm run dev &
FRONTEND_PID=$!

# 종료 처리
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "✅ Backend: http://localhost:3001"
echo "✅ Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all servers"

# 대기
wait
```

실행:

```bash
chmod +x dev.sh
./dev.sh
```

---

### 방법 3: npm scripts 사용 (루트 package.json)

프로젝트 루트에 `package.json` 생성:

```json
{
  "name": "exam-platform",
  "scripts": {
    "dev": "concurrently \"npm:dev:backend\" \"npm:dev:frontend\"",
    "dev:backend": "cd backend && npm run start:dev",
    "dev:frontend": "cd frontend/client && npm run dev",
    "install:all": "npm install && cd backend && npm install && cd ../frontend/client && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

설치 및 실행:

```bash
# 루트에서
npm install
npm run dev
```

---

## 📝 전체 설정 체크리스트

### 백엔드 설정

- [ ] `backend/.env` 파일 생성
- [ ] `DATABASE_URL` 설정
- [ ] `JWT_SECRET` 설정
- [ ] `CORS_ORIGIN=http://localhost:3000` 설정
- [ ] `npm install` 실행
- [ ] `npx prisma generate` 실행
- [ ] `npx prisma migrate dev` 실행

### 프론트엔드 설정

- [ ] `frontend/client/.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3001/api` 설정
- [ ] `npm install` 실행

---

## 🎯 접속 URL

### 프론트엔드
- **메인**: http://localhost:3000
- **로그인**: http://localhost:3000/login
- **시험 목록**: http://localhost:3000/exams
- **Admin**: http://localhost:3000/admin (관리자 권한 필요)

### 백엔드
- **API**: http://localhost:3001/api
- **Swagger 문서**: http://localhost:3001/api-docs

---

## 🔧 문제 해결

### 백엔드가 실행되지 않을 때

1. **포트 확인**:
   ```bash
   lsof -i :3001  # macOS
   netstat -ano | findstr :3001  # Windows
   ```

2. **환경 변수 확인**:
   ```bash
   cd backend
   cat .env  # DATABASE_URL 확인
   ```

3. **데이터베이스 연결 확인**:
   ```bash
   cd backend
   npx prisma studio  # 브라우저에서 확인
   ```

### 프론트엔드가 실행되지 않을 때

1. **포트 확인**:
   ```bash
   lsof -i :3000  # macOS
   ```

2. **환경 변수 확인**:
   ```bash
   cd frontend/client
   cat .env.local  # NEXT_PUBLIC_API_URL 확인
   ```

3. **의존성 재설치**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### CORS 오류 발생 시

`backend/.env` 확인:
```env
CORS_ORIGIN=http://localhost:3000
```

백엔드 재시작 필요

---

## 📚 유용한 명령어

### 데이터베이스 관리

```bash
# Prisma Studio (GUI)
cd backend
npx prisma studio

# 마이그레이션 생성
npx prisma migrate dev --name [migration-name]

# 스키마 동기화
npx prisma db pull

# Prisma Client 재생성
npx prisma generate
```

### 개발 도구

```bash
# 백엔드 테스트
cd backend
npm run test

# 프론트엔드 빌드 테스트
cd frontend/client
npm run build

# 프론트엔드 린트
npm run lint
```

---

## 🎨 개발 워크플로우

1. **백엔드 실행**: `cd backend && npm run start:dev`
2. **프론트엔드 실행**: `cd frontend/client && npm run dev`
3. **브라우저 접속**: http://localhost:3000
4. **코드 수정**: 파일 저장 시 자동 재시작/리로드
5. **API 테스트**: http://localhost:3001/api-docs (Swagger)

---

## ⚡ 빠른 실행 스크립트

### macOS/Linux

`dev.sh`:
```bash
#!/bin/bash
cd backend && npm run start:dev &
cd ../frontend/client && npm run dev
```

실행:
```bash
chmod +x dev.sh
./dev.sh
```

### Windows

`dev.bat`:
```batch
@echo off
start cmd /k "cd backend && npm run start:dev"
cd frontend\client
npm run dev
```

---

**작성일**: 2024년 11월 1일

