# 프로덕션 환경 변수 완전 가이드

> **실제 배포를 위한 필수 환경 변수 설정**

---

## 📋 필수 환경 변수 체크리스트

### ✅ 필수 항목 (반드시 설정)

1. **DATABASE_URL** ✅ (이미 설정됨)
   ```env
   DATABASE_URL=postgresql://postgres:1dnjf4dlf@db.[프로젝트].supabase.co:5432/postgres
   ```

2. **JWT_SECRET** ✅ (강력한 값으로 변경 필요!)
   ```env
   JWT_SECRET=your-super-secret-key
   ```
   ⚠️ **중요**: 이 값을 강력한 랜덤 문자열로 변경하세요!
   ```bash
   # 강력한 시크릿 생성
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **JWT_EXPIRES_IN** ✅ (이미 설정됨)
   ```env
   JWT_EXPIRES_IN=1h
   ```

4. **NODE_ENV** ✅ (이미 설정됨)
   ```env
   NODE_ENV=production
   ```

5. **PORT** ✅ (Railway 등에서는 자동 할당)
   ```env
   PORT=3001
   ```

6. **CORS_ORIGIN** ❌ (추가 필요!)
   ```env
   CORS_ORIGIN=https://your-frontend-domain.com
   ```
   **예시**:
   - Vercel 배포 시: `https://exam-platform.vercel.app`
   - 커스텀 도메인: `https://www.exam-platform.com`
   - 여러 도메인: `https://exam-platform.vercel.app,https://www.exam-platform.com`

---

## 📝 완전한 프로덕션 .env 파일

```env
# ============================================
# 데이터베이스 (Supabase)
# ============================================
DATABASE_URL=postgresql://postgres:1dnjf4dlf@db.[프로젝트].supabase.co:5432/postgres

# Connection Pooling 사용 시 (권장)
# DATABASE_URL=postgresql://postgres.[PROJECT-REF]:1dnjf4dlf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# ============================================
# JWT 인증
# ============================================
# ⚠️ 강력한 시크릿으로 변경 필수!
JWT_SECRET=[위에서 생성한 32자 이상의 랜덤 문자열]
JWT_EXPIRES_IN=1h

# ============================================
# 서버 설정
# ============================================
NODE_ENV=production
PORT=3001

# ============================================
# CORS (프론트엔드 도메인)
# ============================================
# ⚠️ 실제 프론트엔드 URL로 변경 필수!
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# ============================================
# 선택: 로깅
# ============================================
LOG_LEVEL=info
```

---

## 🔐 각 항목 상세 설명

### 1. DATABASE_URL

**Supabase 연결 문자열 형식**:

#### Option A: Direct Connection (개발용)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### Option B: Connection Pooling (프로덕션 권장)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**확인 방법**:
- Supabase Dashboard → Settings → Database
- Connection string → URI 선택
- Connection pooling 사용 권장

**현재 설정 확인**:
```bash
# Supabase 프로젝트 참조 ID 확인
# .env 파일에서 [프로젝트] 부분을 실제 프로젝트 ID로 변경
```

---

### 2. JWT_SECRET ⚠️ 필수 변경!

**현재 값**: `your-super-secret-key` (임시값)

**변경 방법**:
```bash
# 강력한 시크릿 생성 (32바이트 = 64자리 16진수)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 출력 예시:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**설정 예시**:
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

⚠️ **보안 주의사항**:
- 최소 32자 이상 권장
- 랜덤하게 생성된 값 사용
- 절대 GitHub에 커밋하지 말 것
- 프로덕션과 개발 환경에서 다른 값 사용

---

### 3. CORS_ORIGIN ⚠️ 필수 설정!

**목적**: 프론트엔드 도메인에서만 API 접근 허용

**설정 예시**:

#### Vercel 배포 시
```env
CORS_ORIGIN=https://exam-platform.vercel.app
```

#### 커스텀 도메인 사용 시
```env
CORS_ORIGIN=https://www.exam-platform.com
```

#### 여러 도메인 지원 (쉼표로 구분)
```env
CORS_ORIGIN=https://exam-platform.vercel.app,https://www.exam-platform.com,https://admin.exam-platform.com
```

**확인 방법**:
1. Frontend 배포 후 실제 URL 확인
2. 해당 URL을 `CORS_ORIGIN`에 입력
3. 재배포

---

### 4. JWT_EXPIRES_IN

**권장 설정**:
- **개발**: `1h` (1시간)
- **프로덕션**: `7d` (7일) 또는 `30d` (30일)

**형식**:
- `1h` = 1시간
- `7d` = 7일
- `30d` = 30일
- `2w` = 2주

---

## 🎯 프로덕션 환경별 설정 예시

### Railway (Backend 배포)

```env
# Railway Dashboard → Variables 탭에 추가

