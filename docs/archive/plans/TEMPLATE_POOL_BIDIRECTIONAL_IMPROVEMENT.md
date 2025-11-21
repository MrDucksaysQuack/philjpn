# Template ↔ Pool 다대다 관계 개선

## 📋 개요

Template과 Question Pool 간의 단방향 관계를 양방향으로 개선하여, Pool에서도 자신을 사용하는 Template들을 추적할 수 있도록 했습니다.

## 🔧 변경 사항

### 1. Prisma 스키마 변경

**`backend/prisma/schema.prisma`**

```prisma
model QuestionPool {
  // ... 기존 필드들
  usedByTemplateIds  String[]     @default([]) // 이 Pool을 사용하는 Template ID 목록
  // ...
  @@index([usedByTemplateIds])
}
```

### 2. Template 서비스 개선

**`backend/src/modules/admin/services/template.service.ts`**

#### 추가된 기능:

1. **`syncPoolTemplateReferences()` Helper 메서드**
   - Template 생성/수정/삭제 시 Pool의 `usedByTemplateIds` 자동 동기화
   - 제거된 Pool에서 templateId 제거
   - 추가된 Pool에 templateId 추가

2. **Template 생성 시 동기화**
   ```typescript
   async createTemplate() {
     // ... 템플릿 생성
     // Pool의 usedByTemplateIds 동기화
     if (questionPoolIds.length > 0) {
       await this.syncPoolTemplateReferences(template.id, [], questionPoolIds);
     }
   }
   ```

3. **Template 수정 시 동기화**
   ```typescript
   async updateTemplate() {
     const oldPoolIds = template.questionPoolIds || [];
     const newPoolIds = updateData.questionPoolIds || oldPoolIds;
     // ... 템플릿 수정
     // Pool의 usedByTemplateIds 동기화
     if (updateData.questionPoolIds !== undefined) {
       await this.syncPoolTemplateReferences(templateId, oldPoolIds, newPoolIds);
     }
   }
   ```

4. **Template 삭제 시 동기화**
   ```typescript
   async deleteTemplate() {
     const poolIds = template.questionPoolIds || [];
     // ... 템플릿 삭제
     // Pool의 usedByTemplateIds에서 templateId 제거
     if (poolIds.length > 0) {
       await this.syncPoolTemplateReferences(templateId, poolIds, []);
     }
   }
   ```

### 3. Question Pool 서비스 개선

**`backend/src/modules/admin/services/question-pool.service.ts`**

#### 추가된 기능:

1. **Pool 목록 조회 시 사용 정보 포함**
   ```typescript
   async getQuestionPools() {
     // ... 조회
     return pools.map((pool) => ({
       ...pool,
       usedByTemplates: (pool as any).usedByTemplateIds?.length || 0,
     }));
   }
   ```

2. **Pool 상세 조회 시 Template 정보 포함**
   ```typescript
   async getQuestionPool() {
     // ... 조회
     const usedByTemplateIds = (pool as any).usedByTemplateIds || [];
     const usedByTemplates = usedByTemplateIds.length > 0
       ? await this.prisma.examTemplate.findMany({
           where: { id: { in: usedByTemplateIds } },
           select: { id: true, name: true, description: true, createdAt: true },
         })
       : [];
     
     return {
       ...pool,
       usedByTemplates,
       usedByTemplatesCount: usedByTemplates.length,
     };
   }
   ```

3. **Pool 삭제 시 Template에서 참조 제거**
   ```typescript
   async deleteQuestionPool() {
     const usedByTemplateIds = (pool as any).usedByTemplateIds || [];
     if (usedByTemplateIds.length > 0) {
       // 각 Template에서 이 Pool ID 제거
       for (const templateId of usedByTemplateIds) {
         const template = await this.prisma.examTemplate.findUnique({
           where: { id: templateId },
           select: { questionPoolIds: true },
         });
         
         if (template) {
           await this.prisma.examTemplate.update({
             where: { id: templateId },
             data: {
               questionPoolIds: template.questionPoolIds.filter(
                 (poolId) => poolId !== id,
               ),
             },
           });
         }
       }
     }
     // ... Pool 삭제
   }
   ```

