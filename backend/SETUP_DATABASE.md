# 데이터베이스 설정 가이드

## PostgreSQL 데이터베이스 생성

마이그레이션을 실행하기 전에 PostgreSQL 데이터베이스를 생성해야 합니다.

### 방법 1: psql을 사용하여 생성

```bash
# PostgreSQL에 접속 (postgres 사용자로)
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE exam_platform;

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER exam_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE exam_platform TO exam_user;

# 종료
\q
```

### 방법 2: 명령줄에서 직접 생성

```bash
# 데이터베이스 생성
createdb -U postgres exam_platform

# 또는
psql -U postgres -c "CREATE DATABASE exam_platform;"
```

## .env 파일 수정

`.env` 파일의 `DATABASE_URL`을 실제 PostgreSQL 정보로 수정하세요:

```env
# 로컬 PostgreSQL (기본 사용자)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exam_platform?schema=public"

# 또는 특정 사용자
DATABASE_URL="postgresql://exam_user:your_password@localhost:5432/exam_platform?schema=public"
```

### DATABASE_URL 형식

```
postgresql://[사용자명]:[비밀번호]@[호스트]:[포트]/[데이터베이스명]?schema=public
```

예시:
- `postgresql://postgres:postgres@localhost:5432/exam_platform?schema=public`
- `postgresql://myuser:mypassword@localhost:5432/exam_platform?schema=public`

## PostgreSQL 서비스 확인

macOS (Homebrew):
```bash
# PostgreSQL 서비스 상태 확인
brew services list | grep postgresql

# PostgreSQL 시작 (필요시)
brew services start postgresql@14
```

## 마이그레이션 실행

데이터베이스 생성 및 .env 파일 수정 후:

```bash
npx prisma migrate dev --name init
```

## 문제 해결

### "User was denied access" 오류
- PostgreSQL 사용자 비밀번호 확인
- 데이터베이스 접근 권한 확인

### "database does not exist" 오류
- 위의 방법으로 데이터베이스를 먼저 생성하세요

### 연결 실패
- PostgreSQL 서비스가 실행 중인지 확인
- 포트 번호 확인 (기본값: 5432)
- 방화벽 설정 확인

