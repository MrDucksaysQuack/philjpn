# Railway CORS + Request Abort 해결

## 현재 문제

1. **CORS 헤더 없음**: `No 'Access-Control-Allow-Origin' header is present`
2. **요청 중단**: `request aborted` 에러
3. **DB 연결 실패**: `Continuing without database connection`

---

## ✅ 해결 방법 (2단계)

### Step 1: DATABASE_URL 수정 (가장 중요!)

**로그 확인:**
```
Can't reach database server at db.fzfgdayzynspcuhsqubi.supabase.co:5432
```

**문제**: 포트 5432 (Direct Connection) 사용 중

**해결**:
1. Railway Dashboard → Variables → `DATABASE_URL`
2. **포트 6543**으로 변경 (Connection Pooling):
   ```
   postgresql://postgres:[PASSWORD]@db.fzfgdayzynspcuhsqubi.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
   ```
3. Supabase Dashboard → Settings → Database → Connection Pooling에서 URI 복사

### Step 2: CORS 헤더 확인 (코드 개선 완료)

이미 응답 인터셉터 추가됨:
- ✅ 요청 시작 시 CORS 헤더 설정
- ✅ 응답 전송 전 재확인
- ✅ 상세 로깅

---

## 🔍 확인할 로그

배포 후 Railway 로그에서 확인:

### ✅ 성공 시:
```
🔍 [POST] /api/auth/login - Origin: https://philjpn.vercel.app
✅ CORS 헤더 설정: https://philjpn.vercel.app
✅ Database connection established
```

### ❌ 실패 시:
```
⚠️ Database connection failed
❌ CORS 차단: ...
```

---

## 📝 체크리스트

1. ✅ `DATABASE_URL`: 포트 **6543** 사용
2. ✅ `JWT_SECRET`: 설정됨
3. ✅ `CORS_ORIGIN`: `https://philjpn.vercel.app` 포함
4. ✅ Railway 재배포 완료
5. ✅ 로그 확인: `✅ Database connection established`

---

## 🚀 테스트

배포 완료 후:
```bash
curl -X POST https://philjpn-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://philjpn.vercel.app" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**예상 응답:**
- ✅ 200: 로그인 성공
- ✅ 401: 인증 실패 (서버 정상)
- ❌ 400: DB 연결 오류 (DATABASE_URL 확인 필요)
- ❌ CORS 에러: 로그 확인 필요

---

## 💡 Request Aborted 원인

`request aborted` 에러는 보통:
1. **DB 연결 실패** → 응답 지연 → 타임아웃
2. **CORS 헤더 없음** → 브라우저가 요청 취소
3. **네트워크 문제** → 연결 끊김

**해결**: DATABASE_URL을 Connection Pooling URI로 변경하면 대부분 해결됩니다.

