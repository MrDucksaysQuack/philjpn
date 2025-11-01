# Vercel 404 에러 - Root Directory 문제 해결

## 문제

Vercel에서 모든 페이지가 404 에러 발생
- `/` → 404
- `/favicon.ico` → 404

파일은 모두 존재하지만 Vercel이 인식하지 못함

## 원인

**Vercel의 Root Directory 설정 문제**가 가장 가능성 높음

---

## 즉시 해결 방법

### Step 1: Vercel 프로젝트 설정 확인

1. **Vercel Dashboard** 접속
2. 프로젝트 선택
3. **Settings** → **General** 클릭

### Step 2: Root Directory 확인 및 수정

**현재 설정 확인**:
- Root Directory: `frontend/client` ✅ (이미 올바름)

**문제가 있다면**:
1. Root Directory를 **삭제** (비워두기)
2. **Save** 클릭
3. 다시 `frontend/client` 입력
4. **Save** 클릭

### Step 3: Build Settings 확인

**Settings** → **General**:

- **Framework Preset**: `Next.js` (자동 감지)
- **Build Command**: **비워두기** (자동 감지) 또는 `npm run build`
- **Output Directory**: **비워두기** (자동 감지)
- **Install Command**: **비워두기** (자동 감지) 또는 `npm install`
- **Root Directory**: `frontend/client`

### Step 4: 재배포

1. **Deployments** 탭
2. 최신 배포 선택
3. **"..."** → **Redeploy**

또는:
```bash
git add .
git commit -m "Fix Vercel root directory"
git push origin main
```

---

## 추가 확인사항

### 1. package.json 위치

`package.json`이 `frontend/client/` 폴더에 있는지 확인:
```
exam-platform/
└── frontend/
    └── client/
        ├── package.json ✅
        ├── next.config.ts ✅
        ├── app/
        │   ├── page.tsx ✅
        │   └── layout.tsx ✅
        └── ...
```

### 2. vercel.json 제거

**중요**: `vercel.json` 파일이 있으면 **삭제**하세요.

Vercel은 Next.js를 자동 감지하므로 `vercel.json`이 오히려 문제를 일으킬 수 있습니다.

확인:
```bash
cd frontend/client
rm -f vercel.json
```

### 3. 빌드 테스트

로컬에서 빌드 테스트:
```bash
cd frontend/client
npm run build
```

성공하면 다음 확인:
```
Route (app)
┌ ○ /
```

루트 경로(`/`)가 표시되어야 함

---

## 체크리스트

Vercel Dashboard에서 확인:

- [ ] Root Directory = `frontend/client` (정확히)
- [ ] Build Command = 비워두기 또는 `npm run build`
- [ ] Output Directory = 비워두기
- [ ] Framework Preset = `Next.js`
- [ ] `vercel.json` 파일 없음
- [ ] `package.json`이 `frontend/client/`에 있음
- [ ] `app/page.tsx` 파일 존재
- [ ] `app/layout.tsx` 파일 존재

---

## 문제가 계속되면

### 방법 1: 새 프로젝트로 재연결

1. 기존 Vercel 프로젝트 삭제
2. GitHub 저장소에서 새로 Import
3. Root Directory를 `frontend/client`로 설정
4. 자동 배포 확인

### 방법 2: 수동 빌드 로그 확인

1. **Deployments** → 최신 배포 → **Build Logs**
2. 다음 확인:
   - `Installing dependencies...`
   - `Running "npm run build"`
   - `✓ Compiled successfully`
   - `Route (app)`
   - `┌ ○ /`

### 방법 3: Vercel CLI로 배포

```bash
cd frontend/client
npx vercel --prod
```

---

## 빠른 복구

만약 모든 것이 올바르게 설정되어 있다면:

1. **Root Directory 삭제 후 다시 입력**
2. **최신 커밋 푸시**로 자동 재배포
3. **빌드 로그 확인**

---

**작성일**: 2024년 11월 1일

