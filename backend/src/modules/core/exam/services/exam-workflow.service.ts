import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../common/utils/prisma.service';
import { PermissionService, Permission } from '../../../auth/services/permission.service';
import { UserRole } from '../../../../common/types';

export enum ExamWorkflowStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export interface SubmitForReviewDto {
  comment?: string;
}

export interface ReviewDto {
  comment?: string;
}

export interface ApproveDto {
  comment?: string;
}

export interface RejectDto {
  reason: string;
}

@Injectable()
export class ExamWorkflowService {
  private readonly logger = new Logger(ExamWorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private permissionService: PermissionService,
  ) {}

  /**
   * 검수 요청 (draft → review)
   */
  async submitForReview(examId: string, userId: string, userRole: UserRole, dto?: SubmitForReviewDto) {
    // 권한 체크
    this.permissionService.checkPermission(userRole, Permission.WORKFLOW_SUBMIT_REVIEW);
    
    // 작성자 확인 (출제자는 자신이 작성한 시험만 검수 요청 가능)
    if (userRole === UserRole.CREATOR) {
      const canModify = await this.permissionService.canModifyExam(userId, userRole, examId);
      if (!canModify) {
        throw new ForbiddenException('자신이 작성한 시험만 검수 요청할 수 있습니다.');
      }
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    if (exam.status !== ExamWorkflowStatus.DRAFT) {
      throw new BadRequestException(
        `검수 요청은 초안 상태에서만 가능합니다. 현재 상태: ${exam.status}`,
      );
    }

    // 시험 검증 (ExamValidatorService 사용 가능)
    // TODO: 검증 로직 추가

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamWorkflowStatus.REVIEW,
        reviewerId: null, // 검수자 할당은 별도로
        reviewedAt: null,
        reviewComment: dto?.comment || null,
        rejectionReason: null,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`시험 검수 요청: ${examId} by ${userId}`);
    return updatedExam;
  }

  /**
   * 검수자 할당 (review 상태에서)
   */
  async assignReviewer(examId: string, reviewerId: string, assignedBy: string, assignedByRole: UserRole) {
    // 권한 체크 (관리자만 검수자 할당 가능)
    this.permissionService.checkPermission(assignedByRole, Permission.WORKFLOW_ASSIGN_REVIEWER);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    if (exam.status !== ExamWorkflowStatus.REVIEW) {
      throw new BadRequestException(
        `검수자 할당은 검수 중 상태에서만 가능합니다. 현재 상태: ${exam.status}`,
      );
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        reviewerId,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`검수자 할당: ${examId} → ${reviewerId} by ${assignedBy}`);
    return updatedExam;
  }

  /**
   * 승인 (review → approved)
   */
  async approve(examId: string, approverId: string, approverRole: UserRole, dto?: ApproveDto) {
    // 권한 체크
    this.permissionService.checkPermission(approverRole, Permission.WORKFLOW_APPROVE);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    if (exam.status !== ExamWorkflowStatus.REVIEW) {
      throw new BadRequestException(
        `승인은 검수 중 상태에서만 가능합니다. 현재 상태: ${exam.status}`,
      );
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamWorkflowStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
        reviewComment: dto?.comment || exam.reviewComment,
        rejectionReason: null,
      },
      include: {
        approver: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`시험 승인: ${examId} by ${approverId}`);
    return updatedExam;
  }

  /**
   * 거부 (review → rejected)
   */
  async reject(examId: string, reviewerId: string, reviewerRole: UserRole, dto: RejectDto) {
    // 권한 체크
    this.permissionService.checkPermission(reviewerRole, Permission.WORKFLOW_REJECT);
    
    // 검토자는 할당된 시험만 거부 가능
    if (reviewerRole === UserRole.REVIEWER) {
      const canReview = await this.permissionService.canReviewExam(reviewerId, reviewerRole, examId);
      if (!canReview) {
        throw new ForbiddenException('할당된 시험만 거부할 수 있습니다.');
      }
    }
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    if (exam.status !== ExamWorkflowStatus.REVIEW) {
      throw new BadRequestException(
        `거부는 검수 중 상태에서만 가능합니다. 현재 상태: ${exam.status}`,
      );
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamWorkflowStatus.REJECTED,
        reviewerId,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
        reviewComment: null,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`시험 거부: ${examId} by ${reviewerId}`);
    return updatedExam;
  }

  /**
   * 발행 (approved → published)
   */
  async publish(examId: string, publisherId: string, publisherRole: UserRole) {
    // 권한 체크
    this.permissionService.checkPermission(publisherRole, Permission.WORKFLOW_PUBLISH);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    if (exam.status !== ExamWorkflowStatus.APPROVED) {
      throw new BadRequestException(
        `발행은 승인된 상태에서만 가능합니다. 현재 상태: ${exam.status}`,
      );
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamWorkflowStatus.PUBLISHED,
        publishedAt: new Date(),
        isPublic: true,
      },
    });

    this.logger.log(`시험 발행: ${examId} by ${publisherId}`);
    return updatedExam;
  }

  /**
   * 보관 (published → archived)
   */
  async archive(examId: string, archivedBy: string, archivedByRole: UserRole) {
    // 권한 체크 (관리자만 보관 가능)
    this.permissionService.checkPermission(archivedByRole, Permission.WORKFLOW_ARCHIVE);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    if (exam.status !== ExamWorkflowStatus.PUBLISHED) {
      throw new BadRequestException(
        `보관은 발행된 상태에서만 가능합니다. 현재 상태: ${exam.status}`,
      );
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamWorkflowStatus.ARCHIVED,
        isPublic: false,
      },
    });

    this.logger.log(`시험 보관: ${examId} by ${archivedBy}`);
    return updatedExam;
  }

  /**
   * 초안으로 복귀 (rejected → draft)
   */
  async returnToDraft(examId: string, userId: string, userRole: UserRole) {
    // 권한 체크 (관리자 또는 작성자만 초안 복귀 가능)
    if (userRole === UserRole.CREATOR) {
      const canModify = await this.permissionService.canModifyExam(userId, userRole, examId);
      if (!canModify) {
        throw new ForbiddenException('자신이 작성한 시험만 초안으로 복귀할 수 있습니다.');
      }
    } else if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('관리자 또는 작성자만 초안으로 복귀할 수 있습니다.');
    }
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    if (exam.status !== ExamWorkflowStatus.REJECTED) {
      throw new BadRequestException(
        `초안으로 복귀는 거부된 상태에서만 가능합니다. 현재 상태: ${exam.status}`,
      );
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: ExamWorkflowStatus.DRAFT,
        reviewerId: null,
        reviewedAt: null,
        reviewComment: null,
        rejectionReason: null,
      },
    });

    this.logger.log(`시험 초안 복귀: ${examId} by ${userId}`);
    return updatedExam;
  }

  /**
   * 워크플로우 상태 조회
   */
  async getWorkflowStatus(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        status: true,
        createdBy: true,
        reviewerId: true,
        approvedBy: true,
        reviewedAt: true,
        approvedAt: true,
        publishedAt: true,
        reviewComment: true,
        rejectionReason: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`시험을 찾을 수 없습니다. ID: ${examId}`);
    }

    return exam;
  }
}

