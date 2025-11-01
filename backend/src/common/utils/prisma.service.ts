import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY_MS = 5000; // 5초

  async onModuleInit() {
    // 재시도 로직: Railway cold start나 일시적인 연결 실패 대응
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        await this.$connect();
        this.logger.log('✅ Database connection established');
        return;
      } catch (error) {
        const attempt = i + 1;
        this.logger.warn(
          `⚠️ Database connection failed (attempt ${attempt}/${this.MAX_RETRIES})`,
        );

        // 마지막 시도인 경우
        if (i === this.MAX_RETRIES - 1) {
          this.logger.error('❌ Could not connect to database after all retries', error);
          
          // 프로덕션에서는 연결 실패 시 앱 크래시 방지
          if (process.env.NODE_ENV === 'production') {
            this.logger.warn('Continuing without database connection (will retry on first query)');
            return;
          } else {
            throw error;
          }
        }

        // 다음 시도 전 대기
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}

