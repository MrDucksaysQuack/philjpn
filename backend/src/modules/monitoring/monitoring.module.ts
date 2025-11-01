import { Module } from '@nestjs/common';
import { MonitoringService } from './services/monitoring.service';
import { ExamMonitoringGateway } from './gateway/exam-monitoring.gateway';
import { MonitoringController } from './monitoring.controller';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, ExamMonitoringGateway],
  exports: [MonitoringService, ExamMonitoringGateway],
})
export class MonitoringModule {}

