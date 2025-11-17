import { Module, Global } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { MetricsService } from '../services/metrics.service';
import { NotificationService } from '../services/notification.service';
import { FileUploadService } from '../services/file-upload.service';
import { MetricsController } from '../controllers/metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [CacheService, MetricsService, NotificationService, FileUploadService],
  exports: [CacheService, MetricsService, NotificationService, FileUploadService],
})
export class CommonModule {}

