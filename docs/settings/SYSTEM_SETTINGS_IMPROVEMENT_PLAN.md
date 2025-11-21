# 시스템 설정 모듈 개선 계획

## 📊 현재 상태 검증 결과

### ✅ 구현 완료된 기능

1. **사이트 설정 (SiteSettings)**
   - ✅ 기본 정보 관리 (회사명, 로고, 파비콘, 색상)
   - ✅ 회사/팀/서비스 정보 관리 (Markdown 지원)
   - ✅ 다국어 콘텐츠 관리 (ko/en/ja)
   - ✅ 이미지 업로드 기능
   - ✅ 색상 분석 기능 (로고 기반)

2. **카테고리 관리**
   - ✅ 카테고리 CRUD
   - ✅ 서브카테고리 CRUD
   - ✅ 아이콘, 순서, 활성화 관리

3. **배지 관리**
   - ✅ 배지 CRUD
   - ✅ 배지 타입별 그룹화
   - ✅ 희귀도 관리
   - ✅ 조건 설정 (JSON)
   - ✅ 배지 확인 로직 (`BadgeService.checkAndAwardBadges()`)

### ⚠️ 발견된 문제점

#### 1. 배지 자동 부여 미구현
**현재 상태**:
- `BadgeService.checkAndAwardBadges()` 메서드는 구현되어 있음
- `SessionService.submitExam()`에서 주석 처리됨 (순환 의존성 문제)
- 프론트엔드에서 수동으로 배지 확인 중 (`results/[id]/page.tsx:35-65`)

**문제 코드 위치**:
```typescript
// backend/src/modules/core/session/session.service.ts:426-427
// 배지 체크는 나중에 구현 (순환 의존성 문제로 인해 주석 처리)
// TODO: 배지 체크 로직 구현 (이벤트 기반 또는 별도 서비스로 분리)
```

**영향**:
- 시험 완료 시 배지가 자동으로 부여되지 않음
- 사용자가 결과 페이지를 방문해야만 배지 확인 가능
- 실시간 배지 획득 알림 불가능

#### 2. SiteSettings 버전 관리 없음
**현재 상태**:
- `ContentVersion`은 Exam/Question/Template에만 적용
- SiteSettings는 버전 관리 없음
- 변경 이력 추적 불가능
- 롤백 기능 없음

**영향**:
- 설정 변경 실수 시 복구 불가능
- 변경 이력 추적 불가
- A/B 테스트 불가능

#### 3. 데이터 시각화 부족
**현재 상태**:
- 배지 통계/시각화 없음
- 카테고리 드래그 정렬 없음
- 다국어 콘텐츠 미리보기 없음
- 배지 조건 편집기 없음 (JSON 직접 입력)

**영향**:
- 관리자 UX 저하
- 실수 가능성 증가
- 운영 효율 저하

---

## 🎯 개선 계획

### Phase 1: 즉시 개선 (UX·데이터 개선) - 3~5일

#### 1.1 SiteSettings Auto-save
**목표**: 설정 변경 시 자동 저장으로 데이터 손실 방지

**작업 내용**:
- [ ] Debounce 기반 자동 저장 (3초)
- [ ] 저장 상태 표시 (저장 중/저장 완료/저장 실패)
- [ ] 변경 감지 및 저장 확인 다이얼로그

**파일**:
- `frontend/client/app/admin/settings/page.tsx`

**예상 시간**: 1일

#### 1.2 Category Drag & Drop 정렬
**목표**: 카테고리 순서를 드래그로 쉽게 변경

**작업 내용**:
- [ ] `react-beautiful-dnd` 또는 `@dnd-kit/core` 라이브러리 추가
- [ ] 카테고리 목록에 드래그 핸들 추가
- [ ] 드래그 완료 시 순서 업데이트 API 호출
- [ ] 서브카테고리도 동일하게 적용

**파일**:
- `frontend/client/app/admin/categories/page.tsx`
- `backend/src/modules/core/category/category.controller.ts` (순서 업데이트 엔드포인트)

