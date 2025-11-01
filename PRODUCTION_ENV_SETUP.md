# 프로덕션 환경 변수 설정 가이드

## 현재 문제

프론트엔드가 프로덕션에서도 `localhost:3000`을 호출하고 있음:
```
POST http://localhost:3000/api/auth/login
```

**원인**: Vercel 환경 변수가 설정되지 않음

---

## 즉시 해결 방법

### Step 1: Vercel 환경 변수 설정

1. **Vercel Dashboard** 접속: https://vercel.com/dashboard
2. 프로젝트 `philjpn` 선택
3. **Settings** → **Environment Variables**

#### 필수 환경 변수 추가:

**`NEXT_PUBLIC_API_URL`**
- Value: `https://philjpn.railway.app/api`
- 예시: `https://exam-platform-production.up.railway.app/api`
- Environments: Production, Preview, Development 모두 체크

**`NEXT_PUBLIC_SOCKET_URL`** (선택사항)
- Value: `https://philjpn.railway.app`
- 예시: `https://exam-platform-production.up.railway.app`
- Environments: Production, Preview, Development 모두 체크

4. **Save** 클릭

### Step 2: Railway 환경 변수 확인

1. **Railway Dashboard** 접속
2. 백엔드 서비스 선택
3. **Variables** 탭

#### 필수 환경 변수 확인:

**`CORS_ORIGIN`**
- Value: `https://philjpn.vercel.app`
- 또는 여러 도메인: `https://philjpn.vercel.app,https://www.yourdomain.com`

**`DATABASE_URL`**
- Supabase Connection Pooling URL 확인
postgresql://postgres:RldRkd4ro!!@db.fzfgdayzynspcuhsqubi.supabase.co:5432/postgres

**`JWT_SECRET`**
- 강력한 시크릿 키 확인

**`JWT_EXPIRES_IN`**
- 예: `7d`

**`PORT`**
- Railway는 자동 할당하지만, 필요시 `3001` 설정

### Step 3: 재배포

**Vercel**:
1. **Deployments** → 최신 배포
2. **"..."** → **Redeploy**

또는 새 커밋 푸시:
```bash
git push origin main
```

**Railway**:
- 환경 변수 변경 시 자동 재배포

---

## 환경 변수 체크리스트

### Vercel (프론트엔드)

- [ ] `NEXT_PUBLIC_API_URL` = `https://[RAILWAY-URL]/api`
- [ ] `NEXT_PUBLIC_SOCKET_URL` = `https://[RAILWAY-URL]` (선택)

### Railway (백엔드)

- [ ] `CORS_ORIGIN` = `https://philjpn.vercel.app`
- [ ] `DATABASE_URL` = Supabase Connection Pooling URL
- [ ] `JWT_SECRET` = 강력한 시크릿 키
- [ ] `JWT_EXPIRES_IN` = `7d`
- [ ] `NODE_ENV` = `production`

---

## Railway URL 확인 방법

1. **Railway Dashboard** → 백엔드 서비스
2. **Settings** → **Networking**
3. **Public Domain** 또는 **Custom Domain** 확인
4. 예시: `exam-platform-production.up.railway.app`

---

## 확인 사항

### 데이터베이스

✅ **맞습니다!** 계정 정보는 **Supabase**에 저장됩니다.

- 백엔드가 Supabase PostgreSQL 데이터베이스를 사용
- 모든 사용자 계정은 Supabase의 `User` 테이블에 저장
- 로컬에서 `npm run seed:users`를 실행하면 로컬/Supabase DB에 생성됨

### 프로덕션에 Admin 계정 생성

Supabase Dashboard에서 직접 생성:
1. Supabase Dashboard 접속
2. Table Editor → `User` 테이블
3. Insert row 클릭
4. Admin 계정 생성

---

## 빠른 확인

배포 후 브라우저 콘솔 확인:
- ❌ `http://localhost:3000/api/...` → 환경 변수 미설정
- ✅ `https://[RAILWAY-URL]/api/...` → 환경 변수 설정됨

---

**작성일**: 2024년 11월 1일

