import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { UsageLogQueryDto } from '../dto/usage-log-query.dto';

@Injectable()
export class UsageLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * 라이선스 키 사용 로그 조회
   */
  async findUsageLogs(licenseKeyId: string, userId: string, role: string, query: UsageLogQueryDto) {
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

