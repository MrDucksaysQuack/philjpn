# Railway 데이터베이스 연결 오류 해결

## 문제

```
PrismaClientInitializationError: Can't reach database server at `db.fzfgdayzynspcuhsqubi.supabase.co:5432`
```

Railway가 Supabase 데이터베이스에 연결하지 못함

---

## 원인 분석

### 가능한 원인

1. **환경 변수 누락 또는 잘못됨**
   - `DATABASE_URL`이 Railway에 설정되지 않음
   - 잘못된 형식의 연결 문자열

2. **Supabase 방화벽/IP 제한**
   - Supabase가 특정 IP만 허용하도록 설정됨
   - Railway의 동적 IP가 차단됨

3. **연결 문자열 형식 문제**
   - Direct connection vs Connection Pooling
   - SSL 설정 누락

4. **Prisma 초기화 타이밍 문제**
   - 서버 시작 시 즉시 연결 시도

---

## 해결 방법

### 방법 1: Railway 환경 변수 확인 (가장 중요!)

**Railway Dashboard** → **프로젝트** → **Variables** 탭:

필수 환경 변수 확인:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.fzfgdayzynspcuhsqubi.supabase.co:5432/postgres?sslmode=require
```

**중요 체크사항**:
- ✅ `DATABASE_URL` 존재 여부
- ✅ 패스워드가 올바른지
- ✅ `sslmode=require` 포함 여부
- ✅ 프로젝트 ID가 올바른지 (`fzfgdayzynspcuhsqubi`)

### 방법 2: Supabase 방화벽 설정 확인

**Supabase Dashboard** → **Settings** → **Database**:

1. **Connection Pooling** 확인
   - Transaction 모드 (권장)
   - Session 모드

2. **Connection String** 확인:
   - **Direct connection** 사용 시:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
     ```
   
   - **Connection Pooling** 사용 시:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```

3. **IP Allowlist** 확인:
   - **Settings** → **Database** → **Connection Pooling**
   - IP 제한이 있다면 Railway IP를 추가하거나 비활성화

### 방법 3: Connection Pooling 사용 (권장)

Supabase는 Railway 같은 클라우드 환경에서 Connection Pooling을 사용하는 것을 권장합니다.

**올바른 DATABASE_URL 형식**:

```env
# Connection Pooling (Transaction 모드) - 권장
DATABASE_URL=postgresql://postgres.fzfgdayzynspcuhsqubi:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

# 또는 Session 모드
DATABASE_URL=postgresql://postgres.fzfgdayzynspcuhsqubi:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**확인 방법**:
1. Supabase Dashboard → Settings → Database
2. Connection Pooling 섹션에서 연결 문자열 복사
3. Railway Variables에 붙여넣기

### 방법 4: Prisma 연결 설정 개선

Prisma 초기화 시 연결 오류를 더 잘 처리하도록 수정:

```typescript
// prisma.service.ts에 재시도 로직 추가
```

---

## 즉시 실행할 단계

### Step 1: Supabase 연결 문자열 확인

1. **Supabase Dashboard** 접속
2. **Settings** → **Database**
3. **Connection string** → **URI** 선택
4. **Connection Pooling** 섹션에서:
   - Transaction 모드 문자열 복사
   - 또는 Session 모드 문자열 복사

### Step 2: Railway 환경 변수 설정

1. **Railway Dashboard** → 프로젝트 선택
2. **Variables** 탭
3. **+ New Variable** 클릭
4. 다음 설정:
   ```
   Name: DATABASE_URL
   Value: [위에서 복사한 연결 문자열]
   ```
5. **Save** 클릭

### Step 3: Railway 재배포

1. **Deployments** 탭
2. 최신 배포 선택
3. **"..."** → **Redeploy**

또는:

```bash
git push origin main  # 자동 재배포
```

---

## DATABASE_URL 형식 가이드

### Option A: Connection Pooling (Transaction 모드) ⭐ 권장

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**예시**:
```
postgresql://postgres.fzfgdayzynspcuhsqubi:1dnjf4dlf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### Option B: Connection Pooling (Session 모드)

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
```

### Option C: Direct Connection (비권장)

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

⚠️ **주의**: Direct Connection은 연결 수 제한이 있어 프로덕션에는 부적합합니다.

---

## 연결 테스트

### 로컬에서 테스트

```bash
cd backend
# DATABASE_URL 환경 변수 설정 후
npx prisma db pull
# 또는
npx prisma studio
```

### Railway에서 확인

1. **Railway Dashboard** → **Logs** 탭
2. 서버 시작 로그 확인
3. Prisma 연결 성공 메시지 확인:
   ```
   Prisma Client initialized successfully
   ```

---

## 추가 확인사항

### 1. Supabase 프로젝트 상태

- Supabase Dashboard에서 프로젝트가 **Active** 상태인지 확인
- 프로젝트가 일시 중지되지 않았는지 확인

### 2. 비밀번호 확인

- Supabase Dashboard → Settings → Database
- Database Password 확인
- Railway의 `DATABASE_URL`에 올바른 비밀번호가 있는지 확인

### 3. SSL 설정

- `sslmode=require` 또는 `?sslmode=require` 포함 확인
- Supabase는 SSL 연결을 요구합니다

### 4. 포트 확인

- Connection Pooling: `6543` (Transaction) 또는 `5432` (Session)
- Direct Connection: `5432`

---

## 트러블슈팅

### 문제: 여전히 연결 실패

1. **Supabase 방화벽 확인**:
   - Settings → Database → Connection Pooling
   - IP Allowlist 비활성화 또는 Railway IP 추가

2. **연결 문자열 재확인**:
   - Supabase Dashboard에서 직접 복사
   - 수동 입력 시 오타 확인

3. **Railway 로그 확인**:
   - Deployments → 최신 배포 → Logs
   - 정확한 오류 메시지 확인

### 문제: 연결은 되지만 느림

- Connection Pooling 사용 권장
- Transaction 모드 사용

---

## 최종 확인 체크리스트

- [ ] Supabase Dashboard에서 연결 문자열 복사
- [ ] Railway Variables에 `DATABASE_URL` 설정
- [ ] 연결 문자열에 `sslmode=require` 포함
- [ ] Connection Pooling 사용 (포트 6543 또는 5432)
- [ ] Railway 재배포
- [ ] 로그에서 연결 성공 확인

---

**작성일**: 2024년 11월 1일

