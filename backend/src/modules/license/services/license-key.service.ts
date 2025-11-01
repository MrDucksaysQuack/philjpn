import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateLicenseKeyDto } from '../dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from '../dto/update-license-key.dto';
import { LicenseKeyQueryDto } from '../dto/license-key-query.dto';
import { ValidateKeyDto } from '../dto/validate-key.dto';
import { KeyType, LogStatus } from '../../../common/types';
import * as crypto from 'crypto';

@Injectable()
export class LicenseKeyService {
  constructor(private prisma: PrismaService) {}

  /**
   * 라이선스 키 생성
   */
  private generateKey(): string {
    // XXXX-XXXX-XXXX-XXXX 형식 생성
    const segments: string[] = [];
    for (let i = 0; i < 4; i++) {
      const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  }

  /**
   * 라이선스 키 목록 조회
   */
  async findAll(userId: string, role: string, query: LicenseKeyQueryDto) {
    return this.prisma.executeWithRetry(async () => {
      const { page = 1, limit = 20, keyType, isActive } = query;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Admin이 아니면 본인의 키만 조회
      if (role !== 'admin') {
        where.userId = userId;
      }

      if (keyType) where.keyType = keyType;
      if (isActive !== undefined) where.isActive = isActive;

      const [licenseKeys, total] = await Promise.all([
        this.prisma.licenseKey.findMany({
          where,
          skip,
          take: limit,
          orderBy: { issuedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.licenseKey.count({ where }),
      ]);

      return {
        data: licenseKeys.map((key) => ({
          id: key.id,
          key: key.key,
          keyType: key.keyType,
          examIds: key.examIds,
          usageLimit: key.usageLimit,
          usageCount: key.usageCount,
          validFrom: key.validFrom,
          validUntil: key.validUntil,
          isActive: key.isActive,
          issuedAt: key.issuedAt,
          user: key.user,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }, 5); // 5회 재시도
  }

  /**
   * 라이선스 키 상세 조회
   */
  async findOne(id: string, userId: string, role: string) {
    const licenseKey = await this.prisma.licenseKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        usageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!licenseKey) {
      throw new NotFoundException(`라이선스 키를 찾을 수 없습니다. ID: ${id}`);
    }

    // Admin이 아니면 본인의 키만 조회 가능
    if (role !== 'admin' && licenseKey.userId !== userId) {
      throw new ForbiddenException('본인의 라이선스 키만 조회할 수 있습니다.');
    }

    const remainingUsage =
      licenseKey.usageLimit !== null
        ? Math.max(0, licenseKey.usageLimit - licenseKey.usageCount)
        : null;

    const now = new Date();
    const isValid =
      licenseKey.isActive &&
      licenseKey.validFrom <= now &&
      (licenseKey.validUntil === null || licenseKey.validUntil >= now);

    return {
      id: licenseKey.id,
      key: licenseKey.key,
      keyType: licenseKey.keyType,
      examIds: licenseKey.examIds,
      usageLimit: licenseKey.usageLimit,
      usageCount: licenseKey.usageCount,
      remainingUsage,
      validFrom: licenseKey.validFrom,
      validUntil: licenseKey.validUntil,
      isActive: licenseKey.isActive,
      isValid,
      usageLogs: licenseKey.usageLogs.map((log) => ({
        id: log.id,
        action: log.action,
        status: log.status,
        createdAt: log.createdAt,
      })),
    };
  }

  /**
   * 라이선스 키 발급
   */
  async create(createDto: CreateLicenseKeyDto, issuedBy: string) {
    const { userId, keyType, examIds, usageLimit, validFrom, validUntil } = createDto;

    // 키 생성 (중복 방지)
    let key: string;
    let attempts = 0;
    do {
      key = this.generateKey();
      const existing = await this.prisma.licenseKey.findUnique({
        where: { key },
      });
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        throw new BadRequestException('키 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } while (true);

    const licenseKey = await this.prisma.licenseKey.create({
      data: {
        key,
        keyType,
        userId: userId || null,
        examIds: examIds || [],
        usageLimit: usageLimit || null,
        usageCount: 0,
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: true,
        issuedBy,
      },
    });

    return {
      id: licenseKey.id,
      key: licenseKey.key,
      keyType: licenseKey.keyType,
      issuedAt: licenseKey.issuedAt,
    };
  }

  /**
   * 라이선스 키 수정
   */
  async update(id: string, updateDto: UpdateLicenseKeyDto, userId: string, role: string) {
    const existing = await this.prisma.licenseKey.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`라이선스 키를 찾을 수 없습니다. ID: ${id}`);
    }

    // Admin만 수정 가능
    if (role !== 'admin') {
      throw new ForbiddenException('라이선스 키 수정 권한이 없습니다.');
    }

    const updateData: any = {};
    if (updateDto.userId !== undefined) updateData.userId = updateDto.userId;
    if (updateDto.examIds !== undefined) updateData.examIds = updateDto.examIds;
    if (updateDto.usageLimit !== undefined) updateData.usageLimit = updateDto.usageLimit;
    if (updateDto.validFrom !== undefined) updateData.validFrom = new Date(updateDto.validFrom);
    if (updateDto.validUntil !== undefined)
      updateData.validUntil = updateDto.validUntil ? new Date(updateDto.validUntil) : null;
    if (updateDto.isActive !== undefined) updateData.isActive = updateDto.isActive;

    const licenseKey = await this.prisma.licenseKey.update({
      where: { id },
      data: updateData,
    });

    return licenseKey;
  }

  /**
   * 라이선스 키 삭제/비활성화
   */
  async remove(id: string, userId: string, role: string) {
    const licenseKey = await this.prisma.licenseKey.findUnique({
      where: { id },
    });

    if (!licenseKey) {
      throw new NotFoundException(`라이선스 키를 찾을 수 없습니다. ID: ${id}`);
    }

    // Admin만 삭제 가능
    if (role !== 'admin') {
      throw new ForbiddenException('라이선스 키 삭제 권한이 없습니다.');
    }

    // 비활성화로 처리 (물리 삭제 대신)
    await this.prisma.licenseKey.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: '라이선스 키가 비활성화되었습니다.' };
  }

  /**
   * 라이선스 키 유효성 검증
   */
  async validate(key: string, dto?: ValidateKeyDto) {
    const licenseKey = await this.prisma.licenseKey.findUnique({
      where: { key },
    });

    if (!licenseKey) {
      return {
        isValid: false,
        canUse: false,
        reason: '라이선스 키를 찾을 수 없습니다.',
      };
    }

    const now = new Date();
    let isValid = true;
    let canUse = true;
    let reason = '';

    // 활성화 확인
    if (!licenseKey.isActive) {
      isValid = false;
      canUse = false;
      reason = '비활성화된 라이선스 키입니다.';
      return { isValid, canUse, reason };
    }

    // 유효 기간 확인
    if (licenseKey.validFrom > now) {
      isValid = false;
      canUse = false;
      reason = '아직 유효하지 않은 라이선스 키입니다.';
      return { isValid, canUse, reason };
    }

    if (licenseKey.validUntil && licenseKey.validUntil < now) {
      isValid = false;
      canUse = false;
      reason = '만료된 라이선스 키입니다.';
      return { isValid, canUse, reason };
    }

    // 사용 횟수 확인
    if (licenseKey.usageLimit !== null && licenseKey.usageCount >= licenseKey.usageLimit) {
      isValid = true;
      canUse = false;
      reason = '사용 횟수를 초과했습니다.';
      return { isValid, canUse, reason };
    }

    // 시험 ID 제한 확인
    if (dto?.examId && licenseKey.examIds.length > 0) {
      if (!licenseKey.examIds.includes(dto.examId)) {
        isValid = true;
        canUse = false;
        reason = '이 시험에는 사용할 수 없는 라이선스 키입니다.';
        return { isValid, canUse, reason };
      }
    }

    const remainingUsage =
      licenseKey.usageLimit !== null
        ? Math.max(0, licenseKey.usageLimit - licenseKey.usageCount)
        : null;

    return {
      isValid,
      canUse,
      remainingUsage,
      expiresAt: licenseKey.validUntil,
      reason: canUse ? '사용 가능한 라이선스 키입니다.' : reason,
    };
  }

  /**
   * 라이선스 키 사용 로그 기록
   */
  async logUsage(
    keyId: string,
    action: string,
    status: LogStatus,
    userId?: string,
    examId?: string,
    examResultId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.keyUsageLog.create({
      data: {
        licenseKeyId: keyId,
        userId,
        examId,
        examResultId,
        action,
        status,
        ipAddress,
        userAgent,
      },
    });

    // 사용 횟수 증가 (성공한 경우만)
    if (status === 'success') {
      await this.prisma.licenseKey.update({
        where: { id: keyId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    }
  }

  /**
   * 키로 LicenseKey 엔티티 조회
   */
  async findByKey(key: string) {
    return this.prisma.licenseKey.findUnique({
      where: { key },
    });
  }

  /**
   * 라이선스 키 사용 로그 조회
   */
  async findUsageLogs(licenseKeyId: string, userId: string, role: string, query: any) {
    const { page = 1, limit = 10, action } = query;
    const skip = (page - 1) * limit;

    // 라이선스 키 확인
    const licenseKey = await this.prisma.licenseKey.findUnique({
      where: { id: licenseKeyId },
    });

    if (!licenseKey) {
      throw new NotFoundException(`라이선스 키를 찾을 수 없습니다. ID: ${licenseKeyId}`);
    }

    // Admin이 아니면 본인의 키만 조회 가능
    if (role !== 'admin' && licenseKey.userId !== userId) {
      throw new ForbiddenException('본인의 라이선스 키만 조회할 수 있습니다.');
    }

    const where: any = {
      licenseKeyId,
    };

    if (action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.keyUsageLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.keyUsageLog.count({ where }),
    ]);

    return {
      data: data.map((log) => ({
        id: log.id,
        action: log.action,
        status: log.status,
        userId: log.userId,
        user: log.user,
        examId: log.examId,
        examResultId: log.examResultId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

