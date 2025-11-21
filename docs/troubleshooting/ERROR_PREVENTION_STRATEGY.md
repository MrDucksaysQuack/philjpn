# 🛡️ 에러 방지 전략 가이드

## 📋 현재 발생 중인 에러들

### 1. WebSocket 타임아웃 에러
- `Settings notification socket connection error: Error: timeout`
- `Badge notification socket connection error: Error: timeout`

### 2. 백엔드 500 에러
- `/api/users/me/statistics?period=month`
- `/api/users/me/learning-patterns`
- `/api/users/me/weakness-analysis`
- `/api/users/me/efficiency-metrics`
- `/api/users/me/goals/progress`
- `/api/results`

## 🎯 에러 방지 전략

### ✅ 테스트 파일이 필요한가?

**짧은 답변**: 테스트는 도움이 되지만, **완전한 해결책은 아닙니다.**

**이유**:
1. **테스트의 한계**
   - 실제 프로덕션 환경의 복잡성을 완전히 재현하기 어려움
   - 데이터베이스 상태, 네트워크 지연, 동시성 문제 등 예측 불가능한 상황
   - 모든 엣지 케이스를 테스트하기는 현실적으로 불가능

2. **테스트의 장점**
   - 기본적인 로직 검증
   - 리팩토링 시 회귀 방지
   - 문서화 역할

3. **결론**
   - 테스트는 **보조 수단**으로 유용하지만
   - **방어적 프로그래밍**과 **에러 핸들링**이 더 중요

### 🚀 애초에 방지할 수 있는 방법들

## 1. 방어적 프로그래밍 (Defensive Programming)

### 원칙
- **항상 null/undefined 체크**
- **타입 안정성 보장**
- **에러를 숨기지 않고 명확히 로깅**
- **적절한 HTTP 상태 코드 반환**

### ⚠️ 중요: 기본값 반환은 에러를 가립니다

**기본값을 반환하면 안 되는 이유**:
- 실제 문제를 숨겨서 디버깅이 어려워짐
- 사용자는 정상 동작으로 착각
- 근본 원인을 찾을 수 없음

### 예시

```typescript
// ❌ 나쁜 예 - 에러를 숨김
async getUserStatistics(userId: string) {
  try {
    const results = await this.prisma.examResult.findMany({...});
    return results.map(r => r.exam.title);
  } catch (error) {
    console.error('에러 발생:', error);
    return []; // ❌ 에러를 숨김 - 문제 해결 불가
  }
}

// ❌ 나쁜 예 - 기본값으로 에러 가리기
async getUserStatistics(userId: string) {
  try {
    // ...
  } catch (error) {
    return {
      totalExams: 0,
      averageScore: 0,
      // ❌ 빈 데이터 반환으로 에러를 가림
    };
  }
}

// ✅ 좋은 예 - 에러를 명확히 로깅하고 적절한 응답
async getUserStatistics(userId: string) {
  try {
    const results = await this.prisma.examResult.findMany({
      include: {
        exam: {
          select: { id: true, title: true },
        },
      },
    });
    
    // null 체크는 하지만, null이면 에러로 처리
    const invalidResults = results.filter(r => !r.exam);
    if (invalidResults.length > 0) {
      throw new Error(`Invalid exam data found: ${invalidResults.length} results have null exam`);
    }
    
    return results.map(r => ({
      examTitle: r.exam.title,
    }));
  } catch (error: any) {
    // 상세한 에러 로깅
    console.error('❌ getUserStatistics 에러:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      userId,
      timestamp: new Date().toISOString(),
    });
    
    // 에러를 다시 throw하여 컨트롤러에서 처리
    throw error;
  }
}
```

## 2. WebSocket 연결 관리 개선

### 문제점
- 타임아웃 설정 없음
- 재연결 로직 부족
- 연결 실패 시 무한 재시도

### 해결책

