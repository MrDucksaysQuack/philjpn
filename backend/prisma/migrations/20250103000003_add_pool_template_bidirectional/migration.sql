-- Add usedByTemplateIds field to question_pools table
-- This enables bidirectional tracking between Templates and Question Pools

-- Add the new column
ALTER TABLE "question_pools" ADD COLUMN IF NOT EXISTS "usedByTemplateIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "question_pools_usedByTemplateIds_idx" ON "question_pools" USING GIN ("usedByTemplateIds");

-- Backfill existing data: Update all pools to reflect their usage in templates
-- This query finds all templates that reference each pool and updates the pool's usedByTemplateIds
UPDATE "question_pools" qp
SET "usedByTemplateIds" = (
  SELECT ARRAY_AGG(DISTINCT et.id)
  FROM "exam_templates" et
  WHERE qp.id = ANY(et."questionPoolIds")
)
WHERE EXISTS (
  SELECT 1
  FROM "exam_templates" et
  WHERE qp.id = ANY(et."questionPoolIds")
);

