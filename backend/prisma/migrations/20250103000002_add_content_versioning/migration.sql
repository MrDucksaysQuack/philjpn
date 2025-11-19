-- CreateTable: content_versions 테이블 생성
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "contentType" VARCHAR(20) NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "versionLabel" VARCHAR(50),
    "snapshot" JSONB NOT NULL,
    "changeDescription" TEXT,
    "changedBy" TEXT,
    "parentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_versions_contentType_contentId_idx" ON "content_versions"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "content_versions_contentId_idx" ON "content_versions"("contentId");

-- CreateIndex
CREATE INDEX "content_versions_versionNumber_idx" ON "content_versions"("versionNumber");

-- CreateIndex
CREATE INDEX "content_versions_changedBy_idx" ON "content_versions"("changedBy");

-- CreateIndex
CREATE INDEX "content_versions_createdAt_idx" ON "content_versions"("createdAt");

-- CreateIndex
CREATE INDEX "content_versions_parentVersionId_idx" ON "content_versions"("parentVersionId");

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

