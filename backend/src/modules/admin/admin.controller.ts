import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './services/admin.service';
import { TemplateService } from './services/template.service';
import { QuestionPoolService } from './services/question-pool.service';
import { AdminUserQueryDto } from './dto/user-query.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminExamResultQueryDto } from './dto/exam-result-query.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/types';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly templateService: TemplateService,
    private readonly questionPoolService: QuestionPoolService,
  ) {}

  // ==================== 사용자 관리 ====================

  @Get('users')
  @ApiOperation({ summary: '사용자 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '사용자 상세 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '사용자 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '사용자 정보 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '사용자 정보 수정 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  updateUser(@Param('id') id: string, @Body() updateDto: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, updateDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '사용자 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '사용자 삭제 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('users/:id/exam-results')
  @ApiOperation({ summary: '사용자의 시험 결과 목록 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 결과 목록 조회 성공' })
  getUserExamResults(@Param('id') id: string) {
    return this.adminService.getUserExamResults(id);
  }

  @Get('users/:id/learning-pattern')
  @ApiOperation({ summary: '사용자 학습 패턴 분석 (Admin Only)' })
  @ApiResponse({ status: 200, description: '학습 패턴 분석 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  getUserLearningPattern(@Param('id') id: string) {
    return this.adminService.getUserLearningPattern(id);
  }

  // ==================== 시험 관리 ====================

  @Get('exams/statistics')
  @ApiOperation({ summary: '시험 통계 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 통계 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getExamStatistics() {
    try {
      return await this.adminService.getExamStatistics();
    } catch (error: any) {
      this.logger.error('❌ getExamStatistics 에러:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      throw error;
    }
  }

  @Get('exams/:id/analytics')
  @ApiOperation({ summary: '시험별 상세 분석 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 분석 조회 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  getExamAnalytics(@Param('id') id: string) {
    return this.adminService.getExamAnalytics(id);
  }

  // ==================== 결과 모니터링 ====================

  @Get('exam-results')
  @ApiOperation({ summary: '전체 시험 결과 목록 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 결과 목록 조회 성공' })
  getExamResults(@Query() query: AdminExamResultQueryDto) {
    return this.adminService.getExamResults(query);
  }

  // ==================== 라이선스 키 관리 ====================

  @Get('license-keys/statistics')
  @ApiOperation({ summary: '라이선스 키 통계 (Admin Only)' })
  @ApiResponse({ status: 200, description: '라이선스 키 통계 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getLicenseKeyStatistics() {
    try {
      return await this.adminService.getLicenseKeyStatistics();
    } catch (error: any) {
      this.logger.error('❌ getLicenseKeyStatistics 에러:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      throw error;
    }
  }

  // ==================== 대시보드 ====================

  @Get('dashboard')
  @ApiOperation({ summary: '관리자 대시보드 데이터 (Admin Only)' })
  @ApiResponse({ status: 200, description: '대시보드 데이터 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getDashboard() {
    try {
      return await this.adminService.getDashboardData();
    } catch (error: any) {
      this.logger.error('❌ getDashboardData 에러:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      throw error;
    }
  }

  // ==================== 템플릿 관리 ====================

  @Post('templates')
  @ApiOperation({ summary: '시험 템플릿 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '템플릿 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: any) {
    return this.templateService.createTemplate(user.id, dto);
  }

  @Get('templates')
  @ApiOperation({ summary: '시험 템플릿 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 목록 조회 성공' })
  getTemplates(@CurrentUser() user: any) {
    return this.templateService.getTemplates(user.id);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '시험 템플릿 상세 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 조회 성공' })
  @ApiResponse({ status: 404, description: '템플릿을 찾을 수 없음' })
  getTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templateService.getTemplate(id, user.id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '시험 템플릿 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 수정 성공' })
  @ApiResponse({ status: 404, description: '템플릿을 찾을 수 없음' })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
    @CurrentUser() user: any,
  ) {
    return this.templateService.updateTemplate(id, user.id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '시험 템플릿 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 삭제 성공' })
  @ApiResponse({ status: 404, description: '템플릿을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  deleteTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templateService.deleteTemplate(id, user.id);
  }

  @Post('exams/from-template')
  @ApiOperation({ summary: '템플릿으로부터 시험 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '시험 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  createExamFromTemplate(
    @Body() body: {
      templateId: string;
      title: string;
      description?: string;
      examType: string;
      subject?: string;
      overrides?: {
        questionCount?: number;
        structure?: any;
      };
    },
    @CurrentUser() user: any,
  ) {
    return this.templateService.createExamFromTemplate(
      body.templateId,
      user.id,
      body,
    );
  }

  // ==================== 문제 풀 관리 ====================

  @Post('question-pools')
  @ApiOperation({ summary: '문제 풀 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '문제 풀 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  createQuestionPool(@Body() dto: any, @CurrentUser() user: any) {
    return this.questionPoolService.createQuestionPool(user.id, dto);
  }

  @Get('question-pools')
  @ApiOperation({ summary: '문제 풀 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 목록 조회 성공' })
  getQuestionPools(@CurrentUser() user: any) {
    return this.questionPoolService.getQuestionPools(user.id);
  }

  @Get('question-pools/:id')
  @ApiOperation({ summary: '문제 풀 상세 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 조회 성공' })
  @ApiResponse({ status: 404, description: '문제 풀을 찾을 수 없음' })
  getQuestionPool(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionPoolService.getQuestionPool(id, user.id);
  }

  @Put('question-pools/:id')
  @ApiOperation({ summary: '문제 풀 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 수정 성공' })
  @ApiResponse({ status: 404, description: '문제 풀을 찾을 수 없음' })
  updateQuestionPool(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.questionPoolService.updateQuestionPool(id, user.id, dto);
  }

  @Delete('question-pools/:id')
  @ApiOperation({ summary: '문제 풀 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 삭제 성공' })
  @ApiResponse({ status: 404, description: '문제 풀을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  deleteQuestionPool(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionPoolService.deleteQuestionPool(id, user.id);
  }
}

