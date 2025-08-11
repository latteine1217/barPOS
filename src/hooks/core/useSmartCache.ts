// 智能緩存 Hook - 提供便捷的緩存操作接口
import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager, CacheStats } from '@/utils/cacheManager';
import { logger } from '@/services/loggerService';

export interface UseSmartCacheOptions<T> {
  key: string;
  fetcher?: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
  validateData?: (data: T) => boolean;
  onError?: (error: Error) => void;
  refreshInterval?: number;
  staleWhileRevalidate?: boolean;
}

export interface SmartCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
  set: (data: T, ttl?: number) => void;
}

export function useSmartCache<T>(
  options: UseSmartCacheOptions<T>
): SmartCacheReturn<T> {
  const {
    key,
    fetcher,
    ttl,
    enabled = true,
    validateData,
    onError,
    refreshInterval,
    staleWhileRevalidate = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 從緩存加載數據
  const loadFromCache = useCallback(() => {
    const cachedData = cacheManager.get<T>(key);
    if (cachedData) {
      if (!validateData || validateData(cachedData)) {
        setData(cachedData);
        return true;
      } else {
        // 數據無效，從緩存中移除
        cacheManager.delete(key);
      }
    }
    return false;
  }, [key, validateData]);

  // 從遠端獲取數據
  const fetchData = useCallback(async (isRevalidation = false) => {
    if (!fetcher || !enabled) return;

    try {
      if (isRevalidation) {
        setIsValidating(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);

      const result = await fetcher();
      
      if (!isMountedRef.current) return;

      // 數據驗證
      if (validateData && !validateData(result)) {
        throw new Error('Data validation failed');
      }

      // 更新狀態和緩存
      setData(result);
      cacheManager.set(key, result, ttl);
      
      logger.debug(`Fetched and cached data for key: ${key}`, { component: 'useSmartCache' });
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      
      logger.error(`Failed to fetch data for key ${key}`, { component: 'useSmartCache' }, error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [fetcher, enabled, key, ttl, validateData, onError]);

  // 手動刷新
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // 使緩存失效
  const invalidate = useCallback(() => {
    cacheManager.delete(key);
    setData(null);
    setError(null);
  }, [key]);

  // 手動設置數據
  const set = useCallback((newData: T, newTtl?: number) => {
    setData(newData);
    cacheManager.set(key, newData, newTtl || ttl);
  }, [key, ttl]);

  // 初始化加載
  useEffect(() => {
    if (!enabled) return;

    // 先嘗試從緩存加載
    const hasCache = loadFromCache();
    
    // 如果沒有緩存或者啟用了 staleWhileRevalidate
    if (!hasCache || staleWhileRevalidate) {
      fetchData(!hasCache);
    }
  }, [enabled, key, loadFromCache, fetchData, staleWhileRevalidate]);

  // 設置自動刷新
  useEffect(() => {
    if (!enabled || !refreshInterval || !fetcher) return;

    refreshIntervalRef.current = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [enabled, refreshInterval, fetcher, fetchData]);

  // 清理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isValidating,
    error,
    refresh,
    invalidate,
    set
  };
}

// 緩存統計 Hook
export function useCacheStats() {
  const [stats, setStats] = useState<CacheStats>(cacheManager.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(cacheManager.getStats());
    };

    // 定期更新統計
    const interval = setInterval(updateStats, 5000); // 每5秒更新

    return () => clearInterval(interval);
  }, []);

  const resetStats = useCallback(() => {
    cacheManager.resetStats();
    setStats(cacheManager.getStats());
  }, []);

  const clearCache = useCallback(() => {
    cacheManager.clear();
    setStats(cacheManager.getStats());
  }, []);

  return {
    stats,
    resetStats,
    clearCache
  };
}

// 批量緩存 Hook
export function useBatchCache<T>(
  keys: string[],
  fetcher: (key: string) => Promise<T>,
  options: Partial<UseSmartCacheOptions<T>> = {}
) {
  const [items, setItems] = useState<Record<string, T | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const results: Record<string, T | null> = {};
    const newErrors: Record<string, Error> = {};

    await Promise.allSettled(
      keys.map(async (key) => {
        try {
          // 先檢查緩存
          let data = cacheManager.get<T>(key);
          
          if (!data) {
            // 從遠端獲取
            data = await fetcher(key);
            cacheManager.set(key, data, options.ttl);
          }
          
          results[key] = data;
        } catch (error) {
          newErrors[key] = error instanceof Error ? error : new Error('Unknown error');
          results[key] = null;
        }
      })
    );

    setItems(results);
    setErrors(newErrors);
    setIsLoading(false);
  }, [keys, fetcher, options.ttl]);

  useEffect(() => {
    if (keys.length > 0) {
      fetchAll();
    }
  }, [keys, fetchAll]);

  const invalidateAll = useCallback(() => {
    keys.forEach(key => cacheManager.delete(key));
    setItems({});
    setErrors({});
  }, [keys]);

  return {
    items,
    isLoading,
    errors,
    refetch: fetchAll,
    invalidateAll
  };
}

export default useSmartCache;