### 4. 데이터베이스 마이그레이션

**`backend/prisma/migrations/20250103000003_add_pool_template_bidirectional/migration.sql`**

```sql
-- Add usedByTemplateIds field to question_pools table
ALTER TABLE "question_pools" ADD COLUMN IF NOT EXISTS "usedByTemplateIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "question_pools_usedByTemplateIds_idx" ON "question_pools" USING GIN ("usedByTemplateIds");

-- Backfill existing data: Update all pools to reflect their usage in templates
UPDATE "question_pools" qp
SET "usedByTemplateIds" = (
  SELECT ARRAY_AGG(DISTINCT et.id)
  FROM "exam_templates" et
  WHERE qp.id = ANY(et."questionPoolIds")
)
WHERE EXISTS (
  SELECT 1
  FROM "exam_templates" et
  WHERE qp.id = ANY(et."questionPoolIds")
);
```

## 🎯 개선 효과

### Before (단방향)
- ❌ Template → Pool: 추적 가능 (`questionPoolIds[]`)
- ❌ Pool → Template: 추적 불가능
- ❌ Pool 삭제 시 관련 Template 확인 어려움
- ❌ Pool이 어디서 사용되는지 확인 불가능

### After (양방향)
- ✅ Template → Pool: 추적 가능 (`questionPoolIds[]`)
- ✅ Pool → Template: 추적 가능 (`usedByTemplateIds[]`)
- ✅ Pool 삭제 시 관련 Template에서 자동 제거
- ✅ Pool 조회 시 사용 중인 Template 정보 제공
- ✅ 데이터 일관성 자동 유지

## 📊 사용 예시

### Pool 조회 시 사용 정보 확인

```typescript
// Pool 목록 조회
const pools = await questionPoolService.getQuestionPools();
// pools[0].usedByTemplates: 3 (사용 중인 Template 개수)

// Pool 상세 조회
const pool = await questionPoolService.getQuestionPool(poolId);
// pool.usedByTemplates: [{ id: "...", name: "TOEIC Template", ... }]
// pool.usedByTemplatesCount: 3
```

### Pool 삭제 시 안전성

```typescript
// Pool 삭제 시
await questionPoolService.deleteQuestionPool(poolId);
// 자동으로 관련 Template들의 questionPoolIds에서 제거됨
// 데이터 일관성 유지
```

## 🔒 데이터 일관성 보장

1. **Template 생성/수정/삭제 시**
   - Pool의 `usedByTemplateIds` 자동 동기화
   - 변경사항만 업데이트 (효율적)

2. **Pool 삭제 시**
   - 관련 Template의 `questionPoolIds`에서 자동 제거
   - 고아 참조 방지

3. **기존 데이터 백필**
   - 마이그레이션 시 기존 관계 자동 복구
   - 데이터 손실 없음

## 🚀 성능 최적화

- **GIN 인덱스**: `usedByTemplateIds` 배열에 GIN 인덱스 추가
  - 배열 포함 검색 (`@>` 연산자) 최적화
  - 배열 교집합 검색 (`&&` 연산자) 최적화

## 📝 주의사항

1. **타입 안전성**: Prisma Client 재생성 필요
   ```bash
   npx prisma generate
   ```

2. **마이그레이션 적용**: 프로덕션 배포 전 마이그레이션 적용
   ```bash
   npx prisma migrate deploy
   ```

3. **기존 데이터**: 마이그레이션에 백필 로직 포함되어 있어 기존 데이터 자동 복구

## ✅ 완료된 작업

- [x] Prisma 스키마에 `usedByTemplateIds` 필드 추가
- [x] Template 생성/수정/삭제 시 Pool 동기화
- [x] Pool 삭제 시 Template에서 참조 제거
- [x] Pool 조회 시 사용 중인 Template 정보 포함
- [x] 마이그레이션 생성 및 백필 로직 추가
- [x] GIN 인덱스 추가 (성능 최적화)

