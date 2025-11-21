# Backend 확장 방향 개선 계획

## 📋 개요

Exam Platform의 세 가지 주요 확장 방향을 구현하기 위한 Backend 개선 계획입니다.

---

## 1. 🎯 Adaptive Testing (적응형 시험)

### 현재 상태 분석

**현재 구조의 한계**:
- 시험 시작 시 모든 문제가 미리 선택되어 고정됨
- 시험 중 문제 난이도 조정 불가
- 모든 사용자에게 동일한 문제 세트 제공

**현재 플로우**:
```
1. startExam() → ExamResult, UserExamSession 생성
2. 문제는 이미 Exam에 포함되어 있음 (Section → Question[])
3. 사용자가 순차적으로 문제 풀이
4. 답안 저장만 가능, 문제 변경 불가
```

### 필요한 Backend 개선사항

#### 1.1 동적 문제 선택 시스템

**새로운 데이터 구조**:
```typescript
// prisma/schema.prisma에 추가 필요
model AdaptiveQuestion {
  id              String   @id @default(uuid())
  sessionId       String
  questionId      String
  difficulty      Difficulty
  order           Int
  answeredAt      DateTime?
  isCorrect       Boolean?
  selectedAt      DateTime @default(now())
  user            UserExamSession @relation(fields: [sessionId], references: [id])
  question        Question @relation(fields: [questionId], references: [id])
  
  @@index([sessionId])
  @@map("adaptive_questions")
}
```

**SessionService 개선**:
```typescript
// session.service.ts에 추가
async getNextQuestion(sessionId: string, currentAnswer?: string) {
  // 1. 현재 답안 분석
  if (currentAnswer) {
    await this.analyzeAnswer(sessionId, currentAnswer);
  }
  
  // 2. 사용자 능력 추정 (IRT 기반)
  const ability = await this.estimateAbility(sessionId);
  
  // 3. 적합한 난이도 계산
  const targetDifficulty = this.calculateTargetDifficulty(ability);
  
  // 4. 다음 문제 선택 (Question Pool에서 동적 선택)
  const nextQuestion = await this.selectAdaptiveQuestion(
    sessionId,
    targetDifficulty
  );
  
  return nextQuestion;
}

private async estimateAbility(sessionId: string): Promise<number> {
  // IRT (Item Response Theory) 기반 능력 추정
  // - 정답률, 문제 난이도, 응답 시간 등을 고려
  // - 현재 구현: 간단한 가중 평균
  // - 향후: 3PL IRT 모델 적용 가능
}

private calculateTargetDifficulty(ability: number): Difficulty {
  // 능력에 맞는 난이도 계산
  // - 능력이 높으면 → hard 문제
  // - 능력이 낮으면 → easy 문제
  // - 중간이면 → medium 문제
}
```

#### 1.2 Exam 모델 확장

**현재**: `Exam`은 고정된 `Section[]`과 `Question[]`을 가짐

**개선**: Adaptive 모드 지원
```typescript
// prisma/schema.prisma
model Exam {
  // ... 기존 필드
  isAdaptive       Boolean  @default(false)  // 적응형 시험 여부
  adaptiveConfig   Json?                     // 적응형 설정
  // adaptiveConfig: {
  //   initialDifficulty: 'medium',
  //   questionPoolIds: string[],
  //   minQuestions: 10,
  //   maxQuestions: 50,
  //   targetAccuracy: 0.7
  // }
}
```

#### 1.3 Question Pool 통합

**현재**: Template에서만 Question Pool 사용

**개선**: Session에서도 Question Pool 직접 접근
```typescript
// session.service.ts
private async selectAdaptiveQuestion(
  sessionId: string,
  targetDifficulty: Difficulty
): Promise<Question> {
  const session = await this.getSession(sessionId);
  const exam = await this.getExam(session.examId);
  
  // Adaptive Config에서 Question Pool 가져오기
  const poolIds = exam.adaptiveConfig?.questionPoolIds || [];
  
  // 이미 풀은 문제 제외
  const answeredQuestionIds = await this.getAnsweredQuestionIds(sessionId);
  
  // 적합한 문제 선택
  const question = await this.prisma.question.findFirst({
    where: {
      // Question Pool에서 선택
      id: { in: poolQuestionIds },
      id: { notIn: answeredQuestionIds },
      difficulty: targetDifficulty,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // AdaptiveQuestion 레코드 생성
  await this.prisma.adaptiveQuestion.create({
    data: {
      sessionId,
      questionId: question.id,
      difficulty: targetDifficulty,
      order: await this.getNextOrder(sessionId),
    },
  });
  
  return question;
}
```

