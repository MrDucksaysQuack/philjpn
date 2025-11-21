# AI 분석 기능 설정 가이드

## 📋 개요

Exam Platform의 AI 분석 기능을 활성화하기 위한 설정 가이드입니다.

## 🔑 환경 변수 설정

`.env` 파일에 다음 변수들을 추가하세요:

```env
# OpenAI API 설정
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
AI_ANALYSIS_ENABLED=true
```

### 환경 변수 설명

- **OPENAI_API_KEY** (필수): OpenAI API 키
  - OpenAI 웹사이트(https://platform.openai.com/api-keys)에서 발급
  - `sk-`로 시작하는 문자열

- **OPENAI_MODEL** (선택): 사용할 GPT 모델
  - 기본값: `gpt-4o-mini`
  - 추천 모델:
    - `gpt-4o-mini`: 빠르고 저렴 (기본 추천)
    - `gpt-4o`: 더 정확하지만 비용이 높음
    - `gpt-3.5-turbo`: 구형 모델

- **AI_ANALYSIS_ENABLED** (선택): AI 기능 활성화 여부
  - 기본값: `false`
  - `true`로 설정해야 AI 기능 사용 가능

## 🚀 사용 방법

### 1. 해설 생성 API

```bash
POST /api/ai/explanation
Authorization: Bearer {token}

{
  "questionId": "question-uuid",
  "userAnswer": "A",
  "isCorrect": false
}
```

**응답:**
```json
{
  "explanation": "사용자가 선택한 답 A는 틀렸습니다...",
  "questionId": "question-uuid",
  "generatedAt": "2024-11-XX..."
}
```

### 2. AI 기능 활성화 확인

```bash
POST /api/ai/check-availability
Authorization: Bearer {admin-token}
```

**응답:**
```json
{
  "available": true,
  "message": "AI 분석 기능이 활성화되어 있습니다."
}
```

## 💡 사용 예시

### 문제별 해설 생성

시험 결과를 확인한 후, 틀린 문제에 대해 AI 해설을 생성할 수 있습니다:

```typescript
// Frontend 예시
const generateExplanation = async (questionResult) => {
  const response = await fetch('/api/ai/explanation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      questionId: questionResult.questionId,
      userAnswer: questionResult.userAnswer,
      isCorrect: questionResult.isCorrect,
    }),
  });
  
  const data = await response.json();
  return data.explanation;
};
```

## ⚠️ 주의사항

1. **API 비용**: OpenAI API는 사용량에 따라 비용이 발생합니다.
   - `gpt-4o-mini`: 약 $0.15 / 1M 입력 토큰, $0.60 / 1M 출력 토큰
   - 해설 생성 시 약 500 토큰 사용 예상

2. **응답 시간**: AI API 호출은 2-5초 정도 소요될 수 있습니다.
   - Phase 2에서 비동기 처리(Bull Queue) 구현 예정

3. **에러 처리**: API 키가 없거나 잘못된 경우 에러가 발생합니다.
   - `AI_ANALYSIS_ENABLED=false`로 설정하면 기능이 비활성화됩니다.

## 🔧 문제 해결

### "AI 분석 기능이 활성화되지 않았습니다" 에러

1. `.env` 파일에 `OPENAI_API_KEY`가 설정되어 있는지 확인
2. `AI_ANALYSIS_ENABLED=true`로 설정되어 있는지 확인
3. API 키가 유효한지 확인 (OpenAI 대시보드에서 확인)

### API 호출 실패

1. 네트워크 연결 확인
2. OpenAI API 상태 확인 (https://status.openai.com)
3. API 키의 사용량 한도 확인

## 📝 다음 단계

Phase 2에서는 다음 기능이 추가될 예정입니다:
- 비동기 처리 (Bull Queue)
- 약점 진단 AI
- 맞춤형 학습 추천

---

**작성일**: 2024년 11월

