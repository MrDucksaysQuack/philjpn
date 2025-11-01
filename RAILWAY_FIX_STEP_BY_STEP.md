# Railway 데이터베이스 연결 즉시 해결 (단계별)

## 현재 문제

Railway가 여전히 **Direct Connection** (`db.fzfgdayzynspcuhsqubi.supabase.co:5432`)을 사용하고 있습니다.

**에러 메시지**:
```
Can't reach database server at `db.fzfgdayzynspcuhsqubi.supabase.co:5432`
```

---

## 해결 방법 (3단계)

### ✅ Step 1: Supabase에서 올바른 연결 문자열 가져오기

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 `fzfgdayzynspcuhsqubi` 선택
postgresql://postgres:[YOUR_PASSWORD]@db.fzfgdayzynspcuhsqubi.supabase.co:5432/postgres


2. **Settings** → **Database** 클릭

3. **Connection Pooling** 섹션 찾기

4. **Connection string** 드롭다운에서 **URI** 선택

5. **Mode** 확인:
   - ✅ **Transaction** 선택 (권장)
   - 또는 **Session** 선택

6. **복사 버튼** 클릭

7. **복사된 문자열 예시**:
   ```
   postgresql://postgres.fzfgdayzynspcuhsqubi:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

8. **비밀번호 교체**:
   - `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체 (예: `1dnjf4dlf`)

9. **SSL 모드 추가**:
   - 끝에 `&sslmode=require` 추가

**최종 형식**:
```
postgresql://postgres.fzfgdayzynspcuhsqubi:1dnjf4dlf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

---

### ✅ Step 2: Railway 환경 변수 수정

1. **Railway Dashboard** 접속
   - https://railway.app
   - 프로젝트 선택

2. **Variables** 탭 클릭

3. **`DATABASE_URL`** 찾기:
   - 이미 있으면 **편집** 버튼 클릭
   - 없으면 **+ New Variable** 클릭

4. **변수 설정**:
   - **Name**: `DATABASE_URL`
   - **Value**: Step 1에서 준비한 전체 문자열 붙여넣기

5. **Save** 클릭

---

### ✅ Step 3: Railway 재배포

**방법 1: 수동 재배포** (즉시)
1. Railway Dashboard → **Deployments** 탭
2. 최신 배포 선택
3. **"..."** (오른쪽 상단) → **Redeploy** 클릭

**방법 2: 자동 재배포** (추천)
```bash
cd exam-platform
git add .
git commit -m "Update Railway database connection"
git push origin main
```

---

## 확인 사항 체크리스트

수정 전 (`DATABASE_URL`):
```
❌ postgresql://postgres:1dnjf4dlf@db.fzfgdayzynspcuhsqubi.supabase.co:5432/postgres
```

수정 후 (`DATABASE_URL`):
```
✅ postgresql://postgres.fzfgdayzynspcuhsqubi:1dnjf4dlf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**차이점 확인**:
- [x] `postgres.fzfgdayzynspcuhsqubi` (`.` 포함)
- [x] `pooler.supabase.com` (pooler 사용)
- [x] 포트 `6543` (Connection Pooling)
- [x] `?pgbouncer=true` 포함
- [x] `&sslmode=require` 포함

---

## 재배포 후 로그 확인

1. Railway Dashboard → **Deployments** → 최신 배포
2. **Logs** 탭 확인
3. 다음 메시지 확인:
   ```
   ✅ Database connection established
   🚀 Application is running on: http://0.0.0.0:3001
   ```

---

## 여전히 안 되면

### 문제 1: Supabase에서 Connection Pooling을 찾을 수 없음

**해결**:
1. Supabase Dashboard → **Settings** → **Database**
2. **Connection Pooling** 섹션이 없다면:
   - Supabase 프로젝트가 활성화되어 있는지 확인
   - 무료 플랜도 Connection Pooling 지원

### 문제 2: 포트 6543에 연결할 수 없음

**해결**:
- **Session 모드** 사용 (포트 5432):
  ```
  postgresql://postgres.fzfgdayzynspcuhsqubi:1dnjf4dlf@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
  ```

### 문제 3: 비밀번호를 모름

**해결**:
1. Supabase Dashboard → **Settings** → **Database**
2. **Database Password** 섹션
3. **Reset database password** 클릭
4. 새 비밀번호 설정
5. Railway Variables에 새 비밀번호로 업데이트

---

## 빠른 복사용 템플릿

Supabase에서 복사한 후, 다음 형식으로 수정:

```
postgresql://postgres.fzfgdayzynspcuhsqubi:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**[비밀번호]** 부분만 실제 비밀번호로 교체하세요.

---

**작성일**: 2024년 11월 1일

