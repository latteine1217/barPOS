// 樂觀更新 Hook - 提供即時響應和錯誤回滾機制
import { useState, useCallback, useRef } from 'react';
import { logger } from '@/services/loggerService';

export interface UseOptimisticUpdatesOptions<T, R = void> {
  // 初始數據
  initialData: T;
  
  // 樂觀更新後的實際更新函數
  updateFn: (optimisticData: T) => Promise<R>;
  
  // 錯誤處理
  onError?: (error: Error, rollbackData: T) => void;
  onSuccess?: (result: R, finalData: T) => void;
  
  // 衝突解決
  conflictResolver?: (serverData: T, localData: T) => T;
  
  // 重試配置
  maxRetries?: number;
  retryDelay?: number;
}

export interface OptimisticUpdatesReturn<T, R> {
  // 當前數據狀態
  data: T;
  isOptimistic: boolean;
  isPending: boolean;
  error: Error | null;
  
  // 操作方法
  optimisticUpdate: (newData: Partial<T>) => Promise<R>;
  rollback: () => void;
  commit: (serverData: T) => void;
  
  // 狀態查詢
  hasUncommittedChanges: boolean;
  getPendingChanges: () => Partial<T> | null;
}

export function useOptimisticUpdates<T extends Record<string, unknown>, R = void>(
  options: UseOptimisticUpdatesOptions<T, R>
): OptimisticUpdatesReturn<T, R> {
  const {
    initialData,
    updateFn,
    onError,
    onSuccess,
    conflictResolver,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  // 狀態管理
  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 引用數據
  const dataRef = useRef<T>(initialData);
  const baseDataRef = useRef<T>(initialData); // 服務器確認的數據
  const optimisticDataRef = useRef<T | null>(null); // 樂觀更新的數據
  const pendingChangesRef = useRef<Partial<T> | null>(null); // 待提交的變更
  const retryCountRef = useRef(0);

  // 回滾樂觀更新
  const rollback = useCallback(() => {
    const rollbackData = baseDataRef.current;
    dataRef.current = rollbackData;
    setData(rollbackData);
    optimisticDataRef.current = null;
    pendingChangesRef.current = null;
    
    setIsOptimistic(false);
    setIsPending(false);
    setError(null);
    retryCountRef.current = 0;
    
    logger.debug('Rolled back optimistic update', {
      component: 'useOptimisticUpdates'
    });
  }, []);

  // 樂觀更新操作
  const optimisticUpdate = useCallback(async (newData: Partial<T>): Promise<R> => {
    try {
      setError(null);
      setIsPending(true);
      
      // 應用樂觀更新
      const sourceData = optimisticDataRef.current ?? dataRef.current;
      const optimisticData = { ...sourceData, ...newData } as T;
      optimisticDataRef.current = optimisticData;
      pendingChangesRef.current = { ...(pendingChangesRef.current || {}), ...newData };
      
      dataRef.current = optimisticData;
      setData(optimisticData);
      setIsOptimistic(true);
      
      logger.debug('Applied optimistic update', {
        component: 'useOptimisticUpdates',
        changes: Object.keys(newData)
      });

      // 執行實際更新
      const result = await updateFn(optimisticData);
      
      // 成功 - 提交樂觀更新
      baseDataRef.current = optimisticData;
      optimisticDataRef.current = null;
      pendingChangesRef.current = null;
      
      setIsOptimistic(false);
      setIsPending(false);
      retryCountRef.current = 0;
      
      onSuccess?.(result, optimisticData);
      
      logger.debug('Optimistic update committed', {
        component: 'useOptimisticUpdates'
      });
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed');
      
      // 重試邏輯
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        
        logger.warn(`Optimistic update failed, retrying (${retryCountRef.current}/${maxRetries})`, {
          component: 'useOptimisticUpdates'
        });
        
        // 延遲重試
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
        
        return optimisticUpdate(newData);
      } else {
        // 重試次數用盡，回滾
        rollback();
        setError(error);
        
        onError?.(error, baseDataRef.current);
        
        logger.error('Optimistic update failed after retries, rolling back', {
          component: 'useOptimisticUpdates'
        }, error);
        
        throw error;
      }
    }
  }, [updateFn, onError, onSuccess, maxRetries, retryDelay, rollback]);

  // 提交服務器數據（處理衝突）
  const commit = useCallback((serverData: T) => {
    if (!isOptimistic) {
      // 沒有樂觀更新，直接使用服務器數據
      baseDataRef.current = serverData;
      dataRef.current = serverData;
      setData(serverData);
      return;
    }

    let finalData = serverData;

    // 如果有衝突解決器，處理衝突
    if (conflictResolver && optimisticDataRef.current) {
      finalData = conflictResolver(serverData, optimisticDataRef.current);
      logger.debug('Resolved conflict between server and optimistic data', {
        component: 'useOptimisticUpdates'
      });
    }

    // 提交最終數據
    baseDataRef.current = finalData;
    optimisticDataRef.current = null;
    pendingChangesRef.current = null;
    
    dataRef.current = finalData;
    setData(finalData);
    setIsOptimistic(false);
    setIsPending(false);
    retryCountRef.current = 0;
    
    logger.debug('Committed server data', {
      component: 'useOptimisticUpdates'
    });
  }, [isOptimistic, conflictResolver]);

  // 查詢方法
  const hasUncommittedChanges = isOptimistic;
  const getPendingChanges = useCallback(() => pendingChangesRef.current, []);

  return {
    data,
    isOptimistic,
    isPending,
    error,
    optimisticUpdate,
    rollback,
    commit,
    hasUncommittedChanges,
    getPendingChanges
  };
}

