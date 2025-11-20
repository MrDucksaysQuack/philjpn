# 🔍 Supabase와 Backend 동기화 분석 보고서

## 📋 개요

Supabase 데이터베이스와 Backend Prisma 스키마의 일치 여부를 확인한 보고서입니다.

**분석 일시**: 2024년  
**데이터베이스**: Supabase PostgreSQL  
**스키마 관리**: Prisma

> 💡 **실행 가이드**: 이 보고서를 기반으로 한 단계별 가이드는 [`SUPABASE_BACKEND_SYNC_GUIDE.md`](./SUPABASE_BACKEND_SYNC_GUIDE.md)를 참조하세요.

---

## 🔴 발견된 주요 문제점

### 1. 마이그레이션 미적용 (12개)

#### 문제점
Prisma 마이그레이션 상태 확인 결과, **12개의 마이그레이션이 아직 적용되지 않았습니다**.

#### 미적용 마이그레이션 목록
```
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
```

#### 영향도: 🔴 **매우 높음**
- 데이터베이스 스키마가 코드와 불일치
- 새로운 기능이 작동하지 않을 수 있음
- 런타임 에러 발생 가능성

---

### 2. 스키마 불일치 가능성

#### 문제점
1. **`deletedAt` 필드**: Prisma 스키마에서는 제거되었지만, 초기 마이그레이션에는 포함되어 있음
2. **`isActive` 필드**: Prisma 스키마에는 있지만, 초기 마이그레이션에는 없을 수 있음
3. **`slug` 필드**: Category 모델에 추가되었지만, 마이그레이션이 별도 SQL 파일로 존재

#### 확인 필요 사항
- 실제 데이터베이스에 `deletedAt` 필드가 남아있는지
- `isActive` 필드가 모든 테이블에 있는지
- `slug` 필드가 `categories` 테이블에 있는지

---

### 3. 수동 마이그레이션 파일

#### 발견된 수동 마이그레이션 파일
```
prisma/migrations/add_category_slug.sql
prisma/migrations/add_color_theme_and_social_auth.sql
prisma/migrations/add_site_settings_version.sql
prisma/migrations/enable_rls.sql
```

#### 문제점
- Prisma 마이그레이션 히스토리에 포함되지 않음
- 수동으로 Supabase SQL Editor에서 실행해야 함
- 마이그레이션 상태 추적 불가

---

## 📊 현재 상태

### 마이그레이션 상태
- **총 마이그레이션**: 13개
- **적용됨**: 1개 (`20251101061942_init`)
- **미적용**: 12개

### 데이터베이스 연결
- **호스트**: `db.fzfgdayzynspcuhsqubi.supabase.co:5432`
- **데이터베이스**: `postgres`
- **스키마**: `public`
- **연결 상태**: ✅ 연결됨

---

## ✅ 해결 방법

### 1단계: 마이그레이션 적용 (즉시 필요)

#### 개발 환경
```bash
cd backend
npx prisma migrate dev
```

#### 프로덕션 환경
```bash
cd backend
npx prisma migrate deploy
```

### 2단계: 수동 마이그레이션 확인

다음 SQL 파일들이 Supabase에서 실행되었는지 확인:
- `add_category_slug.sql`
- `add_color_theme_and_social_auth.sql`
- `add_site_settings_version.sql`
- `enable_rls.sql`

### 3단계: 스키마 동기화 확인

```bash
# 실제 데이터베이스 스키마 가져오기
npx prisma db pull

# Prisma 스키마와 비교
# 차이점이 있으면 수동으로 조정 필요
```

### 4단계: 데이터베이스 스키마 검증

```bash
# 마이그레이션 상태 재확인
npx prisma migrate status

# Prisma Client 재생성
npx prisma generate
```

---

## 🔍 상세 확인 사항

### 필드 불일치 확인

#### User 모델
- [x] `deletedAt` 필드가 데이터베이스에 있는지 확인 → **✅ 있음** (Prisma 스키마에는 없음)
- [x] `isActive` 필드가 있는지 확인 → **✅ 있음**
- [x] `provider`, `providerId`, `providerData` 필드가 있는지 확인 → **✅ 있음**

#### Exam 모델
- [x] `deletedAt` 필드가 데이터베이스에 있는지 확인 → **✅ 있음** (Prisma 스키마에는 없음)
- [x] `isActive` 필드가 있는지 확인 → **✅ 있음**
- [ ] `status`, `reviewerId`, `approvedBy` 등 워크플로우 필드가 있는지 확인 → **❓ 마이그레이션 미적용**

