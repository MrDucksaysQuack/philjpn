# Vercel 404 에러 즉시 해결 가이드

## 현재 상태 확인

✅ 로컬 빌드: 성공
✅ 루트 페이지 (`app/page.tsx`): 존재
✅ 루트 경로 생성: 확인됨 (`┌ ○ /`)

## 가능한 원인 및 해결

### 1️⃣ Vercel Root Directory 재설정 (가장 가능성 높음)

**Vercel Dashboard**에서:

1. **프로젝트** 선택
2. **Settings** → **General**
3. **Root Directory** 확인:
   - 현재 값 확인
   - **삭제** (비워두기) → **Save**
   - 다시 `frontend/client` 입력 → **Save**
4. **Deployments** → 최신 배포 → **"..."** → **Redeploy**

### 2️⃣ 빌드 명령어 명시적 설정

**Settings** → **General**:

- **Build Command**: `npm run build` 또는 `cd frontend/client && npm run build`
- **Output Directory**: 비워두기 (자동 감지)
- **Install Command**: `npm install` 또는 `cd frontend/client && npm install`

### 3️⃣ 프로젝트 연결 확인

**Settings** → **Git**:
- GitHub 저장소가 올바르게 연결되어 있는지 확인
- 브랜치가 `main`인지 확인

### 4️⃣ 환경 변수 확인

**Settings** → **Environment Variables**:

필수 변수 확인:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
```

---

## 빠른 해결 (권장)

### Step 1: Root Directory 확인

Vercel Dashboard → Settings → General
- Root Directory: `frontend/client` ✅

### Step 2: 최신 커밋 푸시

```bash
cd exam-platform
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### Step 3: 자동 배포 확인

Vercel이 자동으로 새 배포를 시작합니다.

### Step 4: 빌드 로그 확인

Deployments → 최신 배포 → Build Logs

확인 사항:
```
✓ Compiled successfully
Route (app)
┌ ○ /
```

---

## 임시 해결책

만약 여전히 404가 발생한다면:

1. **새 프로젝트로 재배포**:
   - 기존 프로젝트 삭제
   - 새로 Import (GitHub에서)
   - Root Directory: `frontend/client` 설정

2. **빌드 로그 공유**:
   - Build Logs 전체 내용 확인
   - 에러 메시지 확인

---

## 확인 체크리스트

빠른 점검:

- [ ] Root Directory = `frontend/client`
- [ ] Build Command = `npm run build` 또는 비워두기
- [ ] 빌드 로그에 `┌ ○ /` 표시됨
- [ ] 환경 변수 설정됨
- [ ] 최신 커밋 푸시됨

---

**중요**: 로컬 빌드는 성공하고 있으므로, 문제는 Vercel 설정일 가능성이 높습니다.

