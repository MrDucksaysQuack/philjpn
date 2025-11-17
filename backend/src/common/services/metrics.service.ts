import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // HTTP 요청 메트릭
  private readonly httpRequestCounter: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestErrors: Counter<string>;

  // 데이터베이스 메트릭
  private readonly dbQueryDuration: Histogram<string>;
  private readonly dbQueryErrors: Counter<string>;

  // 비즈니스 메트릭
  private readonly examCreatedCounter: Counter<string>;
  private readonly examCompletedCounter: Counter<string>;
  private readonly licenseKeyCreatedCounter: Counter<string>;
  private readonly licenseKeyUsedCounter: Counter<string>;
  private readonly activeUsersGauge: Gauge<string>;
  private readonly activeSessionsGauge: Gauge<string>;

  constructor() {
    this.registry = new Registry();

    // HTTP 메트릭
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    // 데이터베이스 메트릭
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.dbQueryErrors = new Counter({
      name: 'db_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['operation', 'table', 'error_type'],
      registers: [this.registry],
    });

    // 비즈니스 메트릭
    this.examCreatedCounter = new Counter({
      name: 'exams_created_total',
      help: 'Total number of exams created',
      labelNames: ['exam_type'],
      registers: [this.registry],
    });

    this.examCompletedCounter = new Counter({
      name: 'exams_completed_total',
      help: 'Total number of exams completed',
      labelNames: ['exam_type'],
      registers: [this.registry],
    });

    this.licenseKeyCreatedCounter = new Counter({
      name: 'license_keys_created_total',
      help: 'Total number of license keys created',
      labelNames: ['key_type'],
      registers: [this.registry],
    });

    this.licenseKeyUsedCounter = new Counter({
      name: 'license_keys_used_total',
      help: 'Total number of license keys used',
      labelNames: ['key_type'],
      registers: [this.registry],
    });

    this.activeUsersGauge = new Gauge({
      name: 'active_users',
      help: 'Number of active users',
      registers: [this.registry],
    });

    this.activeSessionsGauge = new Gauge({
      name: 'active_sessions',
      help: 'Number of active exam sessions',
      registers: [this.registry],
    });
  }

  // HTTP 메트릭
  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestCounter.inc({ method, route, status: status.toString() });
    this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
  }

  recordHttpError(method: string, route: string, errorType: string) {
    this.httpRequestErrors.inc({ method, route, error_type: errorType });
  }

  // 데이터베이스 메트릭
  recordDbQuery(operation: string, table: string, duration: number) {
    this.dbQueryDuration.observe({ operation, table }, duration);
  }

  recordDbError(operation: string, table: string, errorType: string) {
    this.dbQueryErrors.inc({ operation, table, error_type: errorType });
  }

  // 비즈니스 메트릭
  recordExamCreated(examType: string) {
    this.examCreatedCounter.inc({ exam_type: examType });
  }

  recordExamCompleted(examType: string) {
    this.examCompletedCounter.inc({ exam_type: examType });
  }

  recordLicenseKeyCreated(keyType: string) {
    this.licenseKeyCreatedCounter.inc({ key_type: keyType });
  }

  recordLicenseKeyUsed(keyType: string) {
    this.licenseKeyUsedCounter.inc({ key_type: keyType });
  }

  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  setActiveSessions(count: number) {
    this.activeSessionsGauge.set(count);
  }

  // 메트릭 레지스트리 반환
  getRegistry(): Registry {
    return this.registry;
  }

  // 메트릭을 Prometheus 형식으로 반환
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}

