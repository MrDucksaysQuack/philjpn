# Vercel 환경 변수 설정 가이드

## 문제

프론트엔드가 프로덕션에서 `localhost:3000`을 호출:
```
POST http://localhost:3000/api/auth/login
CORS policy: No 'Access-Control-Allow-Origin' header
```

---

## 즉시 해결 (5분)

### Step 1: Railway 백엔드 URL 확인

1. **Railway Dashboard** 접속
2. 백엔드 서비스 선택
3. **Settings** → **Networking**
4. **Public Domain** 복사
   - 예: `exam-platform-production.up.railway.app`

### Step 2: Vercel 환경 변수 설정

1. **Vercel Dashboard** → 프로젝트 `philjpn`
2. **Settings** → **Environment Variables**
3. **Add New** 클릭

#### 변수 1: NEXT_PUBLIC_API_URL

- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://[YOUR-RAILWAY-URL].railway.app/api`
  - 예: `https://exam-platform-production.up.railway.app/api`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
- **Add** 클릭

#### 변수 2: NEXT_PUBLIC_SOCKET_URL (선택)

- **Name**: `NEXT_PUBLIC_SOCKET_URL`
- **Value**: `https://[YOUR-RAILWAY-URL].railway.app`
  - 예: `https://exam-platform-production.up.railway.app`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
- **Add** 클릭

### Step 3: Vercel 재배포

1. **Deployments** 탭
2. 최신 배포 선택
3. **"..."** → **Redeploy**

또는 새 커밋 푸시:
```bash
git push origin main
```

### Step 4: Railway CORS 설정 확인

**Railway Dashboard** → Variables:

**`CORS_ORIGIN`** 환경 변수 확인:
- Value: `https://philjpn.vercel.app`
- 없으면 추가

---

## 확인 방법

배포 후 브라우저 **개발자 도구** → **Network** 탭:

### ✅ 정상:
```
Request URL: https://exam-platform-production.up.railway.app/api/auth/login
Status: 200 OK
```

### ❌ 문제:
```
Request URL: http://localhost:3000/api/auth/login
Status: CORS error 또는 ERR_FAILED
```

---

## 환경 변수 요약

### Vercel (프론트엔드)

| 변수명 | 값 | 예시 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | Railway 백엔드 URL + `/api` | `https://exam-platform.up.railway.app/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Railway 백엔드 URL | `https://exam-platform.up.railway.app` |

### Railway (백엔드)

| 변수명 | 값 | 예시 |
|--------|-----|------|
| `CORS_ORIGIN` | Vercel 프론트엔드 URL | `https://philjpn.vercel.app` |
| `DATABASE_URL` | Supabase Connection Pooling URL | `postgresql://...` |
| `JWT_SECRET` | 강력한 시크릿 키 | `...` |
| `JWT_EXPIRES_IN` | 토큰 만료 시간 | `7d` |

---

## 데이터베이스 위치

✅ **맞습니다!** 계정 정보는 **Supabase**에 저장됩니다.

- 백엔드는 Supabase PostgreSQL을 사용
- 모든 사용자 계정은 Supabase `User` 테이블에 저장
- 프로덕션과 개발 환경 모두 동일한 Supabase를 사용할 수 있음
- 또는 프로덕션용 Supabase 프로젝트 별도 생성 권장

---

**작성일**: 2024년 11월 1일

