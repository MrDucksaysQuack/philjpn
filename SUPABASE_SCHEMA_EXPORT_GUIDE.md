# 📤 Supabase 스키마 내보내기 가이드

## 📋 개요

Supabase 데이터베이스의 테이블과 필드 정보를 외부로 공유하는 다양한 방법을 제공합니다.

---

## 🔍 방법 1: Prisma db pull (권장)

### Prisma 스키마 형식으로 내보내기

```bash
cd backend

# 현재 데이터베이스 스키마를 Prisma 형식으로 가져오기
npx prisma db pull

# 또는 출력만 확인 (파일로 저장하지 않음)
npx prisma db pull --print > current_schema.prisma
```

**결과**: `prisma/schema.prisma` 파일이 업데이트되거나 `current_schema.prisma` 파일이 생성됩니다.

**장점**:
- ✅ Prisma 형식으로 자동 변환
- ✅ 타입 정보 포함
- ✅ 관계(Relations) 정보 포함

---

## 🔍 방법 2: pg_dump (SQL 형식)

### 전체 데이터베이스 스키마를 SQL로 내보내기

```bash
# 환경 변수에서 DATABASE_URL 가져오기
pg_dump $DATABASE_URL --schema-only > supabase_schema.sql

# 또는 특정 옵션 포함
pg_dump $DATABASE_URL \
  --schema-only \
  --no-owner \
  --no-privileges \
  > supabase_schema.sql
```

**옵션 설명**:
- `--schema-only`: 데이터 없이 스키마만 내보내기
- `--no-owner`: 소유자 정보 제외
- `--no-privileges`: 권한 정보 제외

**결과**: `supabase_schema.sql` 파일 생성

**장점**:
- ✅ 표준 SQL 형식
- ✅ 다른 PostgreSQL 데이터베이스로 직접 이식 가능
- ✅ 테이블, 인덱스, 제약조건 모두 포함

---

## 🔍 방법 3: Supabase SQL Editor 쿼리

### 테이블 및 필드 정보를 JSON/CSV로 내보내기

#### 3.1 모든 테이블 목록

```sql
SELECT 
    table_name,
    table_type,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

#### 3.2 특정 테이블의 모든 필드 정보

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'  -- 원하는 테이블명으로 변경
ORDER BY ordinal_position;
```

#### 3.3 모든 테이블의 모든 필드 정보 (종합)

```sql
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND c.table_schema = 'public'
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
```

#### 3.4 인덱스 정보

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

#### 3.5 외래 키 관계

```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**사용 방법**:
1. Supabase Dashboard → SQL Editor 열기
2. 위 쿼리 중 하나 선택하여 실행
3. 결과를 CSV 또는 JSON으로 다운로드

**장점**:
- ✅ Supabase Dashboard에서 직접 실행 가능
- ✅ 결과를 CSV/JSON으로 다운로드 가능
- ✅ 특정 테이블만 선택적으로 조회 가능

---

## 🔍 방법 4: Prisma Studio (시각적 확인)

### GUI로 스키마 확인 및 공유

```bash
cd backend
npx prisma studio
```

**사용 방법**:
1. 브라우저에서 `http://localhost:5555` 열기
2. 각 테이블 클릭하여 구조 확인
3. 스크린샷 캡처하여 공유

**장점**:
- ✅ 시각적으로 확인 가능
- ✅ 데이터와 함께 확인 가능
- ✅ 관계(Relations) 시각화

---

## 🔍 방법 5: 스크립트로 자동화

### 스키마 정보를 JSON 파일로 자동 생성

```bash
# backend/scripts/export-schema.sh 파일 생성
```

스크립트 예시:

```bash
#!/bin/bash

# Supabase 스키마 정보를 JSON으로 내보내기

cd "$(dirname "$0")/.."

OUTPUT_FILE="supabase_schema_export.json"

echo "📤 Supabase 스키마 내보내기 중..."

# Prisma를 통해 스키마 정보 가져오기
npx prisma db execute --stdin > "$OUTPUT_FILE" <<'EOF'
SELECT 
    json_agg(
        json_build_object(
            'table_name', table_name,
            'columns', (
                SELECT json_agg(
                    json_build_object(
                        'column_name', column_name,
                        'data_type', data_type,
                        'is_nullable', is_nullable,
                        'column_default', column_default
                    )
                )
                FROM information_schema.columns
                WHERE table_name = t.table_name
                AND table_schema = 'public'
            )
        )
    ) as schema_info
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
EOF

echo "✅ 스키마 정보가 $OUTPUT_FILE에 저장되었습니다!"
```

---

## 📊 방법 비교

| 방법 | 형식 | 용도 | 난이도 |
|------|------|------|--------|
| Prisma db pull | `.prisma` | Prisma 프로젝트 | ⭐ 쉬움 |
| pg_dump | `.sql` | 전체 백업/이식 | ⭐⭐ 보통 |
| SQL Editor 쿼리 | CSV/JSON | 특정 정보 조회 | ⭐⭐ 보통 |
| Prisma Studio | GUI | 시각적 확인 | ⭐ 쉬움 |
| 자동화 스크립트 | JSON | CI/CD 통합 | ⭐⭐⭐ 어려움 |

---

## 🎯 추천 사용 시나리오

### 시나리오 1: 팀원과 스키마 공유
```bash
# Prisma 스키마로 내보내기
npx prisma db pull --print > shared_schema.prisma
# 파일을 Git에 커밋하거나 공유
```

### 시나리오 2: 문서화를 위한 스키마 다이어그램
```bash
# Prisma Studio 실행
npx prisma studio
# 스크린샷 캡처하여 문서에 포함
```

### 시나리오 3: 다른 데이터베이스로 이식
```bash
# SQL 형식으로 내보내기
pg_dump $DATABASE_URL --schema-only > schema.sql
# 다른 데이터베이스에 적용
psql $NEW_DATABASE_URL < schema.sql
```

### 시나리오 4: API 문서화를 위한 스키마 정보
```sql
-- Supabase SQL Editor에서 실행
-- 결과를 JSON으로 다운로드하여 API 문서에 포함
SELECT ... (위의 "종합 쿼리" 사용)
```

---

## ⚠️ 주의사항

1. **민감한 정보 제외**: 
   - `pg_dump` 사용 시 `--no-owner --no-privileges` 옵션 사용
   - 실제 데이터는 제외 (`--schema-only`)

2. **환경 변수 확인**:
   - `DATABASE_URL`이 올바르게 설정되어 있는지 확인

3. **권한 확인**:
   - 데이터베이스 읽기 권한이 있는지 확인

---

## 📚 참고 자료

- [Prisma db pull 문서](https://www.prisma.io/docs/concepts/components/prisma-migrate/developing-with-prisma-migrate/pull)
- [pg_dump 문서](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)

---

**마지막 업데이트**: 2024년  
**문서 버전**: 1.0

