import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Skip token refresh during SSR
      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

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
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// API 엔드포인트 타입 정의
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
}

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
  usedCount: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
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
  getExams: (params?: { page?: number; limit?: number; examType?: string }) =>
    apiClient.get<PaginatedResponse<Exam>>("/exams", { params }),
  getExam: (id: string) => apiClient.get<Exam>(`/exams/${id}`),
  getExamSections: (examId: string) =>
    apiClient.get(`/exams/${examId}/sections`),
};

// Session API
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
};

// Result API
export const resultAPI = {
  getResults: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<ExamResult>>("/results", { params }),
  getResult: (id: string) => apiClient.get<ExamResult>(`/results/${id}`),
  getReport: (id: string) => apiClient.get(`/results/${id}/report`),
};

// Statistics API
export const statisticsAPI = {
  getUserStatistics: (params?: { examId?: string; period?: string }) =>
    apiClient.get("/users/me/statistics", { params }),
};

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
  getExamStatistics: () => apiClient.get("/admin/exams/statistics"),
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
};
