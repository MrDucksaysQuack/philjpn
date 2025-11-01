# CORS 문제 본질 원인 분석

## 🔍 문제 상황

```
Access-Control-Allow-Origin header has value 'https://railway.com'
```

**핵심 질문**: 왜 여전히 `https://railway.com`이 반환되는가?

---

## 📊 가능한 원인 3가지

### 1️⃣ Railway 환경 변수가 실제로 업데이트되지 않음

**확인 방법**:
1. Railway Dashboard → **Variables** 탭
2. `CORS_ORIGIN` 변수 클릭
3. **실제 값 확인**

**예상 시나리오**:
- Dashboard에는 `https://philjpn.vercel.app`로 보이지만
- 실제 환경 변수는 `https://railway.com`으로 남아있을 수 있음

**해결**:
- 변수 **완전히 삭제** 후 재생성
- 또는 **Redeploy** 실행

---

### 2️⃣ Railway가 재배포되지 않음

**확인 방법**:
1. Railway Dashboard → **Deployments** 탭
2. 최신 배포의 **타임스탬프** 확인
3. 환경 변수 변경 시점과 비교

**예상 시나리오**:
- 환경 변수를 수정했지만
- Railway가 자동 재배포를 트리거하지 않았을 수 있음

**해결**:
- 수동 **Redeploy** 실행

---

### 3️⃣ 코드가 Railway에 배포되지 않음

**확인 방법**:
1. Railway 로그에서 디버깅 로그 확인:
   ```
   🔍 CORS 환경 변수 본질 분석
   📌 process.env.CORS_ORIGIN (값): ...
   ```
2. 이 로그가 보이지 않으면 → **코드 미배포**

**해결**:
- Git 커밋 및 푸시 확인
- Railway가 GitHub와 연결되어 있는지 확인

---

## 🔬 본질 원인 확인 절차

### Step 1: Railway 로그 확인 (가장 중요)

1. Railway Dashboard → **Deployments** → 최신 배포 → **Logs**
2. 다음 로그 찾기:
   ```
   🔍 CORS 환경 변수 본질 분석
   📌 process.env.CORS_ORIGIN (값): "???"
   ```

**확인할 내용**:
- `process.env.CORS_ORIGIN` 값이 실제로 무엇인가?
- `https://railway.com`인가? → **환경 변수 문제**
- `https://philjpn.vercel.app`인가? → **코드 문제**
- `undefined`인가? → **환경 변수 미설정**

---

### Step 2: Railway Variables 확인

1. Railway Dashboard → **Variables** 탭
2. `CORS_ORIGIN` 변수 클릭
3. **정확한 값 확인** (공백, 따옴표 등)

**예상 문제**:
```
❌ 잘못된 예:
CORS_ORIGIN = "https://railway.com"
CORS_ORIGIN = https://railway.com,https://philjpn.vercel.app (공백 문제)
```

```
✅ 올바른 예:
CORS_ORIGIN = https://philjpn.vercel.app
```

---

### Step 3: Railway 재배포

**확인**:
- Deployments 탭에서 최신 배포가 환경 변수 변경 **이후**인지 확인

**재배포**:
1. Deployments → 최신 배포 선택
2. **"..."** (우측 상단) → **Redeploy**

---

## 🎯 본질 원인 파악을 위한 로그

코드에 추가된 디버깅 로그:

```typescript
📌 process.env.CORS_ORIGIN (타입): string | undefined
📌 process.env.CORS_ORIGIN (값): JSON.stringify(...)
📌 process.env.CORS_ORIGIN (길이): 숫자
📌 config.corsOrigin: JSON.stringify(...)
📌 원본 CORS_ORIGIN 값: JSON.stringify(...)
📋 파싱된 도메인 목록: [...]
✅ 최종 허용 도메인 목록: [...]
```

**실제 요청마다**:
```
🔍 CORS 요청 수신 - Origin: https://philjpn.vercel.app
🔍 허용 목록: [...]
✅ 또는 ❌ 결과
```

---

## 🔥 확실한 해결 방법

### 방법 1: Railway Variables 완전 초기화

1. **Variables** 탭 → `CORS_ORIGIN` **완전 삭제**
2. **+ New Variable** 클릭
3. Name: `CORS_ORIGIN`
4. Value: `https://philjpn.vercel.app` (따옴표 없이)
5. **Save**
6. **Deployments** → **Redeploy**

### 방법 2: Railway CLI로 확인

```bash
railway variables
```

실제 환경 변수 값 확인 가능

---

## 📝 체크리스트

다음 순서로 확인:

1. [ ] Railway 로그에서 `process.env.CORS_ORIGIN` 실제 값 확인
2. [ ] Railway Variables에서 `CORS_ORIGIN` 값 확인
3. [ ] 환경 변수 변경 후 **Redeploy** 실행했는지 확인
4. [ ] 코드가 Git에 푸시되었는지 확인
5. [ ] Railway가 GitHub와 연결되어 있는지 확인

---

**작성일**: 2024년 11월 1일

