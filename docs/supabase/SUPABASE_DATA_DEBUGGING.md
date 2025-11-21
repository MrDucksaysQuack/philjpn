# Supabase 데이터 조회 문제 디버깅 가이드

## 🔍 문제 진단 체크리스트

### 1. 백엔드 데이터베이스 연결 확인

#### Railway/Railway 배포 환경
```bash
# Railway 환경 변수 확인
# DATABASE_URL이 Supabase 연결 문자열로 설정되어 있는지 확인
# 예: postgresql://postgres:[password]@[host].supabase.co:5432/postgres
```

#### 로컬 개발 환경
```bash
# .env 파일 확인
cat backend/.env | grep DATABASE_URL

# 백엔드 로그에서 연결 확인
# "✅ Database connection established" 메시지 확인
```

### 2. Supabase에 실제 데이터 존재 확인

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- 카테고리 확인
SELECT id, name, "isActive", "order" FROM categories ORDER BY "order";

-- 활성 카테고리만 확인 (프론트엔드가 조회하는 데이터)
SELECT id, name, "isActive", "order" 
FROM categories 
WHERE "isActive" = true 
ORDER BY "order";

-- 시험 데이터 확인
SELECT id, title, "isActive", "isPublic", "categoryId" 
FROM exams 
WHERE "isActive" = true AND "isPublic" = true;

-- 사용자 데이터 확인
SELECT id, email, name, role, "isActive" FROM users LIMIT 5;
```

### 3. 프론트엔드 API 호출 확인

브라우저 개발자 도구 (F12) → Network 탭에서:

1. **API 요청 확인**
   - `/api/categories/public` 요청이 있는지 확인
   - 요청 URL이 올바른지 확인 (백엔드 URL)
   - 응답 상태 코드 확인 (200, 401, 404, 500 등)

2. **CORS 에러 확인**
   - Console 탭에서 CORS 관련 에러 확인
   - Network 탭에서 OPTIONS 요청 실패 확인

3. **응답 데이터 확인**
   - `/api/categories/public` 응답 본문 확인
   - `{ data: [...] }` 형식인지 확인
   - 빈 배열 `[]`인지 확인

### 4. 환경 변수 확인

#### 프론트엔드 (Vercel)
```bash
# Vercel 환경 변수 확인
# NEXT_PUBLIC_API_URL이 백엔드 URL로 설정되어 있는지 확인
# 예: https://philjpn-production.up.railway.app
```

#### 백엔드 (Railway)
```bash
# Railway 환경 변수 확인
# DATABASE_URL이 Supabase 연결 문자열인지 확인
# CORS_ORIGIN에 프론트엔드 URL이 포함되어 있는지 확인
```

### 5. 백엔드 API 엔드포인트 테스트

#### 직접 API 호출 테스트
```bash
# 로컬에서 테스트
curl http://localhost:3001/api/categories/public

# 프로덕션에서 테스트
curl https://philjpn-production.up.railway.app/api/categories/public
```

예상 응답:
```json
{
  "data": [
    {
      "id": "...",
      "name": "...",
      "isActive": true,
      "order": 1,
      "subcategories": [...],
      "_count": {
        "exams": 0
      }
    }
  ]
}
```

### 6. 일반적인 문제 및 해결 방법

#### 문제 1: 빈 배열 반환 `[]`
**원인**: Supabase에 데이터가 없거나 `isActive = false`
**해결**: 
- Supabase에서 데이터 확인
- `isActive = true`로 설정된 카테고리 확인

#### 문제 2: CORS 에러
**원인**: 백엔드 CORS 설정 문제
**해결**:
- Railway 환경 변수 `CORS_ORIGIN`에 프론트엔드 URL 추가
- `https://philjpn.vercel.app` 포함 확인

#### 문제 3: 401 Unauthorized
**원인**: Public API인데 인증이 필요한 경우
**해결**: 
- `/api/categories/public`는 인증 불필요 (Public API)
- 다른 엔드포인트는 JWT 토큰 필요

#### 문제 4: 502 Bad Gateway
**원인**: 백엔드 서버 다운 또는 연결 실패
**해결**:
- Railway에서 백엔드 서버 상태 확인
- 백엔드 로그 확인

#### 문제 5: 404 Not Found
**원인**: API 경로 오류
**해결**:
- 프론트엔드 `NEXT_PUBLIC_API_URL` 확인
- 백엔드 라우트 경로 확인 (`/api/categories/public`)

### 7. 디버깅 단계별 가이드

#### Step 1: Supabase 데이터 확인
```sql
-- 1. 카테고리 테이블 확인
SELECT COUNT(*) FROM categories;
SELECT * FROM categories WHERE "isActive" = true;

-- 2. 시험 테이블 확인
SELECT COUNT(*) FROM exams;
SELECT * FROM exams WHERE "isActive" = true AND "isPublic" = true;
```

#### Step 2: 백엔드 직접 테스트
```bash
# 로컬 백엔드 실행
cd backend
npm run start:dev

# 다른 터미널에서 테스트
curl http://localhost:3001/api/categories/public
```

#### Step 3: 프론트엔드에서 API URL 확인
브라우저 Console에서:
```javascript
// API Base URL 확인
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// 실제 요청 URL 확인 (Network 탭에서)
```

#### Step 4: 백엔드 로그 확인
Railway 로그 또는 로컬 터미널에서:
- 데이터베이스 연결 메시지 확인
- API 요청 로그 확인
- 에러 메시지 확인

### 8. 빠른 확인 스크립트

Supabase SQL Editor에서 실행:

```sql
-- 전체 데이터 현황 확인
SELECT 
  'categories' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE "isActive" = true) as active_count
FROM categories
UNION ALL
SELECT 
  'exams' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE "isActive" = true AND "isPublic" = true) as active_count
FROM exams
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE "isActive" = true) as active_count
FROM users;
```

### 9. 예상되는 정상 동작

1. **Supabase에 데이터가 있는 경우**:
   - `/api/categories/public` → `{ data: [카테고리 배열] }`
   - 프론트엔드에서 카테고리 목록 표시

2. **Supabase에 데이터가 없는 경우**:
   - `/api/categories/public` → `{ data: [] }`
   - 프론트엔드에서 빈 목록 표시 (에러 아님)

3. **백엔드 연결 실패**:
   - `/api/categories/public` → 502 Bad Gateway 또는 연결 타임아웃
   - 프론트엔드에서 에러 표시

## 🚀 다음 단계

문제를 발견한 경우:
1. 위 체크리스트를 순서대로 확인
2. 발견한 문제를 기록
3. 해결 방법 적용
4. 다시 테스트

특정 에러 메시지가 있는 경우 해당 에러를 기준으로 위 가이드를 참고하세요.

