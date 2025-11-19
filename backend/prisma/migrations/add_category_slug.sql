-- ============================================
-- Category Slug 필드 추가 마이그레이션
-- ============================================
-- 이 파일은 Supabase SQL Editor에서 실행하세요.
-- 카테고리 테이블에 SEO-friendly URL을 위한 slug 필드를 추가합니다.

-- Step 1: Add slug column (nullable first for existing data)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE categories ADD COLUMN slug VARCHAR(100);
  END IF;
END $$;

-- Step 2: Create function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(input_text, '[^\w\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Generate slugs for existing categories
DO $$
DECLARE
  cat_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR cat_record IN SELECT id, name FROM categories WHERE slug IS NULL OR slug = '' LOOP
    base_slug := generate_slug(cat_record.name);
    final_slug := base_slug;
    counter := 1;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM categories WHERE slug = final_slug AND id != cat_record.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    UPDATE categories SET slug = final_slug WHERE id = cat_record.id;
  END LOOP;
END $$;

-- Step 4: Add NOT NULL constraint and unique index
DO $$ 
BEGIN
  -- Make slug NOT NULL
  ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_slug_key'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
  
  -- Add index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'categories_slug_idx'
  ) THEN
    CREATE INDEX categories_slug_idx ON categories(slug);
  END IF;
END $$;

-- Step 5: Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION auto_generate_category_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  -- Only generate slug if it's not provided or is empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.name);
    final_slug := base_slug;
    counter := 1;
    
    -- Check for uniqueness (excluding current record on update)
    WHILE EXISTS (
      SELECT 1 FROM categories 
      WHERE slug = final_slug 
      AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5-1: Drop trigger if exists (안전하게 조건부 삭제)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_auto_generate_category_slug'
  ) THEN
    DROP TRIGGER trigger_auto_generate_category_slug ON categories;
  END IF;
END $$;

-- Step 5-2: Create trigger (트리거가 없을 때만 생성)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_auto_generate_category_slug'
  ) THEN
    CREATE TRIGGER trigger_auto_generate_category_slug
      BEFORE INSERT OR UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION auto_generate_category_slug();
  END IF;
END $$;

-- Verification query (optional - run separately to verify)
-- SELECT id, name, slug FROM categories ORDER BY name;

