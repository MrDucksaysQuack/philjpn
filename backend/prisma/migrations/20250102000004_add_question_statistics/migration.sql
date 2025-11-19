-- CreateTable
CREATE TABLE "question_statistics" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "unansweredCount" INTEGER NOT NULL DEFAULT 0,
    "averageTimeSpent" INTEGER,
    "calculatedDifficulty" DECIMAL(3,2),
    "correctRate" DECIMAL(5,2),
    "commonMistakes" JSONB,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_statistics_questionId_key" ON "question_statistics"("questionId");

-- CreateIndex
CREATE INDEX "question_statistics_questionId_idx" ON "question_statistics"("questionId");

-- CreateIndex
CREATE INDEX "question_statistics_calculatedDifficulty_idx" ON "question_statistics"("calculatedDifficulty");

-- CreateIndex
CREATE INDEX "question_statistics_correctRate_idx" ON "question_statistics"("correctRate");

-- AddForeignKey
ALTER TABLE "question_statistics" ADD CONSTRAINT "question_statistics_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

