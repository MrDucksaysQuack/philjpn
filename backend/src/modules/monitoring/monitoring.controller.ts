import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MonitoringService } from './services/monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/types';

@ApiTags('Monitoring')
@Controller('api/admin/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('active-sessions')
  @ApiOperation({ summary: '활성 시험 세션 목록 (Admin Only)' })
  @ApiResponse({ status: 200, description: '활성 세션 목록 조회 성공' })
  getActiveSessions() {
    return {
      data: this.monitoringService.getActiveSessions(),
    };
  }
}

