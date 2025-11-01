# Vercel 404 에러 해결 가이드

## 문제 상황

배포 후 `https://philjpn.vercel.app/`에서 404 에러 발생

```
404: NOT_FOUND
Code: NOT_FOUND
```

---

## 원인 분석

### ✅ 확인된 사항

1. **Root Directory**: `frontend/client` ✅ 올바름
2. **빌드 로그**: 성공 ✅
3. **page.tsx 파일**: 존재 ✅

### 🔍 가능한 원인

1. **Next.js App Router 설정 문제**
   - `app/page.tsx`는 존재하지만 빌드 출력에 반영되지 않음
   
2. **빌드 출력 디렉토리 문제**
   - Vercel이 `.next` 폴더를 찾지 못함

3. **환경 변수 누락**
   - API URL 등 필수 환경 변수 없음

---

## 해결 방법

### 방법 1: Vercel 프로젝트 설정 확인

**Vercel Dashboard** → **Settings** → **General**:

1. **Framework Preset**: `Next.js` 확인
2. **Root Directory**: `frontend/client` 확인
3. **Build Command**: `npm run build` (자동 감지)
4. **Output Directory**: 비워둠 (자동 감지)
5. **Install Command**: `npm install` (자동 감지)

### 방법 2: 빌드 명령어 명시적 설정

**Vercel Dashboard** → **Settings** → **General**:

- **Build Command**: `cd frontend/client && npm run build`
- **Output Directory**: `frontend/client/.next`

또는 `vercel.json` 파일 생성:

```json
{
  "buildCommand": "cd frontend/client && npm run build",
  "devCommand": "cd frontend/client && npm run dev",
  "installCommand": "cd frontend/client && npm install",
  "framework": "nextjs"
}
```

⚠️ **주의**: Root Directory를 `frontend/client`로 설정했다면 빌드 명령어는 `npm run build`만 필요

### 방법 3: 환경 변수 확인

**Vercel Dashboard** → **Settings** → **Environment Variables**:

필수 환경 변수:
- `NEXT_PUBLIC_API_URL` (백엔드 API URL)
- `NEXT_PUBLIC_SOCKET_URL` (WebSocket URL, 선택)

### 방법 4: 빌드 로그 확인

**Vercel Dashboard** → **Deployments** → 최신 배포 → **Build Logs**:

다음을 확인:
```
✓ Compiled successfully
✓ Generating static pages
Route (app)
┌ ○ /
```

루트 경로(`/`)가 표시되어야 함

---

## 즉시 확인할 사항

### 1. Vercel 프로젝트 설정

1. Dashboard → 프로젝트 선택
2. Settings → General
3. **Root Directory**가 `frontend/client`인지 확인
4. **Build Command** 확인

### 2. 빌드 출력 확인

최신 배포의 Build Logs에서:
```
Route (app)
┌ ○ /
```

루트 경로(`/`)가 **반드시** 나타나야 함

### 3. 재배포 시도

1. **Settings** → **General** → **Root Directory** 확인
2. **Deployments** → 최신 배포 → **"..."** → **Redeploy**

---

## 추가 확인사항

### 파일 구조 확인

```
frontend/client/
├── app/
│   ├── layout.tsx      ← 필수
│   ├── page.tsx        ← 필수 (루트 페이지)
│   └── ...
├── package.json
├── next.config.ts
└── ...
```

### 빌드 테스트

로컬에서 빌드 확인:
```bash
cd frontend/client
npm run build
```

출력에서 다음 확인:
```
Route (app)
┌ ○ /
```

---

## 빠른 수정 스크립트

프로젝트 루트에 `vercel.json` 생성 (선택사항):

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

⚠️ **중요**: Root Directory를 `frontend/client`로 설정했다면 **루트에 `vercel.json`을 만들지 마세요**. `frontend/client`에만 있어야 합니다.

---

## 문제 해결 체크리스트

- [ ] Vercel Dashboard에서 Root Directory 확인 (`frontend/client`)
- [ ] 빌드 로그에서 루트 경로(`/`) 확인
- [ ] `app/page.tsx` 파일 존재 확인
- [ ] `app/layout.tsx` 파일 존재 확인
- [ ] 환경 변수 설정 확인
- [ ] 최신 배포 재배포 시도

---

## 예상 원인

가장 가능성 높은 원인:

1. **Root Directory 설정이 잘못되었거나 재설정 필요**
2. **빌드는 성공했지만 배포된 파일이 잘못된 위치**

**즉시 확인**:
- Vercel Dashboard → Settings → General
- Root Directory 다시 확인 및 저장
- 최신 배포 재배포

---

**작성일**: 2024년 11월 1일