// 樂觀批量更新 Hook
export function useOptimisticBatch<T extends Record<string, unknown>, K extends keyof T>(
  options: {
    initialItems: Record<K, T>;
    updateFn: (key: K, data: T) => Promise<T>;
    onBatchError?: (errors: Record<K, Error>) => void;
    onBatchSuccess?: (results: Record<K, T>) => void;
  }
) {
  const { initialItems, updateFn, onBatchError, onBatchSuccess } = options;
  
  const [items, setItems] = useState<Record<K, T>>(initialItems);
  const [optimisticItems, setOptimisticItems] = useState<Set<K>>(new Set());
  const [pendingItems, setPendingItems] = useState<Set<K>>(new Set());
  const [errors, setErrors] = useState<Record<K, Error>>({} as Record<K, Error>);

  // 單個項目的樂觀更新
  const optimisticUpdateItem = useCallback(async (key: K, newData: Partial<T>) => {
    const currentItem = items[key];
    const optimisticItem = { ...currentItem, ...newData } as T;
    
    // 應用樂觀更新
    setItems(prev => ({ ...prev, [key]: optimisticItem }));
    setOptimisticItems(prev => new Set([...prev, key]));
    setPendingItems(prev => new Set([...prev, key]));
    
    try {
      const result = await updateFn(key, optimisticItem);
      
      // 成功提交
      setItems(prev => ({ ...prev, [key]: result }));
      setOptimisticItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setPendingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      
      return result;
    } catch (error) {
      // 回滾
      setItems(prev => ({ ...prev, [key]: currentItem }));
      setOptimisticItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setPendingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setErrors(prev => ({ ...prev, [key]: error as Error }));
      
      throw error;
    }
  }, [items, updateFn]);

  // 批量樂觀更新
  const optimisticBatchUpdate = useCallback(async (updates: Record<K, Partial<T>>) => {
    const updatePromises = Object.entries(updates).map(async ([key, data]) => {
      try {
        await optimisticUpdateItem(key as K, data as Partial<T>);
        return { key: key as K, success: true };
      } catch (error) {
        return { key: key as K, success: false, error: error as Error };
      }
    });

    const results = await Promise.allSettled(updatePromises);
    
    const successItems: Record<K, T> = {} as Record<K, T>;
    const errorItems: Record<K, Error> = {} as Record<K, Error>;
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { key, success, error } = result.value;
        if (success) {
          successItems[key] = items[key];
        } else if (error) {
          errorItems[key] = error;
        }
      }
    });

    if (Object.keys(errorItems).length > 0) {
      onBatchError?.(errorItems);
    }
    
    if (Object.keys(successItems).length > 0) {
      onBatchSuccess?.(successItems);
    }
  }, [optimisticUpdateItem, items, onBatchError, onBatchSuccess]);

  return {
    items,
    optimisticItems: Array.from(optimisticItems),
    pendingItems: Array.from(pendingItems),
    errors,
    optimisticUpdateItem,
    optimisticBatchUpdate
  };
}

export default useOptimisticUpdates;
