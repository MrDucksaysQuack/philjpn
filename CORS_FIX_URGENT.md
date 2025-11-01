# CORS 오류 즉시 해결

## 현재 문제

```
Access-Control-Allow-Origin header has a value 'https://railway.com' 
that is not equal to the supplied origin
```

**원인**: Railway의 `CORS_ORIGIN` 환경 변수가 잘못 설정됨

---

## 즉시 해결 (2단계)

### Step 1: Railway CORS_ORIGIN 수정

1. **Railway Dashboard** 접속: https://railway.app
2. 백엔드 서비스 선택
3. **Variables** 탭 클릭
4. **`CORS_ORIGIN`** 찾기 → **편집** 클릭

#### 현재 값 (잘못됨):
```
https://railway.com
```

#### 올바른 값으로 변경:

**옵션 1: Vercel 프로덕션 URL만** (권장)
```
https://philjpn.vercel.app
```

**옵션 2: 여러 URL 지원** (Preview 배포 포함)
```
https://philjpn.vercel.app,https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app
```

**옵션 3: 모든 Vercel 도메인** (개발용만)
```
*.vercel.app
```
⚠️ 이 방법은 정확한 도메인 목록보다 덜 안전할 수 있음

5. **Save** 클릭

### Step 2: Railway 재배포

Railway가 자동으로 재배포합니다.

재배포 확인:
1. **Deployments** 탭
2. 새로운 배포가 시작되는지 확인
3. 완료 대기 (약 1-2분)

---

## 확인 방법

배포 완료 후:

1. 브라우저에서 https://philjpn.vercel.app 접속
2. **개발자 도구** (F12) → **Network** 탭
3. 로그인 시도
4. `/api/auth/login` 요청 확인:
   - ✅ Status: `200 OK`
   - ✅ CORS 오류 없음

---

## CORS_ORIGIN 값 형식

### 단일 도메인:
```
https://philjpn.vercel.app
```

### 여러 도메인 (쉼표로 구분):
```
https://philjpn.vercel.app,https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app
```

### 백엔드 코드 확인:

`backend/src/main.ts`:
```typescript
const corsOrigin = process.env.CORS_ORIGIN || config.corsOrigin || '*';
app.enableCors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(','), // 쉼표로 분리
  credentials: true,
});
```

쉼표로 구분된 여러 도메인을 지원합니다.

---

## 체크리스트

- [ ] Railway Variables에 `CORS_ORIGIN` 존재
- [ ] 값이 `https://philjpn.vercel.app` (또는 Vercel URL 목록)
- [ ] `https://railway.com` 아님 ✅
- [ ] Railway 재배포 완료
- [ ] 브라우저에서 로그인 테스트 성공

---

## 빠른 복사용

Railway Variables → `CORS_ORIGIN`:

```
https://philjpn.vercel.app,https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app
```

이렇게 설정하면 프로덕션과 Preview 배포 모두에서 작동합니다.

---

**작성일**: 2024년 11월 1일

