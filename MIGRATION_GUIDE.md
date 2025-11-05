# 🗄️ Site Settings 테이블 마이그레이션 가이드

> Supabase에서 `site_settings` 테이블을 수동으로 생성하는 방법

---

## 📋 개요

이 가이드는 Supabase 대시보드에서 직접 SQL을 실행하여 `site_settings` 테이블을 생성하는 방법을 안내합니다.

---

## 🚀 단계별 가이드

### 1단계: Supabase 대시보드 접속

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2단계: SQL 쿼리 실행

SQL Editor에서 아래 SQL 쿼리를 복사하여 붙여넣고 실행합니다:

```sql
-- ============================================
-- SITE_SETTINGS 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL DEFAULT 'Exam Platform',
  "logoUrl" VARCHAR(500),
  "faviconUrl" VARCHAR(500),
  "primaryColor" VARCHAR(7),
  "secondaryColor" VARCHAR(7),
  "accentColor" VARCHAR(7),
  "colorScheme" JSONB,
  "aboutCompany" TEXT,
  "aboutTeam" TEXT,
  "contactInfo" JSONB,
  "serviceInfo" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedBy" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "site_settings_isActive_idx" ON "site_settings"("isActive");

-- 외래 키 제약 조건 (users 테이블이 존재하는 경우)
-- 참고: users 테이블이 없다면 이 부분은 건너뛰세요
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "site_settings" 
      ADD CONSTRAINT "site_settings_updatedBy_fkey" 
      FOREIGN KEY ("updatedBy") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 초기 데이터 삽입 (기본값)
INSERT INTO "site_settings" ("id", "companyName", "createdAt", "updatedAt", "isActive")
VALUES (
  gen_random_uuid(),
  'Exam Platform',
  NOW(),
  NOW(),
  true
)
ON CONFLICT DO NOTHING;

-- 성공 메시지
SELECT '✅ site_settings 테이블이 성공적으로 생성되었습니다!' AS message;
```

### 3단계: 실행 확인

1. SQL Editor에서 **Run** 버튼 클릭
2. 성공 메시지 확인: `✅ site_settings 테이블이 성공적으로 생성되었습니다!`
3. 왼쪽 메뉴에서 **Table Editor** 클릭
4. `site_settings` 테이블이 생성되었는지 확인

### 4단계: 테이블 구조 검증 및 누락 컬럼 추가

**⚠️ 중요**: Table Editor에서 일부 컬럼만 보일 수 있습니다. 모든 컬럼이 제대로 생성되었는지 확인하고, 누락된 컬럼이 있다면 추가하세요.

`VERIFY_AND_FIX_TABLE.sql` 파일의 SQL을 실행하여:
1. 현재 테이블 구조 확인
2. 누락된 컬럼 자동 추가
3. 트리거 및 인덱스 확인
4. 외래 키 제약 조건 확인

### 5단계: (선택) 초기 데이터 확인

Table Editor에서 `site_settings` 테이블을 열어보면 기본 데이터가 있는지 확인할 수 있습니다:

```sql
SELECT * FROM "site_settings";
```

또는 모든 컬럼을 확인:

```sql
SELECT 
  id,
  "companyName",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "colorScheme",
  "aboutCompany",
  "aboutTeam",
  "contactInfo",
  "serviceInfo",
  "isActive",
  "updatedBy",
  "updatedAt",
  "createdAt"
FROM "site_settings";
```

---

## 🔍 테이블 구조 확인

테이블이 제대로 생성되었는지 확인하려면:

```sql
-- 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;
```

---

## ⚠️ 문제 해결

### 문제 1: "users 테이블이 존재하지 않습니다" 오류

**해결 방법**: 
- 외래 키 제약 조건을 추가하지 않고 테이블만 생성:

```sql
CREATE TABLE IF NOT EXISTS "site_settings" (
  -- ... (위의 CREATE TABLE 쿼리에서 외래 키 부분 제외)
);

-- 외래 키는 나중에 추가
ALTER TABLE "site_settings" 
  ADD CONSTRAINT "site_settings_updatedBy_fkey" 
  FOREIGN KEY ("updatedBy") REFERENCES "users"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
```

### 문제 2: "테이블이 이미 존재합니다" 오류

**해결 방법**: 
- 테이블이 이미 존재한다면 `IF NOT EXISTS` 구문이 자동으로 스킵합니다.
- 테이블을 삭제하고 다시 생성하려면:

```sql
DROP TABLE IF EXISTS "site_settings" CASCADE;
-- 그 다음 위의 CREATE TABLE 쿼리 실행
```

### 문제 3: 권한 오류

**해결 방법**: 
- Supabase 프로젝트의 관리자 권한이 필요합니다.
- 프로젝트 소유자 또는 관리자로 로그인했는지 확인하세요.

---

## 📝 다음 단계

테이블이 성공적으로 생성되면:

1. **Backend 서버 재시작**: Prisma Client가 새 테이블을 인식하도록
2. **Admin 페이지 접속**: `/admin/settings`에서 사이트 설정 관리
3. **로고 업로드**: Supabase Storage 또는 외부 URL 사용
4. **색상 분석 테스트**: 로고 URL 입력 후 "🎨 색상 분석" 버튼 클릭

---

## 🔗 관련 파일

- **Prisma Schema**: `backend/prisma/schema.prisma`
- **Backend Service**: `backend/src/modules/admin/services/site-settings.service.ts`
- **Frontend Admin Page**: `frontend/client/app/admin/settings/page.tsx`

---

## ✅ 체크리스트

- [ ] Supabase 대시보드 접속
- [ ] SQL Editor 열기
- [ ] SQL 쿼리 실행
- [ ] 테이블 생성 확인
- [ ] 초기 데이터 확인
- [ ] Backend 서버 재시작
- [ ] Admin 페이지에서 테스트

---

**작성일**: 2024년 11월  
**업데이트**: 테이블 생성 후 즉시 사용 가능

