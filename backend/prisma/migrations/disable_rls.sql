-- Disable Row Level Security (RLS) on all public tables
-- This is safe because:
-- 1. All database access goes through the NestJS backend API
-- 2. Backend handles authentication and authorization with JWT
-- 3. Frontend never connects directly to Supabase
-- 4. RLS policies are not needed when using Prisma with backend-only access
-- Run this SQL in Supabase SQL Editor

-- Disable RLS on all tables
ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "adaptive_questions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "badges" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_configs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_results" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_templates" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "exams" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "key_usage_logs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_cycles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_patterns" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "license_key_batches" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "license_keys" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "question_banks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "question_pools" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "question_results" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "questions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "section_results" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "sections" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "subcategories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_badges" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_exam_sessions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_goals" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "word_books" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "question_statistics" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_versions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "content_versions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "site_settings_versions" DISABLE ROW LEVEL SECURITY;

