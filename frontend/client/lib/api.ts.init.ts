// 이 파일은 참고용입니다.
// api.ts를 클라이언트 전용으로 만들기 위한 초기화 패턴

// 문제: axios interceptor가 모듈 레벨에서 등록되면 SSR 중에도 실행될 수 있음
// 해결: interceptor 등록을 지연시키거나 클라이언트에서만 등록

// 패턴 1: 초기화 함수 사용
let interceptorRegistered = false;

export function initApiClient() {
  if (typeof window === "undefined" || interceptorRegistered) {
    return;
  }
  
  // interceptor 등록
  interceptorRegistered = true;
}

// 패턴 2: useEffect에서 등록 (컴포넌트 레벨)
// 이 방법은 권장되지 않음

// 패턴 3: 현재 방식 (interceptor 내부에서 SSR 체크)
// 가장 안전하지만 여전히 interceptor 자체가 등록됨

