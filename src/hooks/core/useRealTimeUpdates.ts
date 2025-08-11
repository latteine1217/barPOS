// 實時更新優化 Hook - 減少不必要的重新渲染
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/services/loggerService';

export interface UseRealTimeUpdatesOptions<T> {
  // 基本配置
  initialData: T;
  enabled?: boolean;
  
  // 節流配置
  throttleMs?: number;
  
  // 相等性比較
  isEqual?: (a: T, b: T) => boolean;
  
  // 選擇性訂閱
  subscribeToFields?: (keyof T)[];
  
  // 批處理配置
  batchUpdates?: boolean;
  batchInterval?: number;
  
  // 回調
  onUpdate?: (newData: T, oldData: T) => void;
  onError?: (error: Error) => void;
}

export interface RealTimeUpdatesReturn<T> {
  data: T;
  isThrottling: boolean;
  pendingUpdates: number;
  update: (newData: Partial<T>) => void;
  forceUpdate: (newData: Partial<T>) => void;
  reset: () => void;
}

export function useRealTimeUpdates<T extends Record<string, any>>(
  options: UseRealTimeUpdatesOptions<T>
): RealTimeUpdatesReturn<T> {
  const {
    initialData,
    enabled = true,
    throttleMs = 100,
    isEqual = defaultIsEqual,
    subscribeToFields,
    batchUpdates = false,
    batchInterval = 50,
    onUpdate,
    onError
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [isThrottling, setIsThrottling] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(0);
  
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<Partial<T>>({});
  const lastUpdateRef = useRef<T>(initialData);
  const isMountedRef = useRef(true);

  // 默認相等性比較
  function defaultIsEqual(a: T, b: T): boolean {
    if (subscribeToFields) {
      return subscribeToFields.every(field => a[field] === b[field]);
    }
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // 應用更新
  const applyUpdate = useCallback((newData: Partial<T>, force = false) => {
    if (!enabled && !force) return;

    try {
      const updatedData = { ...data, ...newData } as T;
      
      // 檢查是否真的有變化
      if (!force && isEqual(updatedData, lastUpdateRef.current)) {
        return;
      }

      const oldData = lastUpdateRef.current;
      setData(updatedData);
      lastUpdateRef.current = updatedData;
      
      onUpdate?.(updatedData, oldData);
      
      logger.debug('Real-time update applied', {
        component: 'useRealTimeUpdates',
        changedFields: Object.keys(newData)
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Update failed');
      onError?.(err);
      logger.error('Failed to apply real-time update', 
        { component: 'useRealTimeUpdates' }, err);
    }
  }, [data, enabled, isEqual, onUpdate, onError]);

  // 節流更新處理
  const handleThrottledUpdate = useCallback((newData: Partial<T>) => {
    // 累積待處理的更新
    pendingDataRef.current = { ...pendingDataRef.current, ...newData };
    setPendingUpdates(prev => prev + 1);

    if (throttleTimeoutRef.current) {
      return; // 已經在節流中
    }

    setIsThrottling(true);
    
    throttleTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      const pendingData = pendingDataRef.current;
      pendingDataRef.current = {};
      
      applyUpdate(pendingData);
      
      setIsThrottling(false);
      setPendingUpdates(0);
      throttleTimeoutRef.current = null;
    }, throttleMs);
  }, [applyUpdate, throttleMs]);

  // 批處理更新處理
  const handleBatchedUpdate = useCallback((newData: Partial<T>) => {
    // 累積批處理更新
    pendingDataRef.current = { ...pendingDataRef.current, ...newData };
    setPendingUpdates(prev => prev + 1);

    if (batchTimeoutRef.current) {
      return; // 已經在批處理中
    }

    batchTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      const pendingData = pendingDataRef.current;
      pendingDataRef.current = {};
      
      applyUpdate(pendingData);
      setPendingUpdates(0);
      batchTimeoutRef.current = null;
    }, batchInterval);
  }, [applyUpdate, batchInterval]);

  // 主要更新方法
  const update = useCallback((newData: Partial<T>) => {
    if (!enabled) return;

    if (batchUpdates) {
      handleBatchedUpdate(newData);
    } else if (throttleMs > 0) {
      handleThrottledUpdate(newData);
    } else {
      applyUpdate(newData);
    }
  }, [enabled, batchUpdates, throttleMs, handleBatchedUpdate, handleThrottledUpdate, applyUpdate]);

  // 強制更新（忽略節流和批處理）
  const forceUpdate = useCallback((newData: Partial<T>) => {
    applyUpdate(newData, true);
  }, [applyUpdate]);

  // 重置到初始狀態
  const reset = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    pendingDataRef.current = {};
    setData(initialData);
    lastUpdateRef.current = initialData;
    setIsThrottling(false);
    setPendingUpdates(0);
  }, [initialData]);

  // 清理副作用
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    isThrottling,
    pendingUpdates,
    update,
    forceUpdate,
    reset
  };
}

// 自定義相等性比較工具
export function createFieldsComparator<T extends Record<string, any>>(
  fields: (keyof T)[]
): (a: T, b: T) => boolean {
  return (a, b) => fields.every(field => a[field] === b[field]);
}

export function createDeepComparator<T>(): (a: T, b: T) => boolean {
  return (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      Object.prototype.hasOwnProperty.call(b, key) && 
      createDeepComparator()(a[key as keyof T], b[key as keyof T])
    );
  };
}

// 實時訂閱 Hook
export function useRealtimeSubscription<T extends Record<string, any>>(
  subscriptionKey: string,
  fetcher: () => Promise<T>,
  options: Partial<UseRealTimeUpdatesOptions<T>> & {
    refreshInterval?: number;
    reconnectOnError?: boolean;
    maxRetries?: number;
  } = {}
) {
  const {
    refreshInterval = 5000,
    reconnectOnError = true,
    maxRetries = 3,
    ...realTimeOptions
  } = options;

  const [initialData] = useState<T>((options.initialData || {}) as T);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const retryCountRef = useRef(0);
  const subscriptionRef = useRef<NodeJS.Timeout | null>(null);

  const realTimeUpdates = useRealTimeUpdates({
    initialData,
    ...realTimeOptions
  });

  // 獲取數據
  const fetchData = useCallback(async () => {
    try {
      const data = await fetcher();
      realTimeUpdates.forceUpdate(data as Partial<T>);
      setError(null);
      setIsConnected(true);
      retryCountRef.current = 0;
      
      logger.debug(`Subscription data updated`, {
        component: 'useRealtimeSubscription',
        subscriptionKey
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);
      setIsConnected(false);
      
      // 重試邏輯
      if (reconnectOnError && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        logger.warn(`Subscription fetch failed, retrying (${retryCountRef.current}/${maxRetries})`, {
          component: 'useRealtimeSubscription',
          subscriptionKey
        });
        
        setTimeout(() => fetchData(), Math.pow(2, retryCountRef.current) * 1000);
      } else {
        logger.error(`Subscription failed after ${maxRetries} retries`, {
          component: 'useRealtimeSubscription',
          subscriptionKey
        }, error);
      }
    }
  }, [fetcher, subscriptionKey, maxRetries, reconnectOnError, realTimeUpdates]);

  // 開始訂閱
  useEffect(() => {
    fetchData(); // 立即獲取一次

    if (refreshInterval > 0) {
      subscriptionRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (subscriptionRef.current) {
        clearInterval(subscriptionRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return {
    ...realTimeUpdates,
    error,
    isConnected,
    retry: fetchData
  };
}

export default useRealTimeUpdates;