import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { StartExamDto } from './dto/start-exam.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { MoveSectionDto } from './dto/move-section.dto';
import { SubmitQuestionDto } from './dto/submit-question.dto';
import { GetNextQuestionDto } from './dto/get-next-question.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { LicenseKeyGuard } from '../../license/guards/license-key.guard';

@ApiTags('Exam Sessions')
@Controller('api')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('exams/:examId/start')
  @UseGuards(JwtAuthGuard, LicenseKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 시작 (License Key 필수)' })
  @ApiResponse({ status: 201, description: '시험 시작 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '유효하지 않은 라이선스 키' })
  @HttpCode(HttpStatus.CREATED)
  startExam(
    @Param('examId') examId: string,
    @Body() dto: StartExamDto,
    @CurrentUser() user: any,
    @Req() req: any, // LicenseKeyGuard가 request.licenseKey에 추가
  ) {
    const licenseKeyId = req.licenseKey?.id;
    return this.sessionService.startExam(examId, user.id, dto, licenseKeyId);
  }

  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '세션 상태 조회' })
  @ApiResponse({ status: 200, description: '세션 상태 조회 성공' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  getSession(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.sessionService.getSession(sessionId, user.id);
  }

  @Put('sessions/:sessionId/answers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '답안 저장' })
  @ApiResponse({ status: 200, description: '답안 저장 성공' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  saveAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SaveAnswerDto,
    @CurrentUser() user: any,
  ) {
    return this.sessionService.saveAnswer(sessionId, user.id, dto);
  }

  @Put('sessions/:sessionId/sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '섹션 이동' })
  @ApiResponse({ status: 200, description: '섹션 이동 성공' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  moveSection(
    @Param('sessionId') sessionId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: MoveSectionDto,
    @CurrentUser() user: any,
  ) {
    return this.sessionService.moveSection(sessionId, sectionId, user.id, dto);
  }

  @Post('sessions/:sessionId/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 제출' })
  @ApiResponse({ status: 200, description: '시험 제출 성공' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  submitExam(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.sessionService.submitExam(sessionId, user.id);
  }

  @Post('sessions/:sessionId/submit-question')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문제별 피드백 (실시간 피드백)' })
  @ApiResponse({ status: 200, description: '피드백 조회 성공' })
  @ApiResponse({ status: 404, description: '세션 또는 문제를 찾을 수 없음' })
  submitQuestion(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.sessionService.submitQuestion(
      sessionId,
      dto.questionId,
      user.id,
      dto,
    );
  }

  // ==================== 적응형 시험 ====================

  @Get('sessions/:sessionId/next-question')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '적응형 시험: 다음 문제 가져오기' })
  @ApiResponse({ status: 200, description: '다음 문제 조회 성공' })
  @ApiResponse({ status: 400, description: '적응형 시험이 아님' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  getNextQuestion(
    @Param('sessionId') sessionId: string,
    @Query() dto: GetNextQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.sessionService.getNextQuestion(sessionId, user.id, dto);
  }
}

