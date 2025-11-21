# 🔧 Supabase와 Backend 동기화 가이드

## 📋 개요

이 가이드는 Supabase 데이터베이스와 Backend Prisma 스키마를 동기화하는 단계별 절차를 제공합니다.

**대상**: 개발자, DevOps 엔지니어  
**예상 소요 시간**: 30-60분  
**난이도**: 중급

> 📊 **현재 상태**: 11개의 마이그레이션이 미적용 상태입니다. 이 가이드를 따라 순서대로 진행하시면 됩니다.

---

## ⚠️ 사전 준비사항

### 필수 확인 사항
- [ ] Supabase 프로젝트 접근 권한
- [ ] DATABASE_URL 환경 변수 설정 확인
- [ ] 데이터베이스 백업 완료 (프로덕션 환경)
- [ ] Prisma CLI 설치 확인 (`npx prisma --version`)

### 백업 방법
```bash
# Supabase Dashboard에서 백업 다운로드
# 또는 pg_dump 사용
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📊 현재 상태 확인

### 1단계: 마이그레이션 상태 확인

```bash
cd backend
npx prisma migrate status
```

**예상 출력**:
```
Loaded Prisma config from prisma.config.ts.

Prisma config detected, skipping environment variable loading.
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.fzfgdayzynspcuhsqubi.supabase.co:5432"

13 migrations found in prisma/migrations
Following migrations have not yet been applied:
20250102000000_add_exam_status
20250102000001_add_question_usage_tracking
20250102000002_add_question_bank_metadata
20250102000003_add_question_pool_auto_select_rules
20250102000004_add_question_statistics
20250102000005_add_exam_version_management
20250103000000_add_exam_workflow_fields
20250103000001_add_rbac_roles
20250103000002_add_content_versioning
20251117194412_add_question_media_fields
enable_rls

To apply migrations in development run prisma migrate dev.
To apply migrations in production run prisma migrate deploy.
```

**확인 사항**:
- ✅ 데이터베이스 연결 성공 (Supabase 호스트 확인)
- ⚠️ **11개의 마이그레이션이 미적용 상태**
- 📋 마이그레이션 목록 확인 완료

**다음 단계**: Phase 1 (수동 마이그레이션)부터 진행

### 2단계: 데이터베이스 연결 확인

```bash
# Prisma Studio로 연결 테스트 (선택사항)
npx prisma studio
```

### 3단계: 현재 스키마 확인

```bash
# 실제 데이터베이스 스키마 가져오기
npx prisma db pull --print > current_schema.prisma
```

---

## 🔧 동기화 절차

### Phase 1: 수동 마이그레이션 적용 (필수)

다음 SQL 파일들을 Supabase SQL Editor에서 **순서대로** 실행합니다.

**⚠️ 중요 사항**:
- 각 SQL 파일은 이미 실행되었을 수 있습니다
- 에러가 발생해도 **확인 쿼리**로 필드/테이블 존재 여부를 먼저 확인하세요
- 필드가 이미 존재하면 에러는 무시하고 다음 단계로 진행하세요
- 모든 단계에서 확인 쿼리를 실행하여 실제 상태를 확인하는 것이 중요합니다

#### 1.1 Category Slug 필드 추가

**파일**: `backend/prisma/migrations/add_category_slug.sql`

**Supabase SQL Editor에서 실행**:
1. Supabase Dashboard → SQL Editor 열기
2. 파일 내용 복사하여 실행
3. 실행 결과 확인

**⚠️ 에러 발생 시**:
- 이미 필드나 인덱스가 존재하는 경우 에러가 발생할 수 있습니다
- 이는 **정상**이며, 아래 확인 쿼리로 필드 존재 여부를 확인하세요
- 필드가 이미 존재하면 이 단계는 **건너뛰어도 됩니다**

**확인 쿼리**:
```sql
-- slug 필드 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'slug';
-- 결과: slug 필드가 있어야 함

-- slug 인덱스 확인
SELECT indexname FROM pg_indexes 
WHERE tablename = 'categories' AND indexname LIKE '%slug%';
-- 결과: categories_slug_key (UNIQUE), categories_slug_idx가 있어야 함
```

**✅ 확인 완료 기준**:
- [✅] `categories.slug` 필드 존재
- [✅] `categories_slug_key` UNIQUE 제약조건 존재
- [✅] `categories_slug_idx` 인덱스 존재

#### 1.2 색상 테마 및 소셜 로그인 필드 추가

**파일**: `backend/prisma/migrations/add_color_theme_and_social_auth.sql`

**Supabase SQL Editor에서 실행**:
1. 파일 내용 복사하여 실행
2. 실행 결과 확인

**⚠️ 에러 발생 시**:
다음과 같은 에러가 발생할 수 있습니다:
```
ERROR: 42P07: relation "users_provider_providerid_key" already exists
```

**이 에러는 정상입니다!** 이미 해당 인덱스나 필드가 존재한다는 의미입니다.

**해결 방법**:
1. 에러가 발생해도 **계속 진행**하세요 (이미 적용된 부분이 있을 수 있음)
2. 아래 확인 쿼리로 필드와 인덱스가 존재하는지 확인
3. 모든 필드가 이미 존재하면 이 단계는 **건너뛰어도 됩니다**

**확인 쿼리**:
```sql
-- SiteSettings에 colorTheme 필드 확인
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'site_settings' AND column_name = 'colorTheme';
-- 결과: colorTheme이 있어야 함

