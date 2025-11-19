import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../../common/types';
import { PrismaService } from '../../../common/utils/prisma.service';

export enum Permission {
  // 시험 관리
  EXAM_CREATE = 'exam:create',
  EXAM_UPDATE = 'exam:update',
  EXAM_DELETE = 'exam:delete',
  EXAM_VIEW = 'exam:view',
  EXAM_PUBLISH = 'exam:publish',
  
  // 워크플로우
  WORKFLOW_SUBMIT_REVIEW = 'workflow:submit_review',
  WORKFLOW_ASSIGN_REVIEWER = 'workflow:assign_reviewer',
  WORKFLOW_APPROVE = 'workflow:approve',
  WORKFLOW_REJECT = 'workflow:reject',
  WORKFLOW_PUBLISH = 'workflow:publish',
  WORKFLOW_ARCHIVE = 'workflow:archive',
  
  // 문제 관리
  QUESTION_CREATE = 'question:create',
  QUESTION_UPDATE = 'question:update',
  QUESTION_DELETE = 'question:delete',
  QUESTION_VIEW = 'question:view',
  
  // 템플릿 관리
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',
  TEMPLATE_VIEW = 'template:view',
  
  // 문제 은행 관리
  QUESTION_BANK_CREATE = 'question_bank:create',
  QUESTION_BANK_UPDATE = 'question_bank:update',
  QUESTION_BANK_DELETE = 'question_bank:delete',
  QUESTION_BANK_VIEW = 'question_bank:view',
  
  // 시스템 관리
  SYSTEM_ADMIN = 'system:admin',
  USER_MANAGE = 'user:manage',
  SETTINGS_MANAGE = 'settings:manage',
}

// 역할별 권한 매핑
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.EXAM_VIEW,
    Permission.QUESTION_VIEW,
  ],
  [UserRole.ADMIN]: [
    // 모든 권한
    Permission.EXAM_CREATE,
    Permission.EXAM_UPDATE,
    Permission.EXAM_DELETE,
    Permission.EXAM_VIEW,
    Permission.EXAM_PUBLISH,
    Permission.WORKFLOW_SUBMIT_REVIEW,
    Permission.WORKFLOW_ASSIGN_REVIEWER,
    Permission.WORKFLOW_APPROVE,
    Permission.WORKFLOW_REJECT,
    Permission.WORKFLOW_PUBLISH,
    Permission.WORKFLOW_ARCHIVE,
    Permission.QUESTION_CREATE,
    Permission.QUESTION_UPDATE,
    Permission.QUESTION_DELETE,
    Permission.QUESTION_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
    Permission.TEMPLATE_VIEW,
    Permission.QUESTION_BANK_CREATE,
    Permission.QUESTION_BANK_UPDATE,
    Permission.QUESTION_BANK_DELETE,
    Permission.QUESTION_BANK_VIEW,
    Permission.SYSTEM_ADMIN,
    Permission.USER_MANAGE,
    Permission.SETTINGS_MANAGE,
  ],
  [UserRole.PARTNER]: [
    Permission.EXAM_VIEW,
    Permission.QUESTION_VIEW,
    Permission.TEMPLATE_VIEW,
  ],
  [UserRole.CREATOR]: [
    Permission.EXAM_CREATE,
    Permission.EXAM_UPDATE,
    Permission.EXAM_VIEW,
    Permission.WORKFLOW_SUBMIT_REVIEW,
    Permission.QUESTION_CREATE,
    Permission.QUESTION_UPDATE,
    Permission.QUESTION_VIEW,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_VIEW,
    Permission.QUESTION_BANK_CREATE,
    Permission.QUESTION_BANK_UPDATE,
    Permission.QUESTION_BANK_VIEW,
  ],
  [UserRole.REVIEWER]: [
    Permission.EXAM_VIEW,
    Permission.WORKFLOW_REJECT,
    Permission.QUESTION_VIEW,
    Permission.TEMPLATE_VIEW,
  ],
  [UserRole.APPROVER]: [
    Permission.EXAM_VIEW,
    Permission.WORKFLOW_APPROVE,
    Permission.WORKFLOW_PUBLISH,
    Permission.QUESTION_VIEW,
    Permission.TEMPLATE_VIEW,
  ],
};

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자가 특정 권한을 가지고 있는지 확인
   */
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
   */
  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(userRole, permission));
  }

  /**
   * 사용자가 모든 권한을 가지고 있는지 확인
   */
  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(userRole, permission));
  }

  /**
   * 권한 체크 및 예외 발생
   */
  checkPermission(userRole: UserRole, permission: Permission): void {
    if (!this.hasPermission(userRole, permission)) {
      throw new ForbiddenException(
        `권한이 없습니다. 필요한 권한: ${permission}, 현재 역할: ${userRole}`,
      );
    }
  }

  /**
   * 역할별 권한 목록 조회
   */
  getPermissionsByRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * 사용자가 시험을 수정할 수 있는지 확인 (작성자 또는 관리자)
   */
  async canModifyExam(userId: string, userRole: UserRole, examId: string): Promise<boolean> {
    // 관리자는 항상 수정 가능
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // 출제자는 자신이 작성한 시험만 수정 가능
    if (userRole === UserRole.CREATOR) {
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        select: { createdBy: true },
      });
      return exam?.createdBy === userId;
    }

    return false;
  }

  /**
   * 사용자가 시험을 검수할 수 있는지 확인
   */
  async canReviewExam(userId: string, userRole: UserRole, examId: string): Promise<boolean> {
    // 관리자는 항상 검수 가능
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // 검토자는 할당된 시험만 검수 가능
    if (userRole === UserRole.REVIEWER) {
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        select: { reviewerId: true, status: true },
      });
      return exam?.reviewerId === userId && exam?.status === 'review';
    }

    return false;
  }

  /**
   * 사용자가 시험을 승인할 수 있는지 확인
   */
  canApproveExam(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN || userRole === UserRole.APPROVER;
  }
}

