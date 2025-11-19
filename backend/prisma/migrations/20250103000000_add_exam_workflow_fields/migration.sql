-- AlterTable: 워크플로우 관리 필드 추가
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "reviewerId" TEXT;
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "reviewComment" TEXT;
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exams_reviewerId_idx" ON "exams"("reviewerId");
CREATE INDEX IF NOT EXISTS "exams_approvedBy_idx" ON "exams"("approvedBy");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exams" ADD CONSTRAINT "exams_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

