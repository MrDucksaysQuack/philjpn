# 테스트 계정 정보 가이드

## 현재 상태

### 개발 환경 (로컬)

| 이메일 | 비밀번호 | 역할 |
|--------|---------|------|
| `user@test.com` | `password123` | user |
| `admin@test.com` | `password123` | admin |

**위치**: 로컬 데이터베이스에만 존재

### 프로덕션 환경 (배포된 서버)

❌ **현재 프로덕션에는 테스트 계정이 없습니다**

---

## 생성 방법

### 개발 환경에서 생성

```bash
cd backend
npm run seed:users
```

이 명령은 로컬 데이터베이스에만 테스트 계정을 생성합니다.

---

## 프로덕션에 테스트 계정 추가하는 방법

### 방법 1: Railway에서 직접 실행 (권장하지 않음 ⚠️)

```bash
# Railway Dashboard → 해당 서비스 → Deployments → Shell 열기
cd backend
npm run seed:users
```

⚠️ **보안 경고**: 프로덕션에 테스트 계정을 생성하는 것은 보안상 권장하지 않습니다.

### 방법 2: 프로덕션용 Admin 계정 별도 생성 (권장 ✅)

#### Supabase Dashboard 사용:

1. Supabase Dashboard 접속
2. Table Editor → `User` 테이블
3. "Insert row" 클릭
4. 다음 입력:
   - `email`: `admin@yourdomain.com`
   - `password`: 해시된 비밀번호 (bcrypt)
   - `name`: 관리자 이름
   - `role`: `admin`
   - `isActive`: `true`
   - `isEmailVerified`: `true` (또는 `false`)

#### SQL 직접 실행:

```sql
-- 비밀번호 해시 생성 필요 (로컬에서)
-- bcrypt.hash('your-secure-password', 10) 실행 결과 사용

INSERT INTO "User" (email, password, name, role, "isActive", "isEmailVerified")
VALUES (
  'admin@yourdomain.com',
  '$2b$10$...', -- 해시된 비밀번호
  'Admin User',
  'admin',
  true,
  true
);
```

---

## 보안 권장사항

### ❌ 하지 말아야 할 것

1. **프로덕션에 테스트 계정 생성**
   - `user@test.com`, `admin@test.com` 같은 테스트 계정
   - 예측 가능한 비밀번호 (`password123`)

2. **시드 스크립트를 프로덕션에서 실행**
   - 개발 전용 스크립트이므로 프로덕션에서 실행하면 안 됨

### ✅ 해야 할 것

1. **실제 Admin 계정 생성**
   - 강력한 이메일 사용
   - 강력한 비밀번호 설정
   - 비밀번호는 bcrypt로 해시

2. **개발과 프로덕션 분리**
   - 개발: 테스트 계정 사용 OK
   - 프로덕션: 실제 관리자 계정만 사용

---

## 비밀번호 해시 생성 방법

### Node.js 스크립트:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(hash => console.log(hash));"
```

### 또는 임시 스크립트 생성:

`backend/scripts/hash-password.ts`:
```typescript
import * as bcrypt from 'bcrypt';

const password = process.argv[2] || 'password123';
bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
});
```

실행:
```bash
cd backend
npx ts-node scripts/hash-password.ts "your-secure-password"
```

---

## 프로덕션 Admin 계정 생성 가이드

### 1단계: 비밀번호 해시 생성

로컬에서:
```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_SECURE_PASSWORD', 10).then(hash => console.log(hash));"
```

출력된 해시 복사 (예: `$2b$10$...`)

### 2단계: Supabase에서 계정 생성

**옵션 A: SQL 실행**

Supabase Dashboard → SQL Editor:
```sql
INSERT INTO "User" (
  email,
  password,
  name,
  role,
  "isActive",
  "isEmailVerified",
  "createdAt",
  "updatedAt"
)
VALUES (
  'admin@yourdomain.com',
  '$2b$10$YOUR_HASHED_PASSWORD_HERE',
  'Administrator',
  'admin',
  true,
  true,
  NOW(),
  NOW()
);
```

**옵션 B: Table Editor 사용**

1. Table Editor → `User` 테이블
2. "Insert row" 클릭
3. 수동으로 입력 (비밀번호는 해시된 값 필요)

---

## 요약

### 개발 환경
- ✅ 테스트 계정 사용 가능
- ✅ `npm run seed:users`로 생성
- ✅ `user@test.com` / `admin@test.com`

### 프로덕션 환경
- ❌ 테스트 계정 없음 (현재)
- ❌ 시드 스크립트 실행 금지
- ✅ 실제 Admin 계정 별도 생성 필요
- ✅ 강력한 비밀번호 사용

---

**작성일**: 2024년 11월 1일

