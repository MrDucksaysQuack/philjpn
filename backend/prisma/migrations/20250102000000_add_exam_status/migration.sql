-- AlterTable
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exams_status_idx" ON "exams"("status");

