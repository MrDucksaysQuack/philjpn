# Supabase RLS (Row Level Security) 설정 가이드

> Supabase 보안 린터 에러 해결 방법

---

## 문제 상황

Supabase Database Linter에서 다음 에러가 발생했습니다:

```
RLS Disabled in Public - ERROR
```

**영향받는 테이블** (15개):
- `_prisma_migrations`
- `users`
- `exams`
- `exam_configs`
- `sections`
- `questions`
- `question_banks`
- `exam_results`
- `license_keys`
- `section_results`
- `question_results`
- `user_exam_sessions`
- `key_usage_logs`
- `word_books`
- `audit_logs`

---

## 중요 참고사항

### 현재 아키텍처

이 프로젝트는 **NestJS 백엔드 + Prisma**를 사용합니다:
- ✅ 모든 데이터베이스 접근은 NestJS API를 통해 이루어짐
- ✅ JWT 인증이 백엔드에서 처리됨
- ✅ Prisma는 PostgREST를 우회하여 직접 PostgreSQL에 연결

**RLS의 역할**:
- PostgREST API를 통한 직접 접근 차단
- 백엔드 API 우회 시도 차단
- 추가 보안 레이어 제공

---

## 해결 방법

### 방법 1: Supabase SQL Editor에서 직접 실행 (권장)

1. **Supabase Dashboard** 접속
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor** 열기
   - 왼쪽 메뉴 → SQL Editor

3. **RLS 활성화 SQL 실행**
   - 아래 SQL을 복사하여 실행:

```sql
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
```

4. **기본 정책 설정** (선택사항)
   - 다음 중 하나 선택:
   
   **옵션 A: 제한적 정책 (권장)**
   ```sql
   -- 모든 테이블에 대해 접근 차단 (Prisma는 우회하므로 영향 없음)
   -- PostgREST 직접 접근만 차단
   
   CREATE POLICY "Deny all public access" ON "users" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "exams" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "exam_configs" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "sections" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "questions" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "question_banks" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "exam_results" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "license_keys" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "section_results" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "question_results" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "user_exam_sessions" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "key_usage_logs" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "word_books" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "audit_logs" FOR ALL USING (false);
   CREATE POLICY "Deny all public access" ON "_prisma_migrations" FOR ALL USING (false);
   ```
   
   **옵션 B: Supabase Auth 사용 시** (현재는 사용 안 함)
   ```sql
   -- Supabase Auth를 사용하는 경우에만 적용
   -- 현재는 NestJS JWT를 사용하므로 이 정책은 필요 없음
   ```

---

### 방법 2: Prisma Migration으로 실행

```bash
cd backend
psql $DATABASE_URL < prisma/migrations/enable_rls.sql
```

---

## 검증

### 1. RLS 활성화 확인

Supabase Dashboard → Database → Tables → 각 테이블 확인
- "Row Level Security" 상태가 **Enabled**로 표시되어야 함

### 2. Linter 재실행

Supabase Dashboard → Database → Linter
- 모든 테이블의 RLS 에러가 사라져야 함

### 3. 애플리케이션 테스트

```bash
# 백엔드 실행 (Prisma는 정상 작동해야 함)
cd backend
npm run start:dev

# API 테스트
curl http://localhost:3001/api/exams
```

---

## RLS 정책 선택 가이드

### 현재 아키텍처 (NestJS + Prisma)

**권장 설정**: 제한적 정책 (옵션 A)
- ✅ Prisma는 RLS를 우회하므로 애플리케이션에 영향 없음
- ✅ PostgREST 직접 접근 차단
- ✅ 보안 요구사항 충족

### 만약 PostgREST도 사용하는 경우

더 세밀한 정책이 필요합니다:
- Supabase Auth 사용 시 `auth.uid()` 사용
- 역할 기반 정책 (Admin, User)
- 데이터 소유권 기반 정책

---

## 주의사항

1. **Prisma는 RLS를 우회합니다**
   - Prisma는 직접 PostgreSQL 연결을 사용
   - RLS 정책은 PostgREST API 접근에만 적용

2. **백엔드 API 보안은 여전히 중요**
   - JWT 인증 유지
   - 역할 기반 접근 제어 (RBAC) 구현
   - 입력 검증 및 SQL Injection 방지

3. **마이그레이션 테이블 보호**
   - `_prisma_migrations`는 항상 접근 차단 권장

---

## 트러블슈팅

### 문제: 애플리케이션이 작동하지 않음

**원인**: RLS 정책이 너무 제한적

**해결**:
- Prisma를 사용하는 경우 RLS는 영향 없어야 함
- 백엔드 로그 확인
- 데이터베이스 연결 확인

### 문제: Linter가 여전히 에러 표시

**원인**: RLS가 활성화되지 않음

**해결**:
1. SQL이 제대로 실행되었는지 확인
2. 테이블별로 수동 확인:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

---

## 추가 보안 권장사항

1. **환경 변수 보호**
   - `.env` 파일 Git에 커밋하지 않기
   - 프로덕션 비밀번호 강력하게 설정

2. **API Rate Limiting**
   - DDoS 공격 방지
   - 무차별 대입 공격 방지

3. **CORS 설정**
   - 허용된 도메인만 접근 가능하도록

4. **정기적인 보안 감사**
   - Supabase Linter 정기 실행
   - 의존성 취약점 검사 (`npm audit`)

---

**작성일**: 2024년 11월 1일  
**버전**: 1.0

