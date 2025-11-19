-- ============================================
-- SiteSettingsVersion 테이블 생성 마이그레이션
-- ============================================
-- 이 파일은 Supabase SQL Editor에서 실행하세요.
-- 사이트 설정 버전 관리 기능을 위한 테이블을 생성합니다.

-- CreateTable: site_settings_versions
CREATE TABLE IF NOT EXISTS "site_settings_versions" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: settingsId 인덱스
CREATE INDEX IF NOT EXISTS "site_settings_versions_settingsId_idx" ON "site_settings_versions"("settingsId");

-- CreateIndex: version 인덱스
CREATE INDEX IF NOT EXISTS "site_settings_versions_version_idx" ON "site_settings_versions"("version");

-- AddForeignKey: settingsId -> site_settings.id (CASCADE 삭제)
-- 제약 조건이 이미 존재하는 경우를 대비하여 DO 블록 사용
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'site_settings_versions_settingsId_fkey'
    ) THEN
        ALTER TABLE "site_settings_versions" 
        ADD CONSTRAINT "site_settings_versions_settingsId_fkey" 
        FOREIGN KEY ("settingsId") 
        REFERENCES "site_settings"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: createdBy -> users.id
-- 제약 조건이 이미 존재하는 경우를 대비하여 DO 블록 사용
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'site_settings_versions_createdBy_fkey'
    ) THEN
        ALTER TABLE "site_settings_versions" 
        ADD CONSTRAINT "site_settings_versions_createdBy_fkey" 
        FOREIGN KEY ("createdBy") 
        REFERENCES "users"("id") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 마이그레이션 완료
-- ============================================
-- 이제 SiteSettingsVersion 테이블이 생성되었습니다.
-- 
-- 주요 기능:
-- - 사이트 설정 변경 이력 추적
-- - 버전별 스냅샷 저장
-- - 특정 버전으로 롤백 가능
-- 
-- 사용 방법:
-- 1. 사이트 설정 업데이트 시 버전 생성
-- 2. 버전 목록 조회
-- 3. 특정 버전으로 롤백

