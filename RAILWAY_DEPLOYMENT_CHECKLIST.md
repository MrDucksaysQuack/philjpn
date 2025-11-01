# Railway 배포 체크리스트

## ⚠️ 현재 발생 중인 에러

### 1. Validation Error (LicenseKeyQueryDto)
**에러 메시지:**
```
whitelistValidation: property page should not exist
whitelistValidation: property limit should not exist
```

**원인:**
- `LicenseKeyQueryDto`에 `page`와 `limit` 필드가 추가되었지만, Railway에 배포된 코드가 아직 업데이트되지 않음

**해결 방법:**
1. ✅ 코드 수정 완료 (`license-key-query.dto.ts`에 `page`, `limit` 필드 추가)
2. ⚠️ **Railway에 재배포 필요**
   - GitHub에 푸시 후 Railway가 자동 배포하거나
   - Railway에서 수동 재배포 실행

### 2. Connection Pool Timeout (P2024)
**에러 메시지:**
```
Timed out fetching a new connection from the connection pool
Current connection pool timeout: 10, connection limit: 1
```

**원인:**
- Prisma가 connection pool을 자동 관리하지만, 동시 요청이 많을 때 타임아웃 발생
- `executeWithRetry`가 적용되지 않은 일부 쿼리에서 발생

**해결 방법:**
1. ✅ `executeWithRetry` 로직 강화 완료 (`P2024` 에러 재시도 추가)
2. ✅ Connection pool 설정 개선 (URL 파라미터 추가)
3. ⚠️ **Railway에 재배포 필요**

---

## ✅ 배포 전 확인 사항

### 1. 코드 변경 확인
```bash
# 변경된 파일 확인
git status

# 다음 파일들이 수정되었는지 확인:
# - backend/src/modules/license/dto/license-key-query.dto.ts (page, limit 추가)
# - backend/src/modules/license/services/license-key.service.ts (페이징 로직 추가)
# - backend/src/common/utils/prisma.service.ts (connection pool 설정, P2024 재시도)
```

### 2. 로컬 빌드 테스트
```bash
cd backend
npm run build
# 에러가 없어야 함
```

### 3. GitHub 푸시
```bash
git add .
git commit -m "fix: LicenseKeyQueryDto pagination fields, Prisma connection pool improvements"
git push origin main
```

### 4. Railway 배포 확인
1. Railway Dashboard → Deployments 탭
2. 최신 배포가 시작되었는지 확인
3. 배포 완료 대기 (약 2-3분)

---

## 🔍 배포 후 확인 사항

### 1. 로그 확인
Railway 로그에서 다음을 확인:

**✅ 성공 시:**
```
✅ Database connection established
🔧 PgBouncer 호환 모드 활성화됨
```

**✅ Validation 에러 해결 확인:**
- `/api/license-keys?page=1&limit=20` 요청이 정상 처리되어야 함
- 에러 로그에 "whitelistValidation"이 더 이상 나타나지 않아야 함

**✅ Connection Pool 타임아웃 감소:**
- P2024 에러가 발생해도 재시도 후 성공해야 함
- 재시도 로그: `⚠️ Database error (attempt X/5), 재연결 시도...`

### 2. API 테스트
```bash
# License Keys API 테스트
curl -X GET "https://philjpn-production.up.railway.app/api/license-keys?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Origin: https://philjpn.vercel.app"
```

**예상 응답:**
- ✅ 200 OK: `{ "data": [...], "meta": { "page": 1, "limit": 20, ... } }`
- ❌ 400 Bad Request: Validation 에러 (재배포 필요)

---

## 📝 환경 변수 확인

Railway Dashboard → Variables 탭에서 다음이 설정되어 있는지 확인:

| 변수명 | 값 예시 | 필수 |
|--------|---------|------|
| `DATABASE_URL` | `postgresql://...@pooler.supabase.com:6543/...?pgbouncer=true` | ✅ |
| `JWT_SECRET` | `my-super-secret-123` | ✅ |
| `CORS_ORIGIN` | `https://philjpn.vercel.app` | ✅ |

---

## 🚨 문제 발생 시

1. **Validation 에러가 계속 발생:**
   - Railway에서 최신 배포가 완료되었는지 확인
   - 로그에서 "🔧 PgBouncer 호환 모드 활성화됨" 메시지 확인
   - 브라우저 캐시 클리어 (Ctrl+Shift+R)

2. **Connection Pool 타임아웃이 계속 발생:**
   - `executeWithRetry`가 모든 쿼리에 적용되었는지 확인
   - Railway 로그에서 재시도 로직이 작동하는지 확인
   - 필요시 Supabase의 Connection Pooling 설정 확인

