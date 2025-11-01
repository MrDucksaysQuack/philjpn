# 빠른 배포 가이드 (30분 완성)

> **최소 시간으로 프로덕션 배포하기**

---

## 🎯 목표
30분 안에 서비스를 인터넷에 배포

---

## Step 1: 데이터베이스 (5분)

### Supabase 사용

1. **Supabase 가입**
   - https://supabase.com 접속
   - GitHub로 로그인

2. **새 프로젝트 생성**
   - New Project 클릭
   - 프로젝트 이름: `exam-platform`
   - 데이터베이스 비밀번호 설정 (기억하기!)
   - Region: `Northeast Asia (Seoul)` 선택
   - Create project 클릭

3. **연결 정보 복사**
   - Settings → Database
   - Connection String → URI 복사
   - 형식: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

4. **마이그레이션 실행** (로컬에서)
   ```bash
   cd backend
   # .env 파일에 DATABASE_URL 업데이트
   nano .env
   # DATABASE_URL="[복사한 연결 문자열]"
   
   # 마이그레이션
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## Step 2: Backend 배포 (10분)

### Railway 사용

1. **Railway 가입**
   - https://railway.app 접속
   - GitHub로 로그인

2. **프로젝트 생성**
   - New Project → Deploy from GitHub repo
   - `exam-platform` 저장소 선택
   - 서비스 추가 → `backend` 폴더 선택

3. **환경 변수 설정**
   Railway Dashboard → Variables 탭에서 추가:
   ```env
   DATABASE_URL=[Supabase에서 복사한 연결 문자열]
   JWT_SECRET=[강력한 시크릿 - 아래 명령으로 생성]
   JWT_EXPIRES_IN=1h
   PORT=3001
   NODE_ENV=production
   ```

4. **JWT Secret 생성** (로컬 터미널)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   출력된 값을 `JWT_SECRET`에 입력

5. **배포 대기**
   - Railway가 자동으로 빌드 및 배포
   - 배포 완료 후 URL 확인 (예: `https://backend-production-xxxx.up.railway.app`)

6. **도메인 확인**
   - Settings → Generate Domain 클릭
   - 생성된 URL 복사 (예: `https://backend-production.up.railway.app`)

---

## Step 3: Frontend 배포 (10분)

### Vercel 사용

1. **Vercel 가입**
   - https://vercel.com 접속
   - GitHub로 로그인

2. **프로젝트 Import**
   - Add New → Project
   - `exam-platform` 저장소 선택
   - Framework Preset: `Next.js` (자동 감지)
   - Root Directory: `frontend/client`

3. **환경 변수 설정**
   Environment Variables에서 추가:
   ```env
   NEXT_PUBLIC_API_URL=https://[Railway에서 생성된 URL]/api
   NEXT_PUBLIC_SOCKET_URL=https://[Railway에서 생성된 URL]
   ```

4. **Deploy 클릭**
   - Vercel이 자동으로 빌드 및 배포
   - 배포 완료 후 URL 확인 (예: `https://exam-platform.vercel.app`)

---

## Step 4: 설정 확인 (5분)

### Backend 테스트

1. **Swagger 확인**
   - `https://[Railway URL]/api` 접속
   - API 문서가 보이면 성공

2. **Health Check**
   ```bash
   curl https://[Railway URL]/api/health
   ```

### Frontend 테스트

1. **홈페이지 접속**
   - Vercel에서 제공한 URL 접속
   - 페이지가 로드되면 성공

2. **API 연결 테스트**
   - 회원가입/로그인 시도
   - 네트워크 탭에서 API 호출 확인

---

## 🔧 추가 설정 (선택사항)

### 도메인 연결 (추가 시간: 30분)

1. **도메인 구매**
   - GoDaddy, Namecheap 등에서 구매
   - 예: `exam-platform.com`

2. **Vercel 도메인 설정**
   - Project Settings → Domains
   - 도메인 추가
   - DNS 설정 안내 따르기

3. **Railway 커스텀 도메인**
   - Settings → Custom Domain
   - 도메인 추가 (예: `api.exam-platform.com`)
   - DNS 설정

4. **환경 변수 업데이트**
   - Vercel: `NEXT_PUBLIC_API_URL` → `https://api.exam-platform.com/api`
   - 재배포

---

## ✅ 완료 체크리스트

- [ ] Supabase 데이터베이스 연결
- [ ] Prisma 마이그레이션 완료
- [ ] Railway Backend 배포 완료
- [ ] Vercel Frontend 배포 완료
- [ ] 환경 변수 모두 설정
- [ ] API 연결 테스트 성공
- [ ] 회원가입/로그인 테스트 성공

---

## 🆘 문제 해결

### 데이터베이스 연결 실패
- Supabase Settings → Database → Connection Pooling 사용
- 연결 문자열에 `?pgbouncer=true` 추가

### CORS 오류
- Railway 환경 변수에 `CORS_ORIGIN` 추가
- Vercel URL 입력

### 빌드 실패
- Node.js 버전 확인 (20.x 필요)
- Railway Settings → Build Command 확인
- 로그 확인

---

## 📊 배포 후 확인

1. **성능 테스트**
   - 페이지 로딩 속도 확인
   - API 응답 시간 확인

2. **보안 확인**
   - HTTPS 적용 확인
   - 환경 변수 노출 확인 (GitHub, 코드)

3. **모니터링 설정**
   - Railway 메트릭 확인
   - Vercel Analytics 확인

---

**예상 소요 시간**: 30분  
**비용**: 무료 플랜으로 시작 가능