### 구현 우선순위

1. **Phase 1**: 기본 적응형 구조
   - `AdaptiveQuestion` 모델 추가
   - `Exam.isAdaptive` 필드 추가
   - `getNextQuestion()` 메서드 구현

2. **Phase 2**: 능력 추정 알고리즘
   - 간단한 가중 평균 기반 능력 추정
   - 난이도 자동 조정 로직

3. **Phase 3**: 고급 IRT 모델
   - 3PL IRT 모델 적용
   - 정확한 능력 추정

---

## 2. 🤖 AI 분석 통합

### 현재 상태 분석

**현재 구조**:
- 기본적인 통계 분석만 제공
- 약점 분석은 태그/섹션 기반
- 자동 해설 생성 없음

**현재 분석 기능**:
- `ReportService`: 섹션별 성취도, 태그별 통계
- `RecommendationService`: 약점 영역 추천
- 수동 해설만 제공 (Question.explanation)

### 필요한 Backend 개선사항

#### 2.1 AI 서비스 모듈 생성

**새로운 모듈 구조**:
```
backend/src/modules/ai/
├── ai.module.ts
├── services/
│   ├── ai-analysis.service.ts      # AI 분석 서비스
│   ├── explanation-generator.service.ts  # 해설 생성
│   └── weakness-diagnosis.service.ts    # 약점 진단
├── dto/
│   ├── ai-analysis-request.dto.ts
│   └── ai-analysis-response.dto.ts
└── providers/
    └── openai.provider.ts          # OpenAI API 연동
```

**AI 서비스 구현**:
```typescript
// ai/services/ai-analysis.service.ts
@Injectable()
export class AIAnalysisService {
  constructor(
    private openAIProvider: OpenAIProvider,
    private prisma: PrismaService,
  ) {}

  async generateExplanation(
    questionId: string,
    userAnswer: string,
    isCorrect: boolean,
  ): Promise<string> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    const prompt = `
다음 문제에 대한 맞춤형 해설을 생성해주세요.

문제: ${question.content}
정답: ${question.correctAnswer}
사용자 답안: ${userAnswer}
정답 여부: ${isCorrect ? '맞음' : '틀림'}

${isCorrect 
  ? '사용자가 정답을 맞췄으므로, 왜 이 답이 맞는지 설명해주세요.'
  : '사용자가 오답을 선택했으므로, 왜 틀렸는지와 정답의 이유를 설명해주세요.'
}
`;

    return await this.openAIProvider.generateText(prompt);
  }

  async diagnoseWeakness(
    examResultId: string,
  ): Promise<WeaknessDiagnosis> {
    const examResult = await this.prisma.examResult.findUnique({
      where: { id: examResultId },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
        sectionResults: {
          include: {
            questionResults: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    // 문제별 성취도 데이터 수집
    const performanceData = examResult.sectionResults.flatMap(sr =>
      sr.questionResults.map(qr => ({
        question: qr.question.content,
        tags: qr.question.tags,
        difficulty: qr.question.difficulty,
        isCorrect: qr.isCorrect,
        userAnswer: qr.userAnswer,
      }))
    );

    const prompt = `
다음 시험 결과를 분석하여 학습자의 약점을 진단해주세요.

성취도 데이터:
${JSON.stringify(performanceData, null, 2)}

다음 형식으로 응답해주세요:
1. 주요 약점 영역 (태그별)
2. 난이도별 성취도
3. 개선 방안 제안
`;

    const analysis = await this.openAIProvider.generateText(prompt);
    
    return {
      weaknesses: this.parseWeaknesses(analysis),
      recommendations: this.parseRecommendations(analysis),
      aiAnalysis: analysis,
    };
  }
}
```

