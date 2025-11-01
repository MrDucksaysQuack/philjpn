# 시험 플랫폼 (Exam Platform)

> 온라인 시험 및 학습 관리 플랫폼

---

## 📚 프로젝트 소개

온라인 시험 플랫폼은 시험 응시, 자동 채점, 학습 분석, 단어장 기능을 제공하는 종합 학습 관리 시스템입니다.

### 주요 기능

- ✅ **시험 관리**: 시험 생성, 섹션/문제 관리
- ✅ **실시간 응시**: 실시간 시험 응시 및 답안 저장
- ✅ **자동 채점**: 서버 기반 자동 채점 시스템
- ✅ **결과 분석**: 상세한 시험 결과 리포트 및 약점 분석
- ✅ **라이선스 키 시스템**: 사용권 기반 접근 제어
- ✅ **단어장**: SRS(간격 반복 학습) 기반 단어 학습
- ✅ **관리자 패널**: 사용자/시험/키 관리 대시보드
- ✅ **실시간 모니터링**: 부정행위 탐지 및 세션 모니터링

---

## 🏗️ 기술 스택

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT
- **Real-time**: Socket.io
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **Styling**: Tailwind CSS
- **WebSocket**: Socket.io Client

---

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 20.x 이상
- PostgreSQL 14.x 이상
- npm 또는 yarn

### 설치 및 실행

자세한 내용은 [QUICK_START.md](./QUICK_START.md)를 참고하세요.

#### Backend 실행
```bash
cd backend
npm install
cp .env.example .env  # 환경 변수 설정
npx prisma migrate dev
npm run start:dev
```

#### Frontend 실행
```bash
cd frontend/client
npm install
cp .env.example .env.local  # 환경 변수 설정
npm run dev
```

---

## 📖 문서

- [프로젝트 아키텍처](./PROJECT_ARCHITECTURE.md)
- [ERD 설계](./ERD_DESIGN.md)
- [API 명세서](./API_SPECIFICATION.md)
- [배포 가이드](./DEPLOYMENT_GUIDE.md)
- [빠른 배포 가이드](./DEPLOYMENT_QUICK_START.md)

---

## 📁 프로젝트 구조

```
exam-platform/
├── backend/          # NestJS Backend
│   ├── src/
│   │   ├── modules/  # 기능별 모듈
│   │   └── common/   # 공통 유틸리티
│   └── prisma/       # 데이터베이스 스키마
├── frontend/
│   └── client/       # Next.js Frontend
└── shared/           # 공통 타입 (향후 확장)
```

---

## 🔐 환경 변수

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 📊 개발 현황

### 완료된 Phase
- ✅ Phase 1: 기초 인프라 & 데이터 구조
- ✅ Phase 2: 핵심 로직 - 모의시험 엔진
- ✅ Phase 3: 사용자 계정 및 인증 시스템
- ✅ Phase 4: Key System 구축
- ✅ Phase 5: 결과 리포트 + 단어장 + 약점요약
- ✅ Phase 6: Frontend (Client UI)
- ✅ Phase 7: Admin Panel
- ✅ Phase 8: 확장 단계 (실시간 모니터링)

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 👥 기여자

프로젝트 팀

---

**버전**: 1.0.0  
**최종 업데이트**: 2024년 11월
