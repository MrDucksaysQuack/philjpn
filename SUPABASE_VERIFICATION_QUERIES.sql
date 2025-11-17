-- ============================================
-- Supabase 데이터베이스 설정 확인 쿼리
-- ============================================
-- 이 쿼리들을 Supabase SQL Editor에서 실행하여 설정이 올바른지 확인하세요.
-- ============================================

-- ============================================
-- 1. Enum 타입 확인
-- ============================================
SELECT 
    typname AS enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN (
    'UserRole', 'ExamType', 'Difficulty', 'QuestionType', 'ResultStatus',
    'KeyType', 'LogStatus', 'GoalType', 'GoalStatus', 'BadgeType', 'BadgeRarity'
)
GROUP BY typname
ORDER BY typname;

-- 예상 결과: 11개의 Enum 타입이 표시되어야 합니다.

-- ============================================
-- 2. 테이블 목록 확인
-- ============================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
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
ORDER BY table_name;

-- 예상 결과: 26개의 테이블이 표시되어야 합니다.

-- ============================================
-- 3. 외래키 제약조건 확인
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 예상 결과: 모든 외래키 제약조건이 표시되어야 합니다.

-- ============================================
-- 4. 인덱스 확인
-- ============================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'categories', 'subcategories', 'exams', 'exam_configs',
        'sections', 'questions', 'question_banks', 'exam_results',
        'section_results', 'question_results', 'user_exam_sessions',
        'adaptive_questions', 'license_keys', 'license_key_batches',
        'key_usage_logs', 'word_books', 'audit_logs', 'user_goals',
        'learning_patterns', 'learning_cycles', 'exam_templates',
        'question_pools', 'site_settings', 'badges', 'user_badges'
    )
ORDER BY tablename, indexname;

-- 예상 결과: 각 테이블에 적절한 인덱스가 생성되어 있어야 합니다.

-- ============================================
-- 5. 기본 데이터 확인
-- ============================================

-- 5-1. SiteSettings 확인
SELECT 
    id,
    "companyName",
    "isActive",
    "createdAt"
FROM site_settings;

-- 예상 결과: 최소 1개의 레코드가 있어야 합니다.

-- 5-2. Badges 확인
SELECT 
    id,
    "badgeType",
    name,
    description,
    icon,
    rarity,
    "isActive"
FROM badges
ORDER BY "badgeType", name;

-- 예상 결과: 7개의 배지가 있어야 합니다.
-- - exam_completed: 첫 시험 완료, 시험 마스터
-- - perfect_score: 만점 달성
-- - streak_days: 7일 연속 학습, 30일 연속 학습
-- - word_master: 단어장 마스터
-- - improvement: 성적 향상

-- ============================================
-- 6. 테이블별 레코드 수 확인
-- ============================================
SELECT 
    'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'subcategories', COUNT(*) FROM subcategories
UNION ALL
SELECT 'exams', COUNT(*) FROM exams
UNION ALL
SELECT 'exam_configs', COUNT(*) FROM exam_configs
UNION ALL
SELECT 'sections', COUNT(*) FROM sections
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'question_banks', COUNT(*) FROM question_banks
UNION ALL
SELECT 'exam_results', COUNT(*) FROM exam_results
UNION ALL
SELECT 'section_results', COUNT(*) FROM section_results
UNION ALL
SELECT 'question_results', COUNT(*) FROM question_results
UNION ALL
SELECT 'user_exam_sessions', COUNT(*) FROM user_exam_sessions
UNION ALL
SELECT 'adaptive_questions', COUNT(*) FROM adaptive_questions
UNION ALL
SELECT 'license_keys', COUNT(*) FROM license_keys
UNION ALL
SELECT 'license_key_batches', COUNT(*) FROM license_key_batches
UNION ALL
SELECT 'key_usage_logs', COUNT(*) FROM key_usage_logs
UNION ALL
SELECT 'word_books', COUNT(*) FROM word_books
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'user_goals', COUNT(*) FROM user_goals
UNION ALL
SELECT 'learning_patterns', COUNT(*) FROM learning_patterns
UNION ALL
SELECT 'learning_cycles', COUNT(*) FROM learning_cycles
UNION ALL
SELECT 'exam_templates', COUNT(*) FROM exam_templates
UNION ALL
SELECT 'question_pools', COUNT(*) FROM question_pools
UNION ALL
SELECT 'site_settings', COUNT(*) FROM site_settings
UNION ALL
SELECT 'badges', COUNT(*) FROM badges
UNION ALL
SELECT 'user_badges', COUNT(*) FROM user_badges
ORDER BY table_name;

-- 예상 결과: 
-- - site_settings: 최소 1개
-- - badges: 7개
-- - 나머지 테이블: 0개 이상 (새로 생성된 경우 0개일 수 있음)

-- ============================================
-- 7. 특정 테이블 구조 확인 (예: users)
-- ============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================
-- 8. JSONB 필드 확인
-- ============================================
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type = 'jsonb'
ORDER BY table_name, column_name;

-- 예상 결과: JSONB 타입 필드들이 표시되어야 합니다.
-- (예: exams.adaptiveConfig, questions.options, site_settings.homeContent 등)

-- ============================================
-- 9. 배열 필드 확인
-- ============================================
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type LIKE '%[]'
ORDER BY table_name, column_name;

-- 예상 결과: 배열 타입 필드들이 표시되어야 합니다.
-- (예: questions.tags, word_books.tags, license_keys.examIds 등)

-- ============================================
-- 10. Primary Key 확인
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 예상 결과: 모든 테이블에 Primary Key가 설정되어 있어야 합니다.

-- ============================================
-- 11. Unique 제약조건 확인
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 예상 결과: 
-- - users.email: UNIQUE
-- - license_keys.key: UNIQUE
-- - exam_configs.examId: UNIQUE
-- - user_badges(userId, badgeId): UNIQUE

-- ============================================
-- 종합 확인 요약
-- ============================================
-- 위의 모든 쿼리를 실행한 후 다음을 확인하세요:
-- 
-- ✅ Enum 타입: 11개
-- ✅ 테이블: 26개
-- ✅ 외래키: 모든 관계가 올바르게 설정됨
-- ✅ 인덱스: 각 테이블에 적절한 인덱스 존재
-- ✅ 기본 데이터: site_settings 1개 이상, badges 7개
-- ✅ Primary Key: 모든 테이블에 설정됨
-- ✅ Unique 제약조건: 올바르게 설정됨
-- ✅ JSONB 필드: 올바르게 생성됨
-- ✅ 배열 필드: 올바르게 생성됨

