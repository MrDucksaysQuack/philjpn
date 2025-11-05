-- ============================================
-- site_settings 테이블 구조 확인 및 누락 컬럼 추가
-- ============================================

-- 1단계: 현재 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;

-- 2단계: 누락된 컬럼 추가 (이미 있는 컬럼은 자동으로 스킵됨)
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "secondaryColor" VARCHAR(7),
  ADD COLUMN IF NOT EXISTS "accentColor" VARCHAR(7),
  ADD COLUMN IF NOT EXISTS "colorScheme" JSONB,
  ADD COLUMN IF NOT EXISTS "aboutCompany" TEXT,
  ADD COLUMN IF NOT EXISTS "aboutTeam" TEXT,
  ADD COLUMN IF NOT EXISTS "contactInfo" JSONB,
  ADD COLUMN IF NOT EXISTS "serviceInfo" TEXT;

-- isActive 컬럼 확인 및 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE "site_settings" 
      ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- updatedBy, updatedAt, createdAt 컬럼 확인 및 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'updatedBy'
  ) THEN
    ALTER TABLE "site_settings" 
      ADD COLUMN "updatedBy" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "site_settings" 
      ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "site_settings" 
      ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 3단계: updatedAt 자동 업데이트 트리거 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_site_settings_updated_at'
  ) THEN
    -- 트리거 함수 생성
    CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW."updatedAt" = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 트리거 생성
    CREATE TRIGGER update_site_settings_updated_at
      BEFORE UPDATE ON "site_settings"
      FOR EACH ROW
      EXECUTE FUNCTION update_site_settings_updated_at();
  END IF;
END $$;

-- 4단계: 인덱스 확인 및 생성
CREATE INDEX IF NOT EXISTS "site_settings_isActive_idx" ON "site_settings"("isActive");

-- 5단계: 외래 키 제약 조건 확인 및 추가
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'site_settings_updatedBy_fkey'
    ) THEN
      ALTER TABLE "site_settings" 
        ADD CONSTRAINT "site_settings_updatedBy_fkey" 
        FOREIGN KEY ("updatedBy") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- 6단계: 최종 확인 - 모든 컬럼 목록
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'companyName', 'isActive', 'updatedAt', 'createdAt') THEN '필수'
    ELSE '선택'
  END as column_type
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;

-- 7단계: 성공 메시지
SELECT '✅ site_settings 테이블 구조 검증 및 업데이트 완료!' AS message,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'site_settings') AS total_columns;

