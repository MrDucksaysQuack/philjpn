# Vercel 배포 가이드 및 트러블슈팅

## "A more recent Production Deployment" 메시지

### 의미

이 메시지는 **에러가 아닙니다**. Vercel의 정상적인 동작입니다.

**의미**:
- 이미 더 최근의 배포가 진행 중이거나 완료되었음
- 이전 배포를 재배포하려고 시도했지만, 최신 배포가 이미 존재함

### 언제 발생하는가?

1. **자동 배포가 진행 중일 때**
   - Git push 후 Vercel이 자동으로 새 배포를 시작
   - 이전 배포를 재배포하려고 시도하면 이 메시지 표시

2. **동시 배포 시도**
   - 여러 커밋이 빠르게 푸시될 때
   - 이전 커밋의 배포가 아직 진행 중인데 새 배포 요청

### 해결 방법

#### 방법 1: 최신 배포 확인 (권장)

1. **Vercel Dashboard** 접속
   - https://vercel.com/dashboard

2. **프로젝트 선택**

3. **Deployments 탭** 확인
   - 가장 위에 있는 배포가 최신 배포입니다
   - 상태 확인:
     - ✅ **Ready** = 배포 성공
     - ⏳ **Building** = 배포 진행 중
     - ❌ **Error** = 배포 실패

4. **최신 배포가 성공했다면**
   - ✅ 정상입니다!
   - 사이트 URL 확인

#### 방법 2: 새 커밋 푸시

```bash
# 변경사항 확인
git status

# 커밋 및 푸시 (변경사항이 있다면)
git add .
git commit -m "Your commit message"
git push origin main
```

#### 방법 3: 수동 재배포 (필요 시)

1. Vercel Dashboard → Deployments
2. 최신 배포 선택
3. "..." 메뉴 → "Redeploy"

---

## 배포 상태 확인 방법

### Vercel Dashboard에서

1. **프로젝트 목록**에서 프로젝트 클릭
2. **Deployments** 탭 확인
3. 각 배포의 상태 확인:
   - ✅ Ready (초록색) - 성공
   - ⏳ Building (노란색) - 진행 중
   - ❌ Error (빨간색) - 실패
   - ⚠️ Canceled (회색) - 취소됨

### 로그 확인

배포 클릭 → **Build Logs** 탭에서:
- 빌드 진행 상황
- 에러 메시지
- 경고

---

## 일반적인 배포 문제

### 1. 빌드 에러

**증상**: 배포가 실패하고 Error 상태

**원인**:
- TypeScript 타입 오류
- 빌드 스크립트 오류
- 의존성 설치 실패

**해결**:
```bash
# 로컬에서 빌드 테스트
cd frontend/client
npm run build

# 에러 수정 후 커밋 & 푸시
git add .
git commit -m "Fix build error"
git push origin main
```

### 2. 타입 오류 (현재 해결됨)

**증상**: `Property 'meta' does not exist` 등의 타입 오류

**해결**: `useQuery<PaginatedResponse<Exam>>` 형식으로 명시적 타입 지정

### 3. 환경 변수 누락

**증상**: 런타임 에러 (API 연결 실패 등)

**해결**:
1. Vercel Dashboard → Settings → Environment Variables
2. 필요한 환경 변수 추가:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SOCKET_URL`

### 4. 배포가 너무 오래 걸림

**원인**:
- 큰 파일 크기
- 느린 빌드 시간

**해결**:
- `.vercelignore` 파일 생성하여 불필요한 파일 제외
- 빌드 캐시 활용

---

## 배포 체크리스트

배포 전 확인:

- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] 타입 오류 없음 (`npx tsc --noEmit`)
- [ ] 환경 변수 설정 확인
- [ ] `.gitignore` 확인 (`.env` 제외되어 있는지)
- [ ] 변경사항 커밋 및 푼

---

## Vercel 자동 배포 흐름

```
Git Push → Vercel 감지 → 자동 배포 시작 → 빌드 → 배포 완료
   ↓
사이트 업데이트
```

**특징**:
- ✅ 자동 감지 및 배포
- ✅ 빌드 로그 실시간 확인
- ✅ 배포 히스토리 관리
- ✅ 이전 배포로 롤백 가능

---

## 유용한 명령어

```bash
# 로컬 빌드 테스트
cd frontend/client
npm run build

# 타입 검사
npx tsc --noEmit

# ESLint 검사
npm run lint

# 최신 배포 상태 확인 (Git)
git log --oneline -5
```

---

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel 트러블슈팅](https://vercel.com/docs/concepts/deployments/troubleshooting)

---

**작성일**: 2024년 11월 1일

