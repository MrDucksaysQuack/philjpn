# Railway 500 에러 해결 가이드

## 문제
```
POST /api/auth/login → 500 Internal Server Error
```

## 가능한 원인 3가지

### 1️⃣ JWT_SECRET 환경 변수 누락

**확인 방법:**
- Railway Dashboard → Variables 탭
- `JWT_SECRET` 변수 존재 여부 확인

**해결 방법:**
```bash
JWT_SECRET=your-super-secret-key-min-32-chars
```

### 2️⃣ DATABASE_URL 연결 실패

**확인 방법:**
Railway 로그에서 다음 메시지 확인:
```
⚠️ Database connection failed (attempt X/5)
❌ Could not connect to database after all retries
```

**해결 방법:**
1. Railway Dashboard → Variables → `DATABASE_URL` 확인
2. **Connection Pooling URI 사용** (포트 6543):
   ```
   postgresql://postgres:PASSWORD@db.xxx.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
   ```
3. **Direct Connection URI 안됨** (포트 5432)

### 3️⃣ Prisma 마이그레이션 미실행

**확인 방법:**
Railway 로그에서:
```
PrismaClientKnownRequestError: Table 'User' does not exist
```

**해결 방법:**
Railway에서 다음 명령 실행 (Deploy 탭 → 설정 → Build Command):
```bash
cd backend && npx prisma generate && npx prisma migrate deploy && npm run build
```

또는 수동 실행:
```bash
npx prisma migrate deploy
npx prisma generate
```

---

## 🔍 Railway 로그 확인 방법

1. Railway Dashboard 접속
2. 프로젝트 선택
3. **Deployments** 탭 → 최신 배포 클릭
4. **Logs** 탭 확인

**찾아야 할 로그:**
- ✅ `✅ Database connection established`
- ❌ `❌ JWT_SECRET이 설정되지 않았습니다`
- ❌ `❌ Login error:`
- ❌ `Prisma error code:`

---

## ✅ 환경 변수 체크리스트

Railway Dashboard → Variables 탭에서 확인:

| 변수명 | 필수 | 예시 값 |
|--------|------|---------|
| `DATABASE_URL` | ✅ | `postgresql://...supabase.co:6543/...` |
| `JWT_SECRET` | ✅ | `your-super-secret-key` |
| `JWT_EXPIRES_IN` | ⚠️ | `7d` (기본값 있음) |
| `CORS_ORIGIN` | ✅ | `https://philjpn.vercel.app` |
| `NODE_ENV` | ⚠️ | `production` |
| `PORT` | ⚠️ | `3001` (Railway 자동 설정) |

---

## 🚀 즉시 테스트

배포 후 다음 명령으로 테스트:
```bash
curl -X POST https://philjpn-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://philjpn.vercel.app" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**예상 응답:**
- ✅ 401: `이메일 또는 비밀번호가 올바르지 않습니다` (서버 정상, 인증만 실패)
- ✅ 200: 로그인 성공
- ❌ 500: 서버 오류 (로그 확인 필요)

---

## 📝 개선 사항

코드에 추가된 에러 핸들링:
1. ✅ Try-catch로 모든 예외 처리
2. ✅ Prisma 에러 상세 로깅
3. ✅ JWT_SECRET 확인
4. ✅ 에러 스택 트레이스 출력

이제 Railway 로그에서 정확한 원인을 확인할 수 있습니다.

