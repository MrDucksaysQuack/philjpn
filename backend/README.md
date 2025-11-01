# Exam Platform Backend

시험 플랫폼 백엔드 API 서버

## 📋 기술 스택

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## 🚀 시작하기

### 필요 조건

- Node.js 18.x 이상
- PostgreSQL 14.x 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# Prisma Client 생성
npx prisma generate

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력
```

### 데이터베이스 설정

```bash
# 마이그레이션 실행
npx prisma migrate dev

# 시드 데이터 추가 (선택)
npx prisma db seed
```

### 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

## 📁 프로젝트 구조

```
src/
├── modules/           # 기능별 모듈
│   ├── core/         # Phase 1-2: Core Engine
│   ├── auth/         # Phase 3: 인증
│   ├── license/      # Phase 4: License Key System
│   └── admin/        # Phase 7: Admin Panel
├── common/            # 공통 유틸리티
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   ├── types/
│   └── utils/
└── config/            # 설정 파일
```

## 📚 API 문서

서버 실행 후 다음 URL에서 Swagger 문서 확인:

```
http://localhost:3000/api-docs
```

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run start:dev

# 빌드
npm run build

# 테스트
npm run test
npm run test:e2e

# Prisma Studio (DB GUI)
npx prisma studio

# Prisma 마이그레이션
npx prisma migrate dev
npx prisma migrate deploy

# Prisma 스키마 포맷
npx prisma format
```

## 📝 환경 변수

`.env` 파일에서 다음 변수들을 설정해야 합니다:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/exam_platform"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3001"
```

## 🔗 관련 문서

- [프로젝트 아키텍처](../PROJECT_ARCHITECTURE.md)
- [ERD 설계](../ERD_DESIGN.md)
- [API 명세서](../API_SPECIFICATION.md)
