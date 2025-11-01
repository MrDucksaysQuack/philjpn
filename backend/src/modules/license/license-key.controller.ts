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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LicenseKeyService } from './services/license-key.service';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
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
}