#### 2.2 비동기 처리 시스템

**문제**: AI API 호출은 시간이 오래 걸림 (수 초 ~ 수십 초)

**해결**: 큐 시스템 도입
```typescript
// ai/services/ai-queue.service.ts
@Injectable()
export class AIQueueService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('ai-analysis', {
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    });

    // 작업 처리
    this.queue.process('generate-explanation', async (job) => {
      const { questionId, userAnswer, isCorrect } = job.data;
      return await this.aiAnalysisService.generateExplanation(
        questionId,
        userAnswer,
        isCorrect,
      );
    });
  }

  async enqueueExplanation(
    questionId: string,
    userAnswer: string,
    isCorrect: boolean,
  ): Promise<Job> {
    return await this.queue.add('generate-explanation', {
      questionId,
      userAnswer,
      isCorrect,
    });
  }
}
```

#### 2.3 ExamResult 모델 확장

```typescript
// prisma/schema.prisma
model ExamResult {
  // ... 기존 필드
  aiAnalysis      Json?    // AI 분석 결과
  aiAnalyzedAt    DateTime?
  // aiAnalysis: {
  //   weaknesses: string[],
  //   recommendations: string[],
  //   detailedAnalysis: string
  // }
}

model QuestionResult {
  // ... 기존 필드
  aiExplanation   String?   // AI 생성 해설
  aiGeneratedAt   DateTime?
}
```

#### 2.4 환경 변수 및 설정

```env
# .env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
AI_ANALYSIS_ENABLED=true
AI_QUEUE_REDIS_HOST=localhost
AI_QUEUE_REDIS_PORT=6379
```

### 구현 우선순위

1. **Phase 1**: 기본 AI 연동
   - OpenAI Provider 구현
   - 간단한 해설 생성 API

2. **Phase 2**: 비동기 처리
   - Bull Queue 도입
   - 백그라운드 작업 처리

3. **Phase 3**: 고급 분석
   - 약점 진단 AI
   - 맞춤형 학습 추천

---

## 3. 📦 대량 배포 모드

### 현재 상태 분석

**현재 라이선스 키 시스템**:
- 개별 라이선스 키 생성 가능
- `usageLimit`으로 사용 횟수 제한
- `examIds`로 특정 시험에만 접근 가능

**한계**:
- 대량 생성 기능 없음
- 배치 처리 없음
- 사용량 모니터링 제한적

### 필요한 Backend 개선사항

#### 3.1 배치 라이선스 키 생성

**새로운 API 엔드포인트**:
```typescript
// license/license-key.controller.ts
@Post('batch')
@ApiOperation({ summary: '대량 라이선스 키 생성' })
async createBatchLicenseKeys(
  @Body() dto: CreateBatchLicenseKeysDto,
  @CurrentUser() user: any,
) {
  return await this.licenseKeyService.createBatch(dto, user.id);
}

// dto/create-batch-license-keys.dto.ts
export class CreateBatchLicenseKeysDto {
  @ApiProperty({ description: '생성할 키 개수' })
  @IsInt()
  @Min(1)
  @Max(10000)
  count: number;

  @ApiProperty({ description: '키 타입' })
  @IsEnum(KeyType)
  keyType: KeyType;

  @ApiProperty({ description: '시험 ID 목록', required: false })
  @IsOptional()
  @IsArray()
  examIds?: string[];

  @ApiProperty({ description: '사용 제한', required: false })
  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @ApiProperty({ description: '유효 기간 (일)', required: false })
  @IsOptional()
  @IsInt()
  validDays?: number;

  @ApiProperty({ description: '키 접두사', required: false })
  @IsOptional()
  @IsString()
  prefix?: string;
}
```

