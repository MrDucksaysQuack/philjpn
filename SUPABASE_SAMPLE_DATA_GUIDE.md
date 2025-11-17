# Supabase 샘플 데이터 가이드

JFT-Basic 형식에 맞춘 샘플 데이터를 사용하여 프론트엔드와 백엔드 연결을 테스트할 수 있습니다.

## 📋 포함된 샘플 데이터

### 1. 사용자 (Users)
- **관리자**: `admin@example.com` (role: admin)
- **일반 사용자 1**: `user1@example.com` (role: user)
- **일반 사용자 2**: `user2@example.com` (role: user)

**⚠️ 주의**: 비밀번호는 실제로는 NestJS AuthService를 통해 생성해야 합니다. 샘플 데이터의 비밀번호는 작동하지 않을 수 있습니다.

### 2. 카테고리 및 서브카테고리
- **일본어 시험** 카테고리
  - JFT-Basic 서브카테고리
  - JLPT 서브카테고리
- **영어 시험** 카테고리
- **기타 시험** 카테고리

### 3. 시험 (Exams)
- **JFT-Basic Mock Test 1 (읽기·문법)**
  - Part 1: 語彙・文法 (Vocabulary & Grammar) - 10문제
  - Part 2: 会話・表現 (Conversation / Expressions) - 10문제
  - Part 3: 読解 (Reading Comprehension) - 10문제
  - 총 30문제, 예상 소요 시간: 60분

- **JFT-Basic Listening Test 1 (청해)**
  - Part 4: 聴解 (Listening) - 10문제
  - 총 10문제, 예상 소요 시간: 20분

### 4. 문제 (Questions)
각 파트별로 실제 JFT-Basic 형식에 맞춘 문제가 포함되어 있습니다:

#### Part 1: Vocabulary & Grammar
- 그림 보고 단어 맞추기
- 히라가나를 한자로 변환
- 문법 문제 (조사 선택)
- 총 5개 샘플 문제 포함

#### Part 2: Conversation
- 인사 표현
- 사과 표현
- 초대 표현
- 총 3개 샘플 문제 포함

#### Part 3: Reading
- 짧은 문단 독해
- 이메일 독해
- 총 2개 샘플 문제 포함

#### Part 4: Listening
- 예약 시간 관련
- 일정 관련
- 총 2개 샘플 문제 포함 (오디오 URL 필요)

### 5. 라이선스 키 (LicenseKeys)
- **TEST-KEY-001**: 테스트용 라이선스 키
  - 사용 제한: 10회
  - 유효 기간: 30일
  - 모든 시험 사용 가능

### 6. 추가 테이블 샘플 데이터
`SUPABASE_SAMPLE_DATA_ADDITIONAL.sql` 파일에 다음 테이블들의 샘플 데이터가 포함되어 있습니다:

- **QuestionBanks**: 문제 은행 2개
- **ExamTemplates**: 시험 템플릿 1개
- **QuestionPools**: 문제 풀 2개
- **LicenseKeyBatches**: 라이선스 키 배치 1개
- **ExamResults**: 시험 결과 2개 (완료 1개, 진행 중 1개)
- **SectionResults**: 섹션 결과 3개
- **QuestionResults**: 문제 결과 5개
- **UserExamSessions**: 사용자 시험 세션 1개
- **WordBooks**: 단어장 3개
- **UserGoals**: 사용자 목표 2개
- **UserBadges**: 사용자 배지 2개
- **KeyUsageLogs**: 라이선스 키 사용 로그 2개
- **AuditLogs**: 감사 로그 2개
- **LearningPatterns**: 학습 패턴 1개
- **LearningCycles**: 학습 사이클 1개

## 🚀 사용 방법

### 1단계: 샘플 데이터 삽입

1. **기본 샘플 데이터 삽입**
   Supabase SQL Editor에서 `SUPABASE_SAMPLE_DATA.sql` 파일의 전체 내용을 실행하세요.

2. **추가 샘플 데이터 삽입** (선택사항)
   `SUPABASE_SAMPLE_DATA_ADDITIONAL.sql` 파일의 전체 내용을 실행하여 추가 테이블 샘플 데이터를 삽입하세요.
   
   이 파일에는 시험 결과, 단어장, 목표, 배지 등 프론트엔드 기능 테스트에 필요한 데이터가 포함되어 있습니다.

