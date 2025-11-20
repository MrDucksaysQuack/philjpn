import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 토큰을 블랙리스트에 추가
   * @param token JWT 토큰
   * @param expiresIn 토큰 만료 시간 (초 단위, 기본값: 7일)
   */
  async addToBlacklist(token: string, expiresIn: number = 7 * 24 * 60 * 60): Promise<void> {
    // cacheManager가 없으면 블랙리스트 추가 불가 (무시)
    if (!this.cacheManager) {
      console.warn('CacheManager not available, cannot add token to blacklist');
      return;
    }
    
    try {
      // 토큰의 jti (JWT ID) 또는 전체 토큰을 키로 사용
      const key = `blacklist:token:${token}`;
      
      // 토큰을 블랙리스트에 추가 (만료 시간까지 유지)
      // cache-manager의 set은 Promise<T>를 반환하지만 반환값은 무시
      await this.cacheManager.set(key, true, expiresIn * 1000); // cache-manager는 밀리초 단위
    } catch (error) {
      console.error('Failed to add token to blacklist:', error);
      // 에러 발생해도 계속 진행 (블랙리스트는 보조 기능)
    }
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   * @param token JWT 토큰
   * @returns 블랙리스트에 있으면 true
   */
  async isBlacklisted(token: string): Promise<boolean> {
    // cacheManager가 없으면 블랙리스트 체크 불가 (false 반환)
    if (!this.cacheManager) {
      return false;
    }
    
    try {
      const key = `blacklist:token:${token}`;
      const value = await this.cacheManager.get<boolean>(key);
      return value === true;
    } catch (error) {
      // 캐시 에러 발생 시 블랙리스트가 아닌 것으로 간주
      console.error('Token blacklist check error:', error);
      return false;
    }
  }

  /**
   * 토큰을 블랙리스트에서 제거 (일반적으로 사용하지 않음)
   * @param token JWT 토큰
   */
  async removeFromBlacklist(token: string): Promise<void> {
    if (!this.cacheManager) {
      return;
    }
    
    try {
      const key = `blacklist:token:${token}`;
      await this.cacheManager.del(key);
    } catch (error) {
      console.error('Failed to remove token from blacklist:', error);
    }
  }

  /**
   * 모든 블랙리스트 항목 제거 (관리자용)
   */
  async clearBlacklist(): Promise<void> {
    if (!this.cacheManager) {
      return;
    }
    
    try {
      // 메모리 캐시의 경우 전체 삭제는 지원하지 않을 수 있음
      // Redis를 사용하는 경우 패턴 매칭으로 삭제 가능
      // 현재는 개별 삭제만 지원
      // cache-manager v4+ 에서는 store.reset() 사용
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
      }
    } catch (error) {
      console.error('Failed to clear blacklist:', error);
    }
  }
}

