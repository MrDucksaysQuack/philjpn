import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/utils/prisma.service';
import { NotificationService } from '../../../common/services/notification.service';

@Injectable()
export class ExpirationNotificationService {
  private readonly logger = new Logger(ExpirationNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * 매일 오전 9시에 만료 예정 배치 확인 및 알림
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringBatches() {
    this.logger.log('만료 예정 배치 확인 시작...');

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 7일 이내 만료 예정 배치
    const expiringBatches = await this.prisma.licenseKeyBatch.findMany({
      where: {
        validUntil: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
      include: {
        issuer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: { keys: true },
        },
      },
    });

    // 내일 만료 예정 배치
    const expiringTomorrow = expiringBatches.filter(
      (batch) =>
        batch.validUntil &&
        batch.validUntil >= tomorrow &&
        batch.validUntil < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
    );

    // 알림 전송 (실제로는 이메일이나 푸시 알림을 보내야 함)
    for (const batch of expiringBatches) {
      const daysUntilExpiry = batch.validUntil
        ? Math.ceil((batch.validUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;

      this.logger.warn(
        `배치 "${batch.name}" (ID: ${batch.id})가 ${daysUntilExpiry}일 후 만료됩니다.`,
      );

      // 알림 전송
      if (batch.issuer.email && daysUntilExpiry !== null) {
        await this.notificationService.sendBatchExpirationNotification(
          batch.issuer.email,
          batch.name,
          daysUntilExpiry,
          batch._count.keys,
        );
      }
    }

    // 내일 만료 예정 배치에 대한 긴급 알림
    for (const batch of expiringTomorrow) {
      this.logger.error(
        `[긴급] 배치 "${batch.name}" (ID: ${batch.id})가 내일 만료됩니다!`,
      );

      // 긴급 알림 전송
      if (batch.issuer.email) {
        await this.notificationService.sendUrgentExpirationNotification(
          batch.issuer.email,
          batch.name,
          batch._count.keys,
        );
      }
    }

    this.logger.log(
      `만료 예정 배치 확인 완료: ${expiringBatches.length}개 배치, ${expiringTomorrow.length}개 긴급`,
    );
  }

  /**
   * 매일 자정에 만료된 배치 확인 및 비활성화
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deactivateExpiredBatches() {
    this.logger.log('만료된 배치 비활성화 시작...');

    const expiredBatches = await this.prisma.licenseKeyBatch.findMany({
      where: {
        validUntil: {
          lt: new Date(),
        },
      },
      include: {
        keys: true,
      },
    });

    for (const batch of expiredBatches) {
      // 배치의 모든 키 비활성화
      await this.prisma.licenseKey.updateMany({
        where: {
          batchId: batch.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      this.logger.warn(
        `배치 "${batch.name}" (ID: ${batch.id})의 ${batch.keys.length}개 키가 비활성화되었습니다.`,
      );
    }

    this.logger.log(`만료된 배치 비활성화 완료: ${expiredBatches.length}개 배치`);
  }

  /**
   * 수동으로 만료 알림 전송
   */
  async sendExpirationNotification(batchId: string) {
    const batch = await this.prisma.licenseKeyBatch.findUnique({
      where: { id: batchId },
      include: {
        issuer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: { keys: true },
        },
      },
    });

    if (!batch) {
      throw new Error(`배치를 찾을 수 없습니다. ID: ${batchId}`);
    }

    if (!batch.validUntil || batch.validUntil < new Date()) {
      throw new Error('이미 만료된 배치입니다.');
    }

    const daysUntilExpiry = Math.ceil(
      (batch.validUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );

    this.logger.log(
      `만료 알림 전송: 배치 "${batch.name}" (${daysUntilExpiry}일 후 만료)`,
    );

    // 알림 전송
    if (batch.issuer.email) {
      await this.notificationService.sendBatchExpirationNotification(
        batch.issuer.email,
        batch.name,
        daysUntilExpiry,
        batch._count.keys,
      );
    }

    return {
      success: true,
      message: `만료 알림이 전송되었습니다. (${daysUntilExpiry}일 후 만료)`,
    };
  }
}
