-- Enable Row Level Security (RLS) on all public tables
-- Run this SQL in Supabase SQL Editor or via Prisma migrate

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

-- IMPORTANT: This application uses NestJS backend with Prisma.
-- All database access goes through the backend API with JWT authentication.
-- The RLS policies below provide an additional security layer, but since
-- Prisma bypasses PostgREST, these policies mainly protect against direct
-- SQL/PostgREST access.

-- Basic restrictive policy: Only authenticated users through backend
-- For production, you may want to adjust these policies based on your needs.

-- Allow authenticated access (adjust based on your auth setup)
-- Note: If using Supabase Auth, use auth.uid() instead

-- For now, we'll use restrictive policies that require admin role
-- or match the user_id with the authenticated user

