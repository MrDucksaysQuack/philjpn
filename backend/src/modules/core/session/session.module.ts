import { Module, forwardRef } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { GradingService } from '../grading/grading.service';
import { IRTService } from './services/irt.service';
import { MonitoringModule } from '../../monitoring/monitoring.module';
import { LicenseModule } from '../../license/license.module';
import { AdminModule } from '../../admin/admin.module';

@Module({
  imports: [
    forwardRef(() => MonitoringModule),
    LicenseModule, // LicenseKeyGuard를 사용하기 위해 필요
    AdminModule, // QuestionPoolService를 사용하기 위해 필요
  ],
  controllers: [SessionController],
  providers: [SessionService, GradingService, IRTService],
  exports: [SessionService],
})
export class SessionModule {}

