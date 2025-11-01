import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './analysis/report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@Controller('api')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('results/:id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 결과 리포트' })
  @ApiResponse({ status: 200, description: '시험 결과 리포트 조회 성공' })
  @ApiResponse({ status: 404, description: '시험 결과를 찾을 수 없음' })
  generateReport(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportService.generateReport(id, user.id);
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
}