**예상 시간**: 1.5일

#### 1.3 Badge 조건 편집기
**목표**: JSON 직접 입력 대신 UI로 조건 설정

**작업 내용**:
- [ ] 배지 타입별 조건 입력 폼 생성
  - `exam_completed`: 시험 완료 횟수
  - `perfect_score`: 자동 (만점 달성)
  - `streak_days`: 연속 학습 일수
  - `word_master`: 단어장 단어 수
  - `improvement`: 성적 향상률
  - `category_master`: 카테고리 ID + 시험 완료 횟수
  - `speed_demon`: 시간 제한 (초)
  - `consistency`: 연속 학습 일수
- [ ] 조건 미리보기 (JSON 표시)
- [ ] 조건 검증 로직

**파일**:
- `frontend/client/app/admin/badges/page.tsx` (BadgeModal 컴포넌트)

**예상 시간**: 2일

#### 1.4 Badge 미리보기
**목표**: 배지 생성 시 실제 표시 모습 확인

**작업 내용**:
- [ ] 배지 카드 미리보기 컴포넌트
- [ ] 희귀도별 색상 표시
- [ ] 아이콘 미리보기

**파일**:
- `frontend/client/app/admin/badges/page.tsx`

**예상 시간**: 0.5일

---

### Phase 2: 중기 개선 (자동화 및 버전 관리) - 5~7일

#### 2.1 배지 자동 부여 시스템
**목표**: ExamResult 완료 시 자동으로 배지 부여

**현재 문제**:
- 순환 의존성: `SessionService` → `BadgeService` → `PrismaService`
- 이벤트 기반으로 분리 필요

**해결 방안**:
1. **이벤트 기반 아키텍처** (권장)
   - `SessionService`에서 이벤트 발행
   - `BadgeEventListener`에서 이벤트 수신 및 배지 확인
   - 순환 의존성 제거

2. **대안: 별도 Job Queue**
   - 시험 완료 시 Job 생성
   - 백그라운드에서 배지 확인

**작업 내용**:
- [ ] 이벤트 모듈 생성 (`@nestjs/event-emitter` 사용)
- [ ] `ExamCompletedEvent` 정의
- [ ] `SessionService.submitExam()`에서 이벤트 발행
- [ ] `BadgeEventListener` 생성 및 등록
- [ ] 배지 획득 시 알림 전송 (WebSocket 또는 푸시)
- [ ] 프론트엔드에서 수동 확인 로직 제거

**파일**:
- `backend/src/modules/core/session/session.service.ts`
- `backend/src/modules/report/listeners/badge-event.listener.ts` (신규)
- `backend/src/modules/report/report.module.ts` (이벤트 리스너 등록)
- `frontend/client/app/results/[id]/page.tsx` (수동 확인 로직 제거)

**예상 시간**: 3일

#### 2.2 SiteSettings 버전 관리
**목표**: SiteSettings 변경 이력 추적 및 롤백

**작업 내용**:
- [ ] `SiteSettingsVersion` 모델 추가
  ```prisma
  model SiteSettingsVersion {
    id          String      @id @default(uuid())
    settingsId  String
    version     Int
    snapshot    Json        // 전체 설정 스냅샷
    label       String?     // 버전 라벨
    description String?     // 변경 사유
    createdBy   String
    createdAt   DateTime    @default(now())
    settings    SiteSettings @relation(fields: [settingsId], references: [id])
    
    @@index([settingsId])
    @@map("site_settings_versions")
  }
  ```
- [ ] `SiteSettingsService`에 버전 관리 로직 추가
  - `createVersion()`: 버전 생성
  - `getVersions()`: 버전 목록 조회
  - `rollbackToVersion()`: 특정 버전으로 롤백
- [ ] 프론트엔드에 버전 히스토리 UI 추가
- [ ] 설정 저장 시 자동 버전 생성 옵션

