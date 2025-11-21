# Frontend와 Supabase 스키마 비교 분석

이 문서는 frontend의 TypeScript 인터페이스와 Supabase SQL 스키마 간의 일치 여부를 확인합니다.

## ✅ 수정 완료 요약

모든 주요 불일치 사항이 수정되었습니다. Frontend의 TypeScript 인터페이스가 Supabase 스키마와 일치하도록 업데이트되었습니다.

---

## 📊 주요 불일치 사항 (수정 전)

### 1. Exam 인터페이스

**Frontend (`api.ts`):**
```typescript
export interface Exam {
  id: string;
  title: string;
  description?: string;
  examType: string;
  isActive: boolean;
  estimatedTime?: number;
  passingScore?: number;
  totalQuestions?: number;
  totalSections?: number;
  subject?: string;
  difficulty?: string;
  isPublic?: boolean;
  config?: ExamConfig;
}
```

**Supabase 스키마 (`exams` 테이블):**
- ✅ 일치: id, title, description, examType, isActive, estimatedTime, passingScore, totalQuestions, totalSections, subject, difficulty, isPublic
- ❌ **누락된 필드:**
  - `categoryId?: string` - 카테고리 연결
  - `subcategoryId?: string` - 서브카테고리 연결
  - `isAdaptive?: boolean` - 적응형 시험 여부
  - `adaptiveConfig?: any` - 적응형 설정
  - `publishedAt?: string` - 게시일
  - `createdBy?: string` - 생성자
  - `createdAt?: string` - 생성일
  - `updatedAt?: string` - 수정일
  - `templateId?: string` - 템플릿 ID

**권장 수정:**
```typescript
export interface Exam {
  id: string;
  title: string;
  description?: string;
  examType: string;
  isActive: boolean;
  estimatedTime?: number;
  passingScore?: number;
  totalQuestions?: number;
  totalSections?: number;
  subject?: string;
  difficulty?: string;
  isPublic?: boolean;
  config?: ExamConfig;
  // 추가 필요
  categoryId?: string;
  subcategoryId?: string;
  isAdaptive?: boolean;
  adaptiveConfig?: any;
  publishedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  templateId?: string;
  category?: Category;
  subcategory?: Subcategory;
}
```

---

### 2. ExamResult 인터페이스

**Frontend (`api.ts`):**
```typescript
export interface ExamResult {
  id: string;
  examId: string;
  status: string;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  timeSpent?: number;
  startedAt: string;
  submittedAt?: string;
}
```

**Supabase 스키마 (`exam_results` 테이블):**
- ✅ 일치: id, examId, status, totalScore, maxScore, percentage, timeSpent, startedAt, submittedAt
- ❌ **누락된 필드:**
  - `userId?: string` - 사용자 ID
  - `licenseKeyId?: string` - 라이선스 키 ID
  - `gradedAt?: string` - 채점 완료일
  - `extractedWords?: string[]` - 추출된 단어 목록
  - `learningInsights?: any` - 학습 인사이트 (JSONB)
  - `aiAnalysis?: any` - AI 분석 결과 (JSONB)
  - `aiAnalyzedAt?: string` - AI 분석 완료일
  - `createdAt?: string` - 생성일
  - `updatedAt?: string` - 수정일

