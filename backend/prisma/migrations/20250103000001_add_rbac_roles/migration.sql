-- AlterEnum: UserRole에 새로운 역할 추가
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'creator';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'reviewer';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'approver';

