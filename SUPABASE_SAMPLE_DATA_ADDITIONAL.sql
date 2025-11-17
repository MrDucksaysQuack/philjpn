-- ============================================
-- Supabase 추가 샘플 데이터 삽입 스크립트
-- ============================================
-- SUPABASE_SAMPLE_DATA.sql에 빠진 테이블들의 샘플 데이터
-- 프론트엔드 연결 테스트용
-- ============================================
-- 
-- 이 스크립트는 SUPABASE_SAMPLE_DATA.sql 실행 후 실행하세요.
-- ============================================

-- ============================================
-- 11. QuestionBanks (문제 은행) 샘플 데이터
-- ============================================
INSERT INTO "question_banks" (
    "id", "name", "description", "category", "createdBy", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic 기본 어휘 문제 은행',
    'JFT-Basic 시험을 위한 기본 어휘 및 문법 문제 모음',
    'JFT-Basic',
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "question_banks" (
    "id", "name", "description", "category", "createdBy", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic 회화 표현 문제 은행',
    '일상 회화에서 자주 사용되는 표현 문제 모음',
    'JFT-Basic',
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. ExamTemplates (시험 템플릿) 샘플 데이터
-- ============================================
INSERT INTO "exam_templates" (
    "id", "name", "description", "structure", "questionPoolIds", "createdBy", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic 표준 템플릿',
    'JFT-Basic 시험의 표준 구조 템플릿',
    '{
        "sections": [
            {
                "title": "Part 1: 語彙・文法",
                "questionCount": 10,
                "timeLimit": null
            },
            {
                "title": "Part 2: 会話・表現",
                "questionCount": 10,
                "timeLimit": null
            },
            {
                "title": "Part 3: 読解",
                "questionCount": 10,
                "timeLimit": null
            }
        ],
        "totalTime": 60,
        "passingScore": 70
    }'::jsonb,
    ARRAY[]::TEXT[],
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 13. QuestionPools (문제 풀) 샘플 데이터
-- ============================================
INSERT INTO "question_pools" (
    "id", "name", "description", "tags", "difficulty", "questionIds", "createdBy", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic 조사 문제 풀',
    '일본어 조사(を, で, に 등) 관련 문제 모음',
    ARRAY['grammar', 'particle', '조사'],
    'medium',
    ARRAY[]::TEXT[], -- 실제 문제 ID로 업데이트 가능
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "question_pools" (
    "id", "name", "description", "tags", "difficulty", "questionIds", "createdBy", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic 회화 표현 문제 풀',
    '일상 회화 표현 문제 모음',
    ARRAY['conversation', 'expression', '회화'],
    'easy',
    ARRAY[]::TEXT[],
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 14. LicenseKeyBatches (라이선스 키 배치) 샘플 데이터
-- ============================================
INSERT INTO "license_key_batches" (
    "id", "name", "description", "keyType", "count", "examIds", "usageLimit", "validUntil", "createdBy", "createdAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic 테스트 배치 1',
    'JFT-Basic 시험 테스트용 라이선스 키 배치',
    'TEST_KEY',
    50,
    ARRAY[]::TEXT[], -- 모든 시험 사용 가능
    5, -- 각 키당 5회 사용 제한
    CURRENT_TIMESTAMP + INTERVAL '90 days', -- 90일 유효
    u.id,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. ExamResults (시험 결과) 샘플 데이터
-- ============================================
-- 완료된 시험 결과 샘플
INSERT INTO "exam_results" (
    "id", "userId", "examId", "licenseKeyId", "status", "totalScore", "maxScore",
    "percentage", "timeSpent", "startedAt", "submittedAt", "gradedAt",
    "extractedWords", "learningInsights", "aiAnalysis", "aiAnalyzedAt",
    "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    e.id,
    lk.id,
    'completed',
    25, -- 총 점수
    30, -- 만점
    83.33, -- 백분율
    45, -- 소요 시간 (분)
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '45 minutes',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '46 minutes',
    ARRAY['はきます', '今日', '道', 'を', 'で']::TEXT[], -- 추출된 단어
    '{
        "strengths": ["문법 이해", "어휘력"],
        "weaknesses": ["독해 속도", "회화 표현"],
        "recommendations": ["독해 연습 강화", "회화 표현 암기"]
    }'::jsonb,
    '{
        "overall": "전반적으로 좋은 성적입니다.",
        "details": "문법과 어휘 부분에서 강점을 보였습니다."
    }'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '47 minutes',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '46 minutes'
FROM "users" u, "exams" e, "license_keys" lk
WHERE u.email = 'user1@example.com'
    AND e.title LIKE '%Mock Test 1%'
    AND lk.key = 'TEST-KEY-001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 진행 중인 시험 결과 샘플
INSERT INTO "exam_results" (
    "id", "userId", "examId", "licenseKeyId", "status", "startedAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    e.id,
    lk.id,
    'in_progress',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
    CURRENT_TIMESTAMP - INTERVAL '5 minutes'
FROM "users" u, "exams" e, "license_keys" lk
WHERE u.email = 'user2@example.com'
    AND e.title LIKE '%Mock Test 1%'
    AND lk.key = 'TEST-KEY-001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 16. SectionResults (섹션 결과) 샘플 데이터
-- ============================================
-- 완료된 시험의 섹션 결과들
INSERT INTO "section_results" (
    "id", "examResultId", "sectionId", "correctCount", "incorrectCount",
    "unansweredCount", "score", "maxScore", "timeSpent", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    er.id,
    s.id,
    4, -- 정답 수
    1, -- 오답 수
    0, -- 미답 수
    4, -- 점수
    5, -- 만점
    15, -- 소요 시간 (분)
    er."submittedAt",
    er."submittedAt"
FROM "exam_results" er
JOIN "exams" e ON er."examId" = e.id
JOIN "sections" s ON s."examId" = e.id
WHERE er."status" = 'completed'
    AND s."order" = 1 -- Part 1
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "section_results" (
    "id", "examResultId", "sectionId", "correctCount", "incorrectCount",
    "unansweredCount", "score", "maxScore", "timeSpent", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    er.id,
    s.id,
    3,
    0,
    0,
    3,
    3,
    15,
    er."submittedAt",
    er."submittedAt"
FROM "exam_results" er
JOIN "exams" e ON er."examId" = e.id
JOIN "sections" s ON s."examId" = e.id
WHERE er."status" = 'completed'
    AND s."order" = 2 -- Part 2
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "section_results" (
    "id", "examResultId", "sectionId", "correctCount", "incorrectCount",
    "unansweredCount", "score", "maxScore", "timeSpent", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    er.id,
    s.id,
    2,
    0,
    0,
    2,
    2,
    15,
    er."submittedAt",
    er."submittedAt"
FROM "exam_results" er
JOIN "exams" e ON er."examId" = e.id
JOIN "sections" s ON s."examId" = e.id
WHERE er."status" = 'completed'
    AND s."order" = 3 -- Part 3
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 17. QuestionResults (문제 결과) 샘플 데이터
-- ============================================
-- Part 1의 문제 결과들
INSERT INTO "question_results" (
    "id", "sectionResultId", "questionId", "userAnswer", "isCorrect",
    "pointsEarned", "pointsPossible", "timeSpent", "answeredAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    sr.id,
    q.id,
    'C', -- 사용자 답안
    true, -- 정답
    1, -- 획득 점수
    1, -- 가능 점수
    90, -- 소요 시간 (초)
    er."submittedAt" - INTERVAL '30 minutes',
    er."submittedAt" - INTERVAL '30 minutes',
    er."submittedAt" - INTERVAL '30 minutes'
FROM "section_results" sr
JOIN "exam_results" er ON sr."examResultId" = er.id
JOIN "sections" s ON sr."sectionId" = s.id
JOIN "questions" q ON q."sectionId" = s.id
WHERE er."status" = 'completed'
    AND s."order" = 1
    AND q."questionNumber" = 1
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "question_results" (
    "id", "sectionResultId", "questionId", "userAnswer", "isCorrect",
    "pointsEarned", "pointsPossible", "timeSpent", "answeredAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    sr.id,
    q.id,
    'A',
    true,
    1,
    1,
    75,
    er."submittedAt" - INTERVAL '28 minutes',
    er."submittedAt" - INTERVAL '28 minutes',
    er."submittedAt" - INTERVAL '28 minutes'
FROM "section_results" sr
JOIN "exam_results" er ON sr."examResultId" = er.id
JOIN "sections" s ON sr."sectionId" = s.id
JOIN "questions" q ON q."sectionId" = s.id
WHERE er."status" = 'completed'
    AND s."order" = 1
    AND q."questionNumber" = 2
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "question_results" (
    "id", "sectionResultId", "questionId", "userAnswer", "isCorrect",
    "pointsEarned", "pointsPossible", "timeSpent", "answeredAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    sr.id,
    q.id,
    'B', -- 오답
    false,
    0,
    1,
    120,
    er."submittedAt" - INTERVAL '25 minutes',
    er."submittedAt" - INTERVAL '25 minutes',
    er."submittedAt" - INTERVAL '25 minutes'
FROM "section_results" sr
JOIN "exam_results" er ON sr."examResultId" = er.id
JOIN "sections" s ON sr."sectionId" = s.id
JOIN "questions" q ON q."sectionId" = s.id
WHERE er."status" = 'completed'
    AND s."order" = 1
    AND q."questionNumber" = 3
LIMIT 1
ON CONFLICT DO NOTHING;

-- Part 2의 문제 결과들
INSERT INTO "question_results" (
    "id", "sectionResultId", "questionId", "userAnswer", "isCorrect",
    "pointsEarned", "pointsPossible", "timeSpent", "answeredAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    sr.id,
    q.id,
    'A',
    true,
    1,
    1,
    60,
    er."submittedAt" - INTERVAL '15 minutes',
    er."submittedAt" - INTERVAL '15 minutes',
    er."submittedAt" - INTERVAL '15 minutes'
FROM "section_results" sr
JOIN "exam_results" er ON sr."examResultId" = er.id
JOIN "sections" s ON sr."sectionId" = s.id
JOIN "questions" q ON q."sectionId" = s.id
WHERE er."status" = 'completed'
    AND s."order" = 2
    AND q."questionNumber" = 1
LIMIT 1
ON CONFLICT DO NOTHING;

-- Part 3의 문제 결과들
INSERT INTO "question_results" (
    "id", "sectionResultId", "questionId", "userAnswer", "isCorrect",
    "pointsEarned", "pointsPossible", "timeSpent", "answeredAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    sr.id,
    q.id,
    'B',
    true,
    1,
    1,
    180,
    er."submittedAt" - INTERVAL '5 minutes',
    er."submittedAt" - INTERVAL '5 minutes',
    er."submittedAt" - INTERVAL '5 minutes'
FROM "section_results" sr
JOIN "exam_results" er ON sr."examResultId" = er.id
JOIN "sections" s ON sr."sectionId" = s.id
JOIN "questions" q ON q."sectionId" = s.id
WHERE er."status" = 'completed'
    AND s."order" = 3
    AND q."questionNumber" = 1
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 18. UserExamSessions (사용자 시험 세션) 샘플 데이터
-- ============================================
-- 진행 중인 시험 세션
INSERT INTO "user_exam_sessions" (
    "id", "userId", "examId", "examResultId", "currentSectionId", "currentQuestionNumber",
    "answers", "startTime", "lastActivityAt", "expiresAt", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    e.id,
    er.id,
    s.id,
    3, -- 현재 3번 문제
    '{
        "question-1": "C",
        "question-2": "A"
    }'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
    CURRENT_TIMESTAMP - INTERVAL '5 minutes',
    CURRENT_TIMESTAMP + INTERVAL '30 minutes', -- 30분 후 만료
    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
    CURRENT_TIMESTAMP - INTERVAL '5 minutes'
FROM "users" u, "exams" e, "exam_results" er, "sections" s
WHERE u.email = 'user2@example.com'
    AND e.title LIKE '%Mock Test 1%'
    AND er."userId" = u.id
    AND er."examId" = e.id
    AND er."status" = 'in_progress'
    AND s."examId" = e.id
    AND s."order" = 1
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 19. WordBooks (단어장) 샘플 데이터
-- ============================================
INSERT INTO "word_books" (
    "id", "userId", "word", "meaning", "example", "difficulty",
    "source", "sourceId", "masteryLevel", "reviewCount", "lastReviewedAt",
    "nextReviewAt", "tags", "createdAt", "updatedAt", "extractedAt", "sourceExamResultId"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    'はきます',
    '신다, 입다 (신발, 양말, 바지)',
    '靴をはきます。',
    'easy',
    'exam',
    er.id::text,
    2, -- 숙련도 레벨 (0-5)
    3, -- 복습 횟수
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '2 days', -- 다음 복습일
    ARRAY['vocabulary', 'verb', 'clothing'],
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    er.id
FROM "users" u, "exam_results" er
WHERE u.email = 'user1@example.com'
    AND er."userId" = u.id
    AND er."status" = 'completed'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "word_books" (
    "id", "userId", "word", "meaning", "example", "difficulty",
    "source", "sourceId", "masteryLevel", "reviewCount", "lastReviewedAt",
    "nextReviewAt", "tags", "createdAt", "updatedAt", "extractedAt", "sourceExamResultId"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    '今日',
    '오늘',
    '今日はいい天気です。',
    'easy',
    'exam',
    er.id::text,
    3,
    5,
    CURRENT_TIMESTAMP - INTERVAL '12 hours',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    ARRAY['kanji', 'vocabulary', 'time'],
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '12 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    er.id
FROM "users" u, "exam_results" er
WHERE u.email = 'user1@example.com'
    AND er."userId" = u.id
    AND er."status" = 'completed'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "word_books" (
    "id", "userId", "word", "meaning", "example", "difficulty",
    "source", "sourceId", "masteryLevel", "reviewCount", "lastReviewedAt",
    "nextReviewAt", "tags", "createdAt", "updatedAt", "extractedAt", "sourceExamResultId"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    '道',
    '길, 도로',
    '道をわたります。',
    'medium',
    'exam',
    er.id::text,
    1,
    1,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    ARRAY['vocabulary', 'noun', 'place'],
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    er.id
FROM "users" u, "exam_results" er
WHERE u.email = 'user1@example.com'
    AND er."userId" = u.id
    AND er."status" = 'completed'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 20. UserGoals (사용자 목표) 샘플 데이터
-- ============================================
INSERT INTO "user_goals" (
    "id", "userId", "goalType", "targetValue", "currentValue", "deadline",
    "status", "milestones", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    'exam_count',
    10, -- 목표: 10개 시험 완료
    1,  -- 현재: 1개 완료
    CURRENT_TIMESTAMP + INTERVAL '30 days', -- 30일 후 마감
    'active',
    '{
        "milestones": [
            {"value": 3, "achieved": false},
            {"value": 5, "achieved": false},
            {"value": 10, "achieved": false}
        ]
    }'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.email = 'user1@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "user_goals" (
    "id", "userId", "goalType", "targetValue", "currentValue", "deadline",
    "status", "milestones", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    'score_target',
    80, -- 목표: 80점 이상
    83, -- 현재: 83점
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    'active',
    '{
        "milestones": [
            {"value": 70, "achieved": true},
            {"value": 80, "achieved": true}
        ]
    }'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.email = 'user1@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 21. UserBadges (사용자 배지) 샘플 데이터
-- ============================================
INSERT INTO "user_badges" (
    "id", "userId", "badgeId", "earnedAt", "progress"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    b.id,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    100 -- 100% 완료
FROM "users" u, "badges" b
WHERE u.email = 'user1@example.com'
    AND b.name = '첫 시험 완료'
LIMIT 1
ON CONFLICT ("userId", "badgeId") DO NOTHING;

-- 진행 중인 배지 (아직 획득하지 않음)
INSERT INTO "user_badges" (
    "id", "userId", "badgeId", "earnedAt", "progress"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    b.id,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    30 -- 30% 진행
FROM "users" u, "badges" b
WHERE u.email = 'user1@example.com'
    AND b.name = '시험 마스터'
LIMIT 1
ON CONFLICT ("userId", "badgeId") DO UPDATE
SET "progress" = 30;

-- ============================================
-- 22. KeyUsageLogs (라이선스 키 사용 로그) 샘플 데이터
-- ============================================
INSERT INTO "key_usage_logs" (
    "id", "licenseKeyId", "userId", "examId", "examResultId", "action",
    "status", "ipAddress", "userAgent", "createdAt"
)
SELECT 
    gen_random_uuid()::text,
    lk.id,
    u.id,
    e.id,
    er.id,
    'exam_started',
    'success',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM "license_keys" lk, "users" u, "exams" e, "exam_results" er
WHERE lk.key = 'TEST-KEY-001'
    AND u.email = 'user1@example.com'
    AND e.title LIKE '%Mock Test 1%'
    AND er."userId" = u.id
    AND er."examId" = e.id
    AND er."licenseKeyId" = lk.id
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "key_usage_logs" (
    "id", "licenseKeyId", "userId", "examId", "examResultId", "action",
    "status", "ipAddress", "userAgent", "createdAt"
)
SELECT 
    gen_random_uuid()::text,
    lk.id,
    u.id,
    e.id,
    er.id,
    'exam_completed',
    'success',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '45 minutes'
FROM "license_keys" lk, "users" u, "exams" e, "exam_results" er
WHERE lk.key = 'TEST-KEY-001'
    AND u.email = 'user1@example.com'
    AND e.title LIKE '%Mock Test 1%'
    AND er."userId" = u.id
    AND er."examId" = e.id
    AND er."licenseKeyId" = lk.id
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 23. AuditLogs (감사 로그) 샘플 데이터
-- ============================================
INSERT INTO "audit_logs" (
    "id", "userId", "action", "entityType", "entityId", "changes",
    "ipAddress", "userAgent", "createdAt"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    'exam_created',
    'Exam',
    e.id,
    '{"title": "JFT-Basic Mock Test 1 (읽기·문법)", "status": "created"}'::jsonb,
    '192.168.1.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
FROM "users" u, "exams" e
WHERE u.role = 'admin'
    AND e.title LIKE '%Mock Test 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "audit_logs" (
    "id", "userId", "action", "entityType", "entityId", "changes",
    "ipAddress", "userAgent", "createdAt"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    'user_login',
    'User',
    u2.id,
    jsonb_build_object('lastLoginAt', (CURRENT_TIMESTAMP - INTERVAL '1 day')::text),
    '192.168.1.50',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM "users" u, "users" u2
WHERE u.role = 'admin'
    AND u2.email = 'user1@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 24. LearningPatterns (학습 패턴) 샘플 데이터
-- ============================================
INSERT INTO "learning_patterns" (
    "id", "userId", "date", "hour", "dayOfWeek", "sessionLength",
    "score", "focusLevel", "efficiency", "examResultId"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    14, -- 오후 2시
    5,  -- 금요일 (0=일요일)
    45, -- 45분
    83.33, -- 점수
    0.85, -- 집중도
    0.92, -- 효율성
    er.id
FROM "users" u, "exam_results" er
WHERE u.email = 'user1@example.com'
    AND er."userId" = u.id
    AND er."status" = 'completed'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 25. LearningCycles (학습 사이클) 샘플 데이터
-- ============================================
INSERT INTO "learning_cycles" (
    "id", "userId", "cycleType", "stage", "startDate", "endDate",
    "targetWords", "targetExams", "improvement", "wordsLearned"
)
SELECT 
    gen_random_uuid()::text,
    u.id,
    'vocabulary_focus',
    'practice', -- identify, practice, review, master
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    NULL, -- 아직 진행 중
    ARRAY['はきます', '今日', '道', 'を', 'で']::TEXT[],
    ARRAY[]::TEXT[],
    15.5, -- 개선률 (%)
    5 -- 학습한 단어 수
FROM "users" u
WHERE u.email = 'user1@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 완료 메시지
-- ============================================
-- 추가 샘플 데이터 삽입이 완료되었습니다!
-- 
-- 추가된 데이터:
-- - QuestionBanks: 2개
-- - ExamTemplates: 1개
-- - QuestionPools: 2개
-- - LicenseKeyBatches: 1개
-- - ExamResults: 2개 (완료 1개, 진행 중 1개)
-- - SectionResults: 3개
-- - QuestionResults: 5개
-- - UserExamSessions: 1개
-- - WordBooks: 3개
-- - UserGoals: 2개
-- - UserBadges: 2개
-- - KeyUsageLogs: 2개
-- - AuditLogs: 2개
-- - LearningPatterns: 1개
-- - LearningCycles: 1개
--
-- 이제 프론트엔드에서 다음 기능들을 테스트할 수 있습니다:
-- - 시험 결과 페이지 (/results/[id])
-- - 단어장 페이지 (/wordbook)
-- - 목표 진행 상황 (대시보드)
-- - 배지 획득 현황
-- - 학습 패턴 분석

