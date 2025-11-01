# 개발 환경 실행 가이드

## 🚀 빠른 시작

### 1. Backend 서버 실행

```bash
cd exam-platform/backend

# 의존성 설치 (최초 1회)
npm install

# 환경 변수 설정 확인
# .env 파일이 있는지 확인
# DATABASE_URL이 설정되어 있는지 확인

# 데이터베이스 마이그레이션 (최초 1회)
npx prisma migrate dev

# 개발 서버 실행
npm run start:dev

# 서버가 http://localhost:3001 에서 실행됩니다
# Swagger 문서: http://localhost:3001/api
```

### 2. Frontend 개발 서버 실행

```bash
cd exam-platform/frontend/client

# 의존성 설치 (최초 1회)
npm install

# 환경 변수 설정
# .env.local 파일 생성 필요
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
# (포트 3000이 사용 중이면 자동으로 다른 포트 사용)
```

## 📝 확인 방법

### Backend API 테스트
1. Swagger UI 접속: http://localhost:3001/api
2. Postman 또는 curl 사용

### Frontend 확인
1. 브라우저에서 http://localhost:3000 접속
2. 회원가입 → 로그인 → 시험 목록 확인

## 🔧 환경 변수 설정

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/exam_platform?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우
- Backend: `package.json`에서 포트 변경 (기본: 3001)
- Frontend: `-p` 옵션으로 포트 지정
  ```bash
  npm run dev -- -p 3002
  ```

### 데이터베이스 연결 오류
- PostgreSQL이 실행 중인지 확인
- `.env` 파일의 DATABASE_URL 확인
- 데이터베이스가 생성되어 있는지 확인
  ```bash
  createdb exam_platform
  ```

## 📚 API 문서

- Swagger UI: http://localhost:3001/api (Backend 실행 후)
- API 명세: `API_SPECIFICATION.md` 참고

