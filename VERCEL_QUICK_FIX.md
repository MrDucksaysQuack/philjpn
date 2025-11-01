# Vercel 배포 오류 즉시 해결

## 현재 문제

```
sh: line 1: cd: frontend/client: No such file or directory
Error: Command "cd frontend/client && npm install" exited with 1
```

**원인**: `vercel.json` 파일이 프로젝트 루트에 있어서 Vercel 설정과 충돌

---

## 즉시 해결 (3단계)

### Step 1: vercel.json 확인

프로젝트 루트에 `vercel.json`이 있으면 **삭제**했는지 확인:
```bash
cd exam-platform
ls -la vercel.json  # 없어야 함
```

없다면 ✅ 완료

### Step 2: Vercel Dashboard 설정

1. **Vercel Dashboard** 접속: https://vercel.com/dashboard
2. 프로젝트 `philjpn` 선택
3. **Settings** → **General**
4. **Root Directory** 섹션:
   - **"Edit"** 클릭
   - `frontend/client` 입력 (정확히)
   - **Save** 클릭

5. **Build & Development Settings** 확인:
   - **Framework Preset**: `Next.js` (자동)
   - **Build Command**: 비워두기 (자동 감지)
   - **Output Directory**: 비워두기 (자동 감지)
   - **Install Command**: 비워두기 (자동 감지)

### Step 3: GitHub 커밋 확인

```bash
cd exam-platform
git status
git add .
git commit -m "Remove vercel.json, fix deployment"
git push origin main
```

Vercel이 자동으로 재배포를 시작합니다.

---

## 확인 체크리스트

- [ ] 프로젝트 루트에 `vercel.json` 없음
- [ ] Vercel Dashboard → Root Directory = `frontend/client`
- [ ] GitHub에 `frontend/client/package.json` 커밋됨
- [ ] 새 커밋 푸시됨

---

## 빌드 로그 확인

배포 후 **Deployments** → **Build Logs** 확인:

정상:
```
Installing dependencies...
Running "npm run build"
✓ Compiled successfully
Route (app)
┌ ○ /
```

오류가 있으면:
- `frontend/client` 디렉토리를 찾을 수 없다는 메시지
- Root Directory 설정 다시 확인 필요

---

## 최종 확인

배포 성공 후:
- ✅ http://philjpn.vercel.app 접속 테스트
- ✅ 404 에러 없음
- ✅ 홈페이지 정상 표시

---

**작성일**: 2024년 11월 1일