**파일**:
- `backend/prisma/schema.prisma`
- `backend/src/modules/admin/services/site-settings.service.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `frontend/client/app/admin/settings/page.tsx`

**예상 시간**: 2.5일

#### 2.3 색상/테마 자동 분석 개선
**목표**: 로고 업로드 시 자동으로 최적 색상 추출

**현재 상태**:
- `analyzeColors` API는 존재하지만 개선 필요

**작업 내용**:
- [ ] 색상 분석 알고리즘 개선
  - 주요 색상 추출 (K-means 클러스터링)
  - 대비 비율 계산
  - 접근성 검증 (WCAG AA/AAA)
- [ ] 색상 팔레트 제안
- [ ] 다크 모드 색상 자동 생성

**파일**:
- `backend/src/modules/admin/services/site-settings.service.ts`
- `frontend/client/app/admin/settings/page.tsx`

**예상 시간**: 1.5일

---

### Phase 3: 장기 개선 (확장·시각화) - 7~10일

#### 3.1 다국어 콘텐츠 미리보기
**목표**: 설정 페이지에서 실제 홈/About 페이지 미리보기

**작업 내용**:
- [ ] 미리보기 탭 개선
  - 언어별 탭 전환
  - 실제 페이지 렌더링 (iframe 또는 별도 컴포넌트)
  - 반응형 미리보기 (모바일/데스크톱)
- [ ] 실시간 업데이트 (변경 시 즉시 반영)

**파일**:
- `frontend/client/app/admin/settings/page.tsx`
- `frontend/client/components/admin/SettingsPreview.tsx` (신규)

**예상 시간**: 2일

#### 3.2 배지 통계 시각화
**목표**: 배지 획득률, 희귀도 분포 등 시각화

**작업 내용**:
- [ ] 배지 통계 API 추가
  - 전체 배지 획득률
  - 희귀도별 분포
  - 타입별 획득률
  - 최근 획득 추이
- [ ] 대시보드 차트 추가
  - 획득률 파이 차트
  - 희귀도 분포 바 차트
  - 시간별 획득 추이 라인 차트

**파일**:
- `backend/src/modules/report/services/badge.service.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `frontend/client/app/admin/badges/page.tsx`

**예상 시간**: 2일

#### 3.3 카테고리 SEO 최적화
**목표**: 카테고리 slug 기반 SEO 개선

**작업 내용**:
- [ ] `Category` 모델에 `slug` 필드 추가
- [ ] 자동 slug 생성 (이름 기반)
- [ ] slug 중복 검증
- [ ] 카테고리 페이지 URL 개선 (`/categories/:slug`)

**파일**:
- `backend/prisma/schema.prisma`
- `backend/src/modules/core/category/category.service.ts`
- `frontend/client/app/categories/[slug]/page.tsx` (신규)

**예상 시간**: 1.5일

#### 3.4 실시간 콘텐츠 반영
**목표**: 설정 변경 시 즉시 프론트엔드에 반영

**작업 내용**:
- [ ] WebSocket 또는 Server-Sent Events (SSE) 구현
- [ ] 설정 변경 시 모든 클라이언트에 브로드캐스트
- [ ] 프론트엔드에서 설정 업데이트 수신 및 반영
- [ ] 캐시 무효화 전략

**파일**:
- `backend/src/modules/admin/gateway/settings.gateway.ts` (신규)
- `frontend/client/lib/socket.ts` (확장)
- `frontend/client/lib/store.ts` (설정 상태 관리)

**예상 시간**: 2.5일

---

## 📋 우선순위 매트릭스

