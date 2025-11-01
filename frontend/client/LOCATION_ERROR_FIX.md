# location is not defined 에러 해결

## 문제

Vercel 빌드 중 `ReferenceError: location is not defined` 발생으로 인해 404 에러 발생

## 원인

빌드 중 SSR 단계에서 `location` 객체에 접근하려고 시도하는 코드가 있음

## 해결 방법

### 1. 모든 `location` 접근을 `window.location`으로 변경하고 `typeof window` 체크 추가

### 2. Admin 페이지에 `export const dynamic = "force-dynamic"` 추가 (이미 완료)

### 3. API interceptor에서 SSR 체크 강화 (이미 완료)

### 4. 추가 확인 필요

빌드 로그에서 정확한 위치 확인:
- `.next/server/chunks/ssr/app_admin_exams_page_tsx`
- `.next/server/chunks/ssr/app_admin_license-keys_page_tsx`
- `.next/server/chunks/ssr/app_admin_users_page_tsx`

이 파일들은 빌드된 번들이므로, 소스 코드에서 직접적인 `location` 사용을 찾기 어려울 수 있습니다.

## 임시 해결책

`next.config.ts`에 다음 추가:

```typescript
const nextConfig: NextConfig = {
  // SSR 중 location 접근을 완전히 방지
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 서버 빌드 중 location 사용 시도 방지
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};
```

하지만 이것도 완전한 해결책은 아닐 수 있습니다.

## 근본 원인 추적

빌드된 번들에서 `location`을 직접 참조하는 코드가 있는지 확인 필요.
이는 서드파티 라이브러리에서 발생할 수도 있습니다.

