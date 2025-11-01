import { Module, forwardRef } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { GradingService } from '../grading/grading.service';
import { MonitoringModule } from '../../monitoring/monitoring.module';
import { LicenseModule } from '../../license/license.module';

@Module({
  imports: [
    forwardRef(() => MonitoringModule),
    LicenseModule, // LicenseKeyGuard를 사용하기 위해 필요
  ],
  controllers: [SessionController],
  providers: [SessionService, GradingService],
  exports: [SessionService],
})
export class SessionModule {}

