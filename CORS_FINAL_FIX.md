# CORS 최종 해결 방법

## 🔥 문제 원인

1. **Railway 환경 변수가 실제로 반영되지 않음**
   - `CORS_ORIGIN` 값에 여전히 `https://railway.com`이 포함되어 있거나
   - Railway가 재배포되지 않음

2. **Vercel 프리뷰 도메인 매번 변경**
   - `https://philjpn-ipps8kz4d-kangs-projects-bf0b6774.vercel.app` (매번 다름)
   - 정적으로 추가할 수 없음

---

## ✅ 해결 방법 (코드 개선 완료)

코드를 수정하여:
1. ✅ `https://railway.com` 자동 필터링
2. ✅ Vercel 프리뷰 도메인 **동적 허용** (정규식 패턴 매칭)
3. ✅ 프로덕션에서 동적 검증 함수 사용

---

## 🚀 배포 절차

### Step 1: 코드 커밋 및 푸시

```bash
cd exam-platform
git add backend/src/main.ts
git commit -m "Fix CORS: Dynamic Vercel preview domain support + filter railway.com"
git push origin main
```

Railway가 자동으로 재배포됩니다.

### Step 2: Railway 환경 변수 확인

1. Railway Dashboard → **Variables**
2. `CORS_ORIGIN` 변수 확인
3. 값이 다음 중 하나인지 확인:
   - ✅ `https://philjpn.vercel.app`
   - ✅ `https://philjpn.vercel.app,https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app`
   - ❌ `https://railway.com` → **삭제 또는 수정**

### Step 3: Railway 수동 재배포 (선택사항)

환경 변수 수정 후:

1. Railway Dashboard → **Deployments**
2. 최신 배포 선택
3. **"..."** → **Redeploy**

---

## 📋 코드 개선 사항

### 1. `railway.com` 자동 필터링

```typescript
const origins = corsOrigin
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0 && origin !== 'https://railway.com');
```

### 2. Vercel 프리뷰 도메인 동적 허용

```typescript
const isVercelDomain = (origin: string): boolean => {
  return /^https:\/\/philjpn(-[a-z0-9-]+)?(-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
};
```

프로덕션에서 다음 패턴 모두 허용:
- `https://philjpn.vercel.app`
- `https://philjpn-XXXX-XXXX.vercel.app`
- `https://philjpn-XXXX-XXXX-XXXX.vercel.app`

### 3. 동적 검증 함수

프로덕션 환경에서는 요청마다 origin을 검증하여 Vercel 도메인을 자동으로 허용합니다.

---

## 🔍 배포 후 확인

Railway 로그에서 확인:

```
🔒 CORS 설정: 동적 검증 함수 (Vercel 프리뷰 도메인 자동 허용)
🔍 CORS_ORIGIN 환경 변수: https://philjpn.vercel.app,...
🔍 NODE_ENV: production
🚀 Application is running on: http://0.0.0.0:3001
```

---

## 💡 핵심 포인트

1. **이제 Vercel 프리뷰 도메인은 자동으로 허용됩니다**
   - 환경 변수에 추가할 필요 없음
   - 매번 바뀌는 도메인도 자동 처리

2. **`railway.com`은 자동으로 필터링됩니다**
   - 환경 변수에 있어도 무시됨

3. **Railway 환경 변수는 최소한만 설정**
   - `CORS_ORIGIN`: `https://philjpn.vercel.app` (프로덕션 도메인만)

---

**작성일**: 2024년 11월 1일

