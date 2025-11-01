# Admin 접속 가이드

## Admin 접속 방법

### 방법 1: Admin 계정으로 로그인

1. **회원가입** 또는 기존 계정으로 **로그인**
2. 로그인 후 사용자 **role을 `admin`으로 변경** (데이터베이스에서 직접 수정)

### 방법 2: 데이터베이스에서 직접 Admin 권한 부여

#### Supabase 사용 시:

1. **Supabase Dashboard** 접속
2. **Table Editor** → `User` 테이블 선택
3. 해당 사용자 행 찾기
4. `role` 컬럼을 `admin`으로 변경
5. 저장

#### SQL 직접 실행:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 방법 3: Backend API를 통해 Admin 계정 생성 (개발 환경)

Prisma Studio 사용:
```bash
cd backend
npx prisma studio
```

브라우저에서 `http://localhost:5555` 접속하여:
1. `User` 테이블 선택
2. 새 사용자 생성 또는 기존 사용자 수정
3. `role` 필드를 `admin`으로 설정

---

## Admin 기능 접근

Admin 권한이 있는 사용자는:

1. **Header에 "관리자" 링크 표시**
2. `/admin` 경로로 접근 가능:
   - Dashboard: `/admin`
   - 사용자 관리: `/admin/users`
   - 시험 관리: `/admin/exams`
   - License Key 관리: `/admin/license-keys`

---

## 권한 체크

- 모든 Admin 페이지는 `user.role === "admin"` 체크를 수행합니다
- Admin이 아닌 사용자가 접근 시 자동으로 `/login`으로 리다이렉트됩니다

---

## 빠른 테스트

1. 회원가입으로 새 계정 생성
2. Supabase에서 해당 계정의 `role`을 `admin`으로 변경
3. 로그인 후 Header에서 "관리자" 링크 확인
4. `/admin` 경로 접근 테스트

---

**주의**: 프로덕션 환경에서는 보안을 위해 Admin 권한 부여를 신중하게 관리하세요.

