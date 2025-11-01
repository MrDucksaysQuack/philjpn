-- Enable Row Level Security (RLS) on all public tables
-- This migration enables RLS to comply with Supabase security requirements

-- Enable RLS on all tables
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question_banks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "license_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "section_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_exam_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "key_usage_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "word_books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- Note: Since this application uses NestJS backend with Prisma,
-- all database access goes through the backend API layer with JWT authentication.
-- RLS policies below are restrictive by default for security.

-- ============================================
-- RLS Policies for Users
-- ============================================
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile"
  ON "users" FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON "users" FOR UPDATE
  USING (auth.uid()::text = id);

-- ============================================
-- RLS Policies for Exams
-- ============================================
-- Public exams can be viewed by anyone, but only admins can modify
CREATE POLICY "Anyone can view active exams"
  ON "exams" FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Only admins can manage exams"
  ON "exams" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

-- ============================================
-- RLS Policies for Exam Results
-- ============================================
-- Users can only see their own exam results
CREATE POLICY "Users can view own exam results"
  ON "exam_results" FOR SELECT
  USING (
    user_id::text = current_setting('request.jwt.claim.sub', true)
  );

-- Admins can view all exam results
CREATE POLICY "Admins can view all exam results"
  ON "exam_results" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

-- ============================================
-- RLS Policies for License Keys
-- ============================================
-- Users can view their own license keys
CREATE POLICY "Users can view own license keys"
  ON "license_keys" FOR SELECT
  USING (
    user_id::text = current_setting('request.jwt.claim.sub', true)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

-- Only admins can manage license keys
CREATE POLICY "Only admins can manage license keys"
  ON "license_keys" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

-- ============================================
-- RLS Policies for Word Books
-- ============================================
-- Users can only see and manage their own words
CREATE POLICY "Users can manage own word books"
  ON "word_books" FOR ALL
  USING (
    user_id::text = current_setting('request.jwt.claim.sub', true)
  );

-- ============================================
-- RLS Policies for Audit Logs
-- ============================================
-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON "audit_logs" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

-- ============================================
-- RLS Policies for Other Tables
-- ============================================
-- Restrictive policies for internal tables
-- These should only be accessed through the backend API

-- Section, Question, Question Bank - Admin only
CREATE POLICY "Only admins can access sections"
  ON "sections" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can access questions"
  ON "questions" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can access question banks"
  ON "question_banks" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

-- Session and Result tables - Users can only see their own
CREATE POLICY "Users can manage own sessions"
  ON "user_exam_sessions" FOR ALL
  USING (
    user_id::text = current_setting('request.jwt.claim.sub', true)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view own section results"
  ON "section_results" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_results
      WHERE exam_results.id = section_results.exam_result_id
      AND exam_results.user_id::text = current_setting('request.jwt.claim.sub', true)
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view own question results"
  ON "question_results" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_results
      WHERE exam_results.id = question_results.exam_result_id
      AND exam_results.user_id::text = current_setting('request.jwt.claim.sub', true)
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view own key usage logs"
  ON "key_usage_logs" FOR SELECT
  USING (
    user_id::text = current_setting('request.jwt.claim.sub', true)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = current_setting('request.jwt.claim.sub', true)
      AND users.role = 'admin'
    )
  );

-- Note: _prisma_migrations table should remain restricted
-- It's only accessible through Prisma migrations
CREATE POLICY "No direct access to migrations"
  ON "_prisma_migrations" FOR ALL
  USING (false);