#### Category 모델
- [ ] `slug` 필드가 있는지 확인 → **❓ 수동 마이그레이션 필요**
- [ ] `slug` 필드에 `@unique` 제약조건이 있는지 확인 → **❓ 수동 마이그레이션 필요**

---

## 🔴 발견된 스키마 불일치

### 1. `deletedAt` 필드 불일치

#### 문제점
- **Prisma 스키마**: `deletedAt` 필드 없음 (제거됨)
- **실제 데이터베이스**: `deletedAt` 필드 존재
- **영향**: 코드에서는 `isActive`를 사용하지만, DB에는 `deletedAt`이 남아있음

#### 해결 방법
1. **옵션 A**: 데이터베이스에서 `deletedAt` 필드 제거 (권장)
   ```sql
   ALTER TABLE users DROP COLUMN IF EXISTS "deletedAt";
   ALTER TABLE exams DROP COLUMN IF EXISTS "deletedAt";
   ```

2. **옵션 B**: Prisma 스키마에 `deletedAt` 필드 다시 추가 (비권장)

### 2. 소셜 로그인 필드

#### 상태
- **Prisma 스키마**: `provider`, `providerId`, `providerData` 필드 있음
- **실제 데이터베이스**: 필드 존재 확인됨
- **상태**: ✅ **일치**

### 3. 워크플로우 필드

#### 상태
- **Prisma 스키마**: `status`, `reviewerId`, `approvedBy` 등 필드 있음
- **실제 데이터베이스**: 마이그레이션 미적용으로 확인 불가
- **상태**: ❓ **마이그레이션 필요**

---

## 📝 권장 사항

### 즉시 조치
1. **마이그레이션 적용**: `npx prisma migrate deploy` 실행
2. **수동 마이그레이션 확인**: Supabase SQL Editor에서 실행 여부 확인
3. **스키마 검증**: `npx prisma db pull`로 실제 스키마 확인

### 단기 개선
1. **마이그레이션 통합**: 수동 SQL 파일을 Prisma 마이그레이션으로 변환
2. **스키마 동기화**: Prisma 스키마와 실제 DB 스키마 일치 확인
3. **테스트**: 마이그레이션 적용 후 전체 기능 테스트

### 장기 개선
1. **마이그레이션 자동화**: CI/CD 파이프라인에 마이그레이션 적용 단계 추가
2. **스키마 검증**: 배포 전 자동 스키마 검증
3. **문서화**: 마이그레이션 실행 가이드 작성

---

## ⚠️ 주의사항

### 프로덕션 환경
- 마이그레이션 적용 전 **반드시 백업** 수행
- 다운타임이 필요한 마이그레이션은 유지보수 시간에 실행
- 마이그레이션 롤백 계획 수립

### 데이터 손실 위험
- `deletedAt` 필드 제거 시 기존 데이터 확인 필요
- `isActive` 필드 추가 시 기본값 설정 확인 필요

---

## 📊 결론

**현재 상태**: 🔴 **심각한 불일치**

Supabase 데이터베이스와 Backend Prisma 스키마가 **심각하게 불일치**하고 있습니다.

### 발견된 주요 문제점

1. **마이그레이션 미적용**: 12개의 마이그레이션이 미적용 상태
2. **`deletedAt` 필드 불일치**: 
   - Prisma 스키마에는 없음 (제거됨)
   - 실제 데이터베이스에는 존재
   - 코드는 `isActive`를 사용하지만 DB에는 `deletedAt`이 남아있음
3. **수동 마이그레이션 필요**: `slug`, `colorTheme` 등 필드가 수동 SQL로만 추가 가능

### 영향

1. 새로운 기능이 작동하지 않음
2. 런타임 에러 발생 가능성
3. 데이터 불일치
4. 타입 안정성 저하

### 즉시 조치 필요

1. **마이그레이션 적용**: `npx prisma migrate deploy`
2. **`deletedAt` 필드 제거**: 데이터베이스에서 제거 또는 마이그레이션 생성
3. **수동 마이그레이션 확인**: Supabase SQL Editor에서 실행 여부 확인
4. **스키마 동기화**: Prisma 스키마와 실제 DB 스키마 일치 확인

