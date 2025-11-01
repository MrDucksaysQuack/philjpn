# Phase 8 완료 보고서

> **실시간 모니터링 및 부정행위 탐지 시스템 구현 완료**

---

## ✅ 완료된 작업

### 1. 실시간 모니터링 시스템
- ✅ **WebSocket Gateway** (Socket.io)
  - 시험 시작/종료 이벤트 추적
  - 실시간 세션 상태 모니터링
  - Admin에게 실시간 알림

- ✅ **Monitoring Service**
  - 활성 세션 관리 (메모리 기반)
  - 세션 상태 추적
  - 일별 통계 집계

- ✅ **Monitoring API**
  - 활성 세션 목록 조회 (Admin)
  - 실시간 이벤트 수신

### 2. 부정행위 탐지 로직
- ✅ **탭 전환 탐지**
  - 시험 중 탭 전환 횟수 추적
  - 3회 초과 시 경고 및 로그 기록
  - Admin에게 실시간 알림

- ✅ **빠른 제출 탐지**
  - 예상 시간의 30% 미만 제출 시 의심
  - 소요 시간 분석 및 기록
  - Audit Log에 부정행위 이벤트 기록

- ✅ **클라이언트 보호 기능**
  - 복사/붙여넣기 방지
  - 우클릭 방지
  - 주기적 활동 업데이트

### 3. Frontend 통합
- ✅ **Socket Client 설정**
  - Socket.io 클라이언트 연결
  - 이벤트 emit/listen 기능
  - 자동 재연결 로직

- ✅ **시험 응시 페이지 통합**
  - 시험 시작 시 WebSocket 연결
  - 탭 전환 감지 및 전송
  - 시험 종료 시 연결 해제

---

## 📁 생성된 파일 구조

### Backend
```
src/modules/monitoring/
├── monitoring.module.ts
├── monitoring.controller.ts
├── services/
│   └── monitoring.service.ts
├── gateway/
│   └── exam-monitoring.gateway.ts
└── dto/
    └── monitoring-events.dto.ts
```

### Frontend
```
lib/
└── socket.ts (Socket.io 클라이언트)
```

---

## 🔧 주요 기능

### 1. 실시간 모니터링

#### WebSocket 이벤트
- `exam_start`: 시험 시작
- `exam_end`: 시험 종료
- `tab_switch`: 탭 전환
- `activity`: 활동 업데이트
- `get_active_sessions`: 활성 세션 조회 (Admin)

#### 서버 이벤트 (브로드캐스트)
- `session_started`: 새 세션 시작 (Admin에게 알림)
- `session_ended`: 세션 종료
- `cheating_detected`: 부정행위 탐지 (Admin에게 알림)

### 2. 부정행위 탐지 알고리즘

#### 탭 전환 탐지
```
탭 전환 횟수 > 3회
→ 경고 (warning)
→ Audit Log 기록
→ Admin에게 실시간 알림
```

#### 빠른 제출 탐지
```
소요 시간 < 예상 시간의 30%
→ 의심 (warning)
→ 상세 정보 기록
→ Admin에게 실시간 알림
```

### 3. 클라이언트 보호

#### 브라우저 이벤트 차단
- `copy` 이벤트 차단
- `paste` 이벤트 차단
- `contextmenu` (우클릭) 차단
- `visibilitychange` 감지 (탭 전환)

---

## 📝 API 엔드포인트

### Monitoring API
- `GET /api/admin/monitoring/active-sessions` - 활성 세션 목록 (Admin Only)

---

## 🔌 WebSocket 연결

### 클라이언트 연결
```typescript
// Frontend
const socket = socketClient.connect(token);

// 이벤트 emit
socketClient.emitExamStart(sessionId, userId, examId);
socketClient.emitTabSwitch(sessionId, userId, examId);
socketClient.emitExamEnd(sessionId);

// 이벤트 수신
socketClient.on('cheating_detected', (data) => {
  console.log('부정행위 탐지:', data);
});
```

### Admin 대시보드 통합 (향후)
```typescript
// Admin 페이지에서 실시간 모니터링
socketClient.on('session_started', (data) => {
  // 새 시험 시작 알림
});

socketClient.on('cheating_detected', (data) => {
  // 부정행위 알림
  showAlert(data);
});
```

---

## 🎯 탐지 기준

### 경고 (Warning)
- 탭 전환 3회 초과
- 빠른 제출 (예상 시간의 30% 미만)

### 심각 (Critical)
- 연속 탭 전환 (10회 이상)
- 극단적으로 빠른 제출 (예상 시간의 10% 미만)

---

## 📋 Phase 8 체크리스트

- [x] 실시간 모니터링 구축 (WebSocket)
- [x] 부정행위 탐지 로직 작동
- [x] 탭 전환 탐지 구현
- [x] 빠른 제출 탐지 구현
- [x] 클라이언트 보호 기능 구현
- [x] Audit Log 연동
- [ ] Admin 실시간 대시보드 (UI)

---

## 🚀 사용 시나리오

### 시나리오 1: 정상적인 시험 응시
1. 사용자가 시험 시작
   - WebSocket 연결
   - `exam_start` 이벤트 전송
   - 모니터링 시스템에 등록

2. 시험 진행
   - 주기적 활동 업데이트 (30초마다)
   - 답안 저장 시 활동 업데이트

3. 시험 제출
   - `exam_end` 이벤트 전송
   - 빠른 제출 검증
   - 모니터링 시스템에서 제거

### 시나리오 2: 부정행위 탐지
1. 사용자가 탭 전환
   - `tab_switch` 이벤트 전송
   - 횟수 증가

2. 3회 초과 시
   - 경고 로그 기록
   - Admin에게 실시간 알림
   - Audit Log 저장

3. 빠른 제출 시
   - 소요 시간 분석
   - 예상 시간 대비 계산
   - 30% 미만 시 경고
   - Admin에게 알림

---

## 🔄 다음 단계 (선택사항)

1. **Admin 실시간 대시보드 UI**
   - 활성 세션 실시간 표시
   - 부정행위 알림 팝업
   - 실시간 차트

2. **추가 탐지 기능**
   - 복사/붙여넣기 탐지
   - 여러 탭 동시 접속 탐지
   - 마우스 이탈 탐지

3. **i18n 지원**
   - 다국어 메시지
   - 지역별 설정

4. **결제 시스템 연동**
   - Stripe/Xendit/GCash 연동
   - 결제 후 자동 Key 발급

---

**Phase 8 완료일**: 2024년 11월  
**상태**: 핵심 기능 완료, UI 개선 가능

