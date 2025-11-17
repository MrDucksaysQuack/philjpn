import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';
import { NotificationService } from '../../common/services/notification.service';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private configService: ConfigService,
  ) {}

  /**
   * 연락처 폼 제출 처리
   */
  async submitContact(dto: SubmitContactDto): Promise<{ success: boolean; message: string }> {
    try {
      // AuditLog에 기록 (선택사항)
      // 현재는 알림만 전송

      // 관리자에게 이메일 알림 전송
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.notificationService.sendNotification(adminEmail, {
          type: 'contact_form',
          title: `새로운 문의: ${dto.subject}`,
          message: `이름: ${dto.name}\n이메일: ${dto.email}\n\n${dto.message}`,
          priority: 'medium',
          metadata: {
            name: dto.name,
            email: dto.email,
            subject: dto.subject,
            message: dto.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 사용자에게 확인 이메일 전송 (선택사항)
      await this.notificationService.sendNotification(dto.email, {
        type: 'contact_form_confirmation',
        title: '문의가 접수되었습니다',
        message: `안녕하세요 ${dto.name}님,\n\n문의해주신 내용이 성공적으로 접수되었습니다.\n빠른 시일 내에 답변드리겠습니다.\n\n감사합니다.`,
        priority: 'low',
        metadata: {
          subject: dto.subject,
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.log(`Contact form submitted: ${dto.email} - ${dto.subject}`);

      return {
        success: true,
        message: '문의가 성공적으로 접수되었습니다.',
      };
    } catch (error) {
      this.logger.error('Failed to submit contact form:', error);
      throw error;
    }
  }
}

