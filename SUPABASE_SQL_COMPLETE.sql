-- ============================================
-- Supabase SQL 완전 초기화 스크립트
-- ============================================
-- ⚠️ 주의: 이 스크립트는 모든 기존 데이터를 삭제하고 새로 생성합니다!
-- ============================================

-- ============================================
-- 1단계: 기존 데이터 정리
-- ============================================
-- 기존 테이블 삭제 (외래키 제약조건 때문에 순서 중요)
DROP TABLE IF EXISTS "user_badges" CASCADE;
DROP TABLE IF EXISTS "badges" CASCADE;
DROP TABLE IF EXISTS "adaptive_questions" CASCADE;
DROP TABLE IF EXISTS "user_exam_sessions" CASCADE;
DROP TABLE IF EXISTS "question_results" CASCADE;
DROP TABLE IF EXISTS "section_results" CASCADE;
DROP TABLE IF EXISTS "exam_results" CASCADE;
DROP TABLE IF EXISTS "user_goals" CASCADE;
DROP TABLE IF EXISTS "learning_patterns" CASCADE;
DROP TABLE IF EXISTS "learning_cycles" CASCADE;
DROP TABLE IF EXISTS "word_books" CASCADE;
DROP TABLE IF EXISTS "key_usage_logs" CASCADE;
DROP TABLE IF EXISTS "license_keys" CASCADE;
DROP TABLE IF EXISTS "license_key_batches" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "sections" CASCADE;
DROP TABLE IF EXISTS "exam_configs" CASCADE;
DROP TABLE IF EXISTS "exams" CASCADE;
DROP TABLE IF EXISTS "subcategories" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "question_pools" CASCADE;
DROP TABLE IF EXISTS "exam_templates" CASCADE;
DROP TABLE IF EXISTS "site_settings" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 기존 Enum 타입 삭제
DROP TYPE IF EXISTS "BadgeRarity" CASCADE;
DROP TYPE IF EXISTS "BadgeType" CASCADE;
DROP TYPE IF EXISTS "GoalStatus" CASCADE;
DROP TYPE IF EXISTS "GoalType" CASCADE;
DROP TYPE IF EXISTS "LogStatus" CASCADE;
DROP TYPE IF EXISTS "KeyType" CASCADE;
DROP TYPE IF EXISTS "ResultStatus" CASCADE;
DROP TYPE IF EXISTS "QuestionType" CASCADE;
DROP TYPE IF EXISTS "Difficulty" CASCADE;
DROP TYPE IF EXISTS "ExamType" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;

-- ============================================
-- 2단계: Enum 타입 생성
-- ============================================
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'partner');
CREATE TYPE "ExamType" AS ENUM ('mock', 'practice', 'official');
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'fill_blank', 'essay');
CREATE TYPE "ResultStatus" AS ENUM ('in_progress', 'completed', 'abandoned', 'graded');
CREATE TYPE "KeyType" AS ENUM ('ACCESS_KEY', 'TEST_KEY', 'ADMIN_KEY');
CREATE TYPE "LogStatus" AS ENUM ('success', 'failed', 'rejected');
CREATE TYPE "GoalType" AS ENUM ('score_target', 'weakness_recovery', 'exam_count', 'word_count');
CREATE TYPE "GoalStatus" AS ENUM ('active', 'achieved', 'failed', 'paused');
CREATE TYPE "BadgeType" AS ENUM (
  'exam_completed',
  'perfect_score',
  'streak_days',
  'word_master',
  'improvement',
  'category_master',
  'speed_demon',
  'consistency'
);
CREATE TYPE "BadgeRarity" AS ENUM ('common', 'rare', 'epic', 'legendary');

-- ============================================
-- 3단계: 테이블 생성 (의존성 순서)
-- ============================================

-- 3-1. Users 테이블
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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- 3-2. Categories 테이블
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");
CREATE INDEX "categories_order_idx" ON "categories"("order");

-- 3-3. Subcategories 테이블
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") 
        REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "subcategories_categoryId_idx" ON "subcategories"("categoryId");
CREATE INDEX "subcategories_isActive_idx" ON "subcategories"("isActive");
CREATE INDEX "subcategories_order_idx" ON "subcategories"("order");

-- 3-4. QuestionBanks 테이블
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

-- 3-5. ExamTemplates 테이블
CREATE TABLE "exam_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "structure" JSONB NOT NULL,
    "questionPoolIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exam_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exam_templates_createdBy_fkey" FOREIGN KEY ("createdBy") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "exam_templates_createdBy_idx" ON "exam_templates"("createdBy");
