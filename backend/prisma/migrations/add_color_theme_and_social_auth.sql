-- 색상 테마 및 소셜 로그인 마이그레이션
-- Supabase SQL Editor에서 실행

-- 1. SiteSettings에 colorTheme 필드 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'colorTheme'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN "colorTheme" JSONB;
    COMMENT ON COLUMN site_settings."colorTheme" IS '고급 색상 테마 (ColorTheme 인터페이스 구조)';
  END IF;
END $$;

-- 2. User 테이블에 소셜 로그인 필드 추가
DO $$ 
BEGIN
  -- provider 필드
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'provider'
  ) THEN
    ALTER TABLE users ADD COLUMN provider VARCHAR(20);
    COMMENT ON COLUMN users.provider IS '인증 제공자: local, google, facebook';
  END IF;

  -- providerId 필드
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'providerId'
  ) THEN
    ALTER TABLE users ADD COLUMN "providerId" VARCHAR(255);
    COMMENT ON COLUMN users."providerId" IS '소셜 제공자의 사용자 ID';
  END IF;

  -- providerData 필드
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'providerData'
  ) THEN
    ALTER TABLE users ADD COLUMN "providerData" JSONB;
    COMMENT ON COLUMN users."providerData" IS '소셜 제공자에서 받은 추가 데이터';
  END IF;
END $$;

-- 3. provider + providerId 유니크 제약 조건 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_provider_providerId_key'
  ) THEN
    -- NULL 값은 유니크 제약에서 제외되도록 부분 인덱스 사용
    CREATE UNIQUE INDEX users_provider_providerId_key 
    ON users(provider, "providerId") 
    WHERE provider IS NOT NULL AND "providerId" IS NOT NULL;
  END IF;
END $$;

-- 4. provider 인덱스 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'users_provider_idx'
  ) THEN
    CREATE INDEX users_provider_idx ON users(provider) WHERE provider IS NOT NULL;
  END IF;
END $$;

-- 5. providerId 인덱스 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'users_providerId_idx'
  ) THEN
    CREATE INDEX users_providerId_idx ON users("providerId") WHERE "providerId" IS NOT NULL;
  END IF;
END $$;

-- 6. 기존 사용자들의 provider를 'local'로 설정 (소셜 로그인 사용자가 아닌 경우)
UPDATE users 
SET provider = 'local' 
WHERE provider IS NULL;

