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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { AdminService } from './services/admin.service';
import { TemplateService } from './services/template.service';
import { QuestionPoolService } from './services/question-pool.service';
import { QuestionBankService } from './services/question-bank.service';
import { SiteSettingsService } from './services/site-settings.service';
import { ColorAnalysisService } from './services/color-analysis.service';
import { FileUploadService } from '../../common/services/file-upload.service';
import { BadgeService } from '../report/services/badge.service';
import { AdminUserQueryDto } from './dto/user-query.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminExamResultQueryDto } from './dto/exam-result-query.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { UploadFileResponseDto } from './dto/upload-file.dto';
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
    private readonly questionBankService: QuestionBankService,
    private readonly siteSettingsService: SiteSettingsService,
    private readonly colorAnalysisService: ColorAnalysisService,
    private readonly fileUploadService: FileUploadService,
    private readonly badgeService: BadgeService,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('❌ getExamStatistics 에러:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('❌ getLicenseKeyStatistics 에러:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('❌ getDashboardData 에러:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
      });
      throw error;
    }
  }

  // ==================== 템플릿 관리 ====================

  @Post('templates')
  @ApiOperation({ summary: '시험 템플릿 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '템플릿 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: { id: string }) {
    return this.templateService.createTemplate(user.id, dto);
  }

  @Get('templates')
  @ApiOperation({ summary: '시험 템플릿 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 목록 조회 성공' })
  getTemplates(@CurrentUser() user: { id: string }) {
    return this.templateService.getTemplates(user.id);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '시험 템플릿 상세 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 조회 성공' })
  @ApiResponse({ status: 404, description: '템플릿을 찾을 수 없음' })
  getTemplate(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.templateService.getTemplate(id, user.id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '시험 템플릿 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 수정 성공' })
  @ApiResponse({ status: 404, description: '템플릿을 찾을 수 없음' })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
    @CurrentUser() user: { id: string },
  ) {
    return this.templateService.updateTemplate(id, user.id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '시험 템플릿 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '템플릿 삭제 성공' })
  @ApiResponse({ status: 404, description: '템플릿을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  deleteTemplate(@Param('id') id: string, @CurrentUser() user: { id: string }) {
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
        structure?: Prisma.InputJsonValue;
        randomSeed?: number; // 랜덤 시드 (재현성 보장)
      };
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.templateService.createExamFromTemplate(
      body.templateId,
      user.id,
      body,
    );
  }

  // ==================== 문제 관리 ====================

  @Get('questions')
  @ApiOperation({ summary: '문제 목록 조회 (Admin Only, 검색 및 필터링 지원)' })
  @ApiResponse({ status: 200, description: '문제 목록 조회 성공' })
  getQuestions(
    @Query('search') search?: string,
    @Query('tags') tags?: string,
    @Query('difficulty') difficulty?: string,
    @Query('examId') examId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getQuestions({
      search,
      tags: tags ? tags.split(',') : undefined,
      difficulty: difficulty as any,
      examId,
      limit: limit ? parseInt(limit) : 100,
    });
  }

  // ==================== 문제 풀 관리 ====================

  @Post('question-pools')
  @ApiOperation({ summary: '문제 풀 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '문제 풀 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  createQuestionPool(@Body() dto: { name: string; description?: string; tags?: string[]; difficulty?: 'easy' | 'medium' | 'hard'; questionIds?: string[] }, @CurrentUser() user: { id: string }) {
    return this.questionPoolService.createQuestionPool(user.id, dto);
  }

  @Get('question-pools')
  @ApiOperation({ summary: '문제 풀 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 목록 조회 성공' })
  getQuestionPools(@CurrentUser() user: { id: string }) {
    return this.questionPoolService.getQuestionPools(user.id);
  }

  @Get('question-pools/:id')
  @ApiOperation({ summary: '문제 풀 상세 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 조회 성공' })
  @ApiResponse({ status: 404, description: '문제 풀을 찾을 수 없음' })
  getQuestionPool(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.questionPoolService.getQuestionPool(id, user.id);
  }

  @Put('question-pools/:id')
  @ApiOperation({ summary: '문제 풀 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 수정 성공' })
  @ApiResponse({ status: 404, description: '문제 풀을 찾을 수 없음' })
  updateQuestionPool(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; tags?: string[]; difficulty?: 'easy' | 'medium' | 'hard'; questionIds?: string[] },
    @CurrentUser() user: { id: string },
  ) {
    return this.questionPoolService.updateQuestionPool(id, user.id, dto);
  }

  @Delete('question-pools/:id')
  @ApiOperation({ summary: '문제 풀 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 풀 삭제 성공' })
  @ApiResponse({ status: 404, description: '문제 풀을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  deleteQuestionPool(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.questionPoolService.deleteQuestionPool(id, user.id);
  }

  // ==================== 사이트 설정 관리 ====================

  @Get('site-settings')
  @ApiOperation({ summary: '사이트 설정 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '사이트 설정 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getSiteSettings() {
    try {
      return { data: await this.siteSettingsService.getAdminSettings() };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('❌ getSiteSettings 에러:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
      });
      throw error;
    }
  }

  @Put('site-settings')
  @ApiOperation({ summary: '사이트 설정 업데이트 (Admin Only)' })
  @ApiResponse({ status: 200, description: '사이트 설정 업데이트 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @HttpCode(HttpStatus.OK)
  async updateSiteSettings(
    @Body() dto: UpdateSiteSettingsDto,
    @CurrentUser() user: { id: string },
  ) {
    try {
      return {
        data: await this.siteSettingsService.updateSettings(user.id, dto),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('❌ updateSiteSettings 에러:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
      });
      throw error;
    }
  }

  @Post('site-settings/analyze-colors')
  @ApiOperation({ summary: '로고 색상 분석 (Admin Only)' })
  @ApiResponse({ status: 200, description: '색상 분석 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @HttpCode(HttpStatus.OK)
  async analyzeColors(@Body() body: { logoUrl: string }) {
    try {
      const result =
        await this.colorAnalysisService.analyzeImageColors(body.logoUrl);
      return { data: result };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('❌ analyzeColors 에러:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
      });
      throw error;
    }
  }

  // ==================== 파일 업로드 ====================

  private getImageUploadOptions() {
    if (!this.fileUploadService) {
      throw new Error('FileUploadService not initialized');
    }
    const imageConfig = this.fileUploadService.getImageUploadConfig();
    return {
      storage: this.fileUploadService.createStorageConfig(imageConfig),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
      },
      fileFilter: this.fileUploadService.createFileFilter(imageConfig),
    };
  }

  private getAudioUploadOptions() {
    if (!this.fileUploadService) {
      throw new Error('FileUploadService not initialized');
    }
    const audioConfig = this.fileUploadService.getAudioUploadConfig();
    return {
      storage: this.fileUploadService.createStorageConfig(audioConfig),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
      },
      fileFilter: this.fileUploadService.createFileFilter(audioConfig),
    };
  }

  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: (() => {
        const service = new FileUploadService();
        const imageConfig = service.getImageUploadConfig();
        return service.createStorageConfig(imageConfig);
      })(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
      },
      fileFilter: (() => {
        const service = new FileUploadService();
        const imageConfig = service.getImageUploadConfig();
        return service.createFileFilter(imageConfig);
      })(),
    }),
  )
  @ApiOperation({ summary: '이미지 파일 업로드 (Admin Only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '파일 업로드 성공', type: UploadFileResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식' })
  @ApiResponse({ status: 413, description: '파일 크기 초과' })
  @HttpCode(HttpStatus.CREATED)
  async uploadImage(@UploadedFile() file?: { fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination: string; filename: string; path: string; buffer: Buffer } | undefined) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    const fileInfo = this.fileUploadService.processUploadedFile(file, 'uploads/images');
    return {
      data: {
        url: fileInfo.url,
        filename: fileInfo.filename,
        size: fileInfo.size,
      },
    };
  }

  @Post('upload/audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: (() => {
        const service = new FileUploadService();
        const audioConfig = service.getAudioUploadConfig();
        return service.createStorageConfig(audioConfig);
      })(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
      },
      fileFilter: (() => {
        const service = new FileUploadService();
        const audioConfig = service.getAudioUploadConfig();
        return service.createFileFilter(audioConfig);
      })(),
    }),
  )
  @ApiOperation({ summary: '오디오 파일 업로드 (Admin Only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '파일 업로드 성공', type: UploadFileResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식' })
  @ApiResponse({ status: 413, description: '파일 크기 초과' })
  @HttpCode(HttpStatus.CREATED)
  async uploadAudio(@UploadedFile() file?: { fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination: string; filename: string; path: string; buffer: Buffer } | undefined) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    const fileInfo = this.fileUploadService.processUploadedFile(file, 'uploads/audio');
    return {
      data: {
        url: fileInfo.url,
        filename: fileInfo.filename,
        size: fileInfo.size,
      },
    };
  }

  // ==================== 배지 관리 ====================

  @Get('badges')
  @ApiOperation({ summary: '배지 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '배지 목록 조회 성공' })
  async getBadges(@Query('includeInactive') includeInactive?: string) {
    try {
      const badges = await this.badgeService.getAllBadges(includeInactive === 'true');
      return { data: badges };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ getBadges 에러:', errorMessage);
      throw error;
    }
  }

  @Get('badges/:id')
  @ApiOperation({ summary: '배지 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '배지 조회 성공' })
  async getBadge(@Param('id') id: string) {
    try {
      const badge = await this.badgeService.getBadge(id);
      if (!badge) {
        throw new BadRequestException('배지를 찾을 수 없습니다.');
      }
      return { data: badge };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ getBadge 에러:', errorMessage);
      throw error;
    }
  }

  @Post('badges')
  @ApiOperation({ summary: '배지 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '배지 생성 성공' })
  async createBadge(@Body() data: {
    badgeType: string;
    name: string;
    description?: string;
    icon?: string;
    rarity?: string;
    condition?: any;
    isActive?: boolean;
  }) {
    try {
      const badge = await this.badgeService.createBadge(data as any);
      return { data: badge };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ createBadge 에러:', errorMessage);
      throw error;
    }
  }

  @Patch('badges/:id')
  @ApiOperation({ summary: '배지 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '배지 수정 성공' })
  async updateBadge(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      description?: string;
      icon?: string;
      rarity?: string;
      condition?: any;
      isActive?: boolean;
    },
  ) {
    try {
      const badge = await this.badgeService.updateBadge(id, data as any);
      return { data: badge };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ updateBadge 에러:', errorMessage);
      throw error;
    }
  }

  @Delete('badges/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '배지 삭제 (Admin Only)' })
  @ApiResponse({ status: 204, description: '배지 삭제 성공' })
  async deleteBadge(@Param('id') id: string) {
    try {
      await this.badgeService.deleteBadge(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ deleteBadge 에러:', errorMessage);
      throw error;
    }
  }

  // ==================== 문제 은행 관리 ====================

  @Get('question-banks')
  @ApiOperation({ summary: '문제 은행 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 은행 목록 조회 성공' })
  async getQuestionBanks(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('includeQuestions') includeQuestions?: string,
  ) {
    try {
      const questionBanks = await this.questionBankService.findAll({
        category,
        search,
        includeQuestions: includeQuestions === 'true',
      });
      return { data: questionBanks };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ getQuestionBanks 에러:', errorMessage);
      throw error;
    }
  }

  @Get('question-banks/categories')
  @ApiOperation({ summary: '문제 은행 카테고리 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공' })
  async getQuestionBankCategories() {
    try {
      const categories = await this.questionBankService.getCategories();
      return { data: categories };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ getQuestionBankCategories 에러:', errorMessage);
      throw error;
    }
  }

  @Get('question-banks/:id')
  @ApiOperation({ summary: '문제 은행 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 은행 조회 성공' })
  async getQuestionBank(
    @Param('id') id: string,
    @Query('includeQuestions') includeQuestions?: string,
  ) {
    try {
      const questionBank = await this.questionBankService.findOne(
        id,
        includeQuestions === 'true',
      );
      return { data: questionBank };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ getQuestionBank 에러:', errorMessage);
      throw error;
    }
  }

  @Post('question-banks')
  @ApiOperation({ summary: '문제 은행 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '문제 은행 생성 성공' })
  async createQuestionBank(
    @Body() data: {
      name: string;
      description?: string;
      category?: string;
    },
    @CurrentUser() user: any,
  ) {
    try {
      const questionBank = await this.questionBankService.create({
        ...data,
        createdBy: user.id,
      });
      return { data: questionBank };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ createQuestionBank 에러:', errorMessage);
      throw error;
    }
  }

  @Patch('question-banks/:id')
  @ApiOperation({ summary: '문제 은행 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 은행 수정 성공' })
  async updateQuestionBank(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      description?: string;
      category?: string;
    },
  ) {
    try {
      const questionBank = await this.questionBankService.update(id, data);
      return { data: questionBank };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ updateQuestionBank 에러:', errorMessage);
      throw error;
    }
  }

  @Delete('question-banks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '문제 은행 삭제 (Admin Only)' })
  @ApiResponse({ status: 204, description: '문제 은행 삭제 성공' })
  async deleteQuestionBank(@Param('id') id: string) {
    try {
      await this.questionBankService.delete(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ deleteQuestionBank 에러:', errorMessage);
      throw error;
    }
  }

  @Post('question-banks/:id/questions/:questionId')
  @ApiOperation({ summary: '문제 은행에 문제 추가 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 추가 성공' })
  async addQuestionToBank(
    @Param('id') questionBankId: string,
    @Param('questionId') questionId: string,
  ) {
    try {
      const question = await this.questionBankService.addQuestion(
        questionBankId,
        questionId,
      );
      return { data: question };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ addQuestionToBank 에러:', errorMessage);
      throw error;
    }
  }

  @Delete('question-banks/:id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '문제 은행에서 문제 제거 (Admin Only)' })
  @ApiResponse({ status: 204, description: '문제 제거 성공' })
  async removeQuestionFromBank(
    @Param('id') questionBankId: string,
    @Param('questionId') questionId: string,
  ) {
    try {
      await this.questionBankService.removeQuestion(questionBankId, questionId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ removeQuestionFromBank 에러:', errorMessage);
      throw error;
    }
  }

  @Delete('question-banks/:id/questions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '문제 은행의 모든 문제 제거 (Admin Only)' })
  @ApiResponse({ status: 204, description: '모든 문제 제거 성공' })
  async removeAllQuestionsFromBank(@Param('id') id: string) {
    try {
      await this.questionBankService.removeAllQuestions(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ removeAllQuestionsFromBank 에러:', errorMessage);
      throw error;
    }
  }
}

