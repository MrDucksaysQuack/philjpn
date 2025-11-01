# ✅ 프로덕션 환경 변수 체크리스트

> **배포 전 필수 확인 사항**

---

## 📋 필수 환경 변수 (7개)

### ✅ 이미 설정된 항목

1. **DATABASE_URL** ✅
   ```env
   DATABASE_URL=postgresql://postgres:1dnjf4dlf@db.[프로젝트].supabase.co:5432/postgres
   ```
   ⚠️ `[프로젝트]` 부분을 실제 Supabase 프로젝트 ID로 변경 필요!

2. **JWT_EXPIRES_IN** ✅
   ```env
   JWT_EXPIRES_IN=1h
   ```

3. **NODE_ENV** ✅
   ```env
   NODE_ENV=production
   ```

4. **PORT** ✅
   ```env
   PORT=3001
   ```

---

### ⚠️ 변경/추가 필요한 항목

5. **JWT_SECRET** ⚠️ **강력한 값으로 변경 필수!**
   ```env
   JWT_SECRET=your-super-secret-key
   ```
   
   **현재 상태**: 임시값 사용 중 → **반드시 변경 필요!**
   
   **변경 방법**:
   ```bash
   # 강력한 시크릿 생성
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   **예시 결과**:
   ```env
   JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
   ```

6. **CORS_ORIGIN** ❌ **추가 필요!**
   ```env
   CORS_ORIGIN=https://your-frontend-domain.com
   ```
   
   **설정 예시**:
   - Vercel 배포: `https://exam-platform.vercel.app`
   - 커스텀 도메인: `https://www.exam-platform.com`
   - 여러 도메인: `https://exam-platform.vercel.app,https://www.exam-platform.com`
   
   ⚠️ **프론트엔드 배포 후 실제 URL로 변경해야 함!**

---

### 선택 항목 (권장)

7. **LOG_LEVEL** (선택, 권장)
   ```env
   LOG_LEVEL=info
   ```
   - `error`: 에러만
   - `warn`: 경고 이상
   - `info`: 정보 이상 (권장)
   - `debug`: 모든 로그

---

## 📝 완전한 프로덕션 .env 파일

```env
# ============================================
# 데이터베이스 (Supabase)
# ============================================
# ⚠️ [프로젝트] 부분을 실제 Supabase 프로젝트 ID로 변경
DATABASE_URL=postgresql://postgres:1dnjf4dlf@db.[프로젝트].supabase.co:5432/postgres

# ============================================
# JWT 인증
# ============================================
# ⚠️ 아래 명령으로 생성한 강력한 시크릿으로 변경:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=[생성한-64자리-16진수-문자열]
JWT_EXPIRES_IN=1h

# ============================================
# 서버 설정
# ============================================
NODE_ENV=production
PORT=3001

# ============================================
# CORS (프론트엔드 도메인)
# ============================================
# ⚠️ 실제 프론트엔드 배포 URL로 변경 필수!
CORS_ORIGIN=https://exam-platform.vercel.app

# ============================================
# 로깅 (선택)
# ============================================
LOG_LEVEL=info
```

---

## 🚀 빠른 설정 가이드

### Step 1: JWT_SECRET 생성
```bash
cd backend
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 결과를 복사
```

### Step 2: .env 파일 수정
```bash
cd backend
nano .env  # 또는 원하는 에디터
```

다음 항목 수정/추가:
1. `JWT_SECRET` → 위에서 생성한 값으로 변경
2. `CORS_ORIGIN` → 프론트엔드 URL 추가
3. `DATABASE_URL` → `[프로젝트]` 부분 실제 ID로 변경

### Step 3: 확인
```bash
# 환경 변수 확인
cat .env | grep -E "(DATABASE_URL|JWT_SECRET|CORS_ORIGIN)"
```

---

## 📊 환경별 설정 비교

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|--------------|
| DATABASE_URL | 로컬 PostgreSQL | Supabase |
| JWT_SECRET | 임시값 가능 | 강력한 랜덤 값 필수 |
| JWT_EXPIRES_IN | 1h | 7d 권장 |
| NODE_ENV | development | production |
| CORS_ORIGIN | http://localhost:3000 | 실제 프론트엔드 URL |
| LOG_LEVEL | debug | info |

---

## ⚠️ 주의사항

### 보안
1. ✅ **JWT_SECRET은 절대 공개하지 말 것**
2. ✅ **.env 파일은 Git에 커밋하지 말 것**
3. ✅ **프로덕션과 개발 환경 분리**

### CORS
1. ❌ `CORS_ORIGIN=*` 사용 금지 (보안 위험)
2. ✅ 실제 프론트엔드 도메인만 허용
3. ✅ 여러 도메인은 쉼표로 구분

### 데이터베이스
1. ✅ Supabase 프로젝트 ID 확인
2. ✅ 연결 문자열 형식 확인
3. ✅ Connection Pooling 사용 권장

---

## 🔍 검증 방법

### 1. 환경 변수 확인 스크립트
```bash
cd backend
node -e "
require('dotenv').config();
const required = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.log('❌ 누락된 환경 변수:', missing.join(', '));
  process.exit(1);
}
console.log('✅ 모든 필수 환경 변수 설정됨');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅' : '❌');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || '❌ 없음');
"
```

### 2. 서버 실행 테스트
```bash
cd backend
npm run start:dev
```
에러가 없으면 환경 변수 설정 완료!

---

## 📋 최종 체크리스트

배포 전 확인:

- [ ] DATABASE_URL - Supabase 프로젝트 ID 포함 확인
- [ ] JWT_SECRET - 강력한 랜덤 값으로 변경 ✅
- [ ] JWT_EXPIRES_IN - 적절한 값 설정
- [ ] NODE_ENV - `production` 설정
- [ ] PORT - 서버 포트 설정
- [ ] **CORS_ORIGIN - 프론트엔드 URL 설정** ⚠️ 필수!
- [ ] LOG_LEVEL - 로깅 레벨 설정 (선택)

---

**작성일**: 2024년 11월 1일

