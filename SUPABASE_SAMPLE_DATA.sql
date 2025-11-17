-- ============================================
-- Supabase 샘플 데이터 삽입 스크립트
-- ============================================
-- JFT-Basic 시험 형식에 맞춘 샘플 데이터
-- 프론트엔드 연결 테스트용
-- ============================================

-- ============================================
-- 1. Users (사용자) 샘플 데이터
-- ============================================
-- 주의: 비밀번호는 bcrypt로 해시화되어야 합니다.
-- 실제 사용 시에는 NestJS AuthService를 통해 생성하세요.
-- 여기서는 예시용으로 해시화된 비밀번호를 사용합니다.

-- 관리자 계정 (비밀번호: admin123)
-- bcrypt 해시: $2b$10$rOzJqJqJqJqJqJqJqJqJqO (예시)
INSERT INTO "users" ("id", "email", "password", "name", "role", "isActive", "isEmailVerified", "createdAt", "updatedAt")
VALUES 
    (
        gen_random_uuid()::text,
        'admin@example.com',
        '$2b$10$rOzJqJqJqJqJqJqJqJqJqO', -- 실제로는 NestJS에서 생성
        '관리자',
        'admin',
        true,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'user1@example.com',
        '$2b$10$rOzJqJqJqJqJqJqJqJqJqO',
        '테스트 사용자1',
        'user',
        true,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'user2@example.com',
        '$2b$10$rOzJqJqJqJqJqJqJqJqJqO',
        '테스트 사용자2',
        'user',
        true,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("email") DO NOTHING;

-- ============================================
-- 2. Categories (카테고리) 샘플 데이터
-- ============================================
INSERT INTO "categories" ("id", "name", "description", "icon", "order", "isActive", "createdAt", "updatedAt")
VALUES 
    (
        gen_random_uuid()::text,
        '일본어 시험',
        'JFT-Basic, JLPT 등 일본어 능력 시험',
        '🇯🇵',
        1,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        '영어 시험',
        'TOEIC, TOEFL 등 영어 능력 시험',
        '🇺🇸',
        2,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        '기타 시험',
        '기타 언어 및 자격 시험',
        '📚',
        3,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. Subcategories (서브카테고리) 샘플 데이터
-- ============================================
INSERT INTO "subcategories" ("id", "categoryId", "name", "description", "icon", "order", "isActive", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    c.id,
    'JFT-Basic',
    '일본어 기초 실용 능력 평가 시험',
    '📝',
    1,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "categories" c
WHERE c.name = '일본어 시험'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "subcategories" ("id", "categoryId", "name", "description", "icon", "order", "isActive", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    c.id,
    'JLPT',
    '일본어 능력 시험',
    '🎌',
    2,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "categories" c
WHERE c.name = '일본어 시험'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Exams (시험) 샘플 데이터
-- ============================================
-- Mock Test 1: 읽기·문법 파트
INSERT INTO "exams" (
    "id", "title", "description", "examType", "subject", "difficulty",
    "totalQuestions", "totalSections", "estimatedTime", "passingScore",
    "isActive", "isPublic", "createdBy", "categoryId", "subcategoryId",
    "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic Mock Test 1 (읽기·문법)',
    'JFT-Basic 형식의 모의고사입니다. Part 1 (語彙・文法), Part 2 (会話・表現), Part 3 (読解)를 포함합니다.',
    'mock',
    'JFT-Basic',
    'medium',
    30, -- 총 문제 수
    3,  -- Part 1, 2, 3
    60, -- 예상 소요 시간 (분)
    70, -- 합격 점수 (%)
    true,
    true,
    u.id,
    cat.id,
    sub.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u, "categories" cat, "subcategories" sub
WHERE u.role = 'admin' 
    AND cat.name = '일본어 시험'
    AND sub.name = 'JFT-Basic'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Listening Test 1: 청해 파트
INSERT INTO "exams" (
    "id", "title", "description", "examType", "subject", "difficulty",
    "totalQuestions", "totalSections", "estimatedTime", "passingScore",
    "isActive", "isPublic", "createdBy", "categoryId", "subcategoryId",
    "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'JFT-Basic Listening Test 1 (청해)',
    'JFT-Basic 형식의 청해 모의고사입니다. Part 4 (聴解)를 포함합니다.',
    'mock',
    'JFT-Basic',
    'medium',
    10, -- 총 문제 수
    1,  -- Part 4만
    20, -- 예상 소요 시간 (분)
    70, -- 합격 점수 (%)
    true,
    true,
    u.id,
    cat.id,
    sub.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u, "categories" cat, "subcategories" sub
WHERE u.role = 'admin' 
    AND cat.name = '일본어 시험'
    AND sub.name = 'JFT-Basic'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. ExamConfigs (시험 설정) 샘플 데이터
-- ============================================
INSERT INTO "exam_configs" (
    "id", "examId", "allowSectionNavigation", "allowQuestionReview",
    "showAnswerAfterSubmit", "showScoreImmediately", "timeLimitPerSection",
    "shuffleQuestions", "shuffleOptions", "preventTabSwitch",
    "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    e.id,
    true,  -- 섹션 간 이동 허용
    true,  -- 문제 복습 허용
    true,  -- 제출 후 정답 표시
    true,  -- 즉시 점수 표시
    false, -- 섹션별 시간 제한 없음
    false, -- 문제 순서 섞기 안 함
    false, -- 선택지 순서 섞기 안 함
    false, -- 탭 전환 감지 안 함
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "exams" e
WHERE e.title LIKE '%Mock Test 1%'
ON CONFLICT ("examId") DO NOTHING;

INSERT INTO "exam_configs" (
    "id", "examId", "allowSectionNavigation", "allowQuestionReview",
    "showAnswerAfterSubmit", "showScoreImmediately", "timeLimitPerSection",
    "shuffleQuestions", "shuffleOptions", "preventTabSwitch",
    "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    e.id,
    true,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "exams" e
WHERE e.title LIKE '%Listening Test 1%'
ON CONFLICT ("examId") DO NOTHING;

-- ============================================
-- 6. Sections (섹션) 샘플 데이터
-- ============================================
-- Mock Test 1의 섹션들
INSERT INTO "sections" (
    "id", "examId", "title", "description", "order", "questionCount",
    "timeLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    e.id,
    'Part 1: 語彙・文法 (Vocabulary & Grammar)',
    '단어, 문형, 문법 이해 문제입니다.',
    1,
    10, -- 문제 수
    NULL, -- 시간 제한 없음
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "exams" e
WHERE e.title LIKE '%Mock Test 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "sections" (
    "id", "examId", "title", "description", "order", "questionCount",
    "timeLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    e.id,
    'Part 2: 会話・表現 (Conversation / Expressions)',
    '대화문 완성, 표현 선택 문제입니다.',
    2,
    10,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "exams" e
WHERE e.title LIKE '%Mock Test 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "sections" (
    "id", "examId", "title", "description", "order", "questionCount",
    "timeLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    e.id,
    'Part 3: 読解 (Reading Comprehension)',
    '짧은 문단, 메일, 광고 독해 문제입니다.',
    3,
    10,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "exams" e
WHERE e.title LIKE '%Mock Test 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Listening Test 1의 섹션
INSERT INTO "sections" (
    "id", "examId", "title", "description", "order", "questionCount",
    "timeLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    e.id,
    'Part 4: 聴解 (Listening)',
    '오디오 질문 후 보기 선택 문제입니다.',
    1,
    10,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "exams" e
WHERE e.title LIKE '%Listening Test 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. Questions (문제) 샘플 데이터
-- ============================================

-- Part 1: Vocabulary & Grammar 문제들
INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    1,
    'multiple_choice',
    '다음 그림을 보고 적절한 단어를 선택하세요.',
    '{"A": "きます", "B": "かぶります", "C": "はきます"}'::jsonb,
    'C',
    '그림에서 신발을 신는 모습이 보입니다. "はきます"는 신발, 양말, 바지를 입을 때 사용하는 동사입니다.',
    1,
    'easy',
    ARRAY['vocabulary', 'verb', 'clothing'],
    'https://example.com/images/question1.jpg', -- 실제 이미지 URL로 교체
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    2,
    'multiple_choice',
    '다음 문장의 밑줄 친 히라가나를 한자로 쓰면? "きょうは はれです。"',
    '{"A": "今日", "B": "今月", "C": "今週"}'::jsonb,
    'A',
    '"きょう"는 "오늘"을 의미하며, 한자로는 "今日"입니다.',
    1,
    'easy',
    ARRAY['kanji', 'vocabulary', 'reading'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    3,
    'multiple_choice',
    '（　）をわたるときは、車に気をつけてください。',
    '{"A": "道", "B": "駅", "C": "店"}'::jsonb,
    'A',
    '"道をわたる"는 "길을 건너다"는 의미입니다. "を"는 이동의 경로를 나타내는 조사를 사용합니다.',
    1,
    'medium',
    ARRAY['grammar', 'particle', 'を'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Part 1 추가 문제들 (4-10번)
INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    4,
    'multiple_choice',
    '毎朝、コーヒー（　）飲みます。',
    '{"A": "を", "B": "が", "C": "に"}'::jsonb,
    'A',
    '"を"는 목적어를 나타내는 조사입니다. "コーヒーを飲む"는 "커피를 마시다"입니다.',
    1,
    'easy',
    ARRAY['grammar', 'particle', 'を'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    5,
    'multiple_choice',
    '図書館（　）本を読みます。',
    '{"A": "で", "B": "に", "C": "を"}'::jsonb,
    'A',
    '"で"는 장소에서 행동을 할 때 사용하는 조사입니다. "図書館で"는 "도서관에서"를 의미합니다.',
    1,
    'medium',
    ARRAY['grammar', 'particle', 'で'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 1%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Part 2: Conversation 문제들
INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    1,
    'multiple_choice',
    'A: こんにちは。\nB: （　）',
    '{"A": "こんにちは", "B": "おはようございます", "C": "こんばんは"}'::jsonb,
    'A',
    '인사에 대한 응답으로 같은 인사를 하는 것이 자연스럽습니다.',
    1,
    'easy',
    ARRAY['conversation', 'greeting'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 2%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    2,
    'multiple_choice',
    'A: すみません。\nB: （　）',
    '{"A": "いいえ", "B": "どういたしまして", "C": "大丈夫です"}'::jsonb,
    'C',
    '"すみません"에 대한 응답으로 "大丈夫です" (괜찮습니다)가 적절합니다.',
    1,
    'easy',
    ARRAY['conversation', 'apology'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 2%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    3,
    'multiple_choice',
    'A: 一緒に映画を見ませんか？\nB: （　）',
    '{"A": "いいえ、見ません", "B": "ええ、見ましょう", "C": "すみません、見ません"}'::jsonb,
    'B',
    '초대에 대한 긍정적 응답으로 "ええ、見ましょう" (네, 봅시다)가 적절합니다.',
    1,
    'medium',
    ARRAY['conversation', 'invitation'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 2%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Part 3: Reading 문제들
INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    1,
    'multiple_choice',
    '次の文章を読んで、質問に答えなさい。\n\n今日は日曜日です。家族と公園に行きます。天気がいいです。お弁当を持って行きます。\n\n質問: 今日は何曜日ですか？',
    '{"A": "月曜日", "B": "日曜日", "C": "土曜日"}'::jsonb,
    'B',
    '문장 첫 줄에 "今日は日曜日です"라고 명시되어 있습니다.',
    1,
    'easy',
    ARRAY['reading', 'comprehension'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 3%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    2,
    'multiple_choice',
    '次のメールを読んで、質問に答えなさい。\n\n田中さんへ\n\n明日の会議は3時からです。場所は会議室Aです。資料を持って来てください。\n\n山田\n\n質問: 会議は何時からですか？',
    '{"A": "2時", "B": "3時", "C": "4時"}'::jsonb,
    'B',
    '메일에 "明日の会議は3時からです"라고 명시되어 있습니다.',
    1,
    'easy',
    ARRAY['reading', 'email', 'comprehension'],
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 3%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Part 4: Listening 문제들
INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    1,
    'multiple_choice',
    '오디오를 듣고 질문에 답하세요.\n\n질문: 예약 시간은 몇 시입니까?',
    '{"A": "10時", "B": "11時", "C": "12時", "D": "13時"}'::jsonb,
    'B',
    '오디오에서 "11時に予約しました"라고 말했습니다.',
    1,
    'medium',
    ARRAY['listening', 'reservation', 'time'],
    NULL,
    'https://example.com/audio/question1.mp3', -- 실제 오디오 URL로 교체
    2, -- 2회 재생 가능
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 4%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    2,
    'multiple_choice',
    '오디오를 듣고 질문에 답하세요.\n\n질문: 내일 할 일은 무엇입니까?',
    '{"A": "買い物", "B": "勉強", "C": "映画", "D": "散歩"}'::jsonb,
    'A',
    '오디오에서 "明日は買い物に行きます"라고 말했습니다.',
    1,
    'medium',
    ARRAY['listening', 'schedule', 'activity'],
    NULL,
    'https://example.com/audio/question2.mp3',
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 4%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. LicenseKeys (라이선스 키) 샘플 데이터
-- ============================================
INSERT INTO "license_keys" (
    "id", "key", "keyType", "examIds", "usageLimit", "usageCount",
    "validFrom", "validUntil", "isActive", "issuedBy", "issuedAt",
    "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    'TEST-KEY-001',
    'TEST_KEY',
    ARRAY[]::TEXT[], -- 모든 시험 사용 가능
    10, -- 10회 사용 제한
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '30 days', -- 30일 유효
    true,
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT ("key") DO NOTHING;

-- ============================================
-- 9. 업데이트: Exams의 totalQuestions와 totalSections 업데이트
-- ============================================
UPDATE "exams" e
SET 
    "totalQuestions" = (
        SELECT COUNT(*) 
        FROM "questions" q
        JOIN "sections" s ON q."sectionId" = s.id
        WHERE s."examId" = e.id
    ),
    "totalSections" = (
        SELECT COUNT(*) 
        FROM "sections" s
        WHERE s."examId" = e.id
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE e.title LIKE '%Mock Test 1%' OR e.title LIKE '%Listening Test 1%';

-- ============================================
-- 10. 업데이트: Sections의 questionCount 업데이트
-- ============================================
UPDATE "sections" s
SET 
    "questionCount" = (
        SELECT COUNT(*) 
        FROM "questions" q
        WHERE q."sectionId" = s.id
    ),
    "updatedAt" = CURRENT_TIMESTAMP;

-- ============================================
-- 완료 메시지
-- ============================================
-- 샘플 데이터 삽입이 완료되었습니다!
-- 
-- 생성된 데이터:
-- - Users: 3명 (관리자 1명, 일반 사용자 2명)
-- - Categories: 3개 (일본어 시험, 영어 시험, 기타 시험)
-- - Subcategories: 2개 (JFT-Basic, JLPT)
-- - Exams: 2개 (Mock Test 1, Listening Test 1)
-- - Sections: 4개 (Part 1, 2, 3, 4)
-- - Questions: 여러 개 (각 파트별 문제)
-- - LicenseKeys: 1개 (테스트용)
--
-- 주의사항:
-- 1. Users의 비밀번호는 실제로는 NestJS AuthService를 통해 생성해야 합니다.
-- 2. 이미지 URL과 오디오 URL은 실제 파일로 교체해야 합니다.
-- 3. 더 많은 문제를 추가하려면 Questions INSERT 문을 추가하세요.