CREATE INDEX "exam_templates_createdAt_idx" ON "exam_templates"("createdAt");

-- 3-6. Exams 테이블
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
    "templateId" TEXT,
    "randomSeed" INTEGER,
    "isAdaptive" BOOLEAN NOT NULL DEFAULT false,
    "adaptiveConfig" JSONB,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    CONSTRAINT "exams_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exams_createdBy_fkey" FOREIGN KEY ("createdBy") 
        REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "exams_templateId_fkey" FOREIGN KEY ("templateId") 
        REFERENCES "exam_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "exams_categoryId_fkey" FOREIGN KEY ("categoryId") 
        REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "exams_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") 
        REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "exams_examType_idx" ON "exams"("examType");
CREATE INDEX "exams_subject_idx" ON "exams"("subject");
CREATE INDEX "exams_isActive_idx" ON "exams"("isActive");
CREATE INDEX "exams_createdAt_idx" ON "exams"("createdAt");
CREATE INDEX "exams_templateId_idx" ON "exams"("templateId");
CREATE INDEX "exams_isAdaptive_idx" ON "exams"("isAdaptive");
CREATE INDEX "exams_categoryId_idx" ON "exams"("categoryId");
CREATE INDEX "exams_subcategoryId_idx" ON "exams"("subcategoryId");

-- 3-7. ExamConfigs 테이블
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
    CONSTRAINT "exam_configs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exam_configs_examId_key" UNIQUE ("examId"),
    CONSTRAINT "exam_configs_examId_fkey" FOREIGN KEY ("examId") 
        REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3-8. Sections 테이블
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
    CONSTRAINT "sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sections_examId_fkey" FOREIGN KEY ("examId") 
        REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "sections_examId_idx" ON "sections"("examId");
CREATE INDEX "sections_examId_order_idx" ON "sections"("examId", "order");

-- 3-9. Questions 테이블
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
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "audioPlayLimit" INTEGER DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "questions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "questions_sectionId_fkey" FOREIGN KEY ("sectionId") 
        REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_questionBankId_fkey" FOREIGN KEY ("questionBankId") 
        REFERENCES "question_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "questions_sectionId_idx" ON "questions"("sectionId");
CREATE INDEX "questions_sectionId_questionNumber_idx" ON "questions"("sectionId", "questionNumber");
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");
CREATE INDEX "questions_tags_idx" ON "questions" USING GIN ("tags");

-- 3-10. LicenseKeyBatches 테이블
CREATE TABLE "license_key_batches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "keyType" "KeyType" NOT NULL,
    "count" INTEGER NOT NULL,
    "examIds" TEXT[],
    "usageLimit" INTEGER,
    "validUntil" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "license_key_batches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "license_key_batches_createdBy_fkey" FOREIGN KEY ("createdBy") 
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "license_key_batches_createdBy_idx" ON "license_key_batches"("createdBy");
CREATE INDEX "license_key_batches_createdAt_idx" ON "license_key_batches"("createdAt");
CREATE INDEX "license_key_batches_validUntil_idx" ON "license_key_batches"("validUntil");
CREATE INDEX "license_key_batches_keyType_idx" ON "license_key_batches"("keyType");

-- 3-11. LicenseKeys 테이블
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
    "batchId" TEXT,
    CONSTRAINT "license_keys_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "license_keys_key_key" UNIQUE ("key"),
    CONSTRAINT "license_keys_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "license_keys_issuedBy_fkey" FOREIGN KEY ("issuedBy") 
        REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "license_keys_batchId_fkey" FOREIGN KEY ("batchId") 
        REFERENCES "license_key_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "license_keys_key_idx" ON "license_keys"("key");
CREATE INDEX "license_keys_userId_idx" ON "license_keys"("userId");
CREATE INDEX "license_keys_keyType_idx" ON "license_keys"("keyType");
CREATE INDEX "license_keys_validUntil_idx" ON "license_keys"("validUntil");
CREATE INDEX "license_keys_batchId_idx" ON "license_keys"("batchId");

-- 3-12. ExamResults 테이블
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
    "extractedWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learningInsights" JSONB,
    "aiAnalysis" JSONB,
    "aiAnalyzedAt" TIMESTAMP(3),
    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exam_results_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exam_results_examId_fkey" FOREIGN KEY ("examId") 
        REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exam_results_licenseKeyId_fkey" FOREIGN KEY ("licenseKeyId") 
        REFERENCES "license_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "exam_results_userId_idx" ON "exam_results"("userId");