-- User에 소셜 로그인 필드 확인
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('provider', 'providerId', 'providerData');
-- 결과: provider, providerId, providerData 3개가 모두 있어야 함

-- 인덱스 확인
SELECT indexname FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE '%provider%';
-- 결과: users_provider_providerId_key, users_provider_idx, users_providerId_idx가 있어야 함
```

**✅ 확인 완료 기준**:
- [✅] `site_settings.colorTheme` 필드 존재
- [✅] `users.provider` 필드 존재
- [✅] `users.providerId` 필드 존재
- [✅] `users.providerData` 필드 존재
- [✅] 인덱스 3개 존재 (또는 에러가 발생했지만 필드는 모두 존재)

**모든 필드가 이미 존재하면** → 다음 단계(1.3)로 진행하세요.

#### 1.3 Site Settings Version 필드 추가

**파일**: `backend/prisma/migrations/add_site_settings_version.sql`

**Supabase SQL Editor에서 실행**:
1. 파일 내용 복사하여 실행
2. 실행 결과 확인

**⚠️ 에러 발생 시**:
- 이미 필드나 테이블이 존재하는 경우 에러가 발생할 수 있습니다
- 이는 **정상**이며, 아래 확인 쿼리로 필드 존재 여부를 확인하세요
- 필드가 이미 존재하면 이 단계는 **건너뛰어도 됩니다**

**확인 쿼리**:
```sql
-- site_settings_versions 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'site_settings_versions';
-- 결과: site_settings_versions 테이블이 있어야 함

-- SiteSettings에 관련 필드 확인
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'site_settings' AND column_name IN ('version', 'versionNumber');
-- 결과: version, versionNumber 필드가 있어야 함 (있는 경우)
```

**✅ 확인 완료 기준**:
- [✅] `site_settings_versions` 테이블 존재
- [ ] 관련 필드 확인 완료

#### 1.4 Row Level Security (RLS) 활성화

**파일**: `backend/prisma/migrations/enable_rls.sql` 또는 `backend/prisma/migrations/enable_rls/migration.sql`

**주의**: RLS는 보안 정책이므로 신중하게 검토 후 실행

**Supabase SQL Editor에서 실행**:
1. 파일 내용 복사하여 실행
2. 정책이 올바르게 생성되었는지 확인

**확인 쿼리**:
```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('users', 'exams', 'categories');
```

---

### Phase 2: Prisma 마이그레이션 적용

#### 2.1 마이그레이션 적용 (프로덕션 환경)

```bash
cd backend
npx prisma migrate deploy
```

**예상 출력** (성공 시):
```
Loaded Prisma config from prisma.config.ts.

Prisma config detected, skipping environment variable loading.
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.fzfgdayzynspcuhsqubi.supabase.co:5432"

Applying migration `20250102000000_add_exam_status`
Applying migration `20250102000001_add_question_usage_tracking`
Applying migration `20250102000002_add_question_bank_metadata`
Applying migration `20250102000003_add_question_pool_auto_select_rules`
Applying migration `20250102000004_add_question_statistics`
Applying migration `20250102000005_add_exam_version_management`
Applying migration `20250103000000_add_exam_workflow_fields`
Applying migration `20250103000001_add_rbac_roles`
Applying migration `20250103000002_add_content_versioning`
Applying migration `20251117194412_add_question_media_fields`
Applying migration `enable_rls`

The following migration(s) have been applied:
  - 20250102000000_add_exam_status
  - 20250102000001_add_question_usage_tracking
  - 20250102000002_add_question_bank_metadata
  - 20250102000003_add_question_pool_auto_select_rules
  - 20250102000004_add_question_statistics
  - 20250102000005_add_exam_version_management
  - 20250103000000_add_exam_workflow_fields
  - 20250103000001_add_rbac_roles
  - 20250103000002_add_content_versioning
  - 20251117194412_add_question_media_fields
  - enable_rls