| 작업 | 우선순위 | 영향도 | 난이도 | 예상 시간 |
|------|---------|--------|--------|----------|
| 배지 자동 부여 | 🔴 높음 | 높음 | 중간 | 3일 |
| SiteSettings 버전 관리 | 🟡 중간 | 높음 | 중간 | 2.5일 |
| Category 드래그 정렬 | 🟡 중간 | 중간 | 낮음 | 1.5일 |
| Badge 조건 편집기 | 🟡 중간 | 중간 | 중간 | 2일 |
| SiteSettings Auto-save | 🟢 낮음 | 중간 | 낮음 | 1일 |
| 다국어 미리보기 | 🟢 낮음 | 낮음 | 중간 | 2일 |
| 배지 통계 시각화 | 🟢 낮음 | 낮음 | 중간 | 2일 |

---

## 🚀 실행 계획

### Week 1: Phase 1 (즉시 개선)
- Day 1-2: SiteSettings Auto-save + Category 드래그 정렬
- Day 3-4: Badge 조건 편집기
- Day 5: Badge 미리보기 + 테스트

### Week 2: Phase 2 (자동화)
- Day 1-3: 배지 자동 부여 시스템
- Day 4-5: SiteSettings 버전 관리
- Day 6-7: 색상 분석 개선 + 테스트

### Week 3: Phase 3 (확장)
- Day 1-2: 다국어 미리보기
- Day 3-4: 배지 통계 시각화
- Day 5: 카테고리 SEO + 실시간 반영 시작
- Day 6-7: 실시간 반영 완료 + 통합 테스트

---

## ✅ 검증 기준

### Phase 1 완료 기준
- [ ] SiteSettings 변경 시 3초 내 자동 저장
- [ ] 카테고리 드래그로 순서 변경 가능
- [ ] 배지 조건을 UI로 설정 가능 (JSON 직접 입력 불필요)
- [ ] 배지 미리보기 표시

### Phase 2 완료 기준
- [ ] 시험 완료 시 자동으로 배지 확인 및 부여
- [ ] 배지 획득 시 실시간 알림 표시
- [ ] SiteSettings 버전 히스토리 조회 가능
- [ ] SiteSettings 특정 버전으로 롤백 가능
- [ ] 로고 업로드 시 최적 색상 자동 추출

### Phase 3 완료 기준
- [ ] 다국어 콘텐츠 미리보기 가능
- [ ] 배지 통계 대시보드 표시
- [ ] 카테고리 slug 기반 URL 작동
- [ ] 설정 변경 시 실시간 반영

---

## 🔍 기술적 고려사항

### 1. 순환 의존성 해결
**문제**: `SessionService` → `BadgeService` 직접 호출 시 순환 의존성

**해결책**: 이벤트 기반 아키텍처
```typescript
// SessionService
@Injectable()
export class SessionService {
  constructor(
    private eventEmitter: EventEmitter2,
  ) {}

  async submitExam(...) {
    // ... 시험 제출 로직
    
    // 이벤트 발행
    this.eventEmitter.emit('exam.completed', {
      userId,
      examResultId,
      examId,
      score: gradedResult.totalScore,
      categoryId: exam.categoryId,
    });
  }
}

// BadgeEventListener
@OnEvent('exam.completed')
async handleExamCompleted(payload: ExamCompletedEvent) {
  await this.badgeService.checkAndAwardBadges(
    payload.userId,
    {
      examResultId: payload.examResultId,
      examId: payload.examId,
      score: payload.score,
      categoryId: payload.categoryId,
    }
  );
}
```

### 2. 성능 최적화
- 배지 확인 로직 최적화 (배치 처리)
- SiteSettings 버전 스냅샷 압축 저장
- 다국어 콘텐츠 캐싱

### 3. 데이터 마이그레이션
- SiteSettings 버전 관리 추가 시 기존 데이터 마이그레이션 필요
- 초기 버전 생성 (현재 설정을 v1으로)

---

## 📝 참고 사항

1. **배지 자동 부여**는 가장 우선순위가 높음 (사용자 경험에 직접 영향)
2. **SiteSettings 버전 관리**는 운영 안정성에 중요
3. **UX 개선**은 관리자 효율성 향상에 기여

각 Phase는 독립적으로 진행 가능하며, 우선순위에 따라 선택적으로 구현 가능합니다.

