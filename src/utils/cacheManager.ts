// 緩存管理器 - 多層緩存策略實現
import { logger } from '@/services/loggerService';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxMemorySize: number;
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
  enableMemory: boolean;
  compressionThreshold: number;
}

export interface CacheStats {
  memoryHits: number;
  localStorageHits: number;
  sessionStorageHits: number;
  misses: number;
  evictions: number;
  totalSize: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private stats: CacheStats = {
    memoryHits: 0,
    localStorageHits: 0,
    sessionStorageHits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxMemorySize: 50, // 50 items
      enableLocalStorage: true,
      enableSessionStorage: true,
      enableMemory: true,
      compressionThreshold: 1024, // 1KB
      ...config
    };

    // 定期清理過期緩存
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  // 設置緩存項
  set<T>(key: string, data: T, ttl?: number): void {
    const actualTTL = ttl || this.config.defaultTTL;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: actualTTL,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    try {
      // Memory cache (最快)
      if (this.config.enableMemory) {
        this.memoryCache.set(key, cacheItem);
        this.enforceMemoryLimit();
      }

      // Local storage (持久化)
      if (this.config.enableLocalStorage) {
        const serialized = this.serialize(cacheItem);
        localStorage.setItem(`cache_${key}`, serialized);
      }

      // Session storage (會話級)
      if (this.config.enableSessionStorage) {
        const serialized = this.serialize(cacheItem);
        sessionStorage.setItem(`cache_${key}`, serialized);
      }

      logger.debug(`Set cache for key: ${key}`, { component: 'CacheManager' });
    } catch (error) {
      logger.error(`Failed to set cache`, { component: 'CacheManager' }, error as Error);
    }
  }

  // 獲取緩存項
  get<T>(key: string): T | null {
    try {
      // 先檢查 memory cache
      if (this.config.enableMemory && this.memoryCache.has(key)) {
        const item = this.memoryCache.get(key)!;
        if (this.isValid(item)) {
          item.accessCount++;
          item.lastAccessed = Date.now();
          this.stats.memoryHits++;
          return item.data;
        } else {
          this.memoryCache.delete(key);
        }
      }

      // 檢查 session storage
      if (this.config.enableSessionStorage) {
        const serialized = sessionStorage.getItem(`cache_${key}`);
        if (serialized) {
          const item = this.deserialize<T>(serialized);
          if (item && this.isValid(item)) {
            // 重新放入 memory cache
            if (this.config.enableMemory) {
              this.memoryCache.set(key, item);
            }
            item.accessCount++;
            item.lastAccessed = Date.now();
            this.stats.sessionStorageHits++;
            return item.data;
          } else {
            sessionStorage.removeItem(`cache_${key}`);
          }
        }
      }

      // 檢查 local storage
      if (this.config.enableLocalStorage) {
        const serialized = localStorage.getItem(`cache_${key}`);
        if (serialized) {
          const item = this.deserialize<T>(serialized);
          if (item && this.isValid(item)) {
            // 重新放入上層緩存
            if (this.config.enableMemory) {
              this.memoryCache.set(key, item);
            }
            if (this.config.enableSessionStorage) {
              sessionStorage.setItem(`cache_${key}`, serialized);
            }
            item.accessCount++;
            item.lastAccessed = Date.now();
            this.stats.localStorageHits++;
            return item.data;
          } else {
            localStorage.removeItem(`cache_${key}`);
          }
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error(`Failed to get cache`, { component: 'CacheManager' }, error as Error);
      this.stats.misses++;
      return null;
    }
  }

  // 刪除緩存項
  delete(key: string): void {
    try {
      this.memoryCache.delete(key);
      localStorage.removeItem(`cache_${key}`);
      sessionStorage.removeItem(`cache_${key}`);
      logger.debug(`Deleted cache for key: ${key}`, { component: 'CacheManager' });
    } catch (error) {
      logger.error(`Failed to delete cache`, { component: 'CacheManager' }, error as Error);
    }
  }

  // 清空所有緩存
  clear(): void {
    try {
      this.memoryCache.clear();
      
      // 清空 localStorage 中的緩存項
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 清空 sessionStorage 中的緩存項
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('cache_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

      this.resetStats();
      logger.info(`All caches cleared`, { component: 'CacheManager' });
    } catch (error) {
      logger.error(`Failed to clear cache`, { component: 'CacheManager' }, error as Error);
    }
  }

  // 檢查是否存在且有效
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // 獲取緩存統計
  getStats(): CacheStats {
    this.stats.totalSize = this.memoryCache.size;
    return { ...this.stats };
  }

  // 重置統計
  resetStats(): void {
    this.stats = {
      memoryHits: 0,
      localStorageHits: 0,
      sessionStorageHits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
  }

  // 私有方法：檢查緩存項是否有效
  private isValid<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  // 私有方法：序列化
  private serialize<T>(item: CacheItem<T>): string {
    const dataString = JSON.stringify(item);
    
    // 如果數據大於壓縮閾值，考慮使用壓縮算法
    if (dataString.length > this.config.compressionThreshold) {
      // 這裡可以添加壓縮邏輯（如 LZ-string）
      // 目前簡單返回
      return dataString;
    }
    
    return dataString;
  }

  // 私有方法：反序列化
  private deserialize<T>(serialized: string): CacheItem<T> | null {
    try {
      return JSON.parse(serialized);
    } catch (error) {
      logger.error(`Failed to deserialize cache item`, { component: 'CacheManager' }, error as Error);
      return null;
    }
  }

  // 私有方法：強制內存限制
  private enforceMemoryLimit(): void {
    if (this.memoryCache.size <= this.config.maxMemorySize) {
      return;
    }

    // 使用 LRU 策略移除最少使用的項
    const items = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => {
        // 先按訪問次數，再按最後訪問時間
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.lastAccessed - b.lastAccessed;
      });

    const toRemove = items.slice(0, this.memoryCache.size - this.config.maxMemorySize + 1);
    toRemove.forEach(item => {
      this.memoryCache.delete(item.key);
      this.stats.evictions++;
    });

    logger.debug(`Evicted ${toRemove.length} items from memory cache`, { component: 'CacheManager' });
  }

  // 私有方法：清理過期項
  private cleanup(): void {
    let cleanedCount = 0;

    // 清理內存緩存
    for (const [key, item] of this.memoryCache.entries()) {
      if (!this.isValid(item)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired items`, { component: 'CacheManager' });
    }
  }

  // 獲取緩存鍵列表
  getKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  // 預熱緩存 - 預加載常用數據
  async preload(keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await dataLoader(key);
          this.set(key, data);
        } catch (error) {
          logger.error(`Failed to preload key ${key}`, { component: 'CacheManager' }, error as Error);
        }
      }
    });

    await Promise.all(promises);
    logger.info(`Preloaded ${keys.length} cache items`, { component: 'CacheManager' });
  }
}

// 創建全局緩存管理器實例
export const cacheManager = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemorySize: 100,
  enableLocalStorage: true,
  enableSessionStorage: true,
  enableMemory: true
});

export default cacheManager;