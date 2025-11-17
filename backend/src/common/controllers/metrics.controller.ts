import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus 메트릭 조회' })
  @ApiResponse({ status: 200, description: '메트릭 조회 성공' })
  async getMetrics() {
    const metrics = await this.metricsService.getMetrics();
    return metrics;
  }
}

