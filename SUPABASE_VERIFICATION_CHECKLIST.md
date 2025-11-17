# Supabase 데이터베이스 설정 확인 체크리스트

## ✅ 확인 방법

`SUPABASE_VERIFICATION_QUERIES.sql` 파일의 쿼리를 Supabase SQL Editor에서 실행하여 확인하세요.

---

## 📋 필수 확인 항목

### 1. Enum 타입 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "1. Enum 타입 확인"

**예상 결과**:
- ✅ `UserRole`: user, admin, partner
- ✅ `ExamType`: mock, practice, official
- ✅ `Difficulty`: easy, medium, hard
- ✅ `QuestionType`: multiple_choice, fill_blank, essay
- ✅ `ResultStatus`: in_progress, completed, abandoned, graded
- ✅ `KeyType`: ACCESS_KEY, TEST_KEY, ADMIN_KEY
- ✅ `LogStatus`: success, failed, rejected
- ✅ `GoalType`: score_target, weakness_recovery, exam_count, word_count
- ✅ `GoalStatus`: active, achieved, failed, paused
- ✅ `BadgeType`: exam_completed, perfect_score, streak_days, word_master, improvement, category_master, speed_demon, consistency
- ✅ `BadgeRarity`: common, rare, epic, legendary

**총 11개의 Enum 타입이 있어야 합니다.**

---

### 2. 테이블 목록 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "2. 테이블 목록 확인"

**예상 결과**: 다음 26개 테이블이 모두 있어야 합니다.

1. ✅ `users`
2. ✅ `categories`
3. ✅ `subcategories`
4. ✅ `exams`
5. ✅ `exam_configs`
6. ✅ `sections`
7. ✅ `questions`
8. ✅ `question_banks`
9. ✅ `exam_results`
10. ✅ `section_results`
11. ✅ `question_results`
12. ✅ `user_exam_sessions`
13. ✅ `adaptive_questions`
14. ✅ `license_keys`
15. ✅ `license_key_batches`
16. ✅ `key_usage_logs`
17. ✅ `word_books`
18. ✅ `audit_logs`
19. ✅ `user_goals`
20. ✅ `learning_patterns`
21. ✅ `learning_cycles`
22. ✅ `exam_templates`
23. ✅ `question_pools`
24. ✅ `site_settings`
25. ✅ `badges`
26. ✅ `user_badges`

---

### 3. 외래키 제약조건 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "3. 외래키 제약조건 확인"

**주요 외래키 관계**:
- ✅ `exams.createdBy` → `users.id`
- ✅ `exams.categoryId` → `categories.id`
- ✅ `exams.subcategoryId` → `subcategories.id`
- ✅ `sections.examId` → `exams.id`
- ✅ `questions.sectionId` → `sections.id`
- ✅ `exam_results.userId` → `users.id`
- ✅ `exam_results.examId` → `exams.id`
- ✅ `license_keys.userId` → `users.id`
- ✅ `word_books.userId` → `users.id`
- ✅ `user_badges.userId` → `users.id`
- ✅ `user_badges.badgeId` → `badges.id`
- ✅ 기타 모든 외래키 관계

---

### 4. 인덱스 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "4. 인덱스 확인"

**주요 인덱스**:
- ✅ `users.email` (UNIQUE)
- ✅ `users.role`
- ✅ `exams.examType`
- ✅ `exams.categoryId`
- ✅ `exams.subcategoryId`
- ✅ `questions.sectionId`
- ✅ `questions.tags` (GIN 인덱스)
- ✅ `exam_results.userId`
- ✅ `exam_results.examId`
- ✅ `license_keys.key` (UNIQUE)
- ✅ 기타 모든 인덱스

---

### 5. 기본 데이터 확인 ✅

#### 5-1. SiteSettings 확인
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "5-1. SiteSettings 확인"

**예상 결과**:
- ✅ 최소 1개의 레코드 존재
- ✅ `companyName` = 'Exam Platform'
- ✅ `isActive` = true

#### 5-2. Badges 확인
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "5-2. Badges 확인"

**예상 결과**: 7개의 배지가 있어야 합니다.

1. ✅ **첫 시험 완료** (exam_completed, common)
2. ✅ **시험 마스터** (exam_completed, rare)
3. ✅ **만점 달성** (perfect_score, epic)
4. ✅ **7일 연속 학습** (streak_days, rare)
5. ✅ **30일 연속 학습** (streak_days, legendary)
6. ✅ **단어장 마스터** (word_master, rare)
7. ✅ **성적 향상** (improvement, epic)

---

### 6. Primary Key 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "10. Primary Key 확인"

**예상 결과**: 모든 26개 테이블에 Primary Key가 설정되어 있어야 합니다.

---

### 7. Unique 제약조건 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "11. Unique 제약조건 확인"

