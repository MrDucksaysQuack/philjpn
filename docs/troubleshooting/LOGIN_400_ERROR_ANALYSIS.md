# 로그인 400 Bad Request 에러 분석

## 🔍 문제 상황

```
POST https://philjpn-production.up.railway.app/api/auth/login
400 (Bad Request)
```

프론트엔드에서 백엔드로 로그인 요청을 보냈지만, 백엔드가 "입력값 검증에 실패했습니다"라는 400 에러를 반환했습니다.

## 📋 코드 분석

### Frontend 요청 코드
```typescript
// frontend/client/app/login/page.tsx
const response = await authAPI.login({ email, password });

// frontend/client/lib/api.ts
login: (data: { email: string; password: string }) =>
  apiClient.post<LoginResponse>("/auth/login", data),
```

### Backend DTO 검증 규칙
```typescript
// backend/src/modules/auth/dto/login.dto.ts
export class LoginDto {
  @ApiProperty({ description: '이메일' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
```

### Backend ValidationPipe 설정
```typescript
// backend/src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // DTO에 없는 속성 제거
    forbidNonWhitelisted: true,    // DTO에 없는 속성 있으면 에러
    transform: true,              // 타입 변환
    exceptionFactory: (errors) => {
      console.error('❌ Validation error:', JSON.stringify(errors, null, 2));
      return new BadRequestException({
        message: '입력값 검증에 실패했습니다.',
        errors: errors.map(err => ({
          property: err.property,
          constraints: err.constraints,
        })),
      });
    },
  }),
);
```

## 🎯 가능한 원인들

### 1. **빈 문자열 (Empty String)**
- `email` 또는 `password`가 빈 문자열(`""`)로 전달되는 경우
- `@IsNotEmpty()`는 빈 문자열을 허용하지 않지만, `@IsEmail()`이 먼저 실패할 수 있음

### 2. **이메일 형식 오류**
- `@IsEmail()` 검증 실패
- 예: `"test"`, `"test@"`, `"@test.com"` 등

### 3. **Content-Type 헤더 문제**
- Axios는 기본적으로 `application/json`을 사용하지만, 서버가 다른 형식을 기대할 수 있음

### 4. **요청 본문 형식 문제**
- 데이터가 올바르게 직렬화되지 않았을 수 있음

### 5. **추가 속성 문제**
- `forbidNonWhitelisted: true`로 인해 DTO에 없는 속성이 있으면 에러 발생

## 🔧 해결 방법

### 방법 1: 프론트엔드에서 빈 값 체크 추가

```typescript
// frontend/client/app/login/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  // ✅ 빈 값 체크
  if (!email.trim() || !password.trim()) {
    setError("이메일과 비밀번호를 모두 입력해주세요.");
    setLoading(false);
    return;
  }

  try {
    const response = await authAPI.login({ 
      email: email.trim(),      // 공백 제거
      password: password.trim()  // 공백 제거
    });
    // ...
  } catch (err) {
    // ...
  }
};
```

### 방법 2: 백엔드 DTO에 Transform 추가

```typescript
// backend/src/modules/auth/dto/login.dto.ts
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ description: '이메일' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '비밀번호' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  password: string;
}
```

### 방법 3: 에러 메시지 개선 (디버깅용)

```typescript
// frontend/client/app/login/page.tsx
catch (err) {
  const error = err as { 
    response?: { 
      data?: { 
        message?: string;
        errors?: Array<{ property: string; constraints: any }>;
      } 
    } 
  };
  
  // ✅ 상세한 에러 메시지 표시
  if (error.response?.data?.errors) {
    const errorMessages = error.response.data.errors
      .map(err => `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`)
      .join('\n');
    setError(errorMessages || error.response?.data?.message || "로그인에 실패했습니다.");
  } else {
    setError(error.response?.data?.message || "로그인에 실패했습니다.");
  }
}
```

### 방법 4: 네트워크 요청 로깅 추가

```typescript
// frontend/client/lib/api.ts
apiClient.interceptors.request.use(
  (config) => {
    // ✅ 개발 환경에서 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Request:', {
        method: config.method,
        url: config.url,
        data: config.data,
        headers: config.headers,
      });
    }
    
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ✅ 응답 에러 로깅
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ✅ 400 에러 상세 로깅
    if (error.response?.status === 400) {
      console.error('❌ 400 Bad Request:', {
        url: error.config?.url,
        data: error.config?.data,
        response: error.response?.data,
      });
    }
    // ... 기존 코드
  },
);
```

## 🧪 디버깅 체크리스트

1. **브라우저 개발자 도구 확인**
   - Network 탭에서 실제 요청 본문 확인
   - Request Payload 확인: `{ "email": "...", "password": "..." }`
   - Content-Type 헤더 확인: `application/json`

2. **백엔드 로그 확인**
   - Railway 로그에서 `❌ Validation error:` 메시지 확인
   - 어떤 필드가 실패했는지 확인

3. **프론트엔드 콘솔 확인**
   - 입력값이 올바르게 전달되는지 확인
   - `email`과 `password` 값이 빈 문자열이 아닌지 확인

4. **수동 테스트**
   ```bash
   # curl로 직접 테스트
   curl -X POST https://philjpn-production.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

## 💡 권장 해결 순서

1. **즉시 적용**: 방법 1 (프론트엔드 빈 값 체크)
2. **백엔드 개선**: 방법 2 (DTO Transform 추가)
3. **디버깅 강화**: 방법 3, 4 (에러 메시지 및 로깅 개선)

## 🔍 추가 확인 사항

- **CORS 문제는 아님**: CORS 문제면 401이나 다른 에러가 발생
- **서버는 살아있음**: 400 에러는 서버가 요청을 받았지만 검증 실패
- **ValidationPipe 작동 중**: `forbidNonWhitelisted: true`로 인해 엄격한 검증 적용 중

