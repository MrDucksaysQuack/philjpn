import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY_MS = 5000; // 5초

  constructor() {
    // ✅ Connection Pooling (PgBouncer) 호환을 위한 DATABASE_URL 정규화
    let dbUrl = process.env.DATABASE_URL || '';
    const isPgBouncer = dbUrl.includes('pooler.supabase.com') || dbUrl.includes(':6543');
    
    if (isPgBouncer) {
      try {
        // URL 파싱 및 파라미터 추가
        const urlObj = new URL(dbUrl);
        
        // PgBouncer 호환 설정 추가
        // Prisma가 prepared statements를 사용하지 않도록 함
        urlObj.searchParams.set('pgbouncer', 'true');
        urlObj.searchParams.set('connection_limit', '1');
        urlObj.searchParams.set('connect_timeout', '10');
        
        dbUrl = urlObj.toString();
        this.logger.log('🔧 PgBouncer 호환 모드 활성화됨');
      } catch (error) {
        // URL 파싱 실패 시 원본 사용
        this.logger.warn('⚠️ DATABASE_URL 파싱 실패, 원본 URL 사용', error);
      }
    }

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    // 🔍 DATABASE_URL 확인
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
      this.logger.log(`🔍 DATABASE_URL: ${safeUrl}`);
      this.logger.log(`🔍 포트: ${dbUrl.match(/:(6543|5432)\//)?.[1] || '알 수 없음'}`);
      this.logger.log(`🔍 호스트: ${dbUrl.match(/@([^:]+)/)?.[1] || '알 수 없음'}`);
    } else {
      this.logger.error('❌ DATABASE_URL 환경 변수가 없습니다!');
    }
    
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
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.warn('Error closing database connection', error);
    }
  }

  // ✅ Prepared Statement 에러 발생 시 연결 재시도 헬퍼
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3,
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        const isPreparedStatementError = 
          error?.message?.includes('prepared statement') ||
          error?.code === '42P05' || // prepared statement already exists
          error?.code === '26000';   // prepared statement does not exist
        
        const isConnectionError =
          error?.code === 'P1017' || // Server has closed the connection
          error?.message?.includes('Server has closed');

        if ((isPreparedStatementError || isConnectionError) && i < retries - 1) {
          this.logger.warn(
            `⚠️ Database error (attempt ${i + 1}/${retries}), 재연결 시도...`,
            error?.code || error?.message,
          );
          
          // 연결 재설정
          try {
            await this.$disconnect();
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await this.$connect();
          } catch (reconnectError) {
            this.logger.warn('재연결 실패, 계속 시도...', reconnectError);
          }
          
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries reached');
  }
}

