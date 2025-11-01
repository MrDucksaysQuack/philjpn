# Railway CORS 여전히 안 될 때 완전 해결

## 문제 증상

수정했는데도 여전히:
```
Access-Control-Allow-Origin header has value 'https://railway.com'
```

---

## 🔍 확인해야 할 것들

### 1. Railway 환경 변수가 실제로 저장되었는지

1. Railway Dashboard → Variables
2. `CORS_ORIGIN` 변수 클릭
3. **값 확인**:
   - ❌ `https://railway.com` → 다시 수정 필요
   - ✅ `https://philjpn.vercel.app,...` → 저장됨

### 2. Railway 재배포 확인

**Deployments** 탭:
- 최신 배포가 환경 변수 변경 **이후**에 시작되었는지 확인
- "Redeploying..." 또는 "Deploying..." 상태가 아니라면 수동 재배포 필요

### 3. 수동 재배포

1. **Deployments** 탭
2. 최신 배포 선택
3. **"..."** (오른쪽 상단) → **Redeploy**

---

## 🔥 강제 해결 방법

### 방법 1: 환경 변수 삭제 후 재생성

1. Railway Variables → `CORS_ORIGIN`
2. **Delete** 클릭
3. **+ New Variable** 클릭
4. Name: `CORS_ORIGIN`
5. Value: `https://philjpn.vercel.app,https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app`
6. **Save**
7. **수동 재배포** (Deployments → Redeploy)

### 방법 2: 코드에 하드코딩 (임시)

`backend/src/main.ts`:
```typescript
app.enableCors({
  origin: [
    'https://philjpn.vercel.app',
    'https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app',
    'http://localhost:3000', // 개발용
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-License-Key'],
});
```

⚠️ 임시 해결책이지만 확실히 작동합니다.

### 방법 3: Railway 서비스 재시작

1. Railway Dashboard → Settings
2. **Delete Service** (주의!)
3. 새로 생성 또는 자동 복구 대기

---

## 📝 체크리스트

- [ ] Railway Variables에 `CORS_ORIGIN` 존재
- [ ] 값이 `https://philjpn.vercel.app,...` (정확히)
- [ ] `https://railway.com` 아님
- [ ] 환경 변수 변경 후 **수동 재배포** 완료
- [ ] 배포 완료 확인 (약 2-3분)
- [ ] 브라우저 강력 새로고침 (Ctrl+Shift+R)

---

## Extension 오류 (무시해도 됨)

```
utils.js:1 Failed to load resource: net::ERR_FILE_NOT_FOUND
heuristicsRedefinitions.js:1 Failed to load resource
```

이는 **크롬 확장 프로그램** 관련 오류입니다.
- 실제 애플리케이션 동작에는 영향 없음
- 무시해도 됨
- 개발자 도구에서 확장 프로그램 비활성화 가능

---

## 최종 확인

배포 완료 후 Railway 로그 확인:

1. **Deployments** → 최신 배포 → **Logs**
2. 다음 메시지 확인:
   ```
   🔒 CORS 설정: [ 'https://philjpn.vercel.app', ... ]
   🚀 Application is running on: http://0.0.0.0:3001
   ```

---

**작성일**: 2024년 11월 1일