```sql
-- 1. 기본 샘플 데이터
-- SUPABASE_SAMPLE_DATA.sql 실행

-- 2. 추가 샘플 데이터 (선택사항)
-- SUPABASE_SAMPLE_DATA_ADDITIONAL.sql 실행
```

### 2단계: 데이터 확인

`SUPABASE_VERIFICATION_QUERIES.sql`의 쿼리를 실행하여 데이터가 올바르게 삽입되었는지 확인하세요.

```sql
-- 시험 확인
SELECT id, title, "totalQuestions", "totalSections" 
FROM exams 
WHERE title LIKE '%JFT-Basic%';

-- 문제 확인
SELECT s.title, COUNT(q.id) as question_count
FROM sections s
LEFT JOIN questions q ON q."sectionId" = s.id
GROUP BY s.id, s.title
ORDER BY s."order";
```

### 3단계: 프론트엔드 테스트

1. **관리자 계정 생성** (실제로는 회원가입 API 사용)
   ```bash
   # 백엔드에서 회원가입 API 호출
   POST /api/auth/register
   {
     "email": "admin@example.com",
     "password": "admin123",
     "name": "관리자",
     "role": "admin"
   }
   ```

2. **시험 목록 확인**
   - 프론트엔드: `/exams` 페이지에서 "일본어 시험" 카테고리 클릭
   - "JFT-Basic" 서브카테고리 확인
   - "JFT-Basic Mock Test 1" 시험 확인

3. **시험 시작**
   - 시험 상세 페이지에서 라이선스 키 입력: `TEST-KEY-001`
   - 시험 시작 버튼 클릭
   - 문제 표시 확인

4. **문제 풀이 테스트**
   - Part 1, 2, 3 문제 확인
   - 선택지 표시 확인 (A, B, C 형식)
   - 답안 선택 및 저장 확인
   - 다음 문제 이동 확인

5. **청해 문제 테스트** (Listening Test 1)
   - 오디오 재생 기능 확인
   - 오디오 재생 횟수 제한 확인 (2회)

6. **시험 결과 확인** (추가 샘플 데이터 필요)
   - `/results/[id]` 페이지에서 완료된 시험 결과 확인
   - 섹션별 점수 확인
   - 문제별 정답/오답 확인

7. **단어장 확인** (추가 샘플 데이터 필요)
   - `/wordbook` 페이지에서 추출된 단어 확인
   - 단어 복습 기능 확인

8. **목표 및 배지 확인** (추가 샘플 데이터 필요)
   - 대시보드에서 목표 진행 상황 확인
   - 획득한 배지 확인

## 📝 추가 문제 생성 방법

더 많은 문제를 추가하려면 `SUPABASE_SAMPLE_DATA.sql` 파일에 다음 형식으로 추가하세요:

```sql
INSERT INTO "questions" (
    "id", "sectionId", "questionNumber", "questionType", "content",
    "options", "correctAnswer", "explanation", "points", "difficulty",
    "tags", "imageUrl", "audioUrl", "audioPlayLimit", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    s.id,
    6, -- 문제 번호
    'multiple_choice',
    '문제 내용',
    '{"A": "선택지1", "B": "선택지2", "C": "선택지3"}'::jsonb,
    'A', -- 정답 (A, B, C 중 하나)
    '해설 내용',
    1,
    'easy', -- easy, medium, hard
    ARRAY['tag1', 'tag2'],
    NULL, -- 이미지 URL (있는 경우)
    NULL, -- 오디오 URL (있는 경우)
    NULL, -- 오디오 재생 횟수 제한
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s.title LIKE '%Part 1%' -- 원하는 파트로 변경
LIMIT 1
ON CONFLICT DO NOTHING;
```

## ⚠️ 주의사항

### 1. 비밀번호 해시
샘플 데이터의 사용자 비밀번호는 실제로 작동하지 않습니다. 실제 사용자 계정은 다음 방법으로 생성하세요:

- **회원가입 API 사용**: `POST /api/auth/register`
- **Supabase Dashboard**: 직접 사용자 생성 (Supabase Auth 사용 시)