```typescript
// 타임아웃 설정
this.settingsSocket = io(`${SOCKET_URL}/settings`, {
  auth: token ? { token } : undefined,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5, // 최대 재시도 횟수 제한
  timeout: 10000, // 10초 타임아웃
  forceNew: false,
});

// 연결 실패 시 graceful degradation
this.settingsSocket.on("connect_error", (error) => {
  console.warn("Settings socket 연결 실패, 폴링으로 전환");
  // WebSocket 실패 시 폴링으로 대체하거나 기능 비활성화
});
```

## 3. 서비스 레이어 에러 핸들링

### 모든 서비스 메서드에 try-catch 추가

**원칙**: 에러를 숨기지 않고 명확히 로깅한 후 다시 throw

```typescript
async getLearningPatterns(userId: string) {
  try {
    // 비즈니스 로직
    const results = await this.prisma.examResult.findMany({...});
    
    // 데이터가 없으면 빈 배열 반환 (에러가 아님)
    if (results.length === 0) {
      return {
        timePatterns: {
          mostProductiveHours: [],
          averageSessionDuration: 0,
          preferredStudyDays: [],
        },
        performanceByTimeOfDay: [],
        attentionSpan: {
          optimalSessionLength: 0,
          focusDeclinePoint: 0,
        },
        difficultyPreference: {
          optimalDifficulty: 'medium',
          challengeAcceptance: 0,
        },
      };
    }
    
    return this.processLearningPatterns(results);
  } catch (error: any) {
    // 상세한 에러 로깅
    console.error('❌ getLearningPatterns 에러:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name,
      userId,
      timestamp: new Date().toISOString(),
    });
    
    // ❌ 기본값 반환하지 않음 - 에러를 숨기면 안 됨
    // ✅ 에러를 다시 throw하여 컨트롤러에서 적절히 처리
    throw error;
  }
}
```

## 4. 컨트롤러 레이어 에러 핸들링

### 모든 엔드포인트에 에러 핸들링 추가

**원칙**: 에러를 숨기지 않고 적절한 HTTP 상태 코드와 함께 반환

```typescript
@Get('users/me/statistics')
@UseGuards(JwtAuthGuard)
async getUserStatistics(
  @Query('period') period?: string,
  @CurrentUser() user?: any,
) {
  try {
    return await this.reportService.getUserStatistics(user.id, undefined, period);
  } catch (error: any) {
    // 상세한 에러 로깅
    console.error('❌ getUserStatistics 컨트롤러 에러:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name,
      userId: user?.id,
      period,
      timestamp: new Date().toISOString(),
    });
    
    // ❌ 빈 데이터 반환하지 않음 - 에러를 가리면 안 됨
    // ✅ 적절한 HTTP 예외를 throw하여 NestJS가 처리
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error; // 클라이언트 에러는 그대로 전달
    }
    
    // 서버 에러는 InternalServerErrorException으로 변환
    throw new InternalServerErrorException({
      message: '통계 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
```

### NestJS 예외 처리

```typescript
// 적절한 예외 타입 사용
import { 
  NotFoundException, 
  BadRequestException, 
  InternalServerErrorException 
} from '@nestjs/common';

// 데이터 없음 (에러가 아님)
if (results.length === 0) {
  return { data: [] }; // 200 OK, 빈 배열
}

// 잘못된 요청
if (!userId) {
  throw new BadRequestException('사용자 ID가 필요합니다.');
}

// 리소스 없음
if (!result) {
  throw new NotFoundException('시험 결과를 찾을 수 없습니다.');
}

// 서버 에러
catch (error) {
  throw new InternalServerErrorException('서버 오류가 발생했습니다.');
}
```

## 5. Prisma 쿼리 최적화

### 문제점
- 불필요한 include로 인한 성능 저하
- null 가능성 무시

### 해결책

```typescript
// ❌ 나쁜 예
include: {
  exam: {
    include: {
      sections: true, // 불필요한 중첩 include
    },
  },
}

// ✅ 좋은 예
include: {
  exam: {
    select: {
      id: true,
      title: true, // 필요한 필드만 선택
    },
  },
}
```

