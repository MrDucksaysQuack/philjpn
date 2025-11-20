-- ============================================
-- Category 및 Subcategory 다국어 필드 추가 마이그레이션
-- ============================================
-- 이 파일은 Supabase SQL Editor에서 실행하세요.
-- 카테고리 및 서브카테고리 테이블에 언어별 이름 필드를 추가합니다.

-- ============================================
-- Step 1: Category 테이블에 언어별 필드 추가
-- ============================================
DO $$ 
BEGIN
  -- nameKo 필드 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'nameKo'
  ) THEN
    ALTER TABLE categories ADD COLUMN "nameKo" VARCHAR(100);
  END IF;

  -- nameEn 필드 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'nameEn'
  ) THEN
    ALTER TABLE categories ADD COLUMN "nameEn" VARCHAR(100);
  END IF;

  -- nameJa 필드 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'nameJa'
  ) THEN
    ALTER TABLE categories ADD COLUMN "nameJa" VARCHAR(100);
  END IF;
END $$;

-- ============================================
-- Step 2: Subcategory 테이블에 언어별 필드 추가
-- ============================================
DO $$ 
BEGIN
  -- nameKo 필드 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subcategories' AND column_name = 'nameKo'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN "nameKo" VARCHAR(100);
  END IF;

  -- nameEn 필드 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subcategories' AND column_name = 'nameEn'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN "nameEn" VARCHAR(100);
  END IF;

  -- nameJa 필드 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subcategories' AND column_name = 'nameJa'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN "nameJa" VARCHAR(100);
  END IF;
END $$;

-- ============================================
-- Step 3: 기존 데이터 마이그레이션
-- ============================================
-- 기존 name 값을 각 언어별 필드에 복사 (기본값으로 사용)
-- 나중에 관리자가 각 언어별로 수정할 수 있음

UPDATE categories 
SET 
  "nameKo" = COALESCE("nameKo", name),
  "nameEn" = COALESCE("nameEn", name),
  "nameJa" = COALESCE("nameJa", name)
WHERE "nameKo" IS NULL OR "nameEn" IS NULL OR "nameJa" IS NULL;

UPDATE subcategories 
SET 
  "nameKo" = COALESCE("nameKo", name),
  "nameEn" = COALESCE("nameEn", name),
  "nameJa" = COALESCE("nameJa", name)
WHERE "nameKo" IS NULL OR "nameEn" IS NULL OR "nameJa" IS NULL;

-- ============================================
-- Step 4: 검증 쿼리 (선택사항)
-- ============================================
-- 마이그레이션 후 실행하여 확인:
-- SELECT id, name, "nameKo", "nameEn", "nameJa FROM categories;
-- SELECT id, name, "nameKo", "nameEn", "nameJa FROM subcategories;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE 'Category 및 Subcategory 다국어 필드 추가 완료!';
  RAISE NOTICE '기존 name 값이 각 언어별 필드에 복사되었습니다.';
  RAISE NOTICE '관리자 페이지에서 각 언어별 이름을 수정할 수 있습니다.';
END $$;