### 2. 이미지 및 오디오 URL
- Part 1의 이미지 URL: `https://example.com/images/question1.jpg` (실제 URL로 교체 필요)
- Part 4의 오디오 URL: `https://example.com/audio/question1.mp3` (실제 URL로 교체 필요)

실제 파일을 업로드한 후 URL을 업데이트하세요:

```sql
UPDATE questions 
SET "imageUrl" = 'https://your-domain.com/images/question1.jpg'
WHERE "content" LIKE '%그림을 보고%';
```

### 3. 문제 수 업데이트
샘플 데이터에는 각 파트별로 일부 문제만 포함되어 있습니다. 더 많은 문제를 추가한 후 다음 쿼리로 업데이트하세요:

```sql
-- Sections의 questionCount 업데이트
UPDATE "sections" s
SET 
    "questionCount" = (
        SELECT COUNT(*) 
        FROM "questions" q
        WHERE q."sectionId" = s.id
    ),
    "updatedAt" = CURRENT_TIMESTAMP;

-- Exams의 totalQuestions 업데이트
UPDATE "exams" e
SET 
    "totalQuestions" = (
        SELECT COUNT(*) 
        FROM "questions" q
        JOIN "sections" s ON q."sectionId" = s.id
        WHERE s."examId" = e.id
    ),
    "updatedAt" = CURRENT_TIMESTAMP;
```

## 🔍 프론트엔드 연결 확인 체크리스트

### 기본 기능
- [ ] 카테고리 목록 표시 확인 (`/exams` 페이지)
- [ ] 서브카테고리 목록 표시 확인
- [ ] 시험 목록 표시 확인
- [ ] 시험 상세 정보 표시 확인 (`/exams/[id]` 페이지)
- [ ] 섹션 정보 표시 확인
- [ ] 라이선스 키 입력 및 검증 확인
- [ ] 시험 시작 기능 확인 (`/exams/[id]/take` 페이지)
- [ ] 문제 표시 확인
- [ ] 선택지 표시 확인 (A, B, C 형식)
- [ ] 이미지 표시 확인 (Part 1)
- [ ] 오디오 재생 확인 (Part 4)
- [ ] 답안 선택 및 저장 확인
- [ ] 문제 이동 기능 확인
- [ ] 시험 제출 기능 확인

### 결과 및 분석 기능 (추가 샘플 데이터 필요)
- [ ] 결과 페이지 표시 확인 (`/results/[id]` 페이지)
- [ ] 섹션별 점수 표시 확인
- [ ] 문제별 정답/오답 표시 확인
- [ ] 해설 표시 확인
- [ ] 단어 추출 기능 확인
- [ ] 단어장 페이지 확인 (`/wordbook`)
- [ ] 목표 진행 상황 확인 (대시보드)
- [ ] 배지 획득 현황 확인
- [ ] 학습 패턴 분석 확인

## 📊 데이터 구조 확인

### Options 형식
프론트엔드는 다음 두 가지 형식을 지원합니다:

1. **객체 형식** (권장):
   ```json
   {
     "A": "선택지1",
     "B": "선택지2",
     "C": "선택지3"
   }
   ```

2. **배열 형식**:
   ```json
   ["선택지1", "선택지2", "선택지3"]
   ```

샘플 데이터는 객체 형식을 사용합니다.

### 정답 형식
- 객체 형식 사용 시: `"A"`, `"B"`, `"C"` 등 (키 값)
- 배열 형식 사용 시: 실제 선택지 텍스트

## 🎯 다음 단계

1. ✅ 샘플 데이터 삽입 완료
2. ✅ 프론트엔드 연결 확인
3. ⬜ 실제 이미지 및 오디오 파일 업로드
4. ⬜ 더 많은 문제 추가
5. ⬜ 실제 사용자 계정 생성
6. ⬜ 시험 결과 확인

## 💡 팁

- 문제를 추가할 때는 각 파트의 `questionNumber`를 순차적으로 증가시키세요.
- 태그를 적절히 사용하면 나중에 문제 필터링이 용이합니다.
- 이미지와 오디오는 Supabase Storage 또는 다른 CDN에 업로드하세요.

