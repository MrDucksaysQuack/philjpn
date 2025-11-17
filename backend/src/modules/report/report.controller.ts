import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportService } from './analysis/report.service';
import { GoalService } from './services/goal.service';
import { RecommendationService } from './services/recommendation.service';
import { LearningCycleService } from './services/learning-cycle.service';
import { BadgeService } from './services/badge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateGoalDto } from './dto/goal.dto';

@ApiTags('Reports')
@Controller('api')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly goalService: GoalService,
    private readonly recommendationService: RecommendationService,
    private readonly learningCycleService: LearningCycleService,
    private readonly badgeService: BadgeService,
  ) {}

  @Get('results/:id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 결과 리포트' })
  @ApiResponse({ status: 200, description: '시험 결과 리포트 조회 성공' })
  @ApiResponse({ status: 404, description: '시험 결과를 찾을 수 없음' })
  generateReport(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportService.generateReport(id, user.id);
  }

  @Get('results/:id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '다층적 피드백 조회' })
  @ApiResponse({ status: 200, description: '상세 피드백 조회 성공' })
  @ApiResponse({ status: 404, description: '시험 결과를 찾을 수 없음' })
  getDetailedFeedback(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportService.generateDetailedFeedback(id, user.id);
  }

  @Get('users/me/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 통계 조회' })
  @ApiResponse({ status: 200, description: '사용자 통계 조회 성공' })
  getUserStatistics(
    @Query('examId') examId?: string,
    @Query('period') period?: string,
    @CurrentUser() user?: any,
  ) {
    return this.reportService.getUserStatistics(user.id, examId, period);
  }

  @Get('users/me/learning-patterns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '학습 패턴 분석' })
  @ApiResponse({ status: 200, description: '학습 패턴 분석 조회 성공' })
  getLearningPatterns(@CurrentUser() user: any) {
    return this.reportService.getLearningPatterns(user.id);
  }

  @Get('users/me/weakness-analysis')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '약점 심층 분석' })
  @ApiResponse({ status: 200, description: '약점 심층 분석 조회 성공' })
  getWeaknessAnalysis(@CurrentUser() user: any) {
    return this.reportService.getWeaknessAnalysis(user.id);
  }

  @Get('users/me/efficiency-metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '학습 효율성 지표' })
  @ApiResponse({ status: 200, description: '학습 효율성 지표 조회 성공' })
  getEfficiencyMetrics(@CurrentUser() user: any) {
    return this.reportService.getEfficiencyMetrics(user.id);
  }

  // 목표 관리 API
  @Post('users/me/goals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '목표 생성' })
  @ApiResponse({ status: 201, description: '목표 생성 성공' })
  createGoal(@CurrentUser() user: any, @Body() createGoalDto: CreateGoalDto) {
    return this.goalService.createGoal(user.id, createGoalDto);
  }

  @Get('users/me/goals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '목표 목록 조회' })
  @ApiResponse({ status: 200, description: '목표 목록 조회 성공' })
  getGoals(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.goalService.getGoals(user.id, status);
  }

  @Get('users/me/goals/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '목표 진행 상황 조회' })
  @ApiResponse({ status: 200, description: '목표 진행 상황 조회 성공' })
  getGoalProgress(@CurrentUser() user: any) {
    return this.goalService.getGoalProgress(user.id);
  }

  @Get('users/me/goals/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '목표 상세 조회' })
  @ApiResponse({ status: 200, description: '목표 상세 조회 성공' })
  getGoal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.goalService.getGoal(id, user.id);
  }

  @Put('users/me/goals/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '목표 업데이트' })
  @ApiResponse({ status: 200, description: '목표 업데이트 성공' })
  updateGoal(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateData: any,
  ) {
    return this.goalService.updateGoal(id, user.id, updateData);
  }

  @Delete('users/me/goals/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '목표 삭제' })
  @ApiResponse({ status: 200, description: '목표 삭제 성공' })
  deleteGoal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.goalService.deleteGoal(id, user.id);
  }

  // 적응형 학습 추천 API
  @Get('exams/recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '개인 맞춤형 시험 추천' })
  @ApiResponse({ status: 200, description: '시험 추천 조회 성공' })
  getRecommendedExams(@CurrentUser() user: any) {
    return this.recommendationService.getRecommendedExams(user.id);
  }

  @Get('exams/by-wordbook')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '단어장 기반 시험 추천' })
  @ApiResponse({ status: 200, description: '단어장 기반 시험 추천 조회 성공' })
  getExamsByWordbook(@CurrentUser() user: any) {
    return this.recommendationService.getExamsByWordbook(user.id);
  }

  // 학습 사이클 API
  @Get('users/me/learning-cycle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 학습 사이클 조회' })
  @ApiResponse({ status: 200, description: '학습 사이클 조회 성공' })
  getLearningCycle(@CurrentUser() user: any) {
    return this.learningCycleService.getCurrentCycle(user.id);
  }

  @Put('users/me/learning-cycle/stage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '학습 사이클 단계 업데이트' })
  @ApiResponse({ status: 200, description: '단계 업데이트 성공' })
  updateCycleStage(
    @CurrentUser() user: any,
    @Body() body: { stage: string },
  ) {
    return this.learningCycleService.updateCycleStage(user.id, body.stage);
  }

  @Post('users/me/learning-cycle/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '학습 사이클 완료' })
  @ApiResponse({ status: 200, description: '사이클 완료 성공' })
  completeCycle(@CurrentUser() user: any) {
    return this.learningCycleService.completeCycle(user.id);
  }

  // 배지 API
  @Get('users/me/badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 배지 목록 조회' })
  @ApiResponse({ status: 200, description: '배지 목록 조회 성공' })
  getUserBadges(@CurrentUser() user: any) {
    return this.badgeService.getUserBadges(user.id);
  }

  @Get('badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '전체 배지 목록 조회 (활성 배지만)' })
  @ApiResponse({ status: 200, description: '배지 목록 조회 성공' })
  getAllBadges() {
    return this.badgeService.getAllBadges(false);
  }
}

