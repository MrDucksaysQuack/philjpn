# 빠른 시작 가이드

## 🚀 개발 서버 실행

### 1단계: Backend 서버 실행

터미널 1번:
```bash
cd exam-platform/backend

# 개발 서버 실행
npm run start:dev

# 서버 주소: http://localhost:3001
# Swagger 문서: http://localhost:3001/api
```

### 2단계: Frontend 개발 서버 실행

터미널 2번:
```bash
cd exam-platform/frontend/client

# 포트가 이미 사용 중이면 다른 포트 사용
npm run dev -- -p 3002

# 브라우저에서 접속
# http://localhost:3000 또는 http://localhost:3002
```

## ✅ 확인 방법

### 1. Backend 확인
- Swagger UI: http://localhost:3001/api 접속
- API 엔드포인트 테스트 가능

### 2. Frontend 확인
- 브라우저: http://localhost:3000 접속
- 홈 → 회원가입 → 로그인 → 시험 목록

### 3. 데이터베이스 확인
```bash
# PostgreSQL 접속
psql exam_platform

# 사용자 확인
SELECT * FROM users;

# 시험 목록 확인
SELECT * FROM exams;
```

## 🔐 테스트 계정 생성

### Admin 계정 생성 방법

1. **회원가입으로 일반 사용자 생성**
   - Frontend: http://localhost:3000/register
   - 또는 API: POST /api/auth/register

2. **데이터베이스에서 역할 변경**
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

3. **로그인하여 Admin 권한 확인**

## 📝 환경 변수 확인

### Backend (.env)
```env
DATABASE_URL="postgresql://givenbybaby@localhost:5432/exam_platform?schema=public"
JWT_SECRET="your-secret-key-change-this"
JWT_EXPIRES_IN="1h"
PORT=3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🎯 주요 기능 테스트

1. **회원가입 & 로그인**
   - `/register` → 회원가입
   - `/login` → 로그인

2. **시험 응시**
   - `/exams` → 시험 목록
   - 시험 선택 → License Key 입력 → 시험 시작
   - 답안 입력 → 제출

3. **결과 확인**
   - `/results` → 내 결과 목록
   - 결과 클릭 → 상세 리포트 확인

4. **단어장**
   - `/wordbook` → 단어 추가/복습

5. **통계**
   - `/statistics` → 학습 통계 확인

## 🐛 문제 해결

### 포트 충돌
- Backend: `package.json`에서 포트 변경 또는 환경 변수 `PORT` 설정
- Frontend: `npm run dev -- -p [포트번호]`

### 데이터베이스 연결 오류
```bash
# PostgreSQL 실행 확인
brew services list  # macOS
# 또는
sudo systemctl status postgresql  # Linux

# 데이터베이스 생성
createdb exam_platform
```

### CORS 오류
- Backend의 `main.ts`에서 CORS 설정 확인
- Frontend의 API URL 확인

