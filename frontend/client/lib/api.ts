import axios from "axios";

// ✅ API URL 자동 정규화: /api 접두사가 없으면 자동 추가
const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  
  // 이미 /api로 끝나면 그대로 사용
  if (envUrl.endsWith("/api")) {
    return envUrl;
  }
  
  // localhost인 경우
  if (envUrl.includes("localhost")) {
    return envUrl.endsWith("/") ? `${envUrl}api` : `${envUrl}/api`;
  }
  
  // 프로덕션 URL인 경우 (Railway 등)
  // 마지막에 /가 있으면 제거 후 /api 추가
  const cleanUrl = envUrl.replace(/\/$/, "");
  return `${cleanUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// ✅ 디버깅: 프로덕션에서 실제 사용되는 API URL 확인
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  console.log("🔍 API Base URL:", API_BASE_URL);
  console.log("🔍 NEXT_PUBLIC_API_URL (env):", process.env.NEXT_PUBLIC_API_URL);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    // ✅ 개발 환경에서 요청 로깅 (400 에러 디버깅용)
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      if (config.url?.includes("/auth/login")) {
        console.log("📤 Login Request:", {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers,
        });
      }
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

// 응답 인터셉터: 401 에러 시 토큰 갱신 시도
// SSR 안전성: interceptor를 클라이언트에서만 등록
// Next.js는 모듈을 서버와 클라이언트 모두에서 평가하므로,
// interceptor 등록 자체를 클라이언트 전용으로 처리
if (typeof window !== "undefined") {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      // ✅ 400 Bad Request 에러 상세 로깅 (디버깅용)
      if (error.response?.status === 400) {
        console.error("❌ 400 Bad Request:", {
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data,
          responseData: error.response?.data,
          status: error.response?.status,
        });
      }
      
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem("accessToken", accessToken);
            if (newRefreshToken) {
              localStorage.setItem("refreshToken", newRefreshToken);
            }

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // 클라이언트에서만 리다이렉트
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            // 동적 import를 사용하여 리다이렉트 (더 안전)
            try {
              const { default: router } = await import("next/navigation");
              // router.push는 클라이언트 컴포넌트에서만 사용 가능
              // 여기서는 직접 window.location 사용
              if (typeof window !== "undefined" && window.location) {
                window.location.href = "/login";
              }
            } catch {
              // import 실패 시 window.location 직접 사용
              if (typeof window !== "undefined" && window.location) {
                window.location.href = "/login";
              }
            }
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );
}

// API 엔드포인트 타입 정의
export interface ExamConfig {
  allowSectionNavigation?: boolean;
  allowQuestionReview?: boolean;
  showAnswerAfterSubmit?: boolean;
  showScoreImmediately?: boolean;
  timeLimitPerSection?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  preventTabSwitch?: boolean;
}

// Category/Subcategory 인터페이스를 먼저 정의 (Exam에서 참조)
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  subcategories?: Subcategory[];
  _count?: {
    exams: number;
  };
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  category?: Category;
  _count?: {
    exams: number;
  };
}

// Badge API
export interface Badge {
  id: string;
  badgeType: 'exam_completed' | 'perfect_score' | 'streak_days' | 'word_master' | 'improvement' | 'category_master' | 'speed_demon' | 'consistency';
  name: string;
  description?: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition?: any; // JSONB
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
  // Category/Subcategory 연결
  categoryId?: string;
  subcategoryId?: string;
  category?: Category;
  subcategory?: Subcategory;
  // 적응형 시험
  isAdaptive?: boolean;
  adaptiveConfig?: any;
  // 메타데이터
  publishedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  templateId?: string;
}

export interface ExamResult {
  id: string;
  userId?: string; // 옵셔널로 변경 (기존 코드 호환성)
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

// Learning Pattern Types
export interface LearningPatterns {
  timePatterns: {
    mostProductiveHours: number[];
    averageSessionDuration: number;
    preferredStudyDays: string[];
  };
  performanceByTimeOfDay: Array<{
    hour: number;
    averageScore: number;
    examCount: number;
  }>;
  attentionSpan: {
    optimalSessionLength: number;
    focusDeclinePoint: number;
  };
  difficultyPreference: {
    optimalDifficulty: string;
    challengeAcceptance: number;
  };
}

export interface WeaknessArea {
  tag: string;
  correctRate: number;
  rootCause: string;
  mistakePattern: {
    commonErrors: string[];
    frequency: number;
    lastAttempt: string;
  };
  relatedConcepts: string[];
  improvementSuggestions: string[];
  predictedImprovementTime: string;
}

export interface WeaknessAnalysis {
  weaknessAreas: WeaknessArea[];
  knowledgeGaps: Array<{
    concept: string;
    understandingLevel: number;
    practiceNeeded: number;
  }>;
}

export interface EfficiencyMetrics {
  learningVelocity: number;
  retentionRate: number;
  practiceEfficiency: number;
  weaknessRecoveryRate: number;
  comparison: {
    vsPeers: string;
    vsPersonalBest: string;
  };
}

// Goal Types
export interface UserGoal {
  id: string;
  userId: string;
  goalType: "score_target" | "weakness_recovery" | "exam_count" | "word_count";
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: "active" | "achieved" | "failed" | "paused";
  milestones?: any; // JSONB 형식 (유연한 구조)
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  activeGoals: Array<{
    goalId: string;
    type: string;
    target: number;
    current: number;
    progress: number;
    estimatedCompletion?: string;
    onTrack: boolean;
    dailyProgress: Array<{ date: string; value: number }>;
  }>;
  achievements: Array<{
    badgeId: string;
    title: string;
    earnedAt: string;
  }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
  lastLoginAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LicenseKey {
  id: string;
  key: string;
  keyType: string;
  userId?: string;
  examIds: string[];
  usageLimit?: number;
  usageCount: number; // Supabase 스키마와 일치: usedCount → usageCount
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  issuedBy?: string;
  issuedAt?: string;
  batchId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLicenseKeyPayload {
  keyType: string;
  userId?: string;
  examIds: string[];
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateLicenseKeyPayload {
  isActive?: boolean;
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
  examIds?: string[];
}

// Batch License Key Types
export interface BatchLicenseKey {
  id: string;
  name: string;
  description?: string;
  count: number;
  createdAt: string;
  createdBy: string;
}

export interface CreateBatchLicenseKeyPayload {
  count: number;
  name: string;
  description?: string;
  keyType: string;
  examIds?: string[];
  usageLimit?: number;
  validDays?: number;
  prefix?: string;
}

export interface BatchStats {
  batchId: string;
  totalKeys: number;
  activeKeys: number;
  usedKeys: number;
  totalUsage: number;
  averageUsagePerKey: number;
  usageDistribution: Array<{
    range: string;
    count: number;
  }>;
  dailyUsage: Array<{
    date: string;
    count: number;
  }>;
}

export interface LicenseKeyDashboard {
  overview: {
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    totalUsage: number;
    expiringBatchesCount: number;
    expiredBatchesCount: number;
  };
  recentBatches: Array<{
    id: string;
    batchId?: string;
    name: string;
    description?: string;
    count: number;
    keyCount?: number;
    keyType: string;
    createdAt: string;
    stats?: {
      totalKeys: number;
      usedKeys: number;
      activeKeys: number;
      totalUsage: number;
      usageRate: number;
    };
  }>;
  expiringBatches: Array<{
    id: string;
    batchId?: string;
    name: string;
    validUntil: string;
    daysUntilExpiry: number | null;
    expiringCount?: number;
  }>;
  expiredBatches?: Array<{
    id: string;
    name: string;
    validUntil: string;
    daysSinceExpiry: number | null;
  }>;
}

export interface UsagePrediction {
  batchId: string;
  predictedDays: number;
  predictedUsage: number;
  message: string;
}

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => apiClient.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<LoginResponse>("/auth/login", data),
  logout: () => apiClient.post("/auth/logout"),
  getCurrentUser: () => apiClient.get<User>("/auth/me"),
  refreshToken: (refreshToken: string) =>
    apiClient.post("/auth/refresh", { refreshToken }),
};

// Exam API
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const examAPI = {
  getExams: (params?: { 
    page?: number; 
    limit?: number; 
    examType?: string;
    categoryId?: string;
    subcategoryId?: string;
  }) =>
    apiClient.get<PaginatedResponse<Exam>>("/exams", { params }),
  getExam: (id: string) => apiClient.get<Exam>(`/exams/${id}`),
  getExamSections: (examId: string) =>
    apiClient.get(`/sections/exams/${examId}`),
};

// Category API
// Category와 Subcategory 인터페이스는 위에서 이미 정의됨

export const categoryAPI = {
  // Public API
  getPublicCategories: () =>
    apiClient.get<{ data: Category[] }>("/categories/public"),
  getSubcategories: (categoryId?: string) =>
    apiClient.get<{ data: Subcategory[] }>("/categories/subcategories/all", {
      params: categoryId ? { categoryId } : undefined,
    }),
  getSubcategory: (id: string) =>
    apiClient.get<{ data: Subcategory }>(`/categories/subcategories/${id}`),
  // Admin API
  createCategory: (data: {
    name: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) => apiClient.post<{ data: Category }>("/categories", data),
  getCategories: (includeInactive?: boolean) =>
    apiClient.get<{ data: Category[] }>("/categories", {
      params: includeInactive ? { includeInactive: "true" } : undefined,
    }),
  getCategory: (id: string) =>
    apiClient.get<{ data: Category }>(`/categories/${id}`),
  updateCategory: (id: string, data: Partial<Category>) =>
    apiClient.patch<{ data: Category }>(`/categories/${id}`, data),
  deleteCategory: (id: string) =>
    apiClient.delete(`/categories/${id}`),
  createSubcategory: (data: {
    categoryId: string;
    name: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) => apiClient.post<{ data: Subcategory }>("/categories/subcategories", data),
  updateSubcategory: (id: string, data: Partial<Subcategory>) =>
    apiClient.patch<{ data: Subcategory }>(`/categories/subcategories/${id}`, data),
  deleteSubcategory: (id: string) =>
    apiClient.delete(`/categories/subcategories/${id}`),
};

// Question API
export interface Question {
  id: string;
  sectionId: string;
  questionBankId?: string;
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

export interface CreateQuestionDto {
  questionNumber: number;
  questionType: 'multiple_choice' | 'fill_blank' | 'essay';
  content: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation?: string;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  questionBankId?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioPlayLimit?: number;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {}

export const questionAPI = {
  getQuestionsBySection: (sectionId: string) =>
    apiClient.get<{ data: Question[] }>(`/questions/sections/${sectionId}`),
  getQuestion: (id: string, includeAnswer?: boolean) =>
    apiClient.get<Question>(`/questions/${id}`, { params: { includeAnswer } }),
  createQuestion: (sectionId: string, data: CreateQuestionDto) =>
    apiClient.post<Question>(`/questions/sections/${sectionId}`, data),
  updateQuestion: (id: string, data: UpdateQuestionDto) =>
    apiClient.patch<Question>(`/questions/${id}`, data),
  deleteQuestion: (id: string) =>
    apiClient.delete(`/questions/${id}`),
};

// Session API
export interface NextQuestionResponse {
  question: {
    id: string;
    content: string;
    options: any;
    questionType: string;
    points: number;
    difficulty?: string;
    imageUrl?: string;
    audioUrl?: string;
    audioPlayLimit?: number;
  };
  ability: number; // 능력 추정 값
  targetDifficulty: string; // 목표 난이도
  order: number; // 문제 순서
}

export const sessionAPI = {
  startExam: (examId: string, data: { licenseKey: string }) =>
    apiClient.post(`/exams/${examId}/start`, data),
  getSession: (sessionId: string) => apiClient.get(`/sessions/${sessionId}`),
  saveAnswer: (
    sessionId: string,
    data: { questionId: string; answer: string },
  ) => apiClient.put(`/sessions/${sessionId}/answers`, data),
  moveSection: (
    sessionId: string,
    sectionId: string,
    data: { currentQuestionNumber: number },
  ) => apiClient.put(`/sessions/${sessionId}/sections/${sectionId}`, data),
  submitExam: (sessionId: string) =>
    apiClient.post(`/sessions/${sessionId}/submit`),
  // 적응형 시험: 다음 문제 가져오기
  getNextQuestion: (sessionId: string, currentAnswer?: string) =>
    apiClient.get<NextQuestionResponse>(`/sessions/${sessionId}/next-question`, {
      params: currentAnswer ? { currentAnswer } : undefined,
    }),
};

// Result API
export const resultAPI = {
  getResults: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<ExamResult>>("/results", { params }),
  getResult: (id: string) => apiClient.get<ExamResult>(`/results/${id}`),
  getReport: (id: string) => apiClient.get(`/results/${id}/report`),
  getDetailedFeedback: (id: string) =>
    apiClient.get<DetailedFeedback>(`/results/${id}/feedback`),
};

// Statistics API
export const statisticsAPI = {
  getUserStatistics: (params?: { examId?: string; period?: string }) =>
    apiClient.get("/users/me/statistics", { params }),
  getLearningPatterns: () =>
    apiClient.get<LearningPatterns>("/users/me/learning-patterns"),
  getWeaknessAnalysis: () =>
    apiClient.get<WeaknessAnalysis>("/users/me/weakness-analysis"),
  getEfficiencyMetrics: () =>
    apiClient.get<EfficiencyMetrics>("/users/me/efficiency-metrics"),
};

// Goal API
export const goalAPI = {
  createGoal: (data: {
    goalType: "score_target" | "weakness_recovery" | "exam_count" | "word_count";
    targetValue: number;
    deadline: string;
    milestones?: Array<{ date: string; target: number }>;
  }) => apiClient.post("/users/me/goals", data),
  getGoals: (params?: { status?: string }) =>
    apiClient.get("/users/me/goals", { params }),
  getGoalProgress: () =>
    apiClient.get("/users/me/goals/progress"),
  getGoal: (id: string) =>
    apiClient.get(`/users/me/goals/${id}`),
  updateGoal: (id: string, data: {
    targetValue?: number;
    deadline?: string;
    status?: "active" | "achieved" | "failed" | "paused";
    milestones?: Array<{ date: string; target: number }>;
  }) => apiClient.put(`/users/me/goals/${id}`, data),
  deleteGoal: (id: string) =>
    apiClient.delete(`/users/me/goals/${id}`),
};

// Recommendation API
export const recommendationAPI = {
  getRecommendedExams: () =>
    apiClient.get("/exams/recommended"),
  getExamsByWordbook: () =>
    apiClient.get("/exams/by-wordbook"),
};

// Learning Cycle API
export const learningCycleAPI = {
  getLearningCycle: () =>
    apiClient.get("/users/me/learning-cycle"),
  updateCycleStage: (stage: string) =>
    apiClient.put("/users/me/learning-cycle/stage", { stage }),
  completeCycle: () =>
    apiClient.post("/users/me/learning-cycle/complete"),
};

// Badge API (User)
export interface UserBadge {
  id: string;
  badgeId: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
  progress: number;
}

export const badgeAPI = {
  getUserBadges: () =>
    apiClient.get<{ data: UserBadge[] }>("/users/me/badges"),
  getAllBadges: () =>
    apiClient.get<{ data: Badge[] }>("/badges"),
};

// Word Extraction API
export const wordExtractionAPI = {
  extractFromResult: (examResultId: string) =>
    apiClient.post(`/word-books/extract-from-result/${examResultId}`),
  addExtractedWords: (words: Array<{
    word: string;
    meaning: string;
    context?: string;
    difficulty?: "easy" | "medium" | "hard";
    source?: string;
    sourceId?: string;
    tags?: string[];
  }>) => apiClient.post("/word-books/add-extracted", words),
};

// Session API (실시간 피드백)
export const sessionFeedbackAPI = {
  submitQuestion: (sessionId: string, data: {
    questionId: string;
    answer: string;
    timeSpent?: number;
    confidence?: number;
  }) => apiClient.post(`/sessions/${sessionId}/submit-question`, data),
};

// Detailed Feedback API
export interface DetailedFeedback {
  summary: any;
  detailedFeedback: {
    questionLevel: Array<{
      questionId: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      mistakeType: "conceptual" | "careless" | "time_pressure" | "correct";
      explanation: string;
      timeSpent?: number;
      similarQuestions: string[];
      relatedWords: string[];
    }>;
    sectionLevel: Array<{
      sectionId: string;
      sectionTitle: string;
      strengths: string[];
      weaknesses: string[];
      improvementPlan: {
        focusAreas: string[];
        practiceQuestions: number;
        estimatedTime: string;
      };
    }>;
    overall: {
      learningInsights: string[];
      nextSteps: string[];
    };
  };
}

// WordBook API
export const wordBookAPI = {
  getWords: (params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    tags?: string[];
    masteryLevel?: number;
  }) => apiClient.get<PaginatedResponse<unknown>>("/word-books", { params }),
  createWord: (data: {
    word: string;
    meaning: string;
    example?: string;
    difficulty?: string;
    tags?: string[];
  }) => apiClient.post("/word-books", data),
  updateWord: (
    id: string,
    data: {
      word?: string;
      meaning?: string;
      example?: string;
      difficulty?: string;
      tags?: string[];
    },
  ) => apiClient.patch(`/word-books/${id}`, data),
  deleteWord: (id: string) => apiClient.delete(`/word-books/${id}`),
  recordReview: (id: string, data: { isCorrect: boolean }) =>
    apiClient.post(`/word-books/${id}/review`, data),
  getReviewList: (limit?: number) =>
    apiClient.get("/word-books/review-list", { params: { limit } }),
  generateQuiz: (data: {
    count: number;
    tags?: string[];
    difficulty?: string;
  }) => apiClient.post("/word-books/quiz", data),
};

// Admin API Types
export interface ExamAnalytics {
  examStats: {
    totalAttempts: number;
    completedResults: number;
    completionRate: number;
    averageScore: number;
    averageTimeSpent: number;
  };
  questionAnalysis: Array<{
    questionId: string;
    correctRate: number;
    averageTime: number;
    discriminationIndex: number;
    difficultyIndex: number;
    commonWrongAnswer: string | null;
    issues: string[];
    attempts: number;
  }>;
  userPatterns: {
    scoreDistribution: Array<{
      range: string;
      count: number;
    }>;
    improvementRate: number;
  };
  recommendations: string[];
}

export interface UserLearningPattern {
  engagementMetrics: {
    activeDays: number;
    averageSessionLength: number;
    consistency: number;
  };
  performanceTrends: {
    improvementRate: number;
    volatility: number;
    peakPerformance: string;
  };
  riskFactors: Array<{
    type: string;
    severity: string;
    description: string;
    suggestedAction: string;
  }>;
  strengths: string[];
  weaknesses: string[];
}

// Admin API Types - Templates
export interface ExamTemplate {
  id: string;
  name: string;
  description?: string;
  structure: {
    sections: Array<{
      type: string;
      questionCount: number;
      questionPoolId?: string; // 문제 풀 ID (우선순위 1)
      tags?: string[]; // 태그 필터 (questionPoolId가 없을 때 사용)
      difficulty?: string; // 난이도 필터 (questionPoolId가 없을 때 사용)
    }>;
  };
  questionPoolIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    exams: number;
  };
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  structure: {
    sections: Array<{
      type: string;
      questionCount: number;
      questionPoolId?: string; // 문제 풀 ID (우선순위 1)
      tags?: string[]; // 태그 필터 (questionPoolId가 없을 때 사용)
      difficulty?: string; // 난이도 필터 (questionPoolId가 없을 때 사용)
    }>;
  };
  questionPoolIds?: string[];
}

export interface CreateExamFromTemplateData {
  templateId: string;
  title: string;
  description?: string;
  examType: string;
  subject?: string;
  overrides?: {
    questionCount?: number;
    structure?: any;
    randomSeed?: number; // 랜덤 시드 (재현성 보장, 선택사항)
  };
}

// Site Settings Types
export interface SocialMedia {
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  socialMedia?: SocialMedia;
}

export interface SiteSettings {
  id?: string;
  companyName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  colorScheme?: any;
  aboutCompany?: string | null;
  aboutTeam?: string | null;
  contactInfo?: ContactInfo | null;
  serviceInfo?: string | null;
  companyStats?: {
    stats?: Array<{
      icon?: string;
      value: number | string;
      suffix?: string;
      label: string;
    }>;
  } | null;
  companyValues?: {
    values?: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
  } | null;
  teamMembers?: {
    members?: Array<{
      name: string;
      role: string;
      description?: string;
      imageUrl?: string;
      socialLinks?: {
        email?: string;
        linkedin?: string;
        github?: string;
      };
    }>;
  } | null;
  teamCulture?: {
    culture?: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
  } | null;
  serviceFeatures?: {
    features?: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
  } | null;
  serviceBenefits?: {
    benefits?: Array<{
      text: string;
    }>;
  } | null;
  serviceProcess?: {
    steps?: Array<{
      step: number;
      title: string;
      description: string;
    }>;
  } | null;
  homeContent?: {
    ko?: {
      hero?: { title?: string; subtitle?: string };
      features?: Array<{ title?: string; description?: string }>;
      featuresSectionTitle?: string;
      featuresSectionSubtitle?: string;
    };
    en?: {
      hero?: { title?: string; subtitle?: string };
      features?: Array<{ title?: string; description?: string }>;
      featuresSectionTitle?: string;
      featuresSectionSubtitle?: string;
    };
    ja?: {
      hero?: { title?: string; subtitle?: string };
      features?: Array<{ title?: string; description?: string }>;
      featuresSectionTitle?: string;
      featuresSectionSubtitle?: string;
    };
  } | null;
  aboutContent?: {
    ko?: {
      team?: { hero?: { title?: string; subtitle?: string } };
      company?: { hero?: { subtitle?: string } };
      service?: { hero?: { title?: string; subtitle?: string } };
      contact?: { hero?: { title?: string; subtitle?: string } };
    };
    en?: {
      team?: { hero?: { title?: string; subtitle?: string } };
      company?: { hero?: { subtitle?: string } };
      service?: { hero?: { title?: string; subtitle?: string } };
      contact?: { hero?: { title?: string; subtitle?: string } };
    };
    ja?: {
      team?: { hero?: { title?: string; subtitle?: string } };
      company?: { hero?: { subtitle?: string } };
      service?: { hero?: { title?: string; subtitle?: string } };
      contact?: { hero?: { title?: string; subtitle?: string } };
    };
  } | null;
  isActive?: boolean;
  updatedBy?: string | null;
  updatedAt?: string;
  createdAt?: string;
  updater?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface UpdateSiteSettingsDto {
  companyName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  aboutCompany?: string;
  aboutTeam?: string;
  contactInfo?: ContactInfo;
  serviceInfo?: string;
  companyStats?: {
    stats?: Array<{
      icon?: string;
      value: number | string;
      suffix?: string;
      label: string;
    }>;
  };
  companyValues?: {
    values?: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
  };
  teamMembers?: {
    members?: Array<{
      name: string;
      role: string;
      description?: string;
      imageUrl?: string;
      socialLinks?: {
        email?: string;
        linkedin?: string;
        github?: string;
      };
    }>;
  };
  teamCulture?: {
    culture?: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
  };
  serviceFeatures?: {
    features?: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
  };
  serviceBenefits?: {
    benefits?: Array<{
      text: string;
    }>;
  };
  serviceProcess?: {
    steps?: Array<{
      step: number;
      title: string;
      description: string;
    }>;
  };
  homeContent?: {
    ko?: {
      hero?: { title?: string; subtitle?: string };
      features?: Array<{ title?: string; description?: string }>;
      featuresSectionTitle?: string;
      featuresSectionSubtitle?: string;
    };
    en?: {
      hero?: { title?: string; subtitle?: string };
      features?: Array<{ title?: string; description?: string }>;
      featuresSectionTitle?: string;
      featuresSectionSubtitle?: string;
    };
    ja?: {
      hero?: { title?: string; subtitle?: string };
      features?: Array<{ title?: string; description?: string }>;
      featuresSectionTitle?: string;
      featuresSectionSubtitle?: string;
    };
  };
  aboutContent?: {
    ko?: {
      team?: { hero?: { title?: string; subtitle?: string } };
      company?: { hero?: { subtitle?: string } };
      service?: { hero?: { title?: string; subtitle?: string } };
      contact?: { hero?: { title?: string; subtitle?: string } };
    };
    en?: {
      team?: { hero?: { title?: string; subtitle?: string } };
      company?: { hero?: { subtitle?: string } };
      service?: { hero?: { title?: string; subtitle?: string } };
      contact?: { hero?: { title?: string; subtitle?: string } };
    };
    ja?: {
      team?: { hero?: { title?: string; subtitle?: string } };
      company?: { hero?: { subtitle?: string } };
      service?: { hero?: { title?: string; subtitle?: string } };
      contact?: { hero?: { title?: string; subtitle?: string } };
    };
  };
}

export interface ColorAnalysisResult {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    gradients: {
      primary: string;
      secondary: string;
      accent: string;
    };
    textColors: {
      primary: string;
      secondary: string;
    };
    bgColors: {
      primary: string;
      secondary: string;
    };
  };
  confidence: number;
}

export interface QuestionPool {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  questionIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

// Admin API
export const adminAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }) => apiClient.get<PaginatedResponse<User>>("/admin/users", { params }),
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),
  updateUser: (
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    },
  ) => apiClient.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  getUserExamResults: (id: string) =>
    apiClient.get(`/admin/users/${id}/exam-results`),
  getUserLearningPattern: (id: string) =>
    apiClient.get<{ data: UserLearningPattern }>(`/admin/users/${id}/learning-pattern`),
  getExamStatistics: () => apiClient.get("/admin/exams/statistics"),
  getExamAnalytics: (id: string) =>
    apiClient.get<{ data: ExamAnalytics }>(`/admin/exams/${id}/analytics`),
  getExamResults: (params?: {
    page?: number;
    limit?: number;
    examId?: string;
    userId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    apiClient.get<PaginatedResponse<ExamResult>>("/admin/exam-results", {
      params,
    }),
  getLicenseKeyStatistics: () =>
    apiClient.get("/admin/license-keys/statistics"),
  getDashboard: () => apiClient.get("/admin/dashboard"),
  // Template APIs
  createTemplate: (data: CreateTemplateData) =>
    apiClient.post<{ data: ExamTemplate }>("/admin/templates", data),
  getTemplates: () =>
    apiClient.get<{ data: ExamTemplate[] }>("/admin/templates"),
  getTemplate: (id: string) =>
    apiClient.get<{ data: ExamTemplate }>(`/admin/templates/${id}`),
  updateTemplate: (id: string, data: Partial<CreateTemplateData>) =>
    apiClient.put<{ data: ExamTemplate }>(`/admin/templates/${id}`, data),
  deleteTemplate: (id: string) =>
    apiClient.delete(`/admin/templates/${id}`),
  createExamFromTemplate: (data: CreateExamFromTemplateData) =>
    apiClient.post<{ data: Exam }>(`/admin/exams/from-template`, data),
  // Question APIs
  getQuestions: (params?: {
    search?: string;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    examId?: string;
    limit?: number;
  }) =>
    apiClient.get<{ data: Array<{
      id: string;
      content: string;
      questionType: string;
      difficulty?: string;
      tags: string[];
      points: number;
      section: {
        id: string;
        title: string;
        examId: string;
        exam: {
          id: string;
          title: string;
        };
      };
      createdAt: string;
    }> }>('/admin/questions', { params }),
  // Question Pool APIs
  createQuestionPool: (data: {
    name: string;
    description?: string;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    questionIds?: string[];
  }) => apiClient.post<{ data: QuestionPool }>('/admin/question-pools', data),
  getQuestionPools: () =>
    apiClient.get<{ data: QuestionPool[] }>('/admin/question-pools'),
  getQuestionPool: (id: string) =>
    apiClient.get<{ data: QuestionPool }>(`/admin/question-pools/${id}`),
  updateQuestionPool: (
    id: string,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
      difficulty?: 'easy' | 'medium' | 'hard';
      questionIds?: string[];
    },
  ) =>
    apiClient.put<{ data: QuestionPool }>(`/admin/question-pools/${id}`, data),
  deleteQuestionPool: (id: string) =>
    apiClient.delete(`/admin/question-pools/${id}`),
  // Site Settings APIs
  getSiteSettings: () =>
    apiClient.get<{ data: SiteSettings }>("/admin/site-settings"),
  updateSiteSettings: (data: UpdateSiteSettingsDto) =>
    apiClient.put<{ data: SiteSettings }>("/admin/site-settings", data),
  analyzeColors: (logoUrl: string) =>
    apiClient.post<{ data: ColorAnalysisResult }>("/admin/site-settings/analyze-colors", { logoUrl }),
  // Badge APIs
  getBadges: (includeInactive?: boolean) =>
    apiClient.get<{ data: Badge[] }>("/admin/badges", {
      params: includeInactive ? { includeInactive: "true" } : undefined,
    }),
  getBadge: (id: string) =>
    apiClient.get<{ data: Badge }>(`/admin/badges/${id}`),
  createBadge: (data: {
    badgeType: string;
    name: string;
    description?: string;
    icon?: string;
    rarity?: string;
    condition?: any;
    isActive?: boolean;
  }) => apiClient.post<{ data: Badge }>("/admin/badges", data),
  updateBadge: (
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      rarity?: string;
      condition?: any;
      isActive?: boolean;
    },
  ) => apiClient.patch<{ data: Badge }>(`/admin/badges/${id}`, data),
  deleteBadge: (id: string) => apiClient.delete(`/admin/badges/${id}`),
  // File Upload API
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ data: { url: string; filename: string; size: number } }>("/admin/upload/image", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadAudio: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ data: { url: string; filename: string; size: number } }>("/admin/upload/audio", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// License Key API
export const licenseKeyAPI = {
  // Single key operations
  getLicenseKeys: (params?: {
    page?: number;
    limit?: number;
    keyType?: string;
    isActive?: boolean;
  }) => apiClient.get<PaginatedResponse<LicenseKey>>("/license-keys", { params }),
  getLicenseKey: (id: string) => apiClient.get<LicenseKey>(`/license-keys/${id}`),
  createLicenseKey: (data: CreateLicenseKeyPayload) =>
    apiClient.post<{ data: LicenseKey }>("/license-keys", data),
  updateLicenseKey: (id: string, data: UpdateLicenseKeyPayload) =>
    apiClient.patch<{ data: LicenseKey }>(`/license-keys/${id}`, data),
  deleteLicenseKey: (id: string) =>
    apiClient.delete(`/license-keys/${id}`),
  // Batch operations
  createBatch: (data: CreateBatchLicenseKeyPayload) =>
    apiClient.post<{
      batch: BatchLicenseKey;
      keys: Array<{ id: string; key: string; keyType: string }>;
      count: number;
    }>("/license-keys/batch", data),
  getBatchStats: (batchId: string) =>
    apiClient.get<{ data: BatchStats }>(`/license-keys/batch/${batchId}/stats`),
  exportBatchKeys: (batchId: string) =>
    apiClient.get(`/license-keys/batch/${batchId}/export`, {
      responseType: 'blob',
    }),
  getDashboard: () =>
    apiClient.get<{ data: LicenseKeyDashboard }>("/license-keys/dashboard"),
  getExpiringBatches: (days?: number) =>
    apiClient.get<{ data: Array<{
      batchId: string;
      name: string;
      expiringCount: number;
      expiresAt: string;
    }> }>("/license-keys/batches/expiring", { params: { days } }),
  predictUsage: (batchId: string, days?: number) =>
    apiClient.get<{ data: UsagePrediction }>(`/license-keys/batch/${batchId}/predict`, {
      params: { days },
    }),
  notifyExpiration: (batchId: string) =>
    apiClient.post(`/license-keys/batch/${batchId}/notify-expiration`),
};

// AI API
export interface GenerateExplanationPayload {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  questionResultId?: string;
}

export interface AIJobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const aiAPI = {
  // 동기 해설 생성
  generateExplanation: (data: GenerateExplanationPayload) =>
    apiClient.post<{
      explanation: string;
      questionId: string;
      generatedAt: string;
    }>("/ai/explanation", data),
  // 비동기 해설 생성
  generateExplanationAsync: (data: GenerateExplanationPayload) =>
    apiClient.post<{
      jobId: string;
      status: string;
      message: string;
    }>("/ai/explanation-async", data),
  // 약점 진단 (동기)
  diagnoseWeakness: (examResultId: string) =>
    apiClient.post(`/ai/diagnose-weakness/${examResultId}`),
  // 약점 진단 (비동기)
  diagnoseWeaknessAsync: (examResultId: string) =>
    apiClient.post<{
      jobId: string;
      status: string;
      message: string;
    }>(`/ai/diagnose-weakness-async/${examResultId}`),
  // 작업 상태 조회
  getJobStatus: (jobId: string) =>
    apiClient.get<AIJobStatus>(`/ai/job/${jobId}`),
  // 큐 통계
  getQueueStats: () =>
    apiClient.get<{
      queued: number;
      processing: number;
      completed: number;
      failed: number;
    }>("/ai/queue/stats"),
  // AI 기능 활성화 확인
  checkAvailability: () =>
    apiClient.post<{
      available: boolean;
      message: string;
    }>("/ai/check-availability"),
};

// Site Settings API (Public)
export const siteSettingsAPI = {
  getPublicSettings: () =>
    apiClient.get<{ data: SiteSettings }>("/site-settings"),
  getAboutSection: (section: string) =>
    apiClient.get<{ data: any }>(`/site-settings/about?section=${section}`),
};

// Contact API (Public)
export interface SubmitContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const contactAPI = {
  submit: (data: SubmitContactDto) =>
    apiClient.post<{
      success: boolean;
      message: string;
    }>("/contact/submit", data),
};
