# 🚨 Railway 데이터베이스 연결 실패 - 긴급 해결

## 문제 확인
로그에서 확인된 오류:
```
Can't reach database server at db.fzfgdayzynspcuhsqubi.supabase.co:5432
```

**원인**: Direct Connection URI (포트 5432) 사용 중 → **불안정하고 연결 실패**

---

## ✅ 즉시 해결 방법

### Step 1: Supabase에서 Connection Pooling URI 가져오기

1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. **Settings** → **Database** 클릭
4. **Connection Pooling** 섹션 확인
5. **Connection string** → **Transaction mode** 또는 **Session mode** 선택
6. URI 복사 (형식: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres?pgbouncer=true&sslmode=require`)

### Step 2: Railway 환경 변수 업데이트

1. Railway Dashboard 접속: https://railway.app
2. 백엔드 서비스 선택
3. **Variables** 탭 클릭
4. **`DATABASE_URL`** 변수 찾기
5. **Edit** 클릭
6. **현재 값 삭제** (포트 5432인 경우)
7. **새 값 입력** (Connection Pooling URI, 포트 6543):
   ```
   postgresql://postgres:[YOUR_PASSWORD]@db.fzfgdayzynspcuhsqubi.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
   ```
   ⚠️ `[YOUR_PASSWORD]`를 실제 Supabase 비밀번호로 교체
8. **Save** 클릭

### Step 3: 재배포 대기

Railway가 자동으로 재배포합니다 (약 1-2분)

---

## 🔍 Connection Pooling URI 형식

### 올바른 형식 (포트 6543):
```
postgresql://postgres:PASSWORD@db.xxx.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
```

### 잘못된 형식 (포트 5432):
```
postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres
```

---

## 📝 Supabase 비밀번호 찾기

비밀번호를 모르는 경우:
1. Supabase Dashboard → **Settings** → **Database**
2. **Database password** 섹션
3. **Reset database password** 클릭하여 새 비밀번호 생성
4. 새 비밀번호로 `DATABASE_URL` 업데이트

---

## ✅ 확인 방법

배포 완료 후 Railway 로그에서:
- ✅ `✅ Database connection established` 확인
- ❌ `⚠️ Database connection failed` 없어야 함

또는 직접 테스트:
```bash
curl -X POST https://philjpn-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://philjpn.vercel.app" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**예상 응답:**
- ✅ 401: 인증 실패 (서버 정상, 사용자 정보만 문제)
- ❌ 400: DB 연결 오류 (여전히 DATABASE_URL 문제)

---

## 🔧 추가 체크리스트

Railway Variables에서 확인:
- ✅ `DATABASE_URL`: 포트 **6543** 사용
- ✅ `JWT_SECRET`: 설정됨
- ✅ `CORS_ORIGIN`: `https://philjpn.vercel.app` 포함

---

## 💡 왜 포트 6543인가?

- **포트 5432**: Direct Connection - 연결 수 제한, 불안정
- **포트 6543**: Connection Pooling - 연결 풀링, 안정적, 프로덕션 권장

Supabase는 프로덕션 환경에서 **반드시 Connection Pooling**을 사용해야 합니다.

