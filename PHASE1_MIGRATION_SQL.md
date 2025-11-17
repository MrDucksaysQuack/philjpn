# Phase 1 개선: 데이터베이스 마이그레이션 SQL

## 1. Exam 테이블에 randomSeed 컬럼 추가

```sql
-- exams 테이블에 randomSeed 컬럼 추가
ALTER TABLE "exams" 
ADD COLUMN IF NOT EXISTS "randomSeed" INTEGER;

-- 컬럼에 대한 설명 추가 (선택사항)
COMMENT ON COLUMN "exams"."randomSeed" IS '랜덤 시드 (템플릿 기반 생성 시 사용, 재현성 보장)';
```

## 실행 방법

1. Supabase Dashboard → SQL Editor로 이동
2. 위 SQL을 복사하여 실행
3. Prisma Client 재생성: `npx prisma generate`

## 확인

마이그레이션 후 다음 명령어로 확인:
```bash
cd backend
npx prisma db pull
npx prisma generate
```

