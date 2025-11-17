import { Module, Global } from '@nestjs/common';
import { CacheService } from '../services/cache.service';
import { MetricsService } from '../services/metrics.service';
import { NotificationService } from '../services/notification.service';
import { MetricsController } from '../controllers/metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [CacheService, MetricsService, NotificationService],
  exports: [CacheService, MetricsService, NotificationService],
})
export class CommonModule {}

