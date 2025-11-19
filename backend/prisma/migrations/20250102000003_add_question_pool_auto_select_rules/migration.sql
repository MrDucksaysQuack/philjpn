-- AlterTable
ALTER TABLE "question_pools" ADD COLUMN "autoSelectRules" JSONB,
ADD COLUMN "isAutoSelect" BOOLEAN NOT NULL DEFAULT false;