DATABASE_URL=postgresql://postgres:1dnjf4dlf@db.[프로젝트].supabase.co:5432/postgres
JWT_SECRET=[생성한 강력한 시크릿]
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://exam-platform.vercel.app
PORT=3001
LOG_LEVEL=info
```

### Vercel (Frontend 배포)

```env
# Vercel Dashboard → Settings → Environment Variables

NEXT_PUBLIC_API_URL=https://backend-production.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://backend-production.up.railway.app
```

### AWS EC2 (수동 배포)

```bash
# EC2 서버에서 .env 파일 생성
nano /home/ubuntu/exam-platform/backend/.env
```

```env
DATABASE_URL=postgresql://postgres:1dnjf4dlf@db.[프로젝트].supabase.co:5432/postgres
JWT_SECRET=[생성한 강력한 시크릿]
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://exam-platform.vercel.app
PORT=3001
LOG_LEVEL=info
```

---

## 🔍 환경 변수 검증 방법

### 1. 연결 테스트 스크립트
```bash
cd backend
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ 데이터베이스 연결 성공');
    return prisma.\$disconnect();
  })
  .catch((e) => {
    console.error('❌ 연결 실패:', e.message);
    process.exit(1);
  });
"
```

### 2. 환경 변수 확인
```bash
cd backend
# 모든 환경 변수 출력 (비밀번호는 마스킹)
node -e "
require('dotenv').config();
const env = process.env;
console.log('DATABASE_URL:', env.DATABASE_URL ? '✅ 설정됨' : '❌ 없음');
console.log('JWT_SECRET:', env.JWT_SECRET ? '✅ 설정됨' : '❌ 없음');
console.log('CORS_ORIGIN:', env.CORS_ORIGIN || '❌ 없음 (필수!)');
console.log('NODE_ENV:', env.NODE_ENV || 'development');
"
```

---

## ⚠️ 주의사항

### 보안
1. ✅ **JWT_SECRET은 강력한 랜덤 값 사용**
2. ✅ **절대 GitHub에 .env 파일 커밋 금지**
3. ✅ **프로덕션 비밀번호는 별도 관리**
4. ✅ **환경 변수는 배포 플랫폼에서 설정**

### CORS 설정
- ❌ `CORS_ORIGIN=*` 사용 금지 (보안 위험)
- ✅ 실제 프론트엔드 도메인만 허용
- ✅ 여러 도메인은 쉼표로 구분

### 데이터베이스
- ✅ Connection Pooling 사용 권장 (프로덕션)
- ✅ SSL 연결 활성화
- ✅ 백업 설정 확인

---

## 📋 최종 체크리스트

배포 전 확인:

- [ ] DATABASE_URL - Supabase 연결 문자열 설정
- [ ] JWT_SECRET - 강력한 랜덤 값으로 변경
- [ ] JWT_EXPIRES_IN - 적절한 만료 시간 설정
- [ ] NODE_ENV - `production` 설정
- [ ] PORT - 서버 포트 (자동 할당 시 생략 가능)
- [ ] **CORS_ORIGIN - 프론트엔드 도메인 설정** ⚠️ 필수!
- [ ] LOG_LEVEL - 로깅 레벨 (선택)

---

## 🚀 빠른 설정 스크립트

```bash
# JWT_SECRET 생성
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "JWT_SECRET=$JWT_SECRET"

# .env.production 파일에 추가
cat >> .env.production << EOF
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
EOF
```

---

**작성일**: 2024년 11월  
**버전**: 1.0

