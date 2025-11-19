-- AlterTable: exams 테이블에 버전 관리 필드 추가
ALTER TABLE "exams" ADD COLUMN "parentExamId" TEXT,
ADD COLUMN "version" VARCHAR(10),
ADD COLUMN "versionNumber" INTEGER;

-- CreateIndex
CREATE INDEX "exams_parentExamId_idx" ON "exams"("parentExamId");

-- CreateIndex
CREATE INDEX "exams_version_idx" ON "exams"("version");

-- CreateTable: exam_versions 테이블 생성
CREATE TABLE "exam_versions" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "version" VARCHAR(10) NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "questionOrder" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_versions_examId_key" ON "exam_versions"("examId");

-- CreateIndex
CREATE INDEX "exam_versions_examId_idx" ON "exam_versions"("examId");

-- CreateIndex
CREATE INDEX "exam_versions_version_idx" ON "exam_versions"("version");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_parentExamId_fkey" FOREIGN KEY ("parentExamId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_versions" ADD CONSTRAINT "exam_versions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

