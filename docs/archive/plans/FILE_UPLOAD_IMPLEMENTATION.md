# 파일 업로드 기능 구현 완료

## 개요

Settings 페이지에서 로고와 파비콘을 URL 입력 대신 이미지 파일 업로드로 변경했습니다.

## 구현 내용

### 1. 백엔드 파일 업로드 엔드포인트

**위치**: `backend/src/modules/admin/admin.controller.ts`

**엔드포인트**: `POST /api/admin/upload/image`

**기능**:
- Multer를 사용한 파일 업로드 처리
- 이미지 파일만 허용 (JPG, PNG, GIF, WEBP, SVG, ICO)
- 파일 크기 제한: 5MB
- 고유한 파일명 생성 (timestamp-random.extension)
- `public/uploads` 폴더에 저장
- 업로드된 파일 URL 반환

**정적 파일 서빙**:
- `backend/src/main.ts`에서 `/uploads` 경로로 정적 파일 서빙 설정
- `public/uploads` 폴더의 파일을 `/uploads/{filename}` 경로로 접근 가능

### 2. 프론트엔드 파일 업로드 UI

**위치**: `frontend/client/app/admin/settings/page.tsx`

**변경 사항**:
- 로고와 파비콘 입력 필드를 파일 선택 UI로 변경
- 파일 선택 버튼 추가 (드래그 앤 드롭 스타일)
- URL 직접 입력 옵션 유지 (또는)
- 업로드 중 로딩 상태 표시
- 미리보기 기능 유지

**파일 업로드 핸들러**:
- `handleFileUpload` 함수 추가
- 파일 크기 및 타입 검증
- 업로드 성공 시 자동으로 formData에 URL 설정

### 3. API 함수 추가

**위치**: `frontend/client/lib/api.ts`

**추가된 함수**:
```typescript
adminAPI.uploadImage(file: File)
```

## 사용 방법

### 로고 업로드
1. "📁 파일 선택" 버튼 클릭
2. 이미지 파일 선택 (JPG, PNG, SVG, ICO 등)
3. 자동으로 업로드되고 URL이 설정됨
4. 또는 URL을 직접 입력 가능

### 파비콘 업로드
1. "📁 파일 선택" 버튼 클릭
2. ICO 또는 PNG 파일 선택
3. 자동으로 업로드되고 URL이 설정됨
4. 또는 URL을 직접 입력 가능

## 파일 저장 위치

- **로컬 개발**: `backend/public/uploads/`
- **프로덕션**: Railway 서버의 `public/uploads/` 폴더

## 파일 접근 URL

- **형식**: `{API_BASE_URL}/uploads/{filename}`
- **예시**: `https://philjpn-production.up.railway.app/uploads/1234567890-123456789.png`

## 제한 사항

- **파일 크기**: 최대 5MB
- **허용 파일 타입**: 
  - image/jpeg, image/jpg
  - image/png
  - image/gif
  - image/webp
  - image/svg+xml
  - image/x-icon, image/vnd.microsoft.icon (ICO)

## 향후 개선 사항

1. **Supabase Storage 통합**: 현재는 로컬 파일 시스템 사용, Supabase Storage로 마이그레이션 고려
2. **이미지 최적화**: 업로드 시 자동 리사이징/압축
3. **파일 삭제 기능**: 기존 파일 삭제 API 추가
4. **드래그 앤 드롭**: 더 나은 UX를 위한 드래그 앤 드롭 지원

## 주의사항

- Railway 배포 시 `public/uploads` 폴더가 영구 저장소에 마운트되어야 함
- 현재는 서버 재시작 시 업로드된 파일이 유지되지 않을 수 있음
- 프로덕션 환경에서는 Supabase Storage나 S3 같은 클라우드 스토리지 사용 권장