CREATE INDEX "exam_results_examId_idx" ON "exam_results"("examId");
CREATE INDEX "exam_results_status_idx" ON "exam_results"("status");
CREATE INDEX "exam_results_startedAt_idx" ON "exam_results"("startedAt");

-- 3-13. UserExamSessions 테이블
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
    CONSTRAINT "user_exam_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_exam_sessions_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_exam_sessions_examId_fkey" FOREIGN KEY ("examId") 
        REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "user_exam_sessions_userId_idx" ON "user_exam_sessions"("userId");
CREATE INDEX "user_exam_sessions_examId_idx" ON "user_exam_sessions"("examId");
CREATE INDEX "user_exam_sessions_expiresAt_idx" ON "user_exam_sessions"("expiresAt");

-- 3-14. AdaptiveQuestions 테이블
CREATE TABLE "adaptive_questions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "order" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3),
    "isCorrect" BOOLEAN,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "adaptive_questions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "adaptive_questions_sessionId_fkey" FOREIGN KEY ("sessionId") 
        REFERENCES "user_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "adaptive_questions_questionId_fkey" FOREIGN KEY ("questionId") 
        REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "adaptive_questions_examId_fkey" FOREIGN KEY ("examId") 
        REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "adaptive_questions_sessionId_idx" ON "adaptive_questions"("sessionId");
CREATE INDEX "adaptive_questions_questionId_idx" ON "adaptive_questions"("questionId");
CREATE INDEX "adaptive_questions_examId_idx" ON "adaptive_questions"("examId");
CREATE INDEX "adaptive_questions_sessionId_order_idx" ON "adaptive_questions"("sessionId", "order");

-- 3-15. SectionResults 테이블
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
    CONSTRAINT "section_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "section_results_examResultId_fkey" FOREIGN KEY ("examResultId") 
        REFERENCES "exam_results"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "section_results_sectionId_fkey" FOREIGN KEY ("sectionId") 
        REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "section_results_examResultId_idx" ON "section_results"("examResultId");
CREATE INDEX "section_results_sectionId_idx" ON "section_results"("sectionId");

-- 3-16. QuestionResults 테이블
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
    "aiExplanation" TEXT,
    "aiGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "question_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_results_sectionResultId_fkey" FOREIGN KEY ("sectionResultId") 
        REFERENCES "section_results"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_results_questionId_fkey" FOREIGN KEY ("questionId") 
        REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "question_results_sectionResultId_idx" ON "question_results"("sectionResultId");
CREATE INDEX "question_results_questionId_idx" ON "question_results"("questionId");
CREATE INDEX "question_results_isCorrect_idx" ON "question_results"("isCorrect");
CREATE INDEX "question_results_answeredAt_idx" ON "question_results"("answeredAt");

-- 3-17. WordBooks 테이블
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
    "extractedAt" TIMESTAMP(3),
    "sourceExamResultId" TEXT,
    CONSTRAINT "word_books_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "word_books_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "word_books_userId_idx" ON "word_books"("userId");
CREATE INDEX "word_books_word_idx" ON "word_books"("word");
CREATE INDEX "word_books_nextReviewAt_idx" ON "word_books"("nextReviewAt");
CREATE INDEX "word_books_tags_idx" ON "word_books" USING GIN ("tags");
CREATE INDEX "word_books_sourceExamResultId_idx" ON "word_books"("sourceExamResultId");

-- 3-18. UserGoals 테이블
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "milestones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_goals_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "user_goals_userId_idx" ON "user_goals"("userId");
CREATE INDEX "user_goals_status_idx" ON "user_goals"("status");
CREATE INDEX "user_goals_deadline_idx" ON "user_goals"("deadline");

-- 3-19. LearningPatterns 테이블
CREATE TABLE "learning_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hour" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "sessionLength" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "focusLevel" DOUBLE PRECISION,
    "efficiency" DOUBLE PRECISION,
    "examResultId" TEXT,
    CONSTRAINT "learning_patterns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_patterns_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "learning_patterns_userId_idx" ON "learning_patterns"("userId");
CREATE INDEX "learning_patterns_userId_date_idx" ON "learning_patterns"("userId", "date");
CREATE INDEX "learning_patterns_hour_idx" ON "learning_patterns"("hour");
CREATE INDEX "learning_patterns_dayOfWeek_idx" ON "learning_patterns"("dayOfWeek");

