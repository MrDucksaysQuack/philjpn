# 프로덕션 배포 가이드

> **실제 인터넷에 서비스 배포를 위한 완전한 가이드**

---

## 🎯 배포 전략 개요

### 추천 아키텍처

```
┌─────────────────────────────────────────┐
│           Domain (도메인)                │
│    exam-platform.com / *.yourdomain.com │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼───────┐      ┌────────▼────────┐
│  Frontend     │      │   Backend       │
│  (Vercel)     │      │  (Railway/EC2)  │
│  Next.js      │      │  NestJS         │
└───────┬───────┘      └────────┬────────┘
        │                       │
        └───────────┬───────────┘
                    │
          ┌─────────▼─────────┐
          │   Database        │
          │  (Supabase/RDS)   │
          │  PostgreSQL       │
          └───────────────────┘
```

---

## 📋 배포 체크리스트

### Phase 1: 인프라 선택 및 준비

#### 1.1 프론트엔드 호스팅 (Frontend)
**옵션**:
- ✅ **Vercel** (추천) - Next.js 최적화, 무료 시작
- ✅ **Netlify** - 간단한 배포
- ✅ **AWS S3 + CloudFront** - 확장성
- ✅ **Railway** - Full-stack 통합

#### 1.2 백엔드 호스팅 (Backend)
**옵션**:
- ✅ **Railway** (추천) - 간단하고 빠름
- ✅ **AWS EC2** - 제어권 높음
- ✅ **Render** - 무료 시작 가능
- ✅ **Heroku** - 클래식하지만 유료 전환됨
- ✅ **DigitalOcean** - 중간 가격, 좋은 성능

#### 1.3 데이터베이스 (Database)
**옵션**:
- ✅ **Supabase** (추천) - PostgreSQL + 실시간 기능
- ✅ **AWS RDS** - 프로덕션 안정성
- ✅ **Railway Database** - 통합 관리
- ✅ **Neon** - Serverless PostgreSQL
- ✅ **PlanetScale** - MySQL (마이그레이션 필요)

---

## 🚀 배포 단계별 가이드

### Step 1: 데이터베이스 설정 (우선순위 1)

#### Supabase 사용 (추천)

1. **Supabase 프로젝트 생성**
   ```bash
   # https://supabase.com 접속
   # 새 프로젝트 생성
   # PostgreSQL 버전 선택
   ```

2. **데이터베이스 연결 정보 복사**
   ```
   Connection String 형식:
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

3. **환경 변수 설정**
   ```bash
   # Backend .env.production
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
   ```

4. **Prisma 마이그레이션 실행**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

---

### Step 2: Backend 배포

#### Option A: Railway 사용 (가장 간단)

1. **Railway 계정 생성**
   ```bash
   # https://railway.app 접속
   # GitHub 연동
   ```

2. **프로젝트 생성**
   - New Project → Deploy from GitHub
   - `exam-platform/backend` 선택

3. **환경 변수 설정** (Railway Dashboard)
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-super-secret-key-change-this
   JWT_EXPIRES_IN=1h
   PORT=3001
   NODE_ENV=production
   ```

4. **빌드 설정** (Railway는 자동 감지하지만, 명시적 설정 가능)
   ```json
   // package.json (이미 설정됨)
   {
     "scripts": {
       "build": "nest build",
       "start": "node dist/main.js"
     }
   }
   ```

5. **배포 URL 확인**
   - Railway가 자동으로 URL 제공
   - 예: `https://backend-production-xxxx.up.railway.app`

#### Option B: AWS EC2 사용

1. **EC2 인스턴스 생성**
   ```bash
   # AWS Console → EC2 → Launch Instance
   # Ubuntu 22.04 LTS 선택
   # t3.small 이상 권장 (2GB RAM)
   ```

2. **보안 그룹 설정**
   - Inbound Rules:
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (3001) - Your IP (선택)

3. **서버 설정**
   ```bash
   # SSH 접속
   ssh -i your-key.pem ubuntu@[EC2-IP]
   
   # Node.js 설치
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PM2 설치 (프로세스 관리)
   sudo npm install -g pm2
   
   # Git 설치
   sudo apt-get install git
   
   # 프로젝트 클론
   git clone https://github.com/your-username/exam-platform.git
   cd exam-platform/backend
   
   # 의존성 설치
   npm install
   
   # 환경 변수 설정
   nano .env
   # DATABASE_URL, JWT_SECRET 등 입력
   
   # Prisma 마이그레이션
   npx prisma migrate deploy
   npx prisma generate
   
   # 빌드
   npm run build
   
   # PM2로 실행
   pm2 start dist/main.js --name exam-platform-backend
   pm2 save
   pm2 startup  # 재부팅 시 자동 시작
   ```

4. **Nginx 설정** (Reverse Proxy)
   ```bash
   sudo apt-get install nginx
   
   # 설정 파일 생성
   sudo nano /etc/nginx/sites-available/exam-platform
   ```
   
   ```nginx
   server {
       listen 80;
       server_name api.exam-platform.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/exam-platform /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

### Step 3: Frontend 배포

#### Vercel 사용 (가장 간단)

1. **Vercel 계정 생성**
   ```bash
   # https://vercel.com 접속
   # GitHub 연동
   ```

2. **프로젝트 Import**
   - New Project → Import Git Repository
   - `exam-platform/frontend/client` 선택

3. **빌드 설정**
   ```
   Framework Preset: Next.js
   Root Directory: frontend/client
   Build Command: npm run build
   Output Directory: .next
   ```

4. **환경 변수 설정** (Vercel Dashboard)
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
   ```

