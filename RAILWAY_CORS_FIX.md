# Railway CORS 설정 즉시 해결

## 문제

```
The 'Access-Control-Allow-Origin' header has a value 'https://railway.com' 
that is not equal to the supplied origin 'https://philjpn.vercel.app'
```

**원인**: Railway 환경 변수 `CORS_ORIGIN`이 `https://railway.com`으로 잘못 설정됨

---

## 🔥 즉시 해결 (2분)

### Step 1: Railway Dashboard 접속

1. https://railway.app 접속
2. 백엔드 서비스 선택 (philjpn)
3. **Variables** 탭 클릭

### Step 2: CORS_ORIGIN 수정

1. **`CORS_ORIGIN`** 변수 찾기
2. **Edit** 또는 **"..."** 클릭
3. **현재 값 삭제**: `https://railway.com` (잘못됨)
4. **새 값 입력**:

```
https://philjpn.vercel.app,https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app
```

이렇게 설정하면:
- ✅ 프로덕션: `https://philjpn.vercel.app`
- ✅ Preview: `https://philjpn-git-main-*.vercel.app`

5. **Save** 클릭

### Step 3: 재배포 확인

Railway가 자동으로 재배포합니다.

1. **Deployments** 탭 확인
2. 새로운 배포 시작 확인
3. 완료 대기 (약 1-2분)

---

## 올바른 CORS_ORIGIN 값

### 프로덕션 + Preview 모두:
```
https://philjpn.vercel.app,https://philjpn-git-main-kangs-projects-bf0b6774.vercel.app
```

### 프로덕션만:
```
https://philjpn.vercel.app
```

### 개발 환경 포함 (로컬 테스트):
```
https://philjpn.vercel.app,http://localhost:3000
```

---

## 확인 방법

### 방법 1: 브라우저 테스트

1. https://philjpn.vercel.app 접속
2. **F12** (개발자 도구) → **Network** 탭
3. 로그인 시도
4. `/api/auth/login` 요청 확인:
   - ✅ Status: `200 OK`
   - ✅ Response Headers에 `Access-Control-Allow-Origin: https://philjpn.vercel.app`

### 방법 2: curl 테스트

```bash
curl -I -X OPTIONS https://philjpn.railway.app/api/auth/login \
  -H "Origin: https://philjpn.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

출력에서 확인:
```
Access-Control-Allow-Origin: https://philjpn.vercel.app
```

---

## 문제 해결 체크리스트

- [ ] Railway Variables에 `CORS_ORIGIN` 존재
- [ ] 값이 `https://philjpn.vercel.app` (또는 여러 URL)
- [ ] `https://railway.com` 아님 ✅
- [ ] Railway 재배포 완료
- [ ] 브라우저에서 로그인 성공

---

## 여전히 안 되면

### 1. Railway 로그 확인

Railway Dashboard → **Deployments** → 최신 배포 → **Logs**

다음 메시지 확인:
```
🔒 CORS 설정: [ 'https://philjpn.vercel.app', ... ]
🚀 Application is running on: http://0.0.0.0:3001
```

### 2. 환경 변수 캐시 확인

Railway에서 환경 변수를 변경한 후:
- 서비스 재시작 필요할 수 있음
- Deployments → **"..."** → **Redeploy**

### 3. 브라우저 캐시 클리어

- **Ctrl+Shift+R** (강력 새로고침)
- 또는 개발자 도구 → Network → "Disable cache" 체크

---

## 백엔드 코드 개선

코드에서 CORS 설정을 개선했습니다:
- 여러 HTTP 메서드 허용
- 필요한 헤더 명시
- 디버깅 로그 추가

코드 변경 후:
```bash
cd backend
git add .
git commit -m "Improve CORS configuration"
git push origin main
```

Railway가 자동으로 재배포합니다.

---

**작성일**: 2024년 11월 1일

