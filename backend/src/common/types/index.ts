// Common types for the application

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PARTNER = 'partner',
  CREATOR = 'creator',    // 출제자
  REVIEWER = 'reviewer',  // 검토자
  APPROVER = 'approver',  // 승인자
}

export enum ExamType {
  MOCK = 'mock',
  PRACTICE = 'practice',
  OFFICIAL = 'official',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_BLANK = 'fill_blank',
  ESSAY = 'essay',
}

export enum ResultStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  GRADED = 'graded',
}

export enum KeyType {
  ACCESS_KEY = 'ACCESS_KEY',
  TEST_KEY = 'TEST_KEY',
  ADMIN_KEY = 'ADMIN_KEY',
}

export enum LogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

