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
    
    // super() 호출 전에 URL 처리만 수행
    if (isPgBouncer) {
      try {
        // URL 파싱 및 파라미터 추가
        const urlObj = new URL(dbUrl);
        
        // PgBouncer 호환 설정 추가
        // Prisma가 prepared statements를 사용하지 않도록 함
        urlObj.searchParams.set('pgbouncer', 'true');
        // connection_limit을 늘려서 동시 요청 처리 능력 향상
        // PgBouncer를 사용할 때는 연결 풀 크기를 적절히 설정해야 함
        urlObj.searchParams.set('connection_limit', '10');
        urlObj.searchParams.set('connect_timeout', '20');
        // Pool 타임아웃 증가 (초)
        urlObj.searchParams.set('pool_timeout', '20');
        
        dbUrl = urlObj.toString();
      } catch (error) {
        // URL 파싱 실패 시 원본 사용 (super() 호출 후 로깅)
        console.warn('⚠️ DATABASE_URL 파싱 실패, 원본 URL 사용', error);
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

    // super() 호출 후 로깅
    if (isPgBouncer) {
      this.logger.log('🔧 PgBouncer 호환 모드 활성화됨');
    }
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
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        const isPreparedStatementError = 
          error?.message?.includes('prepared statement') ||
          error?.code === '42P05' || // prepared statement already exists
          error?.code === '26000';   // prepared statement does not exist
        
        const isConnectionError =
          error?.code === 'P1017' || // Server has closed the connection
          error?.code === 'P1001' || // Can't reach database server
          error?.code === 'P2024' || // Timed out fetching a new connection from the connection pool
          error?.message?.includes('Server has closed') ||
          error?.message?.includes('Can\'t reach database') ||
          error?.message?.includes('Timed out fetching a new connection');

        // 재시도 가능한 에러인 경우
        if ((isPreparedStatementError || isConnectionError) && i < retries - 1) {
          this.logger.warn(
            `⚠️ Database error (attempt ${i + 1}/${retries}), 재연결 시도...`,
            {
              code: error?.code,
              message: error?.message?.substring(0, 100),
            },
          );
          
          // 연결 재설정
          try {
            await this.$disconnect().catch(() => {
              // 이미 연결 해제된 경우 무시
            });
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // 지수 백오프
            await this.$connect();
            this.logger.log(`✅ 재연결 성공 (attempt ${i + 1}/${retries})`);
          } catch (reconnectError: any) {
            this.logger.warn(
              `⚠️ 재연결 실패 (attempt ${i + 1}/${retries}), 계속 시도...`,
              {
                code: reconnectError?.code,
                message: reconnectError?.message?.substring(0, 100),
              },
            );
          }
          
          continue;
        }
        
        // 재시도 불가능한 에러 또는 마지막 시도
        this.logger.error(
          `❌ Database operation failed ${i < retries - 1 ? '(will retry)' : '(max retries reached)'}`,
          {
            code: error?.code,
            message: error?.message?.substring(0, 200),
            attempt: i + 1,
            maxRetries: retries,
          },
        );
        
        // 마지막 시도인 경우 에러 throw
        if (i === retries - 1) {
          throw error;
        }
      }
    }
    
    // 이 코드는 실행되지 않아야 하지만 TypeScript를 위해 추가
    throw lastError || new Error('Max retries reached');
  }
}

