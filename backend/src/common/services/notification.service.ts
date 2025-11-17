import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<string>('NOTIFICATIONS_ENABLED', 'true') === 'true';
  }

  /**
   * 알림 전송 (이메일, 푸시, 웹훅 등)
   */
  async sendNotification(
    recipient: string,
    payload: NotificationPayload,
  ): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(`Notifications disabled, skipping: ${payload.title}`);
      return false;
    }

    try {
      this.logger.log(
        `Sending notification to ${recipient}: ${payload.title} (${payload.type})`,
      );

      // TODO: 실제 알림 전송 로직
      // - 이메일: nodemailer, sendgrid 등
      // - 푸시: FCM, OneSignal 등
      // - 웹훅: HTTP POST 요청
      // - SMS: Twilio 등

      // 현재는 로깅만 수행
      this.logger.log(`Notification sent: ${JSON.stringify(payload)}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 배치 만료 알림
   */
  async sendBatchExpirationNotification(
    email: string,
    batchName: string,
    daysUntilExpiry: number,
    keyCount: number,
  ): Promise<boolean> {
    return this.sendNotification(email, {
      type: 'batch_expiration',
      title: `배치 만료 예정: ${batchName}`,
      message: `${batchName} 배치가 ${daysUntilExpiry}일 후 만료됩니다. (${keyCount}개 키)`,
      priority: daysUntilExpiry <= 1 ? 'urgent' : daysUntilExpiry <= 7 ? 'high' : 'medium',
      metadata: {
        batchName,
        daysUntilExpiry,
        keyCount,
      },
    });
  }

  /**
   * 긴급 알림 (내일 만료)
   */
  async sendUrgentExpirationNotification(
    email: string,
    batchName: string,
    keyCount: number,
  ): Promise<boolean> {
    return this.sendNotification(email, {
      type: 'batch_expiration_urgent',
      title: `[긴급] 배치 만료: ${batchName}`,
      message: `${batchName} 배치가 내일 만료됩니다! 즉시 조치가 필요합니다. (${keyCount}개 키)`,
      priority: 'urgent',
      metadata: {
        batchName,
        keyCount,
      },
    });
  }

  /**
   * 시스템 에러 알림
   */
  async sendSystemErrorNotification(
    error: Error,
    context?: string,
  ): Promise<boolean> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      this.logger.warn('ADMIN_EMAIL not configured, skipping error notification');
      return false;
    }

    return this.sendNotification(adminEmail, {
      type: 'system_error',
      title: `시스템 에러 발생: ${error.name}`,
      message: `${context || 'Unknown context'}: ${error.message}`,
      priority: 'high',
      metadata: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * 사용량 임계값 알림
   */
  async sendUsageThresholdNotification(
    email: string,
    batchName: string,
    usageRate: number,
    threshold: number = 80,
  ): Promise<boolean> {
    return this.sendNotification(email, {
      type: 'usage_threshold',
      title: `배치 사용량 임계값 도달: ${batchName}`,
      message: `${batchName} 배치의 사용률이 ${usageRate.toFixed(1)}%에 도달했습니다. (임계값: ${threshold}%)`,
      priority: usageRate >= 95 ? 'urgent' : 'medium',
      metadata: {
        batchName,
        usageRate,
        threshold,
      },
    });
  }
}

