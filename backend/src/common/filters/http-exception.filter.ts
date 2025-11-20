import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const origin = request.headers.origin;
    const url = request.url;

    // CORS 헤더 설정 (에러 응답에도 필수)
    if (origin) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Credentials', 'true');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-License-Key');
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // 특정 admin/AI 엔드포인트에 대해 기본값 반환 (500 에러 방지)
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      if (url.includes('/api/admin/dashboard')) {
        this.logger.error(`[getDashboard] 에러 발생, 기본값 반환: ${exception instanceof Error ? exception.message : String(exception)}`);
        return response.status(200).json({
          summary: {
            totalUsers: 0,
            activeUsers: 0,
            totalExams: 0,
            totalAttempts: 0,
          },
          recentActivity: [],
          chartData: {
            dailyAttempts: [],
          },
        });
      }
      
      if (url.includes('/api/admin/exams/statistics')) {
        this.logger.error(`[getExamStatistics] 에러 발생, 기본값 반환: ${exception instanceof Error ? exception.message : String(exception)}`);
        return response.status(200).json({
          totalExams: 0,
          activeExams: 0,
          totalAttempts: 0,
          averageScore: 0,
          completionRate: 0,
        });
      }
      
      if (url.includes('/api/admin/license-keys/statistics')) {
        this.logger.error(`[getLicenseKeyStatistics] 에러 발생, 기본값 반환: ${exception instanceof Error ? exception.message : String(exception)}`);
        return response.status(200).json({
          totalKeys: 0,
          activeKeys: 0,
          totalUsage: 0,
          expiringSoon: 0,
        });
      }
      
      if (url.includes('/api/ai/queue/stats')) {
        this.logger.error(`[getQueueStats] 에러 발생, 기본값 반환: ${exception instanceof Error ? exception.message : String(exception)}`);
        return response.status(200).json({
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          total: 0,
        });
      }
      
      if (url.includes('/api/ai/check-availability')) {
        this.logger.error(`[checkAvailability] 에러 발생, 기본값 반환: ${exception instanceof Error ? exception.message : String(exception)}`);
        return response.status(200).json({
          available: false,
          message: 'AI 기능 상태를 확인할 수 없습니다.',
        });
      }
    }

    // 에러 로깅
    this.logger.error(`[${url}] ${status} 에러: ${exception instanceof Error ? exception.message : String(exception)}`, {
      stack: exception instanceof Error ? exception.stack : undefined,
      status,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: url,
      message: typeof message === 'string' ? message : (message as any).message || message,
    });
  }
}

