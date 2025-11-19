import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { ExamValidatorService } from './services/exam-validator.service';
import { ExamWorkflowService } from './services/exam-workflow.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto } from './dto/exam-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../../common/types';

@ApiTags('Exams')
@Controller('api/exams')
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly examValidatorService: ExamValidatorService,
    private readonly examWorkflowService: ExamWorkflowService,
  ) {}

  @Get()
  @ApiOperation({ summary: '시험 목록 조회' })
  @ApiResponse({ status: 200, description: '시험 목록 조회 성공' })
  findAll(@Query() query: ExamQueryDto) {
    return this.examService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '시험 상세 조회' })
  @ApiResponse({ status: 200, description: '시험 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.examService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '시험 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createExamDto: CreateExamDto, @CurrentUser() user: any) {
    return this.examService.create(createExamDto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 수정 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examService.update(id, updateExamDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 삭제 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.examService.remove(id);
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 복제 (Admin Only)' })
  @ApiResponse({ status: 201, description: '시험 복제 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.CREATED)
  clone(
    @Param('id') id: string,
    @Body() body: { 
      title?: string;
      createVersion?: boolean;
      version?: string;
      shuffleQuestions?: boolean;
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.examService.clone(
      id,
      user.id,
      body.title,
      body.createVersion,
      body.version,
      body.shuffleQuestions,
    );
  }

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 버전 목록 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '버전 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  getVersions(@Param('id') id: string) {
    return this.examService.getVersions(id);
  }

  @Get(':id/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 검증 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 검증 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  validateExam(@Param('id') id: string) {
    return this.examValidatorService.validateExam(id);
  }

  // ==================== 워크플로우 엔드포인트 ====================

  @Get(':id/workflow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CREATOR, UserRole.REVIEWER, UserRole.APPROVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 워크플로우 상태 조회' })
  @ApiResponse({ status: 200, description: '워크플로우 상태 조회 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  getWorkflowStatus(@Param('id') id: string) {
    return this.examWorkflowService.getWorkflowStatus(id);
  }

  @Post(':id/workflow/submit-for-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: '검수 요청 (Admin, Creator)' })
  @ApiResponse({ status: 200, description: '검수 요청 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  submitForReview(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.examWorkflowService.submitForReview(id, user.id, user.role, body);
  }

  @Post(':id/workflow/assign-reviewer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '검수자 할당 (Admin Only)' })
  @ApiResponse({ status: 200, description: '검수자 할당 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  assignReviewer(
    @Param('id') id: string,
    @Body() body: { reviewerId: string },
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.examWorkflowService.assignReviewer(id, body.reviewerId, user.id, user.role);
  }

  @Post(':id/workflow/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.APPROVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 승인 (Admin, Approver)' })
  @ApiResponse({ status: 200, description: '승인 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.examWorkflowService.approve(id, user.id, user.role, body);
  }

  @Post(':id/workflow/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 거부 (Admin, Reviewer)' })
  @ApiResponse({ status: 200, description: '거부 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.examWorkflowService.reject(id, user.id, user.role, body);
  }

  @Post(':id/workflow/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.APPROVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 발행 (Admin, Approver)' })
  @ApiResponse({ status: 200, description: '발행 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  publish(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.examWorkflowService.publish(id, user.id, user.role);
  }

  @Post(':id/workflow/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 보관 (Admin Only)' })
  @ApiResponse({ status: 200, description: '보관 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  archive(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.examWorkflowService.archive(id, user.id, user.role);
  }

  @Post(':id/workflow/return-to-draft')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: '초안으로 복귀 (Admin, Creator)' })
  @ApiResponse({ status: 200, description: '초안 복귀 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  returnToDraft(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.examWorkflowService.returnToDraft(id, user.id, user.role);
  }
}

