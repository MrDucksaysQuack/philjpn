-- ============================================
-- site_settings 테이블 구조 확인 및 누락 컬럼 추가
-- ============================================

-- 1. 현재 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;

-- 2. 누락된 컬럼 추가 (이미 있는 컬럼은 자동으로 스킵됨)
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "secondaryColor" VARCHAR(7),
  ADD COLUMN IF NOT EXISTS "accentColor" VARCHAR(7),
  ADD COLUMN IF NOT EXISTS "colorScheme" JSONB,
  ADD COLUMN IF NOT EXISTS "aboutCompany" TEXT,
  ADD COLUMN IF NOT EXISTS "aboutTeam" TEXT,
  ADD COLUMN IF NOT EXISTS "contactInfo" JSONB,
  ADD COLUMN IF NOT EXISTS "serviceInfo" TEXT,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. updatedAt 컬럼에 자동 업데이트 트리거 설정 (이미 있으면 스킵)
DO $$
BEGIN
  -- updatedAt이 자동으로 업데이트되도록 트리거 생성
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_site_settings_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW."updatedAt" = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_site_settings_updated_at
      BEFORE UPDATE ON "site_settings"
      FOR EACH ROW
      EXECUTE FUNCTION update_site_settings_updated_at();
  END IF;
END $$;

-- 4. 인덱스 확인 및 생성
CREATE INDEX IF NOT EXISTS "site_settings_isActive_idx" ON "site_settings"("isActive");

-- 5. 외래 키 제약 조건 확인 및 추가
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- 외래 키가 없으면 추가
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

-- 6. 최종 확인 메시지
SELECT '✅ site_settings 테이블 구조 검증 및 업데이트 완료!' AS message;

