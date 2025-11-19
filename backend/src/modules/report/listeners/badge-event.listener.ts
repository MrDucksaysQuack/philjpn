import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BadgeService } from '../services/badge.service';
import { ExamCompletedEvent } from '../events/exam-completed.event';
import { BadgeNotificationGateway } from '../gateway/badge-notification.gateway';

@Injectable()
export class BadgeEventListener {
  private readonly logger = new Logger(BadgeEventListener.name);

  constructor(
    private readonly badgeService: BadgeService,
    @Inject(forwardRef(() => BadgeNotificationGateway))
    private readonly badgeNotificationGateway: BadgeNotificationGateway,
  ) {}

  /**
   * 시험 완료 이벤트 처리
   * 배지 획득 조건을 확인하고 자동으로 배지를 부여합니다.
   */
  @OnEvent('exam.completed')
  async handleExamCompleted(event: ExamCompletedEvent) {
    this.logger.log(
      `Processing exam completed event: userId=${event.userId}, examResultId=${event.examResultId}`,
    );

    try {
      // 배지 확인 및 자동 부여
      const awardedBadgeIds = await this.badgeService.checkAndAwardBadges(
        event.userId,
        {
          examResultId: event.examResultId,
          examId: event.examId,
          score: event.score,
          categoryId: event.categoryId,
        },
      );

      if (awardedBadgeIds.length > 0) {
        this.logger.log(
          `User ${event.userId} earned ${awardedBadgeIds.length} badge(s): ${awardedBadgeIds.join(', ')}`,
        );

        // 배지 정보 조회 및 실시간 알림 전송
        const badges = await this.badgeService.getBadgesByIds(awardedBadgeIds);
        const badgeNotifications = badges.map((badge) => ({
          badgeId: badge.id,
          badgeName: badge.name,
          badgeIcon: badge.icon || undefined,
          badgeRarity: badge.rarity,
          earnedAt: new Date(),
        }));

        // 실시간 알림 전송
        if (badgeNotifications.length === 1) {
          this.badgeNotificationGateway.notifyBadgeEarned(
            event.userId,
            badgeNotifications[0],
          );
        } else if (badgeNotifications.length > 1) {
          this.badgeNotificationGateway.notifyBadgesEarned(
            event.userId,
            badgeNotifications,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing badge award for user ${event.userId}:`,
        error,
      );
      // 에러가 발생해도 시험 제출은 성공한 것으로 처리
    }
  }
}

