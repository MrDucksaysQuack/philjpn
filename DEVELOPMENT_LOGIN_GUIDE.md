# 개발 환경 로그인 가이드

> **테스트 사용자와 Admin 계정으로 로그인하는 방법**

---

## 🚀 빠른 시작 (3가지 방법)

### 방법 1: 시드 스크립트 사용 (가장 쉬움) ⭐

#### Step 1: 테스트 계정 생성

```bash
cd backend
npm run seed:users
```

#### Step 2: 로그인

브라우저에서 http://localhost:3000/login 접속:

**일반 사용자**:
- Email: `user@test.com`
- Password: `password123`

**Admin 사용자**:
- Email: `admin@test.com`
- Password: `password123`

---

### 방법 2: 회원가입 후 Admin 권한 부여

#### Step 1: 회원가입

1. http://localhost:3000/register 접속
2. 새 계정 생성 (예: `myadmin@test.com` / `password123`)

#### Step 2: Admin 권한 부여

**옵션 A: Prisma Studio 사용**

```bash
cd backend
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 접속:
1. `User` 테이블 선택
2. 생성한 사용자 찾기
3. `role` 필드를 `ADMIN`으로 변경
4. 저장

**옵션 B: SQL 직접 실행**

```bash
cd backend
npx prisma db execute --stdin
```

SQL 입력:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'myadmin@test.com';
```

**옵션 C: Supabase Dashboard 사용**

1. Supabase Dashboard 접속
2. Table Editor → `User` 테이블
3. 사용자 행 선택 → `role`을 `ADMIN`으로 변경
4. 저장

---

### 방법 3: 직접 API 호출로 Admin 계정 생성

```bash
# 일반 회원가입
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "name": "Admin User",
    "phone": "010-0000-0000"
  }'

# 그 다음 Prisma Studio나 SQL로 role을 ADMIN으로 변경
```

---

## 📋 테스트 계정 목록

시드 스크립트 실행 후 사용 가능한 계정:

| 이메일 | 비밀번호 | 역할 | 설명 |
|--------|---------|------|------|
| `user@test.com` | `password123` | USER | 일반 사용자 |
| `admin@test.com` | `password123` | ADMIN | 관리자 |

---

## 🔐 Admin 접속 방법

### Step 1: Admin 계정으로 로그인

http://localhost:3000/login 접속
- Email: `admin@test.com`
- Password: `password123`

### Step 2: Admin 페이지 접근

로그인 후:
1. **Header에 "관리자" 링크 표시** (보라색)
2. 클릭하여 `/admin` 접근
3. 또는 직접 접근: http://localhost:3000/admin

### Admin 메뉴:

- **Dashboard**: http://localhost:3000/admin
- **사용자 관리**: http://localhost:3000/admin/users
- **시험 관리**: http://localhost:3000/admin/exams
- **License Key 관리**: http://localhost:3000/admin/license-keys

---

## 🔧 추가 Admin 계정 생성

### 시드 스크립트 수정

`backend/scripts/seed-users.ts` 파일 수정하여 추가 계정 생성:

```typescript
const admin2 = await prisma.user.upsert({
  where: { email: 'admin2@test.com' },
  update: {},
  create: {
    email: 'admin2@test.com',
    password: hashedPassword,
    name: '관리자 2',
    role: UserRole.ADMIN,
  },
});
```

실행:
```bash
npm run seed:users
```

---

## 🛠️ 기존 계정을 Admin으로 변경

### Prisma Studio 사용 (가장 쉬움)

```bash
cd backend
npm run prisma:studio
```

1. `User` 테이블 선택
2. 계정 찾기 (이메일로 검색)
3. `role` 필드 클릭 → `ADMIN` 선택
4. 저장

### SQL 실행

```bash
cd backend
npx prisma db execute --stdin
```

```sql
-- 특정 이메일
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';

-- 또는 모든 사용자를 Admin으로 (주의!)
UPDATE "User" SET role = 'ADMIN';
```

---

## 📝 시드 스크립트 커스터마이징

`backend/scripts/seed-users.ts` 파일을 수정하여:

1. **비밀번호 변경**:
   ```typescript
   const hashedPassword = await bcrypt.hash('my-custom-password', 10);
   ```

2. **계정 추가**:
   ```typescript
   const customUser = await prisma.user.upsert({
     where: { email: 'custom@test.com' },
     update: {},
     create: {
       email: 'custom@test.com',
       password: hashedPassword,
       name: '커스텀 사용자',
       role: UserRole.USER,
     },
   });
   ```

---

## ✅ 체크리스트

개발 환경 준비:

- [ ] 백엔드 실행 중 (`npm run start:dev`)
- [ ] 프론트엔드 실행 중 (`npm run dev`)
- [ ] 시드 스크립트 실행 (`npm run seed:users`)
- [ ] 로그인 테스트: http://localhost:3000/login
- [ ] Admin 페이지 접근 테스트: http://localhost:3000/admin

---

## 🚨 문제 해결

### "User already exists" 오류

시드 스크립트는 `upsert`를 사용하므로 안전하게 재실행 가능:
```bash
npm run seed:users  # 다시 실행해도 괜찮음
```

### Admin 권한이 적용되지 않음

1. 로그아웃 후 다시 로그인
2. 브라우저 캐시 확인 (Ctrl+Shift+R)
3. `role` 필드가 정확히 `ADMIN`인지 확인 (대소문자 구분)

### Prisma Studio 실행 오류

```bash
# Prisma Client 재생성
npx prisma generate

# 다시 실행
npm run prisma:studio
```

---

## 📚 유용한 명령어

```bash
# 시드 스크립트 실행
cd backend && npm run seed:users

# Prisma Studio 실행
cd backend && npm run prisma:studio

# 데이터베이스 리셋 (주의: 모든 데이터 삭제)
cd backend && npx prisma migrate reset

# 마이그레이션 후 시드 다시 실행
cd backend && npx prisma migrate dev && npm run seed:users
```

---

**작성일**: 2024년 11월 1일