## 6. 타입 안정성 강화

### TypeScript strict mode 활용

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
  }
}
```

### Optional chaining과 nullish coalescing 사용

```typescript
// ❌ 나쁜 예
const title = result.exam.title;

// ✅ 좋은 예
const title = result.exam?.title ?? '알 수 없음';
```

## 7. 로깅 및 모니터링

### 구조화된 로깅

```typescript
console.error('❌ getUserStatistics 에러:', {
  message: error?.message,
  stack: error?.stack,
  code: error?.code,
  userId,
  timestamp: new Date().toISOString(),
});
```

### 에러 추적
- Sentry, LogRocket 등 에러 추적 도구 사용
- 프로덕션 환경에서 실제 에러 패턴 파악

## 8. WebSocket 연결 실패 시 대체 전략

### 폴링(Polling)으로 전환 (선택적)

**주의**: WebSocket 실패는 에러이므로 로깅해야 함

```typescript
// WebSocket 실패 시 폴링으로 전환
if (!socket.connected) {
  // 에러를 명확히 로깅
  console.warn('⚠️ WebSocket 연결 실패, 폴링으로 전환:', {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });
  
  // WebSocket 연결 실패 시 주기적으로 API 호출
  const pollInterval = setInterval(async () => {
    try {
      const settings = await fetch('/api/site-settings/public');
      // 설정 업데이트 처리
    } catch (error) {
      // 폴링도 실패하면 에러 로깅
      console.error('❌ 폴링 실패:', error);
      clearInterval(pollInterval); // 무한 재시도 방지
    }
  }, 30000); // 30초마다
}
```

### 에러를 숨기지 않는 것이 중요

- WebSocket 실패는 에러이므로 로깅해야 함
- 사용자에게는 적절한 메시지 표시 (선택적)
- 하지만 에러 자체는 숨기지 않음

## 📊 우선순위별 구현 계획

### 우선순위 1 (즉시 적용)
1. ✅ 모든 서비스 메서드에 try-catch 추가
2. ✅ 에러를 명확히 로깅하고 적절한 예외 throw
3. ✅ WebSocket 타임아웃 설정
4. ✅ Prisma 쿼리 최적화 (select 사용)
5. ✅ 컨트롤러에서 적절한 HTTP 상태 코드 반환

### 우선순위 2 (단기)
5. WebSocket 재연결 로직 개선
6. 연결 실패 시 폴링으로 전환
7. 구조화된 로깅 시스템 구축

### 우선순위 3 (중기)
8. 단위 테스트 작성 (핵심 로직)
9. 통합 테스트 작성 (API 엔드포인트)
10. 에러 추적 도구 도입 (Sentry 등)

## 🎯 결론

**테스트 파일만으로는 부족합니다.** 

**더 중요한 것들**:
1. ✅ **방어적 프로그래밍** - null 체크, 타입 안정성
2. ✅ **에러 핸들링** - try-catch, 명확한 로깅, 적절한 예외 throw
3. ✅ **에러를 숨기지 않기** - 기본값 반환으로 에러 가리기 금지
4. ✅ **타입 안정성** - TypeScript strict mode
5. ✅ **로깅** - 상세한 에러 로그로 디버깅 가능하게
6. ✅ **연결 관리** - WebSocket 타임아웃, 재연결 로직

**핵심 원칙**:
- ❌ **기본값 반환으로 에러 가리기 금지**
- ✅ **에러를 명확히 로깅하고 적절한 HTTP 상태 코드 반환**
- ✅ **실제 문제를 해결할 수 있도록 상세한 정보 제공**

**테스트는 보조 수단**으로, 위의 방어적 프로그래밍과 함께 사용할 때 효과적입니다.

---

**작성일**: 2024년
**목적**: 에러 방지 전략 수립 및 구현 가이드