All migrations have been successfully applied.
```

**확인 사항**:
- ✅ "All migrations have been successfully applied." 메시지 확인
- ✅ 11개의 마이그레이션이 모두 적용됨

**에러 발생 시**:
- 에러 메시지 확인 및 로그 분석
- 마이그레이션 파일 내용 검토
- 데이터베이스 권한 확인
- 수동으로 SQL 실행 후 마이그레이션 기록 업데이트 (아래 참조)

**특정 마이그레이션만 수동 적용이 필요한 경우**:
```bash
# 1. Supabase SQL Editor에서 해당 마이그레이션 SQL 실행
# 2. 마이그레이션 기록에 적용됨으로 표시
npx prisma migrate resolve --applied <migration_name>
```

#### 2.2 마이그레이션 상태 재확인

```bash
npx prisma migrate status
```

**예상 출력** (성공 시):
```
Loaded Prisma config from prisma.config.ts.

Prisma config detected, skipping environment variable loading.
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.fzfgdayzynspcuhsqubi.supabase.co:5432"

13 migrations found in prisma/migrations

Database schema is up to date!
```

**확인 사항**:
- ✅ "Database schema is up to date!" 메시지 확인
- ✅ 미적용 마이그레이션이 없어야 함

---

### Phase 3: deletedAt 필드 제거 (선택사항)

**주의**: 이 단계는 데이터 손실이 발생할 수 있으므로 신중하게 진행하세요.

#### 3.1 데이터 확인

```sql
-- deletedAt 필드에 값이 있는지 확인
SELECT COUNT(*) as deleted_users 
FROM users 
WHERE "deletedAt" IS NOT NULL;

SELECT COUNT(*) as deleted_exams 
FROM exams 
WHERE "deletedAt" IS NOT NULL;
```

#### 3.2 isActive로 마이그레이션 (필요한 경우)

```sql
-- deletedAt이 있는 레코드를 isActive = false로 업데이트
UPDATE users 
SET "isActive" = false 
WHERE "deletedAt" IS NOT NULL AND "isActive" = true;

UPDATE exams 
SET "isActive" = false 
WHERE "deletedAt" IS NOT NULL AND "isActive" = true;
```

#### 3.3 deletedAt 필드 제거

```sql
-- Supabase SQL Editor에서 실행
ALTER TABLE users DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE exams DROP COLUMN IF EXISTS "deletedAt";
```

**확인 쿼리**:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name IN ('users', 'exams') AND column_name = 'deletedAt';
-- 결과가 없어야 함
```

---

### Phase 4: Prisma Client 재생성

```bash
cd backend
npx prisma generate
```

**확인**:
```bash
npm run build
```

빌드가 성공적으로 완료되어야 합니다.

---

### Phase 5: 스키마 동기화 검증

#### 5.1 실제 스키마 가져오기

```bash
npx prisma db pull
```

#### 5.2 스키마 비교

```bash
# Prisma 스키마와 비교
diff prisma/schema.prisma <(npx prisma db pull --print)
```

**차이점이 있으면**:
- Prisma 스키마를 업데이트하거나
- 데이터베이스 스키마를 수정

#### 5.3 최종 검증

```bash
# 마이그레이션 상태 확인
npx prisma migrate status
```

**예상 출력**:
```
Database schema is up to date!
```

```bash
# Prisma Client 재생성
npx prisma generate
```

**예상 출력**:
```
✔ Generated Prisma Client (v6.18.0) to ./node_modules/@prisma/client in XXXms
```

```bash
# 빌드 테스트
npm run build
```

**예상 출력**:
```
> backend@0.0.1 build
> nest build

✔ Build successful
```

**모든 단계가 성공적으로 완료되면 동기화가 완료된 것입니다!** ✅

---

## 🧪 테스트 및 검증

### 기능 테스트

#### 1. 기본 CRUD 테스트
```bash
# Prisma Studio로 테스트
npx prisma studio
```

#### 2. API 엔드포인트 테스트
- 카테고리 조회: `GET /api/categories/public`
- 사용자 통계: `GET /api/users/me/statistics`
- 시험 목록: `GET /api/exams`

#### 3. 워크플로우 기능 테스트
- 시험 검수자 할당
- 시험 승인/거부
- 시험 버전 관리

### 데이터 무결성 확인

