import { Module } from '@nestjs/common';
import { LicenseKeyService } from './services/license-key.service';
import { LicenseKeyController } from './license-key.controller';
import { ExpirationNotificationService } from './services/expiration-notification.service';
import { LicenseKeyGuard } from './guards/license-key.guard';

@Module({
  controllers: [LicenseKeyController],
  providers: [
    LicenseKeyService,
    ExpirationNotificationService,
    LicenseKeyGuard,
  ],
  exports: [LicenseKeyService, LicenseKeyGuard],
})
export class LicenseModule {}

