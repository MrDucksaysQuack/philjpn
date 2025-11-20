import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { CreateLicenseKeyDto } from '../dto/create-license-key.dto';
import { CreateBatchLicenseKeysDto } from '../dto/create-batch-license-keys.dto';
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
  private generateKey(prefix?: string): string {
    // XXXX-XXXX-XXXX-XXXX 형식 생성
    const segments: string[] = [];
    for (let i = 0; i < 4; i++) {
      const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
      segments.push(segment);
    }
    const key = segments.join('-');
    return prefix ? `${prefix}-${key}` : key;
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
   * 대량 라이선스 키 배치 생성
   */
  async createBatch(
    dto: CreateBatchLicenseKeysDto,
    issuedBy: string,
  ): Promise<{ batch: any; keys: any[]; count: number }> {
    const {
      count,
      name,
      description,
      keyType,
      examIds,
      usageLimit,
      validDays,
      prefix,
    } = dto;

    // 배치 생성
    const batch = await this.prisma.licenseKeyBatch.create({
      data: {
        name,
        description: description || null,
        keyType,
        count,
        examIds: examIds || [],
        usageLimit: usageLimit || null,
        validUntil: validDays
          ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000)
          : null,
        createdBy: issuedBy,
      },
    });

    const keys: any[] = [];
    const batchSize = 500; // 한 번에 처리할 개수 (개선: 100 -> 500)

    // 트랜잭션으로 배치 단위 키 생성 (성능 개선)
    for (let i = 0; i < count; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - i);
      
      // 트랜잭션으로 배치 생성 (원자성 보장 및 성능 향상)
      const batchKeys = await this.prisma.$transaction(
        async (tx) => {
          const newKeys: any[] = [];
          for (let j = 0; j < currentBatchSize; j++) {
            const key = await this.createSingleKeyForBatch(
              batch.id,
              keyType,
              examIds,
              usageLimit,
              validDays,
              prefix,
              issuedBy,
              tx,
            );
            newKeys.push(key);
          }
          return newKeys;
        },
        {
          timeout: 30000, // 30초 타임아웃
        },
      );
      
      keys.push(...batchKeys);
    }

    return {
      batch: {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        count: batch.count,
        createdAt: batch.createdAt,
      },
      keys: keys.map((k) => ({
        id: k.id,
        key: k.key,
        keyType: k.keyType,
      })),
      count: keys.length,
    };
  }

  /**
   * 배치용 단일 키 생성 (내부 메서드, 트랜잭션 지원)
   */
  private async createSingleKeyForBatch(
    batchId: string,
    keyType: KeyType,
    examIds: string[] | undefined,
    usageLimit: number | undefined,
    validDays: number | undefined,
    prefix: string | undefined,
    issuedBy: string,
    tx?: any, // 트랜잭션 클라이언트 (선택사항)
  ) {
    const prismaClient = tx || this.prisma;

    // 키 생성 (중복 방지)
    let key: string;
    let attempts = 0;
    do {
      key = this.generateKey(prefix);
      const existing = await prismaClient.licenseKey.findUnique({
        where: { key },
      });
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        throw new BadRequestException('키 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } while (true);

    const validUntil = validDays
      ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000)
      : null;

    return await prismaClient.licenseKey.create({
      data: {
        key,
        keyType,
        examIds: examIds || [],
        usageLimit: usageLimit || null,
        usageCount: 0,
        validUntil,
        isActive: true,
        issuedBy,
        batchId,
      },
    });
  }

  /**
   * 배치 통계 조회 (강화된 버전)
   */
  async getBatchStats(batchId: string) {
    const batch = await this.prisma.licenseKeyBatch.findUnique({
      where: { id: batchId },
      include: {
        keys: {
          include: {
            usageLogs: {
              orderBy: { createdAt: 'desc' },
              take: 100,
            },
          },
        },
        issuer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`배치를 찾을 수 없습니다. ID: ${batchId}`);
    }

    const totalKeys = batch.keys.length;
    const usedKeys = batch.keys.filter((k) => k.usageCount > 0).length;
    const activeKeys = batch.keys.filter((k) => k.isActive).length;
    const totalUsage = batch.keys.reduce((sum, k) => sum + k.usageCount, 0);
    const expiredKeys = batch.keys.filter(
      (k) => k.validUntil && k.validUntil < new Date(),
    ).length;
    const expiringSoonKeys = batch.keys.filter(
      (k) =>
        k.validUntil &&
        k.validUntil > new Date() &&
        k.validUntil < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 이내
    ).length;

    // 일별 사용량 통계 (최근 30일)
    const dailyUsage = this.calculateDailyUsage(batch.keys);
    
    // 사용량 분포
    const usageDistribution = this.calculateUsageDistribution(batch.keys);

    return {
      batch: {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        count: batch.count,
        keyType: batch.keyType,
        createdAt: batch.createdAt,
        issuer: batch.issuer,
        validUntil: batch.validUntil,
      },
      stats: {
        totalKeys,
        usedKeys,
        unusedKeys: totalKeys - usedKeys,
        activeKeys,
        inactiveKeys: totalKeys - activeKeys,
        expiredKeys,
        expiringSoonKeys,
        totalUsage,
        averageUsage: totalKeys > 0 ? totalUsage / totalKeys : 0,
        usageRate: totalKeys > 0 ? (usedKeys / totalKeys) * 100 : 0,
        expirationRate: totalKeys > 0 ? (expiredKeys / totalKeys) * 100 : 0,
      },
      trends: {
        dailyUsage,
        usageDistribution,
      },
    };
  }

  /**
   * 일별 사용량 계산
   */
  private calculateDailyUsage(keys: any[]): Array<{ date: string; count: number }> {
    const usageMap = new Map<string, number>();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 모든 키의 사용 로그에서 일별 사용량 집계
    for (const key of keys) {
      if (key.usageLogs) {
        for (const log of key.usageLogs) {
          const logDate = new Date(log.createdAt);
          if (logDate >= thirtyDaysAgo) {
            const dateKey = logDate.toISOString().split('T')[0];
            usageMap.set(dateKey, (usageMap.get(dateKey) || 0) + 1);
          }
        }
      }
    }

    // 최근 30일 데이터 생성
    const dailyUsage: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyUsage.push({
        date: dateKey,
        count: usageMap.get(dateKey) || 0,
      });
    }

    return dailyUsage;
  }

  /**
   * 사용량 분포 계산
   */
  private calculateUsageDistribution(keys: any[]): {
    zero: number;
    low: number;
    medium: number;
    high: number;
  } {
    let zero = 0; // 0회
    let low = 0; // 1-5회
    let medium = 0; // 6-20회
    let high = 0; // 21회 이상

    for (const key of keys) {
      const usage = key.usageCount || 0;
      if (usage === 0) {
        zero++;
      } else if (usage <= 5) {
        low++;
      } else if (usage <= 20) {
        medium++;
      } else {
        high++;
      }
    }

    return { zero, low, medium, high };
  }

  /**
   * 배치 키 CSV 내보내기
   */
  async exportBatchToCSV(batchId: string): Promise<string> {
    const batch = await this.prisma.licenseKeyBatch.findUnique({
      where: { id: batchId },
      include: {
        keys: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`배치를 찾을 수 없습니다. ID: ${batchId}`);
    }

    // CSV 헤더
    const headers = [
      'Key',
      'Type',
      'Usage Count',
      'Usage Limit',
      'Valid Until',
      'Is Active',
    ];

    // CSV 행 생성
    const rows = batch.keys.map((k) => [
      k.key,
      k.keyType,
      k.usageCount.toString(),
      k.usageLimit?.toString() || 'Unlimited',
      k.validUntil?.toISOString() || 'Never',
      k.isActive ? 'Yes' : 'No',
    ]);

    // CSV 형식으로 변환
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * 만료 예정 배치 조회
   */
  async getExpiringBatches(userId: string, days: number = 7) {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.licenseKeyBatch.findMany({
      where: {
        createdBy: userId,
        validUntil: {
          gte: new Date(),
          lte: cutoffDate,
        },
      },
      include: {
        _count: {
          select: { keys: true },
        },
      },
      orderBy: { validUntil: 'asc' },
    });
  }

  /**
   * 사용량 예측 (간단한 선형 회귀)
   */
  async predictUsage(batchId: string, days: number = 30): Promise<number> {
    const batch = await this.prisma.licenseKeyBatch.findUnique({
      where: { id: batchId },
      include: {
        keys: {
          include: {
            usageLogs: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`배치를 찾을 수 없습니다. ID: ${batchId}`);
    }

    // 최근 30일 사용량 데이터
    const dailyUsage = this.calculateDailyUsage(batch.keys);
    const recentUsage = dailyUsage.slice(-14); // 최근 14일

    if (recentUsage.length < 7) {
      // 데이터가 부족하면 평균 사용량 기반 예측
      const avgDailyUsage =
        recentUsage.reduce((sum, d) => sum + d.count, 0) / recentUsage.length || 0;
      return Math.round(avgDailyUsage * days);
    }

    // 선형 회귀를 사용한 예측
    const n = recentUsage.length;
    const sumX = recentUsage.reduce((sum, _, i) => sum + i, 0);
    const sumY = recentUsage.reduce((sum, d) => sum + d.count, 0);
    const sumXY = recentUsage.reduce((sum, d, i) => sum + i * d.count, 0);
    const sumX2 = recentUsage.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 미래 예측
    const futureDays = Array.from({ length: days }, (_, i) => n + i);
    const predictedUsage = futureDays.reduce(
      (sum, x) => sum + Math.max(0, slope * x + intercept),
      0,
    );

    return Math.round(predictedUsage);
  }

  /**
   * 사용량 대시보드 (강화된 버전)
   */
  async getDashboard(userId: string) {
    try {
      const [totalKeys, activeKeys, totalUsage, recentBatches, expiringBatches, expiredBatches] =
        await Promise.all([
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
            keys: {
              select: {
                usageCount: true,
                isActive: true,
                validUntil: true,
              },
            },
          },
        }),
        this.prisma.licenseKeyBatch.findMany({
          where: {
            createdBy: userId,
            validUntil: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 이내 만료
            },
          },
          orderBy: { validUntil: 'asc' },
          take: 5,
        }),
        this.prisma.licenseKeyBatch.findMany({
          where: {
            createdBy: userId,
            validUntil: {
              lt: new Date(),
            },
          },
          orderBy: { validUntil: 'desc' },
          take: 5,
        }),
      ]);

    // 배치별 통계 계산
    const batchStats = recentBatches.map((batch) => {
      const keys = batch.keys || [];
      const totalKeys = keys.length;
      const usedKeys = keys.filter((k) => k.usageCount > 0).length;
      const activeKeys = keys.filter((k) => k.isActive).length;
      const totalUsage = keys.reduce((sum, k) => sum + (k.usageCount || 0), 0);

      return {
        id: batch.id,
        name: batch.name,
        count: batch.count,
        keyType: batch.keyType,
        createdAt: batch.createdAt,
        keyCount: batch._count.keys,
        stats: {
          totalKeys,
          usedKeys,
          activeKeys,
          totalUsage,
          usageRate: totalKeys > 0 ? (usedKeys / totalKeys) * 100 : 0,
        },
      };
    });

    return {
      overview: {
        totalKeys,
        activeKeys,
        inactiveKeys: totalKeys - activeKeys,
        totalUsage: totalUsage._sum.usageCount || 0,
        expiringBatchesCount: expiringBatches.length,
        expiredBatchesCount: expiredBatches.length,
      },
      recentBatches: batchStats,
      expiringBatches: expiringBatches.map((batch) => ({
        id: batch.id,
        name: batch.name,
        validUntil: batch.validUntil,
        daysUntilExpiry: batch.validUntil
          ? Math.ceil(
              (batch.validUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
            )
          : null,
      })),
      expiredBatches: expiredBatches.map((batch) => ({
        id: batch.id,
        name: batch.name,
        validUntil: batch.validUntil,
        daysSinceExpiry: batch.validUntil
          ? Math.ceil(
              (Date.now() - batch.validUntil.getTime()) / (24 * 60 * 60 * 1000),
            )
          : null,
      })),
    };
    } catch (error: any) {
      console.error('[LicenseKeyService.getDashboard] 에러:', {
        message: error?.message,
        stack: error?.stack,
        userId,
      });
      // 에러 발생 시 기본값 반환
      return {
        overview: {
          totalKeys: 0,
          activeKeys: 0,
          inactiveKeys: 0,
          totalUsage: 0,
          expiringBatchesCount: 0,
          expiredBatchesCount: 0,
        },
        recentBatches: [],
        expiringBatches: [],
        expiredBatches: [],
      };
    }
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