```sql
-- 외래 키 제약조건 확인
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## 🚨 문제 해결

### 문제 1: 수동 마이그레이션 실행 시 "already exists" 에러

**증상**: SQL 파일 실행 시 다음과 같은 에러 발생
```
ERROR: 42P07: relation "xxx" already exists
ERROR: 42710: duplicate key value violates unique constraint
ERROR: 42P16: invalid input syntax for type
```

**원인**: 해당 필드, 인덱스, 또는 제약조건이 이미 존재함

**해결 방법**:
1. **에러는 무시하고 계속 진행**하세요
2. 확인 쿼리로 필드/인덱스 존재 여부 확인
3. 모든 필드가 이미 존재하면 해당 단계는 완료된 것으로 간주
4. 일부만 존재하는 경우, 수동으로 나머지 부분만 실행

**예시 - add_color_theme_and_social_auth.sql**:
```sql
-- 에러가 발생한 부분(인덱스)은 이미 존재하므로 무시
-- 필드만 확인하면 됨
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('provider', 'providerId', 'providerData');
-- 3개 필드가 모두 있으면 완료
```

**확인 후 다음 단계로 진행하세요!**

### 문제 2: 마이그레이션 적용 실패

**증상**: `prisma migrate deploy` 실행 시 에러 발생

**해결 방법**:
1. 에러 메시지 확인
2. 해당 마이그레이션 파일 내용 검토
3. 수동으로 SQL 실행 후 마이그레이션 기록 업데이트:
   ```bash
   # 마이그레이션 기록에 추가
   npx prisma migrate resolve --applied <migration_name>
   ```

### 문제 3: deletedAt 필드 제거 후 에러

**증상**: 코드에서 `deletedAt` 필드를 참조하는 에러

**해결 방법**:
1. 코드에서 `deletedAt` 사용 검색:
   ```bash
   grep -r "deletedAt" backend/src
   ```
2. 모든 `deletedAt` 참조를 `isActive`로 변경

### 문제 4: slug 필드 타입 에러

**증상**: Prisma Client에서 `slug` 필드를 인식하지 못함

**해결 방법**:
1. Prisma Client 재생성:
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```
2. 여전히 문제가 있으면 `as any` 타입 단언 사용 (임시 조치)

### 문제 5: RLS 정책으로 인한 접근 불가

**증상**: API 요청이 실패하거나 데이터를 조회할 수 없음

**해결 방법**:
1. RLS 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
2. 정책 수정 또는 비활성화 (개발 환경에서만):
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```

---

## 📝 체크리스트

### 사전 준비
- [ ] 데이터베이스 백업 완료
- [ ] DATABASE_URL 환경 변수 확인
- [ ] Supabase 접근 권한 확인

### 수동 마이그레이션
- [ ] `add_category_slug.sql` 실행 완료
- [ ] `add_color_theme_and_social_auth.sql` 실행 완료
- [ ] `add_site_settings_version.sql` 실행 완료
- [ ] `enable_rls.sql` 실행 완료 (선택사항)

### Prisma 마이그레이션
- [ ] `npx prisma migrate deploy` 실행 완료
- [ ] 모든 마이그레이션이 적용됨 확인
- [ ] 에러 없이 완료 확인

### 스키마 동기화
- [ ] `deletedAt` 필드 제거 (선택사항)
- [ ] Prisma Client 재생성 완료
- [ ] 빌드 성공 확인

### 검증
- [ ] 마이그레이션 상태 확인 (`npx prisma migrate status`)
- [ ] 스키마 동기화 확인 (`npx prisma db pull`)
- [ ] 기능 테스트 완료
- [ ] API 엔드포인트 테스트 완료

---

## 🔄 롤백 절차

### 마이그레이션 롤백

```bash
# 특정 마이그레이션 롤백
npx prisma migrate resolve --rolled-back <migration_name>
```

### 데이터베이스 롤백

```bash
# 백업 파일로 복원
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### Prisma 스키마 롤백

```bash
# Git을 사용하여 이전 버전으로 복원
git checkout HEAD~1 -- prisma/schema.prisma
npx prisma generate
```

---

## 📚 참고 자료

### Prisma 문서
- [Prisma Migrate 가이드](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### Supabase 문서
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### 관련 파일
- `SUPABASE_BACKEND_SYNC_ANALYSIS.md`: 상세 분석 보고서
- `BACKEND_ISSUES_ANALYSIS.md`: Backend 문제점 분석

---

## ⚡ 빠른 참조

### 자주 사용하는 명령어

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 적용 (프로덕션)
npx prisma migrate deploy

# 마이그레이션 적용 (개발)
npx prisma migrate dev

# 실제 DB 스키마 가져오기
npx prisma db pull

# Prisma Client 재생성
npx prisma generate

# Prisma Studio 실행
npx prisma studio
```

### Supabase SQL Editor 쿼리

```sql
-- 테이블 목록 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';

-- 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'users';
```

---

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:
1. 에러 메시지와 함께 이슈 생성
2. `SUPABASE_BACKEND_SYNC_ANALYSIS.md` 참조
3. Prisma 및 Supabase 공식 문서 확인

---

**마지막 업데이트**: 2024년  
**문서 버전**: 1.0

