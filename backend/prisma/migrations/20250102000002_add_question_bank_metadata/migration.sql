-- AlterTable
ALTER TABLE "question_banks" ADD COLUMN "subcategory" VARCHAR(100),
ADD COLUMN "level" VARCHAR(50),
ADD COLUMN "source" VARCHAR(200),
ADD COLUMN "sourceYear" INTEGER;

-- CreateIndex
CREATE INDEX "question_banks_category_idx" ON "question_banks"("category");

-- CreateIndex
CREATE INDEX "question_banks_subcategory_idx" ON "question_banks"("subcategory");

-- CreateIndex
CREATE INDEX "question_banks_level_idx" ON "question_banks"("level");

