# Railway 데이터베이스 연결 오류 즉시 해결

## 문제

```
PrismaClientInitializationError: Can't reach database server at `db.fzfgdayzynspcuhsqubi.supabase.co:5432`
```

Railway가 Supabase 데이터베이스에 연결하지 못함

---

## 즉시 해결 방법

### Step 1: Supabase 연결 문자열 확인

1. **Supabase Dashboard** 접속
   - https://supabase.com/dashboard
   - 프로젝트 선택 (`fzfgdayzynspcuhsqubi`)

2. **Settings** → **Database**

3. **Connection Pooling** 섹션에서:
   - **Transaction** 모드 선택
   - **Connection string** → **URI** 복사

**형식** (예시):
```
postgresql://postgres.fzfgdayzynspcuhsqubi:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

⚠️ **중요**: 
- Connection Pooling 사용 (포트 **6543**)
- SSL 모드 필수 (`?sslmode=require`)

### Step 2: Railway 환경 변수 설정

**Railway Dashboard** → **프로젝트** → **Variables** 탭:

1. **DATABASE_URL** 변수 확인/추가

2. **올바른 형식**으로 설정:
   ```
   postgresql://postgres.fzfgdayzynspcuhsqubi:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```

3. **Save** 클릭

### Step 3: Railway 재배포

1. **Deployments** 탭
2. 최신 배포 선택
3. **"..."** → **Redeploy**

또는 새 커밋 푸시:
```bash
git push origin main
```

---

## DATABASE_URL 형식 비교

### ❌ 잘못된 형식 (Direct Connection)

```
postgresql://postgres:1dnjf4dlf@db.fzfgdayzynspcuhsqubi.supabase.co:5432/postgres
```

**문제점**:
- Direct connection은 연결 수 제한
- 프로덕션 환경에서 불안정

### ✅ 올바른 형식 (Connection Pooling)

```
postgresql://postgres.fzfgdayzynspcuhsqubi:1dnjf4dlf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**차이점**:
- `postgres.[PROJECT-REF]` 형식
- `pooler.supabase.com` 도메인
- 포트 `6543` (Transaction 모드)
- `pgbouncer=true` 파라미터
- `sslmode=require` 필수

---

## Supabase에서 연결 문자열 복사하는 방법

1. **Supabase Dashboard** → **Settings** → **Database**

2. **Connection Pooling** 섹션:
   - **Mode**: Transaction (권장)
   - **Connection string**: URI 클릭
   - **복사** 버튼 클릭

3. **복사된 문자열 예시**:
   ```
   postgresql://postgres.fzfgdayzynspcuhsqubi:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

4. `[YOUR-PASSWORD]`를 실제 비밀번호로 교체

5. `&sslmode=require` 추가 (없다면)

---

## Railway 환경 변수 설정 체크리스트

**Variables** 탭에서 확인:

- [ ] `DATABASE_URL` 존재
- [ ] `postgres.[PROJECT-REF]` 형식 (Connection Pooling)
- [ ] 포트 `6543` 사용 (Transaction 모드)
- [ ] `pgbouncer=true` 포함
- [ ] `sslmode=require` 포함
- [ ] 비밀번호가 올바른지

**전체 예시**:
```env
DATABASE_URL=postgresql://postgres.fzfgdayzynspcuhsqubi:1dnjf4dlf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

---

## 추가 필수 환경 변수

Railway Variables에 다음도 설정:

```env
DATABASE_URL=postgresql://postgres.fzfgdayzynspcuhsqubi:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

JWT_SECRET=[강력한-랜덤-문자열-32자-이상]
JWT_EXPIRES_IN=7d

NODE_ENV=production

PORT=3001

CORS_ORIGIN=https://philjpn.vercel.app
```

---

## 연결 테스트

### Railway 로그 확인

1. **Railway Dashboard** → **Deployments** → 최신 배포
2. **Logs** 탭 확인
3. 다음 메시지 확인:
   ```
   ✅ Database connection established
   🚀 Application is running on: http://0.0.0.0:3001
   ```

### 연결 실패 시

로그에서 다음 확인:
- `DATABASE_URL`이 설정되어 있는지
- 연결 문자열 형식이 올바른지
- SSL 오류가 없는지

---

## 빠른 복사용 템플릿

Supabase에서 연결 문자열을 복사한 후:

1. Railway Variables → `DATABASE_URL` 설정
2. 비밀번호 교체: `[YOUR-PASSWORD]` → 실제 비밀번호
3. `sslmode=require` 확인 (없으면 추가)

---

## 문제 해결 체크리스트

- [ ] Supabase에서 Connection Pooling URI 복사
- [ ] Railway Variables에 `DATABASE_URL` 설정
- [ ] `sslmode=require` 포함 확인
- [ ] 포트 `6543` 확인 (Connection Pooling)
- [ ] 비밀번호 올바른지 확인
- [ ] Railway 재배포
- [ ] 로그에서 연결 성공 확인

---

**작성일**: 2024년 11월 1일