**예상 결과**:
- ✅ `users.email` (UNIQUE)
- ✅ `license_keys.key` (UNIQUE)
- ✅ `exam_configs.examId` (UNIQUE)
- ✅ `user_badges(userId, badgeId)` (UNIQUE)

---

### 8. JSONB 필드 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "8. JSONB 필드 확인"

**주요 JSONB 필드**:
- ✅ `exams.adaptiveConfig`
- ✅ `questions.options`
- ✅ `site_settings.homeContent`
- ✅ `site_settings.aboutContent`
- ✅ `site_settings.colorScheme`
- ✅ `badges.condition`
- ✅ 기타 JSONB 필드

---

### 9. 배열 필드 확인 ✅
**쿼리**: `SUPABASE_VERIFICATION_QUERIES.sql`의 "9. 배열 필드 확인"

**주요 배열 필드**:
- ✅ `questions.tags` (TEXT[])
- ✅ `word_books.tags` (TEXT[])
- ✅ `license_keys.examIds` (TEXT[])
- ✅ `exam_templates.questionPoolIds` (TEXT[])
- ✅ `exam_results.extractedWords` (TEXT[])
- ✅ 기타 배열 필드

---

## 🔍 빠른 확인 쿼리

모든 항목을 한 번에 확인하려면 다음 쿼리를 실행하세요:

```sql
-- 종합 확인
SELECT 
    'Enum Types' AS check_type,
    COUNT(DISTINCT typname) AS count,
    'Expected: 11' AS expected
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN (
    'UserRole', 'ExamType', 'Difficulty', 'QuestionType', 'ResultStatus',
    'KeyType', 'LogStatus', 'GoalType', 'GoalStatus', 'BadgeType', 'BadgeRarity'
)
UNION ALL
SELECT 
    'Tables',
    COUNT(*),
    'Expected: 26'
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'users', 'categories', 'subcategories', 'exams', 'exam_configs',
        'sections', 'questions', 'question_banks', 'exam_results',
        'section_results', 'question_results', 'user_exam_sessions',
        'adaptive_questions', 'license_keys', 'license_key_batches',
        'key_usage_logs', 'word_books', 'audit_logs', 'user_goals',
        'learning_patterns', 'learning_cycles', 'exam_templates',
        'question_pools', 'site_settings', 'badges', 'user_badges'
    )
UNION ALL
SELECT 
    'Foreign Keys',
    COUNT(*),
    'Expected: Many'
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
UNION ALL
SELECT 
    'Site Settings',
    COUNT(*),
    'Expected: >= 1'
FROM site_settings
UNION ALL
SELECT 
    'Badges',
    COUNT(*),
    'Expected: 7'
FROM badges;
```

---

## ✅ 완료 체크리스트

- [ ] Enum 타입 11개 확인
- [ ] 테이블 26개 확인
- [ ] 외래키 제약조건 확인
- [ ] 인덱스 확인
- [ ] SiteSettings 기본 데이터 확인
- [ ] Badges 7개 확인
- [ ] Primary Key 확인
- [ ] Unique 제약조건 확인
- [ ] JSONB 필드 확인
- [ ] 배열 필드 확인

---

## 🚨 문제 발생 시

### 에러: "relation does not exist"
- 해당 테이블이 생성되지 않았습니다.
- `SUPABASE_SQL_COMPLETE.sql`을 다시 실행하세요.

### 에러: "foreign key constraint"
- 외래키 관계가 올바르게 설정되지 않았습니다.
- 테이블 생성 순서를 확인하세요.

### Badges가 7개가 아님
- 기본 데이터 삽입이 완료되지 않았습니다.
- `SUPABASE_SQL_COMPLETE.sql`의 4단계를 다시 실행하세요.

### SiteSettings가 없음
- 기본 데이터 삽입이 완료되지 않았습니다.
- `SUPABASE_SQL_COMPLETE.sql`의 4단계를 다시 실행하세요.

---

## 🎉 모든 확인이 완료되면

1. ✅ Prisma Client 재생성:
   ```bash
   cd backend
   npx prisma generate
   ```

2. ✅ 애플리케이션 테스트:
   - 백엔드 서버 시작
   - 프론트엔드 연결 확인
   - 기본 기능 테스트

3. ✅ 관리자 계정 생성:
   - 회원가입 API를 통해 관리자 계정 생성
   - 또는 Supabase Dashboard에서 직접 생성

---

## 📝 확인 결과 기록

확인 완료 후 아래에 체크하세요:

- [ ] 모든 Enum 타입 정상
- [ ] 모든 테이블 정상
- [ ] 모든 외래키 정상
- [ ] 모든 인덱스 정상
- [ ] 기본 데이터 정상
- [ ] Prisma Client 재생성 완료
- [ ] 애플리케이션 테스트 완료

**확인 일시**: _______________
**확인자**: _______________

