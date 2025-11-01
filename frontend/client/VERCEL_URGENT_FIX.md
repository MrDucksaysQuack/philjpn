# Vercel 404 즉시 해결 (확실한 방법)

## 문제 확인

로컬 빌드: ✅ 성공 (`┌ ○ /` 경로 생성됨)
Vercel 배포: ❌ 404 에러

## 원인

Vercel이 `frontend/client` 폴더를 인식하지 못하고 루트에서 빌드를 시도하고 있음

---

## 🔥 즉시 해결 방법 (3가지 선택)

### 방법 1: Vercel 프로젝트 완전 재설정 (가장 확실)

1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **General** → 맨 아래로 스크롤
3. **Delete Project** 클릭 → 확인
4. **Add New Project** 클릭
5. GitHub 저장소 선택
6. **Configure Project**:   
   - **Root Directory**: `frontend/client` 입력
   - **Framework Preset**: `Next.js` (자동)
   - **Build Command**: 비워두기
   - **Output Directory**: 비워두기
7. **Deploy** 클릭

### 방법 2: Vercel CLI로 직접 배포

```bash
cd exam-platform/frontend/client
npm install -g vercel
vercel login
vercel --prod
```

CLI가 자동으로 설정을 감지합니다.

### 방법 3: 프로젝트 루트에 vercel.json (임시 해결책)

프로젝트 루트(`exam-platform/`)에 `vercel.json` 생성:

```json
{
  "buildCommand": "cd frontend/client && npm run build",
  "devCommand": "cd frontend/client && npm run dev",
  "installCommand": "cd frontend/client && npm install",
  "outputDirectory": "frontend/client/.next",
  "framework": "nextjs"
}
```

⚠️ 이 방법은 권장하지 않지만 임시로 작동할 수 있습니다.

---

## 확인 체크리스트

Vercel Dashboard → Settings → General:

- [ ] Root Directory = `frontend/client` (정확히, 앞뒤 공백 없음)
- [ ] Framework = `Next.js` 또는 자동 감지
- [ ] Build Command = 비워두기 또는 `npm run build`
- [ ] Output Directory = 비워두기

---

## 빌드 로그 확인 방법

Vercel Dashboard → Deployments → 최신 배포 → Build Logs

다음을 확인:
1. `Installing dependencies...`
2. `Running "npm run build"` 또는 `Building...`
3. `Route (app)`
4. `┌ ○ /` (이게 없으면 실패)

---

## 최종 해결책 (권장)

**프로젝트 삭제 후 재생성**:
- 가장 확실한 방법
- 5분 정도 소요
- 모든 설정이 깨끗하게 초기화됨