**권장 수정:**
```typescript
export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  licenseKeyId?: string;
  status: string;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  timeSpent?: number;
  startedAt: string;
  submittedAt?: string;
  gradedAt?: string;
  extractedWords?: string[];
  learningInsights?: any;
  aiAnalysis?: any;
  aiAnalyzedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

### 3. LicenseKey 인터페이스

**Frontend (`api.ts`):**
```typescript
export interface LicenseKey {
  id: string;
  key: string;
  keyType: string;
  userId?: string;
  examIds: string[];
  usageLimit?: number;
  usedCount: number;  // ⚠️ 필드명 불일치
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
}
```

**Supabase 스키마 (`license_keys` 테이블):**
- ✅ 일치: id, key, keyType, userId, examIds, usageLimit, validFrom, validUntil, isActive, createdAt
- ❌ **필드명 불일치:**
  - Frontend: `usedCount`
  - Supabase: `usageCount`
- ❌ **누락된 필드:**
  - `issuedBy?: string` - 발급자
  - `issuedAt?: string` - 발급일
  - `updatedAt?: string` - 수정일
  - `batchId?: string` - 배치 ID

**권장 수정:**
```typescript
export interface LicenseKey {
  id: string;
  key: string;
  keyType: string;
  userId?: string;
  examIds: string[];
  usageLimit?: number;
  usageCount: number;  // usedCount → usageCount로 변경
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  issuedBy?: string;
  issuedAt?: string;
  batchId?: string;
  createdAt: string;
  updatedAt?: string;
}
```

---

### 4. UserGoal 인터페이스

**Frontend (`api.ts`):**
```typescript
export interface UserGoal {
  id: string;
  userId: string;
  goalType: "score_target" | "weakness_recovery" | "exam_count" | "word_count";
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: "active" | "achieved" | "failed" | "paused";
  milestones?: Array<{ date: string; target: number }>;
  createdAt: string;
  updatedAt: string;
}
```

**Supabase 스키마 (`user_goals` 테이블):**
- ✅ 일치: id, userId, goalType, targetValue, currentValue, deadline, status, createdAt, updatedAt
- ⚠️ **milestones 필드 형식:**
  - Frontend: `Array<{ date: string; target: number }>`
  - Supabase: `JSONB` (유연한 구조)
  - 실제 사용 시 JSONB 형식에 맞게 조정 필요

**권장 수정:**
```typescript
export interface UserGoal {
  id: string;
  userId: string;
  goalType: "score_target" | "weakness_recovery" | "exam_count" | "word_count";
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: "active" | "achieved" | "failed" | "paused";
  milestones?: any;  // JSONB 형식으로 유연하게 처리
  createdAt: string;
  updatedAt: string;
}
```

---

### 5. Question 인터페이스

**Frontend (`api.ts`):**
```typescript
export interface Question {
  id: string;
  sectionId: string;
  questionNumber: number;
  questionType: 'multiple_choice' | 'fill_blank' | 'essay';
  content: string;
  options?: Record<string, string> | Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation?: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  audioUrl?: string;
  audioPlayLimit?: number;
  createdAt: string;
  updatedAt: string;
}
```

**Supabase 스키마 (`questions` 테이블):**
- ✅ 일치: id, sectionId, questionNumber, questionType, content, options (JSONB), correctAnswer, explanation, points, difficulty, tags, imageUrl, audioUrl, audioPlayLimit, createdAt, updatedAt
- ❌ **누락된 필드:**
  - `questionBankId?: string` - 문제 은행 ID

**권장 수정:**
```typescript
export interface Question {
  id: string;
  sectionId: string;
  questionBankId?: string;  // 추가
  questionNumber: number;
  questionType: 'multiple_choice' | 'fill_blank' | 'essay';
  content: string;
  options?: Record<string, string> | Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation?: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  audioUrl?: string;
  audioPlayLimit?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

### 6. SiteSettings 인터페이스

**Frontend (`api.ts`):**
- ✅ 대부분 일치
- ⚠️ **필드명 확인 필요:**
  - Frontend: `companyValues`, `teamCulture` (camelCase)
  - Supabase: `company_values`, `team_culture` (snake_case)
  - Prisma가 자동 변환하므로 실제로는 문제 없을 수 있음

---

## ✅ 일치하는 인터페이스

### 1. Category / Subcategory
- ✅ 모든 필드 일치

### 2. User
- ✅ 기본 필드 일치 (필요한 필드만 포함)

### 3. ExamConfig
- ✅ 모든 필드 일치

---

## ✅ 수정 완료 사항

### 완료된 수정

1. ✅ **Exam 인터페이스에 `categoryId`, `subcategoryId` 추가**
   - Category와 Subcategory 인터페이스를 Exam보다 먼저 정의하여 타입 참조 문제 해결
   - `isAdaptive`, `adaptiveConfig`, `publishedAt`, `createdBy`, `createdAt`, `updatedAt`, `templateId` 추가

2. ✅ **LicenseKey 인터페이스의 `usedCount` → `usageCount`로 변경**
   - Supabase 스키마와 일치
   - `admin/license-keys/page.tsx`에서 사용하는 모든 `usedCount` 참조를 `usageCount`로 변경
   - `issuedBy`, `issuedAt`, `batchId`, `updatedAt` 필드 추가

3. ✅ **ExamResult 인터페이스에 누락된 필드 추가**
   - `userId` (옵셔널), `licenseKeyId`, `gradedAt`, `extractedWords`, `learningInsights`, `aiAnalysis`, `aiAnalyzedAt`, `createdAt`, `updatedAt` 추가

4. ✅ **Question 인터페이스에 `questionBankId` 추가**
   - 문제 은행 관리 기능 지원

5. ✅ **UserGoal 인터페이스의 `milestones` 타입 수정**
   - JSONB 형식에 맞게 `any` 타입으로 변경하여 유연성 확보

### 추가 개선 사항

6. ✅ **Category/Subcategory 인터페이스 순서 조정**
   - Exam 인터페이스에서 참조하므로 먼저 정의하도록 순서 변경

---

## 📝 참고사항

1. **Prisma 자동 변환**: Prisma는 snake_case를 camelCase로 자동 변환하므로, 실제 API 응답은 camelCase일 수 있습니다.

2. **JSONB 필드**: `milestones`, `learningInsights`, `aiAnalysis` 등은 JSONB 타입이므로 TypeScript에서는 `any` 또는 구체적인 인터페이스로 정의할 수 있습니다.

3. **옵셔널 필드**: 대부분의 필드가 옵셔널(`?`)로 정의되어 있어, Supabase의 NULL 허용 필드와 일치합니다.

4. **Enum 타입**: Frontend에서 문자열 리터럴 타입으로 정의된 필드들(`examType`, `difficulty` 등)은 Supabase의 Enum 타입과 일치합니다.

---

## 🎯 다음 단계

1. ✅ **완료**: 모든 주요 불일치 사항 수정 완료
2. **추가 확인 권장**: 실제 API 응답과 비교하여 추가 불일치 확인
3. **타입 안전성 향상**: JSONB 필드에 대한 구체적인 인터페이스 정의 (선택사항)

---

## 📋 수정된 파일 목록

1. **`frontend/client/lib/api.ts`**
   - Exam 인터페이스: categoryId, subcategoryId, isAdaptive 등 추가
   - ExamResult 인터페이스: userId, licenseKeyId, extractedWords 등 추가
   - LicenseKey 인터페이스: usedCount → usageCount 변경, 추가 필드 포함
   - Question 인터페이스: questionBankId 추가
   - UserGoal 인터페이스: milestones 타입 수정
   - Category/Subcategory 인터페이스: Exam보다 먼저 정의

2. **`frontend/client/app/admin/license-keys/page.tsx`**
   - usedCount → usageCount로 모든 참조 변경

---

## ✨ 개선 효과

- ✅ **타입 안전성 향상**: Supabase 스키마와 일치하여 런타임 오류 감소
- ✅ **개발자 경험 개선**: IDE 자동완성에서 모든 필드 접근 가능
- ✅ **유지보수성 향상**: 스키마 변경 시 TypeScript 컴파일 오류로 조기 발견 가능

