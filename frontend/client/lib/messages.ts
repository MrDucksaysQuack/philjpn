/**
 * 감정적 피드백 메시지 시스템
 * 인지 패턴 원리에 따른 맥락 기반 + 감정 중심 메시지
 */

export interface ContextualMessage {
  message: string;
  emoji?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  retry?: boolean;
}

export type ErrorType = 'network' | 'validation' | 'permission' | 'server' | 'notFound' | 'timeout' | 'license';

export const contextualMessages = {
  success: {
    examSubmitted: {
      message: "🎉 시험이 제출되었습니다! 결과를 확인하세요!",
      emoji: "🎉",
    },
    wordAdded: (count: number) => ({
      message: `✨ ${count}개의 단어가 단어장에 추가되었습니다. 지금 복습하시겠어요?`,
      emoji: "✨",
    }),
    goalCreated: {
      message: "🎯 목표가 설정되었습니다! 달성까지 화이팅!",
      emoji: "🎯",
    },
    goalAchieved: (target: string) => ({
      message: `🏆 ${target} 목표 달성! 정말 멋져요! 다음 목표를 설정해볼까요?`,
      emoji: "🏆",
    }),
    saved: {
      message: "💾 저장되었습니다",
      emoji: "💾",
    },
    profileUpdated: {
      message: "✅ 프로필이 업데이트되었습니다",
      emoji: "✅",
    },
    scoreImproved: (points: number) => ({
      message: `💪 잘했어요! 이번 시험에서 ${points}점 향상했어요!`,
      emoji: "💪",
    }),
    streakContinued: (days: number) => ({
      message: `🔥 ${days}일 연속 학습 중! 대단해요!`,
      emoji: "🔥",
    }),
  },

  error: {
    network: (retry?: () => void): ContextualMessage => ({
      message: "😓 연결이 불안정해요. 잠시 후 다시 시도해볼까요?",
      emoji: "😓",
      retry: !!retry,
      action: retry ? {
        label: "다시 시도",
        onClick: retry,
      } : undefined,
    }),
    server: (retry?: () => void): ContextualMessage => ({
      message: "🔧 서버가 일시적으로 응답하지 않습니다. 30초 후 자동 재시도됩니다.",
      emoji: "🔧",
      retry: !!retry,
      action: retry ? {
        label: "지금 다시 시도",
        onClick: retry,
      } : undefined,
    }),
    timeout: (retry?: () => void): ContextualMessage => ({
      message: "⏱️ 요청 시간이 초과되었어요. 다시 시도해볼까요?",
      emoji: "⏱️",
      retry: !!retry,
      action: retry ? {
        label: "다시 시도",
        onClick: retry,
      } : undefined,
    }),
    validation: (field?: string) => ({
      message: field 
        ? `⚠️ ${field} 입력 내용을 확인해주세요`
        : "⚠️ 입력 내용을 확인해주세요",
      emoji: "⚠️",
    }),
    permission: () => ({
      message: "🔒 로그인이 필요해요. 로그인 페이지로 이동할까요?",
      emoji: "🔒",
      action: {
        label: "로그인하기",
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        },
      },
    }),
    notFound: (resource: string) => ({
      message: `🔍 ${resource}을(를) 찾을 수 없어요`,
      emoji: "🔍",
    }),
    license: {
      message: "🔑 라이선스 키가 만료되었습니다. 새 키를 발급받으세요.",
      emoji: "🔑",
      action: {
        label: "라이선스 키 관리",
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/license-keys';
          }
        },
      },
    },
    examStart: (reason?: string) => ({
      message: reason 
        ? `❌ 시험 시작에 실패했어요: ${reason}`
        : "❌ 시험을 시작할 수 없어요. 다시 시도해볼까요?",
      emoji: "❌",
    }),
    generic: () => ({
      message: "앗, 문제가 생겼네요. 걱정 마세요, 다시 시도해볼까요?",
      emoji: "😅",
    }),
  },

  encouragement: {
    goodStart: {
      message: "💪 좋아요! 계속 달려봐요!",
      emoji: "💪",
    },
    almostThere: {
      message: "🎯 거의 다 왔어요! 화이팅!",
      emoji: "🎯",
    },
    keepGoing: {
      message: "🚀 계속 향상되고 있어요!",
      emoji: "🚀",
    },
    greatProgress: {
      message: "⭐ 오늘도 열심히 하셨네요!",
      emoji: "⭐",
    },
    consistency: (count: number) => ({
      message: `🔥 이번 주 ${count}번째 시험이에요. 대단해요!`,
      emoji: "🔥",
    }),
  },

  info: {
    autoSaved: {
      message: "💾 변경사항이 자동 저장되었습니다 (방금 전)",
      emoji: "💾",
    },
    analyzing: {
      message: "🔍 학습 패턴을 분석하고 있어요...",
      emoji: "🔍",
    },
    preparing: {
      message: "⏳ 준비 중이에요. 잠시만 기다려주세요...",
      emoji: "⏳",
    },
  },
};

/**
 * 에러 타입 자동 감지 및 메시지 생성
 */
export function getContextualError(error: any, retry?: () => void): ContextualMessage {
  // 네트워크 에러
  if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
    return contextualMessages.error.network(retry);
  }

  // 타임아웃
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return contextualMessages.error.timeout(retry);
  }

  // 서버 에러 (5xx)
  if (error?.response?.status >= 500) {
    return contextualMessages.error.server(retry);
  }

  // 권한 에러 (401)
  if (error?.response?.status === 401) {
    return contextualMessages.error.permission();
  }

  // 찾을 수 없음 (404)
  if (error?.response?.status === 404) {
    const resource = error?.response?.data?.resource || '요청한 내용';
    return contextualMessages.error.notFound(resource);
  }

  // 검증 에러 (400)
  if (error?.response?.status === 400) {
    const field = error?.response?.data?.field;
    return contextualMessages.error.validation(field);
  }

  // 라이선스 에러
  if (error?.response?.data?.message?.includes('라이선스') || 
      error?.response?.data?.message?.includes('license')) {
    return contextualMessages.error.license;
  }

  // 기타
  return contextualMessages.error.generic();
}