5. **자동 배포**
   - Git push 시 자동 배포
   - Preview 배포 (Pull Request)
   - Production 배포 (main 브랜치)

---

### Step 4: 도메인 설정

1. **도메인 구매**
   - GoDaddy, Namecheap, Cloudflare 등

2. **DNS 설정**

   **Vercel (Frontend)**
   ```
   Type: CNAME
   Name: www (또는 @)
   Value: cname.vercel-dns.com
   ```

   **Railway/EC2 (Backend)**
   ```
   Type: A
   Name: api (또는 api.yourdomain.com)
   Value: [서버 IP 주소]
   
   또는
   
   Type: CNAME
   Name: api
   Value: [Railway 제공 도메인]
   ```

3. **Vercel 도메인 추가**
   - Project Settings → Domains
   - 도메인 추가 및 인증

4. **SSL 인증서** (자동)
   - Vercel: 자동 Let's Encrypt
   - Railway: 자동 SSL
   - EC2: Certbot 사용 또는 AWS Certificate Manager

---

### Step 5: 환경 변수 최종 확인

#### Backend (.env.production)
```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public

# JWT
JWT_SECRET=[강력한 랜덤 문자열, 최소 32자]
JWT_EXPIRES_IN=1h

# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Optional: Logging
LOG_LEVEL=info
```

#### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

---

## 🔒 보안 설정

### 1. 환경 변수 보안
- ✅ **절대 GitHub에 커밋하지 말 것**
- ✅ `.env.production` 파일은 서버에만
- ✅ `.gitignore`에 `.env*` 추가 확인

### 2. JWT Secret 생성
```bash
# 강력한 시크릿 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. CORS 설정 확인
```typescript
// backend/src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.com',
  credentials: true,
});
```

### 4. Rate Limiting (추천)
```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
```

### 5. Helmet (보안 헤더)
```bash
npm install helmet
```

```typescript
// main.ts
import helmet from 'helmet';
app.use(helmet());
```

---

## 📊 모니터링 및 로깅

### 1. 로깅 설정 (Winston/Pino)

```bash
cd backend
npm install pino pino-pretty
```

```typescript
// logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as pino from 'pino';

@Injectable()
export class AppLogger implements LoggerService {
  private logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' 
      ? { target: 'pino-pretty' }
      : undefined,
  });

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace: string) {
    this.logger.error({ trace }, message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }
}
```

### 2. 에러 추적 (Sentry - 선택사항)

```bash
npm install @sentry/node @sentry/nestjs
```

### 3. 성능 모니터링

- **Railway**: 내장 메트릭
- **Vercel**: Analytics 내장
- **AWS CloudWatch**: EC2 사용 시

---

## 🔄 CI/CD 파이프라인

### GitHub Actions 설정

#### Backend CI/CD

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          working-directory: ./backend
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Run tests
        run: npm test
        working-directory: ./backend
      
      - name: Build
        run: npm run build
        working-directory: ./backend
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.0.8
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

#### Frontend CI/CD

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/client/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          working-directory: ./frontend/client
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend/client
      
      - name: Build
        run: npm run build
        working-directory: ./frontend/client
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
```

---

## 📝 배포 전 확인 사항

### 필수 체크리스트

- [ ] 데이터베이스 백업 설정
- [ ] 환경 변수 모든 서버에 설정
- [ ] CORS 설정 확인
- [ ] JWT Secret 강력한 값으로 변경
- [ ] SSL 인증서 설정
- [ ] 도메인 DNS 설정 완료
- [ ] 프론트엔드 API URL 설정
- [ ] 에러 로깅 설정
- [ ] Rate Limiting 설정
- [ ] 보안 헤더 설정
- [ ] 프로덕션 빌드 테스트

---

## 🚀 빠른 배포 가이드 (최소 시간)

### 최소 구성 (테스트용)

1. **Supabase** (데이터베이스)
   - 5분: 프로젝트 생성
   - 연결 정보 복사

2. **Railway** (백엔드)
   - 10분: GitHub 연동, 배포
   - 환경 변수 설정

3. **Vercel** (프론트엔드)
   - 10분: GitHub 연동, 배포
   - 환경 변수 설정

**총 소요 시간: 약 30분**

### 프로덕션 구성 (안정성 중시)

1. **AWS RDS** (데이터베이스) - 30분
2. **AWS EC2 + Nginx** (백엔드) - 1시간
3. **Vercel** (프론트엔드) - 10분
4. **도메인 + SSL** - 1시간

**총 소요 시간: 약 2-3시간**

---

## 📚 추가 리소스

### 문서
- [Vercel Deployment](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)

### 도구
- [Let's Encrypt](https://letsencrypt.org) - 무료 SSL
- [Cloudflare](https://cloudflare.com) - DNS + CDN
- [PM2](https://pm2.keymetrics.io) - Node.js 프로세스 관리

---

## 🆘 문제 해결

### 일반적인 문제

1. **데이터베이스 연결 실패**
   - 방화벽 설정 확인
   - 연결 문자열 확인
   - SSL 모드 확인 (Supabase는 필요)

2. **CORS 오류**
   - CORS_ORIGIN 환경 변수 확인
   - 프론트엔드 도메인 정확히 입력

3. **빌드 실패**
   - Node.js 버전 확인 (20.x 권장)
   - 의존성 설치 확인
   - 환경 변수 누락 확인

4. **SSL 인증서 오류**
   - DNS 전파 대기 (최대 48시간)
   - 인증서 발급 대기

---

**작성일**: 2024년 11월  
**버전**: 1.0

