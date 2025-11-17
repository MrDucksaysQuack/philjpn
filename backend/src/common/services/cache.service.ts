import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 3600; // 1시간

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 캐시에서 값 가져오기
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit: ${key}`);
      } else {
        this.logger.debug(`Cache miss: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * 캐시에 값 저장
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl || this.defaultTTL);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl || this.defaultTTL}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * 캐시에서 값 삭제
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache delete: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * 패턴으로 캐시 삭제
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Redis store의 경우 keys 패턴으로 삭제 가능
      // 일반 cache-manager는 지원하지 않으므로 개별 삭제 필요
      this.logger.debug(`Cache delete pattern: ${pattern}`);
      // TODO: Redis store를 사용하는 경우 keys() 메서드로 패턴 매칭 후 삭제
    } catch (error) {
      this.logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * 캐시 전체 삭제 (Redis store의 경우 store.reset() 사용)
   */
  async reset(): Promise<void> {
    try {
      // cache-manager v5에서는 reset이 없으므로 store를 직접 사용
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
        this.logger.debug('Cache reset');
      } else {
        this.logger.warn('Cache reset not supported by current store');
      }
    } catch (error) {
      this.logger.error('Cache reset error:', error);
    }
  }

  /**
   * 캐시 키 생성 헬퍼
   */
  static createKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

