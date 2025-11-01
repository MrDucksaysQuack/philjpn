import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './services/admin.service';
import { AdminUserQueryDto } from './dto/user-query.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminExamResultQueryDto } from './dto/exam-result-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/types';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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

  // ==================== 시험 관리 ====================

  @Get('exams/statistics')
  @ApiOperation({ summary: '시험 통계 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 통계 조회 성공' })
  getExamStatistics() {
    return this.adminService.getExamStatistics();
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
  getLicenseKeyStatistics() {
    return this.adminService.getLicenseKeyStatistics();
  }

  // ==================== 대시보드 ====================

  @Get('dashboard')
  @ApiOperation({ summary: '관리자 대시보드 데이터 (Admin Only)' })
  @ApiResponse({ status: 200, description: '대시보드 데이터 조회 성공' })
  getDashboard() {
    return this.adminService.getDashboardData();
  }
}