**배치 생성 서비스**:
```typescript
// license/services/license-key.service.ts
async createBatch(
  dto: CreateBatchLicenseKeysDto,
  issuedBy: string,
): Promise<{ keys: LicenseKey[]; count: number }> {
  const keys: LicenseKey[] = [];
  const batchSize = 100; // 한 번에 처리할 개수

  // 트랜잭션으로 배치 생성
  for (let i = 0; i < dto.count; i += batchSize) {
    const batch = await this.prisma.$transaction(
      Array.from({ length: Math.min(batchSize, dto.count - i) }).map(() =>
        this.createSingleKey(dto, issuedBy)
      )
    );
    keys.push(...batch);
  }

  // 사용량 로그 기록
  await this.usageLogService.logBatchCreation({
    issuedBy,
    count: keys.length,
    keyType: dto.keyType,
  });

  return { keys, count: keys.length };
}

private async createSingleKey(
  dto: CreateBatchLicenseKeysDto,
  issuedBy: string,
): Promise<LicenseKey> {
  const key = this.generateLicenseKey(dto.prefix);
  const validUntil = dto.validDays
    ? new Date(Date.now() + dto.validDays * 24 * 60 * 60 * 1000)
    : null;

  return await this.prisma.licenseKey.create({
    data: {
      key,
      keyType: dto.keyType,
      examIds: dto.examIds || [],
      usageLimit: dto.usageLimit,
      validUntil,
      issuedBy,
    },
  });
}
```

#### 3.2 대량 배포 모니터링

**새로운 모델**:
```typescript
// prisma/schema.prisma
model LicenseKeyBatch {
  id              String        @id @default(uuid())
  name            String
  description     String?
  keyType         KeyType
  count           Int
  examIds         String[]
  usageLimit      Int?
  validUntil      DateTime?
  createdBy       String
  createdAt       DateTime      @default(now())
  keys            LicenseKey[]
  issuer          User          @relation(fields: [createdBy], references: [id])
  
  @@index([createdBy])
  @@map("license_key_batches")
}

model LicenseKey {
  // ... 기존 필드
  batchId         String?
  batch           LicenseKeyBatch? @relation(fields: [batchId], references: [id])
}
```

**배치 통계 API**:
```typescript
// license/license-key.controller.ts
@Get('batches/:id/stats')
@ApiOperation({ summary: '배치 사용량 통계' })
async getBatchStats(@Param('id') batchId: string) {
  return await this.licenseKeyService.getBatchStats(batchId);
}

// license/services/license-key.service.ts
async getBatchStats(batchId: string) {
  const batch = await this.prisma.licenseKeyBatch.findUnique({
    where: { id: batchId },
    include: {
      keys: {
        include: {
          _count: {
            select: {
              examResults: true,
            },
          },
        },
      },
    },
  });

  const totalKeys = batch.keys.length;
  const usedKeys = batch.keys.filter(k => k.usageCount > 0).length;
  const activeKeys = batch.keys.filter(k => k.isActive).length;
  const totalUsage = batch.keys.reduce((sum, k) => sum + k.usageCount, 0);

  return {
    batch: {
      id: batch.id,
      name: batch.name,
      count: batch.count,
    },
    stats: {
      totalKeys,
      usedKeys,
      activeKeys,
      unusedKeys: totalKeys - usedKeys,
      totalUsage,
      averageUsage: totalKeys > 0 ? totalUsage / totalKeys : 0,
      usageRate: totalKeys > 0 ? (usedKeys / totalKeys) * 100 : 0,
    },
  };
}
```

#### 3.3 CSV 내보내기/가져오기

**CSV 내보내기**:
```typescript
// license/license-key.controller.ts
@Get('batches/:id/export')
@ApiOperation({ summary: '배치 키 CSV 내보내기' })
async exportBatchKeys(@Param('id') batchId: string, @Res() res: Response) {
  const csv = await this.licenseKeyService.exportBatchToCSV(batchId);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="batch-${batchId}.csv"`);
  res.send(csv);
}

