-- AlterTable
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "questions_usageCount_idx" ON "questions"("usageCount");
CREATE INDEX IF NOT EXISTS "questions_lastUsedAt_idx" ON "questions"("lastUsedAt");

