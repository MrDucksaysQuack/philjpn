import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AIAnalysisService } from './services/ai-analysis.service';
import { AIQueueService } from './services/ai-queue.service';
import { GenerateExplanationDto } from './dto/generate-explanation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/types';

@ApiTags('AI Analysis')
@Controller('api/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.USER)
@ApiBearerAuth()
export class AIController {
  constructor(
    private readonly aiAnalysisService: AIAnalysisService,
    private readonly aiQueueService: AIQueueService,
  ) {}

  // ==================== 동기 처리 (즉시 응답) ====================

  @Post('explanation')
  @ApiOperation({ summary: 'AI 기반 문제 해설 생성 (동기)' })
  @ApiResponse({ status: 200, description: '해설 생성 성공' })
  @ApiResponse({ status: 404, description: '문제를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async generateExplanation(@Body() dto: GenerateExplanationDto) {
    const explanation = await this.aiAnalysisService.generateExplanation(
      dto.questionId,
      dto.userAnswer,
      dto.isCorrect,
    );
    return {
      explanation,
      questionId: dto.questionId,
      generatedAt: new Date(),
    };
  }

  // ==================== 비동기 처리 (큐 사용) ====================

  @Post('explanation-async')
  @ApiOperation({ summary: 'AI 기반 문제 해설 생성 (비동기)' })
  @ApiResponse({ status: 202, description: '작업이 큐에 추가됨' })
  @HttpCode(HttpStatus.ACCEPTED)
  async generateExplanationAsync(
    @Body() dto: GenerateExplanationDto & { questionResultId?: string },
    @CurrentUser() user: any,
  ) {
    const job = await this.aiQueueService.enqueueExplanation(
      dto.questionId,
      dto.userAnswer,
      dto.isCorrect,
      dto.questionResultId,
    );
    return {
      jobId: job.id,
      status: 'queued',
      message: '해설 생성 작업이 큐에 추가되었습니다.',
    };
  }

  @Post('diagnose-weakness-async/:examResultId')
  @ApiOperation({ summary: '약점 진단 (비동기)' })
  @ApiParam({ name: 'examResultId', description: '시험 결과 ID' })
  @ApiResponse({ status: 202, description: '작업이 큐에 추가됨' })
  @HttpCode(HttpStatus.ACCEPTED)
  async diagnoseWeaknessAsync(
    @Param('examResultId') examResultId: string,
    @CurrentUser() user: any,
  ) {
    const job = await this.aiQueueService.enqueueWeaknessDiagnosis(examResultId);
    return {
      jobId: job.id,
      status: 'queued',
      message: '약점 진단 작업이 큐에 추가되었습니다.',
    };
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: '작업 상태 조회' })
  @ApiParam({ name: 'jobId', description: '작업 ID' })
  @ApiResponse({ status: 200, description: '작업 상태 조회 성공' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.aiQueueService.getJobStatus(jobId);
    if (!status) {
      return { error: '작업을 찾을 수 없습니다.' };
    }
    return status;
  }

  @Get('queue/stats')
  @ApiOperation({ summary: '큐 통계 조회' })
  @ApiResponse({ status: 200, description: '큐 통계 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getQueueStats(@Req() request: Request, @Res() response: Response) {
    // CORS 헤더 설정
    const origin = request.headers.origin as string | undefined;
    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-License-Key');
    }
    
    try {
      const stats = await this.aiQueueService.getQueueStats();
      return response.status(HttpStatus.OK).json(stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      const context = '[getQueueStats]';
      
      // Winston + console + stderr 병행 (Railway 환경 대응)
      console.error(`${context}`, {
        code: errorCode,
        msg: errorMessage,
        stack: errorStack,
        time: new Date().toISOString(),
      });
      // Railway가 인식할 수 있도록 stderr에 직접 출력
      process.stderr.write(
        `[ERROR] ${context} ${errorMessage}\n` +
        `Code: ${errorCode || 'N/A'}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `Stack: ${errorStack || 'N/A'}\n\n`,
      );
      
      // 큐가 초기화되지 않은 경우 기본값 반환
      return response.status(HttpStatus.OK).json({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      });
    }
  }

  // ==================== 약점 진단 (동기) ====================

  @Post('diagnose-weakness/:examResultId')
  @ApiOperation({ summary: '약점 진단 (동기)' })
  @ApiParam({ name: 'examResultId', description: '시험 결과 ID' })
  @ApiResponse({ status: 200, description: '약점 진단 성공' })
  @ApiResponse({ status: 404, description: '시험 결과를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async diagnoseWeakness(
    @Param('examResultId') examResultId: string,
    @CurrentUser() user: any,
  ) {
    const diagnosis = await this.aiAnalysisService.diagnoseWeakness(examResultId);
    return diagnosis;
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'AI 기능 활성화 확인' })
  @ApiResponse({ status: 200, description: 'AI 기능 상태' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @HttpCode(HttpStatus.OK)
  async checkAvailability() {
    try {
      const isAvailable = this.aiAnalysisService.isAvailable();
      return {
        available: isAvailable,
        message: isAvailable
          ? 'AI 분석 기능이 활성화되어 있습니다.'
          : 'AI 분석 기능이 비활성화되어 있습니다. OPENAI_API_KEY를 설정해주세요.',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      const context = '[checkAvailability]';
      
      // Winston + console + stderr 병행 (Railway 환경 대응)
      console.error(`${context}`, {
        code: errorCode,
        msg: errorMessage,
        stack: errorStack,
        time: new Date().toISOString(),
      });
      // Railway가 인식할 수 있도록 stderr에 직접 출력
      process.stderr.write(
        `[ERROR] ${context} ${errorMessage}\n` +
        `Code: ${errorCode || 'N/A'}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `Stack: ${errorStack || 'N/A'}\n\n`,
      );
      
      return {
        available: false,
        message: 'AI 기능 상태를 확인할 수 없습니다.',
      };
    }
  }
}
