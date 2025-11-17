import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { LicenseKeyService } from './services/license-key.service';
import { ExpirationNotificationService } from './services/expiration-notification.service';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { CreateBatchLicenseKeysDto } from './dto/create-batch-license-keys.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { LicenseKeyQueryDto } from './dto/license-key-query.dto';
import { ValidateKeyDto } from './dto/validate-key.dto';
import { UsageLogQueryDto } from './dto/usage-log-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/types';
import { PrismaService } from '../../common/utils/prisma.service';

@ApiTags('License Keys')
@Controller('api/license-keys')
export class LicenseKeyController {
  constructor(
    private readonly licenseKeyService: LicenseKeyService,
    private readonly expirationNotificationService: ExpirationNotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 라이선스 키 목록 (사용자) 또는 전체 목록 (Admin)' })
  @ApiResponse({ status: 200, description: '라이선스 키 목록 조회 성공' })
  findAll(
    @Query() query: LicenseKeyQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.licenseKeyService.findAll(user.id, user.role, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '라이선스 키 발급 (Admin Only)' })
  @ApiResponse({ status: 201, description: '라이선스 키 발급 성공' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateLicenseKeyDto, @CurrentUser() user: any) {
    return this.licenseKeyService.create(createDto, user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '라이선스 키 상세 조회' })
  @ApiResponse({ status: 200, description: '라이선스 키 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '라이선스 키를 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.licenseKeyService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '라이선스 키 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '라이선스 키 수정 성공' })
  @ApiResponse({ status: 404, description: '라이선스 키를 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLicenseKeyDto,
    @CurrentUser() user: any,
  ) {
    return this.licenseKeyService.update(id, updateDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '라이선스 키 삭제/비활성화 (Admin Only)' })
  @ApiResponse({ status: 200, description: '라이선스 키 삭제 성공' })
  @ApiResponse({ status: 404, description: '라이선스 키를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.licenseKeyService.remove(id, user.id, user.role);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: '라이선스 키 ID로 유효성 검증' })
  @ApiResponse({ status: 200, description: '라이선스 키 유효성 검증 성공' })
  async validateById(@Param('id') id: string, @Body() dto?: ValidateKeyDto) {
    const licenseKey = await this.prisma.licenseKey.findUnique({
      where: { id },
    });
    if (!licenseKey) {
      return {
        isValid: false,
        canUse: false,
        reason: '라이선스 키를 찾을 수 없습니다.',
      };
    }
    return this.licenseKeyService.validate(licenseKey.key, dto);
  }

  @Post('validate')
  @ApiOperation({ summary: '라이선스 키 문자열로 유효성 검증' })
  @ApiResponse({ status: 200, description: '라이선스 키 유효성 검증 성공' })
  async validateByKey(@Body() body: ValidateKeyDto & { key: string }) {
    return this.licenseKeyService.validate(body.key, {
      examId: body.examId,
    });
  }

  @Get(':id/usage-logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '라이선스 키 사용 로그 조회' })
  @ApiResponse({ status: 200, description: '사용 로그 조회 성공' })
  async getUsageLogs(
    @Param('id') id: string,
    @Query() query: UsageLogQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.licenseKeyService.findUsageLogs(id, user.id, user.role, query);
  }

  // ==================== 배치 관리 ====================

  @Post('batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '대량 라이선스 키 배치 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '배치 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  async createBatch(
    @Body() dto: CreateBatchLicenseKeysDto,
    @CurrentUser() user: any,
  ) {
    return this.licenseKeyService.createBatch(dto, user.id);
  }

  @Get('batch/:id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '배치 사용량 통계 (Admin Only)' })
  @ApiResponse({ status: 200, description: '통계 조회 성공' })
  async getBatchStats(@Param('id') batchId: string) {
    return this.licenseKeyService.getBatchStats(batchId);
  }

  @Get('batch/:id/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '배치 키 CSV 내보내기 (Admin Only)' })
  @ApiResponse({ status: 200, description: 'CSV 내보내기 성공' })
  async exportBatchKeys(
    @Param('id') batchId: string,
    @Res() res: Response,
  ) {
    const csv = await this.licenseKeyService.exportBatchToCSV(batchId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="batch-${batchId}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '라이선스 키 사용량 대시보드 (Admin Only)' })
  @ApiResponse({ status: 200, description: '대시보드 조회 성공' })
  async getDashboard(@CurrentUser() user: any) {
    return this.licenseKeyService.getDashboard(user.id);
  }

  @Get('batches/expiring')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '만료 예정 배치 조회 (Admin Only)' })
  @ApiResponse({ status: 200, description: '만료 예정 배치 조회 성공' })
  async getExpiringBatches(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.licenseKeyService.getExpiringBatches(user.id, daysNum);
  }

  @Get('batch/:id/predict')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '배치 사용량 예측 (Admin Only)' })
  @ApiResponse({ status: 200, description: '사용량 예측 성공' })
  async predictUsage(
    @Param('id') batchId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const predictedUsage = await this.licenseKeyService.predictUsage(batchId, daysNum);
    return {
      batchId,
      predictedDays: daysNum,
      predictedUsage,
      message: `향후 ${daysNum}일간 예상 사용량: ${predictedUsage}회`,
    };
  }

  @Post('batch/:id/notify-expiration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '만료 알림 수동 전송 (Admin Only)' })
  @ApiResponse({ status: 200, description: '알림 전송 성공' })
  async sendExpirationNotification(@Param('id') batchId: string) {
    return this.expirationNotificationService.sendExpirationNotification(batchId);
  }
}

