-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'partner');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('mock', 'practice', 'official');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'fill_blank', 'essay');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('in_progress', 'completed', 'abandoned', 'graded');

-- CreateEnum
CREATE TYPE "KeyType" AS ENUM ('ACCESS_KEY', 'TEST_KEY', 'ADMIN_KEY');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('success', 'failed', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "phone" TEXT,
    "profileImage" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "examType" "ExamType" NOT NULL,
    "subject" VARCHAR(100),
    "difficulty" "Difficulty",
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "totalSections" INTEGER NOT NULL DEFAULT 0,
    "estimatedTime" INTEGER,
    "passingScore" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_configs" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "allowSectionNavigation" BOOLEAN NOT NULL DEFAULT true,
    "allowQuestionReview" BOOLEAN NOT NULL DEFAULT true,
    "showAnswerAfterSubmit" BOOLEAN NOT NULL DEFAULT true,
    "showScoreImmediately" BOOLEAN NOT NULL DEFAULT true,
    "timeLimitPerSection" BOOLEAN NOT NULL DEFAULT false,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "preventTabSwitch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "timeLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "questionBankId" TEXT,
    "questionNumber" INTEGER NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "content" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "difficulty" "Difficulty",
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "licenseKeyId" TEXT,
    "status" "ResultStatus" NOT NULL DEFAULT 'in_progress',
    "totalScore" INTEGER,
    "maxScore" INTEGER,
    "percentage" DECIMAL(5,2),
    "timeSpent" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_results" (
    "id" TEXT NOT NULL,
    "examResultId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "unansweredCount" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "maxScore" INTEGER,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_results" (
    "id" TEXT NOT NULL,
    "sectionResultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "pointsEarned" INTEGER,
    "pointsPossible" INTEGER,
    "timeSpent" INTEGER,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_exam_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "examResultId" TEXT,
    "currentSectionId" TEXT,
    "currentQuestionNumber" INTEGER,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "keyType" "KeyType" NOT NULL,
    "examIds" TEXT[],
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "issuedBy" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_usage_logs" (
    "id" TEXT NOT NULL,
    "licenseKeyId" TEXT NOT NULL,
    "userId" TEXT,
    "examId" TEXT,
    "examResultId" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "status" "LogStatus" NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_books" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "example" TEXT,
    "difficulty" "Difficulty",
    "source" VARCHAR(100),
    "sourceId" TEXT,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "exams_examType_idx" ON "exams"("examType");

-- CreateIndex
CREATE INDEX "exams_subject_idx" ON "exams"("subject");

-- CreateIndex
CREATE INDEX "exams_isActive_idx" ON "exams"("isActive");

-- CreateIndex
CREATE INDEX "exams_createdAt_idx" ON "exams"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "exam_configs_examId_key" ON "exam_configs"("examId");

-- CreateIndex
CREATE INDEX "sections_examId_idx" ON "sections"("examId");

-- CreateIndex
CREATE INDEX "sections_examId_order_idx" ON "sections"("examId", "order");

-- CreateIndex
CREATE INDEX "questions_sectionId_idx" ON "questions"("sectionId");

-- CreateIndex
CREATE INDEX "questions_sectionId_questionNumber_idx" ON "questions"("sectionId", "questionNumber");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_tags_idx" ON "questions"("tags");

-- CreateIndex
CREATE INDEX "exam_results_userId_idx" ON "exam_results"("userId");

-- CreateIndex
CREATE INDEX "exam_results_examId_idx" ON "exam_results"("examId");

-- CreateIndex
CREATE INDEX "exam_results_status_idx" ON "exam_results"("status");

-- CreateIndex
CREATE INDEX "exam_results_startedAt_idx" ON "exam_results"("startedAt");

-- CreateIndex
CREATE INDEX "section_results_examResultId_idx" ON "section_results"("examResultId");

-- CreateIndex
CREATE INDEX "section_results_sectionId_idx" ON "section_results"("sectionId");

-- CreateIndex
CREATE INDEX "question_results_sectionResultId_idx" ON "question_results"("sectionResultId");

-- CreateIndex
CREATE INDEX "question_results_questionId_idx" ON "question_results"("questionId");

-- CreateIndex
CREATE INDEX "user_exam_sessions_userId_idx" ON "user_exam_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_exam_sessions_examId_idx" ON "user_exam_sessions"("examId");

-- CreateIndex
CREATE INDEX "user_exam_sessions_expiresAt_idx" ON "user_exam_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "license_keys_key_key" ON "license_keys"("key");

-- CreateIndex
CREATE INDEX "license_keys_key_idx" ON "license_keys"("key");

-- CreateIndex
CREATE INDEX "license_keys_userId_idx" ON "license_keys"("userId");

-- CreateIndex
CREATE INDEX "license_keys_keyType_idx" ON "license_keys"("keyType");

-- CreateIndex
CREATE INDEX "license_keys_validUntil_idx" ON "license_keys"("validUntil");

-- CreateIndex
CREATE INDEX "key_usage_logs_licenseKeyId_idx" ON "key_usage_logs"("licenseKeyId");

-- CreateIndex
CREATE INDEX "key_usage_logs_userId_idx" ON "key_usage_logs"("userId");

-- CreateIndex
CREATE INDEX "key_usage_logs_createdAt_idx" ON "key_usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "key_usage_logs_action_idx" ON "key_usage_logs"("action");

-- CreateIndex
CREATE INDEX "word_books_userId_idx" ON "word_books"("userId");

-- CreateIndex
CREATE INDEX "word_books_word_idx" ON "word_books"("word");

-- CreateIndex
CREATE INDEX "word_books_nextReviewAt_idx" ON "word_books"("nextReviewAt");

-- CreateIndex
CREATE INDEX "word_books_tags_idx" ON "word_books"("tags");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_configs" ADD CONSTRAINT "exam_configs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "question_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_licenseKeyId_fkey" FOREIGN KEY ("licenseKeyId") REFERENCES "license_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_results" ADD CONSTRAINT "section_results_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "exam_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_results" ADD CONSTRAINT "section_results_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_sectionResultId_fkey" FOREIGN KEY ("sectionResultId") REFERENCES "section_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exam_sessions" ADD CONSTRAINT "user_exam_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exam_sessions" ADD CONSTRAINT "user_exam_sessions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_usage_logs" ADD CONSTRAINT "key_usage_logs_licenseKeyId_fkey" FOREIGN KEY ("licenseKeyId") REFERENCES "license_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_usage_logs" ADD CONSTRAINT "key_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_books" ADD CONSTRAINT "word_books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
