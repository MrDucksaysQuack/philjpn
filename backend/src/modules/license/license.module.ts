import { Module } from '@nestjs/common';
import { LicenseKeyService } from './services/license-key.service';
import { LicenseKeyController } from './license-key.controller';
import { LicenseKeyGuard } from './guards/license-key.guard';

@Module({
  controllers: [LicenseKeyController],
  providers: [LicenseKeyService, LicenseKeyGuard],
  exports: [LicenseKeyService, LicenseKeyGuard],
})
export class LicenseModule {}

