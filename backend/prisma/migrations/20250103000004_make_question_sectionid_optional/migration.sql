-- Make Question.sectionId optional to support standalone question creation
-- This aligns with the architecture flow: Question → Pool → Template → Exam

-- Make sectionId nullable
ALTER TABLE "questions" ALTER COLUMN "sectionId" DROP NOT NULL;

-- Update questionNumber to have a default value for standalone questions
ALTER TABLE "questions" ALTER COLUMN "questionNumber" SET DEFAULT 1;

-- Note: Existing questions will keep their sectionId values
-- New standalone questions can be created with sectionId = NULL

