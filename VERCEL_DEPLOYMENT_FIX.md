# Vercel 배포 오류 해결

## 문제

```
sh: line 1: cd: frontend/client: No such file or directory
Error: Command "cd frontend/client && npm install" exited with 1
```

Vercel이 `frontend/client` 디렉토리를 찾지 못함

---

## 해결 방법

### 방법 1: Vercel Dashboard에서 Root Directory 설정 (권장)

1. **Vercel Dashboard** 접속
2. 프로젝트 선택
3. **Settings** → **General**
4. **Root Directory** 섹션:
   - **"Edit"** 클릭
   - `frontend/client` 입력
   - **Save** 클릭
5. **Build Command** 확인:
   - 비워두기 (자동 감지) 또는 `npm run build`
6. **Output Directory** 확인:
   - 비워두기 (자동 감지)
7. **Install Command** 확인:
   - 비워두기 (자동 감지) 또는 `npm install`

### 방법 2: vercel.json 제거

프로젝트 루트의 `vercel.json` 파일이 있다면 **삭제**하세요.

Vercel Dashboard에서 Root Directory를 설정하면 `vercel.json`이 필요 없습니다.

### 방법 3: 새 커밋 푸시

```bash
cd exam-platform
git add .
git commit -m "Remove vercel.json, configure root directory in dashboard"
git push origin main
```

---

## 확인 사항

### GitHub 저장소 구조 확인

GitHub 저장소에서 다음 구조를 확인하세요:

```
exam-platform/
├── backend/
│   ├── package.json
│   └── ...
├── frontend/
│   └── client/
│       ├── package.json
│       ├── app/
│       └── ...
└── ...
```

**중요**: `frontend/client/` 폴더와 `frontend/client/package.json`이 GitHub에 커밋되어 있어야 합니다.

---

## 빠른 체크리스트

Vercel Dashboard 설정:

- [ ] **Root Directory**: `frontend/client` (정확히)
- [ ] **Framework Preset**: `Next.js` (자동)
- [ ] **Build Command**: 비워두기
- [ ] **Output Directory**: 비워두기
- [ ] **Install Command**: 비워두기
- [ ] 프로젝트 루트에 `vercel.json` 없음

---

## 문제가 계속되면

### 1. GitHub 저장소 구조 확인

GitHub에서 직접 확인:
- https://github.com/MrDucksaysQuack/philjpn/tree/main/frontend/client

`package.json` 파일이 있어야 합니다.

### 2. 파일 커밋 확인

```bash
# 로컬에서 확인
cd exam-platform
git ls-files | grep "frontend/client/package.json"

# 있으면 출력되어야 함
```

없다면:
```bash
cd exam-platform
git add frontend/client
git commit -m "Add frontend client files"
git push origin main
```

### 3. Vercel 프로젝트 재연결

1. Vercel Dashboard → Settings → General
2. 맨 아래 **"Disconnect"** 클릭
3. 다시 **"Add New Project"** → GitHub 저장소 선택
4. **Configure Project**:
   - Root Directory: `frontend/client`
   - 나머지 자동 설정
5. **Deploy**

---

**작성일**: 2024년 11월 1일

