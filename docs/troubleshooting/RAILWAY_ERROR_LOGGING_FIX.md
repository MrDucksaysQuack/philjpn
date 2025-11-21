# Railway 에러 로깅 개선 가이드

## 문제 상황

Railway 로그 CSV 파일(`logs.1763607911939.csv`)을 분석한 결과, **에러 메시지가 전혀 나타나지 않았습니다**.

### 발견된 문제

1. **모든 로그의 `level`이 `"info"`**: `error` 레벨의 로그가 없음
2. **`console.error` 호출이 로그에 나타나지 않음**: Railway 환경에서 `console.error`가 필터링되거나 다른 스트림으로 리다이렉트될 수 있음
3. **Winston 로거의 `error` 레벨도 로그에 나타나지 않음**: Railway가 Winston의 JSON 포맷 로그를 제대로 파싱하지 못할 수 있음

### 실제 상황

- API 요청은 정상적으로 들어오고 있음 (`GET /api/admin/dashboard`, `GET /api/admin/exams/statistics` 등)
- 하지만 500 에러가 발생했을 때 로그에 기록되지 않음
- 에러 원인을 파악할 수 없어 디버깅이 불가능한 상태

---

## 해결 방법

### 1. `process.stderr.write` 직접 사용

Railway 환경에서 에러가 확실히 로그에 나타나도록 `process.stderr.write`를 직접 사용합니다.

**수정 전:**
```typescript
catch (error: unknown) {
  console.error('❌ 에러:', error);
  throw error;
}
```

**수정 후:**
```typescript
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as { code?: string })?.code;
  const errorStack = error instanceof Error ? error.stack : undefined;
  const context = '[메서드명]';
  
  // Winston + console + stderr 병행 (Railway 환경 대응)
  this.logger.error(`${context} ${errorMessage}`, {
    code: errorCode,
    stack: errorStack,
  });
  console.error(`${context}`, {
    code: errorCode,
    msg: errorMessage,
    stack: errorStack,
    time: new Date().toISOString(),
  });
  // Railway가 인식할 수 있도록 stderr에 직접 출력
  process.stderr.write(
    `[ERROR] ${context} ${errorMessage}\n` +
    `Code: ${errorCode || 'N/A'}\n` +
    `Time: ${new Date().toISOString()}\n` +
    `Stack: ${errorStack || 'N/A'}\n\n`,
  );
  
  throw error;
}
```

### 2. Winston 로거 설정 개선

Winston 로거의 `error` 레벨이 Railway 콘솔에 출력되도록 설정을 개선했습니다.

**수정 내용:**
- `error` 레벨 로그가 출력될 때 `process.stderr.write`를 직접 호출하여 Railway가 인식할 수 있도록 함

---

## 적용된 파일

다음 파일들의 catch 블록이 수정되었습니다:

1. ✅ `backend/src/modules/admin/admin.controller.ts`
   - `getDashboard()`
   - `getExamStatistics()`
   - `getLicenseKeyStatistics()`

2. ✅ `backend/src/modules/ai/ai.controller.ts`
   - `getQueueStats()`
   - `checkAvailability()`

3. ✅ `backend/src/modules/report/report.controller.ts`
   - `getUserStatistics()`
   - `getLearningPatterns()`
   - `getWeaknessAnalysis()`
   - `getEfficiencyMetrics()`
   - `getGoalProgress()`
   - `generateReport()`
   - `getDetailedFeedback()`

4. ✅ `backend/src/modules/core/result/result.controller.ts`
   - `findAll()`
   - `findOne()`

5. ✅ `backend/src/modules/core/category/category.controller.ts`
   - `getPublicCategories()`

6. ✅ `backend/src/modules/contact/contact.controller.ts`
   - `submitContact()`

7. ✅ `backend/src/common/config/logger.config.ts`
   - Winston 로거 설정 개선

---

## Railway 로그에서 에러 확인 방법

### 방법 1: Railway 대시보드에서 검색

1. Railway 대시보드 → 서비스 → Logs 탭
2. 검색창에 `[ERROR]` 입력
3. 에러 메시지 확인

### 방법 2: Railway CLI로 검색

```bash
# [ERROR] 태그로 검색
railway logs --tail | grep "\[ERROR\]"

# 또는 일반적인 에러 키워드로 검색
railway logs --tail | grep -i "error\|❌\|500"
```

### 에러 로그 형식

에러가 발생하면 다음과 같은 형식으로 로그에 기록됩니다:

```
[ERROR] [getDashboard] 에러 메시지
Code: P2002
Time: 2025-11-20T03:00:00.000Z
Stack: Error: ...
```

---

## 다음 단계

1. ✅ **코드 수정 완료**: 모든 컨트롤러의 catch 블록에 `process.stderr.write` 추가
2. ⏳ **배포 대기**: Railway에 배포하여 변경사항 적용
3. ⏳ **에러 재현**: 500 에러가 발생하는 API 호출
4. ⏳ **로그 확인**: Railway 로그에서 `[ERROR]` 태그로 에러 메시지 확인
5. ⏳ **원인 분석**: 에러 메시지를 바탕으로 실제 원인 파악

---

## 예상 결과

배포 후 500 에러가 발생하면:

1. Railway 로그에 `[ERROR]` 태그로 시작하는 메시지가 나타남
2. 에러 코드, 메시지, 스택 트레이스가 모두 기록됨
3. 실제 에러 원인을 파악할 수 있게 됨

---

## 참고 사항

- Railway 환경에서는 `console.error`가 로그에 나타나지 않을 수 있습니다
- `process.stderr.write`를 직접 사용하면 Railway가 확실히 인식할 수 있습니다
- `[ERROR]` 태그를 사용하여 Railway 로그에서 쉽게 검색할 수 있습니다

---

## 업데이트 이력

- 2025-11-20: Railway 에러 로깅 개선 적용