// license/services/license-key.service.ts
async exportBatchToCSV(batchId: string): Promise<string> {
  const batch = await this.prisma.licenseKeyBatch.findUnique({
    where: { id: batchId },
    include: {
      keys: true,
    },
  });

  const headers = ['Key', 'Type', 'Usage Count', 'Usage Limit', 'Valid Until', 'Is Active'];
  const rows = batch.keys.map(k => [
    k.key,
    k.keyType,
    k.usageCount,
    k.usageLimit || 'Unlimited',
    k.validUntil?.toISOString() || 'Never',
    k.isActive ? 'Yes' : 'No',
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
```

#### 3.4 사용량 대시보드 API

```typescript
// license/license-key.controller.ts
@Get('dashboard')
@ApiOperation({ summary: '라이선스 키 사용량 대시보드' })
async getDashboard(@CurrentUser() user: any) {
  return await this.licenseKeyService.getDashboard(user.id);
}

// license/services/license-key.service.ts
async getDashboard(userId: string) {
  const [totalKeys, activeKeys, totalUsage, recentBatches] = await Promise.all([
    this.prisma.licenseKey.count({
      where: { issuedBy: userId },
    }),
    this.prisma.licenseKey.count({
      where: { issuedBy: userId, isActive: true },
    }),
    this.prisma.licenseKey.aggregate({
      where: { issuedBy: userId },
      _sum: { usageCount: true },
    }),
    this.prisma.licenseKeyBatch.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        _count: {
          select: { keys: true },
        },
      },
    }),
  ]);

  return {
    overview: {
      totalKeys,
      activeKeys,
      inactiveKeys: totalKeys - activeKeys,
      totalUsage: totalUsage._sum.usageCount || 0,
    },
    recentBatches,
  };
}
```

### 구현 우선순위

1. **Phase 1**: 기본 배치 생성
   - `createBatch()` API 구현
   - CSV 내보내기

2. **Phase 2**: 모니터링 강화
   - 배치 통계 API
   - 사용량 대시보드

3. **Phase 3**: 고급 기능
   - 자동 만료 알림
   - 사용량 예측

---

## 📊 종합 구현 로드맵

### 우선순위 1 (즉시 구현 가능)
1. ✅ **대량 배포 모드 - Phase 1**
   - 배치 라이선스 키 생성
   - CSV 내보내기
   - **예상 시간**: 2-3일

### 우선순위 2 (중기)
2. ⚠️ **AI 분석 통합 - Phase 1**
   - OpenAI Provider 구현
   - 기본 해설 생성
   - **예상 시간**: 3-5일

3. ⚠️ **Adaptive Testing - Phase 1**
   - 기본 적응형 구조
   - 동적 문제 선택
   - **예상 시간**: 5-7일

### 우선순위 3 (장기)
4. 🔄 **AI 분석 통합 - Phase 2-3**
   - 비동기 처리
   - 고급 분석
   - **예상 시간**: 7-10일

5. 🔄 **Adaptive Testing - Phase 2-3**
   - IRT 모델 적용
   - 정확한 능력 추정
   - **예상 시간**: 10-14일

---

## 🔧 공통 개선사항

### 1. 성능 최적화
- **캐싱**: Redis로 자주 조회되는 데이터 캐싱
- **인덱싱**: Prisma 스키마에 적절한 인덱스 추가
- **배치 처리**: 대량 작업은 트랜잭션으로 처리

### 2. 모니터링 및 로깅
- **로깅**: Winston으로 구조화된 로깅
- **메트릭**: Prometheus로 성능 메트릭 수집
- **알림**: 중요한 이벤트 알림 시스템

### 3. 테스트
- **단위 테스트**: 각 서비스 메서드 테스트
- **통합 테스트**: API 엔드포인트 테스트
- **E2E 테스트**: 전체 플로우 테스트

---

## 📝 결론

세 가지 확장 방향 모두 **Backend 개선이 필수**입니다:

1. **Adaptive Testing**: SessionService 대폭 수정, 새로운 모델 추가
2. **AI 분석 통합**: 새로운 모듈 생성, 외부 API 연동, 비동기 처리
3. **대량 배포 모드**: 기존 License 서비스 확장, 배치 처리 로직

**권장 시작 순서**:
1. 대량 배포 모드 (가장 간단하고 즉시 효과)
2. AI 분석 통합 (사용자 가치 높음)
3. Adaptive Testing (가장 복잡하지만 차별화 요소)

각 기능은 독립적으로 구현 가능하며, 점진적으로 추가할 수 있습니다.

---

**작성일**: 2024년 11월  
**버전**: 1.0.0