-- 3-20. LearningCycles 테이블
CREATE TABLE "learning_cycles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleType" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'identify',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "targetWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetExams" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvement" DOUBLE PRECISION,
    "wordsLearned" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "learning_cycles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_cycles_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "learning_cycles_userId_idx" ON "learning_cycles"("userId");
CREATE INDEX "learning_cycles_stage_idx" ON "learning_cycles"("stage");

-- 3-21. QuestionPools 테이블
CREATE TABLE "question_pools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "difficulty" "Difficulty",
    "questionIds" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "question_pools_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_pools_createdBy_fkey" FOREIGN KEY ("createdBy") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "question_pools_createdBy_idx" ON "question_pools"("createdBy");
CREATE INDEX "question_pools_tags_idx" ON "question_pools" USING GIN ("tags");
CREATE INDEX "question_pools_difficulty_idx" ON "question_pools"("difficulty");

-- 3-22. SiteSettings 테이블
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Exam Platform',
    "logoUrl" VARCHAR(500),
    "faviconUrl" VARCHAR(500),
    "primaryColor" VARCHAR(7),
    "secondaryColor" VARCHAR(7),
    "accentColor" VARCHAR(7),
    "colorScheme" JSONB,
    "aboutCompany" TEXT,
    "aboutTeam" TEXT,
    "contactInfo" JSONB,
    "serviceInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyStats" JSONB,
    "teamMembers" JSONB,
    "serviceFeatures" JSONB,
    "serviceBenefits" JSONB,
    "serviceProcess" JSONB,
    "company_values" JSONB,
    "team_culture" JSONB,
    "homeContent" JSONB,
    "aboutContent" JSONB,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "site_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") 
        REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "site_settings_isActive_idx" ON "site_settings"("isActive");

-- 3-23. AuditLogs 테이블
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
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- 3-24. KeyUsageLogs 테이블
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
    CONSTRAINT "key_usage_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "key_usage_logs_licenseKeyId_fkey" FOREIGN KEY ("licenseKeyId") 
        REFERENCES "license_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "key_usage_logs_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "key_usage_logs_licenseKeyId_idx" ON "key_usage_logs"("licenseKeyId");
CREATE INDEX "key_usage_logs_userId_idx" ON "key_usage_logs"("userId");
CREATE INDEX "key_usage_logs_createdAt_idx" ON "key_usage_logs"("createdAt");
CREATE INDEX "key_usage_logs_action_idx" ON "key_usage_logs"("action");

-- 3-25. Badges 테이블
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "icon" VARCHAR(50),
    "rarity" "BadgeRarity" NOT NULL DEFAULT 'common',
    "condition" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "badges_badgeType_idx" ON "badges"("badgeType");
CREATE INDEX "badges_isActive_idx" ON "badges"("isActive");

-- 3-26. UserBadges 테이블
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER DEFAULT 0,
    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_badges_userId_badgeId_key" UNIQUE ("userId", "badgeId"),
    CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") 
        REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");
CREATE INDEX "user_badges_badgeId_idx" ON "user_badges"("badgeId");
CREATE INDEX "user_badges_earnedAt_idx" ON "user_badges"("earnedAt");

-- ============================================
-- 4단계: 기본 데이터 삽입
-- ============================================

-- 4-1. 기본 SiteSettings 생성
INSERT INTO "site_settings" (
    "id",
    "companyName",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'Exam Platform',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- 4-2. 기본 배지 생성
INSERT INTO "badges" ("id", "badgeType", "name", "description", "icon", "rarity", "condition", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'exam_completed', '첫 시험 완료', '첫 번째 시험을 완료했습니다.', '🎯', 'common', '{"examCount": 1}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'exam_completed', '시험 마스터', '10개의 시험을 완료했습니다.', '🏆', 'rare', '{"examCount": 10}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'perfect_score', '만점 달성', '시험에서 만점을 받았습니다.', '💯', 'epic', '{}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'streak_days', '7일 연속 학습', '7일 연속으로 시험을 완료했습니다.', '🔥', 'rare', '{"streakDays": 7}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'streak_days', '30일 연속 학습', '30일 연속으로 시험을 완료했습니다.', '🌟', 'legendary', '{"streakDays": 30}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'word_master', '단어장 마스터', '100개의 단어를 학습했습니다.', '📚', 'rare', '{"wordCount": 100}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'improvement', '성적 향상', '최근 시험에서 20% 이상 성적이 향상되었습니다.', '📈', 'epic', '{"improvementRate": 20}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- ============================================
-- 완료!
-- ============================================
-- 이제 Prisma Client를 재생성하세요:
-- cd backend && npx prisma generate

