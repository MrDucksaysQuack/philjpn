import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const route = request.route?.path || request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        const status = response.statusCode || 200;
        this.metricsService.recordHttpRequest(method, route, status, duration);
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        const status = error.status || 500;
        this.metricsService.recordHttpRequest(method, route, status, duration);
        this.metricsService.recordHttpError(method, route, error.constructor.name);
        throw error;
      }),
    );
  }
}

