import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/services/loggerService';

// 網路狀態接口
interface NetworkStatus {
  isOnline: boolean;
  isOfflineReady: boolean;
  lastOnline: Date | null;
  connectionType: string;
  connectionQuality: 'offline' | 'poor' | 'good' | 'excellent' | 'unknown';
}

// 離線動作數據類型
export type OfflineActionData = Record<string, unknown>;

// 離線隊列項目接口
export interface OfflineQueueItem {
  id: string;
  type: 'order' | 'table' | 'menu';
  action: string;
  data: OfflineActionData;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

// 同步結果接口
export interface SyncResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// 網路連接擴展類型
interface NavigatorWithConnection extends Navigator {
  connection?: {
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
}

// ===== Module-level helpers to keep stable references =====

function getConnectionType(): string {
  try {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection;
      return connection?.effectiveType || 'unknown';
    }
    return typeof navigator !== 'undefined' && navigator.onLine ? 'unknown' : 'none';
  } catch {
    return typeof navigator !== 'undefined' && navigator.onLine ? 'unknown' : 'none';
  }
}

function getConnectionQuality(): NetworkStatus['connectionQuality'] {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
  const connectionType = getConnectionType();

  switch (connectionType) {
    case '4g':
      return 'excellent';
    case '3g':
      return 'good';
    case '2g':
    case 'slow-2g':
      return 'poor';
    default:
      return 'unknown';
  }
}

function shallowEqualNetworkStatus(a: NetworkStatus, b: NetworkStatus): boolean {
  const aLast = a.lastOnline ? a.lastOnline.getTime() : null;
  const bLast = b.lastOnline ? b.lastOnline.getTime() : null;
  return (
    a.isOnline === b.isOnline &&
    a.isOfflineReady === b.isOfflineReady &&
    a.connectionType === b.connectionType &&
    a.connectionQuality === b.connectionQuality &&
    aLast === bLast
  );
}

// Hook 選項接口
export interface UseNetworkStatusOptions {
  // 最大重試次數
  maxRetries?: number;
  // 重試間隔（毫秒）
  retryDelay?: number;
  // 是否自動同步
  autoSync?: boolean;
  // 錯誤回調
  onError?: (error: Error, context: string) => void;
  // 同步成功回調
  onSyncSuccess?: (result: SyncResult) => void;
}

/**
 * 統一的網路狀態和離線功能 Hook
 * 提供智能重試機制、網路狀態監控和離線數據同步
 */
export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    autoSync = true,
    onError,
    onSyncSuccess
  } = options;

  // 網路狀態
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOfflineReady: false,
    lastOnline: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
    connectionType: getConnectionType(),
    connectionQuality: getConnectionQuality()
  });
  
  // 離線隊列
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  
  // 同步狀態
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 重試定時器引用
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Service Worker 檢查引用
  const serviceWorkerCheckRef = useRef<boolean>(false);

  // 錯誤處理輔助函數
  const handleError = useCallback((error: Error, context: string) => {
    logger.error(`NetworkStatus: ${context}`, { context }, error);
    onError?.(error, context);
  }, [onError]);

  // getConnectionType/getConnectionQuality moved to module scope to keep stable references

  // 儲存離線隊列到 localStorage
  const saveOfflineQueueToStorage = useCallback((queue: OfflineQueueItem[]) => {
    try {
      const serializedQueue = queue.map(item => ({
        ...item,
        timestamp: item.timestamp.toISOString()
      }));
      localStorage.setItem('networkOfflineQueue', JSON.stringify(serializedQueue));
      logger.debug('Offline queue saved to storage', { queueLength: queue.length });
    } catch (error) {
      handleError(error as Error, 'saveOfflineQueueToStorage');
    }
  }, [handleError]);

  // 從 localStorage 載入離線隊列
  const loadOfflineQueueFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('networkOfflineQueue');
      if (stored) {
        const parsedQueue = JSON.parse(stored);
        const queue: OfflineQueueItem[] = parsedQueue.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setOfflineQueue(queue);
        logger.debug('Offline queue loaded from storage', { queueLength: queue.length });
        return queue;
      }
      return [];
    } catch (error) {
      handleError(error as Error, 'loadOfflineQueueFromStorage');
      return [];
    }
  }, [handleError]);

  // 檢查 Service Worker 狀態
  const checkServiceWorkerStatus = useCallback(async () => {
    if (serviceWorkerCheckRef.current) return; // 防止重複檢查
    
    if ('serviceWorker' in navigator) {
      try {
        serviceWorkerCheckRef.current = true;
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration && registration.active) {
          setStatus(prev => ({ ...prev, isOfflineReady: true }));
          logger.info('Service Worker is ready', { context: 'NetworkStatus' });
        } else {
          logger.warn('Service Worker not found or inactive', { context: 'NetworkStatus' });
        }
      } catch (error) {
        handleError(error as Error, 'checkServiceWorkerStatus');
      }
    } else {
      logger.warn('Service Worker not supported', { context: 'NetworkStatus' });
    }
  }, [handleError]);

  // 智能重試機制
  const scheduleRetry = useCallback((callback: () => Promise<void>, delay: number) => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }
    
    retryTimerRef.current = setTimeout(async () => {
      try {
        await callback();
      } catch (error) {
        handleError(error as Error, 'scheduleRetry');
      }
    }, delay);
  }, [handleError]);

  // 執行單個離線操作
  const executeOfflineItem = useCallback(async (item: OfflineQueueItem): Promise<void> => {
    logger.debug('Executing offline item', { itemId: item.id, type: item.type, action: item.action });
    
    // 這裡會根據實際需求整合具體的服務
    // 暫時使用模擬實現
    switch (item.type) {
      case 'order':
        await simulateApiCall(item, 'order');
        break;
      case 'table':
        await simulateApiCall(item, 'table');
        break;
      case 'menu':
        await simulateApiCall(item, 'menu');
        break;
      default:
        throw new Error(`Unknown offline item type: ${item.type}`);
    }
  }, []);

  // 模擬 API 調用（實際實現時會替換為真實的服務調用）
  const simulateApiCall = async (item: OfflineQueueItem, type: string): Promise<void> => {
    // 模擬網路延遲和失敗率
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    
    // 5% 的失敗率用於測試重試機制
    if (Math.random() < 0.05) {
      throw new Error(`Simulated ${type} API failure for item ${item.id}`);
    }
    
    logger.info(`Successfully synced ${type} item`, { itemId: item.id });
  };

  // 處理離線隊列
  const processOfflineQueue = useCallback(async (): Promise<SyncResult> => {
    if (offlineQueue.length === 0) {
      return {
        success: true,
        processedCount: 0,
        failedCount: 0,
        errors: []
      };
    }

    if (isSyncing) {
      logger.warn('Sync already in progress', { context: 'processOfflineQueue' });
      return {
        success: false,
        processedCount: 0,
        failedCount: 0,
        errors: [{ id: 'sync-in-progress', error: 'Sync already in progress' }]
      };
    }
    
    setIsSyncing(true);
    
    const results: SyncResult = {
      success: true,
      processedCount: 0,
      failedCount: 0,
      errors: []
    };
    
    const failedItems: OfflineQueueItem[] = [];
    
    try {
      for (const item of offlineQueue) {
        try {
          await executeOfflineItem(item);
          results.processedCount++;
          logger.info('Successfully synced offline item', { itemId: item.id });
        } catch (error) {
          results.failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push({ id: item.id, error: errorMessage });
          
          // 檢查是否還能重試
          if (item.retryCount < item.maxRetries) {
            const updatedItem: OfflineQueueItem = {
              ...item,
              retryCount: item.retryCount + 1
            };
            failedItems.push(updatedItem);
            logger.warn('Offline item failed, will retry', {
              itemId: item.id,
              retryCount: updatedItem.retryCount,
              maxRetries: item.maxRetries
            });
          } else {
            logger.error('Offline item exceeded max retries', {
              itemId: item.id,
              maxRetries: item.maxRetries
            });
          }
        }
      }
      
      // 更新隊列（只保留需要重試的項目）
      setOfflineQueue(failedItems);
      saveOfflineQueueToStorage(failedItems);
      
      if (results.failedCount > 0) {
        results.success = false;
      }
      
      logger.info('Offline queue processing completed', {
        processed: results.processedCount,
        failed: results.failedCount,
        remaining: failedItems.length
      });
      
      onSyncSuccess?.(results);
      
      return results;
    } catch (error) {
      handleError(error as Error, 'processOfflineQueue');
      return {
        success: false,
        processedCount: results.processedCount,
        failedCount: results.failedCount + (offlineQueue.length - results.processedCount),
        errors: [...results.errors, { id: 'queue-error', error: error instanceof Error ? error.message : 'Unknown error' }]
      };
    } finally {
      setIsSyncing(false);
    }
  }, [offlineQueue, isSyncing, executeOfflineItem, saveOfflineQueueToStorage, onSyncSuccess, handleError]);

  // 添加到離線隊列
  const addToOfflineQueue = useCallback((
    type: OfflineQueueItem['type'],
    action: string,
    data: OfflineActionData
  ): string => {
    const queueItem: OfflineQueueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      action,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries
    };

    setOfflineQueue(prev => {
      const newQueue = [...prev, queueItem];
      saveOfflineQueueToStorage(newQueue);
      return newQueue;
    });
    
    logger.info('Added item to offline queue', {
      itemId: queueItem.id,
      type: queueItem.type,
      action: queueItem.action
    });
    
    return queueItem.id;
  }, [maxRetries, saveOfflineQueueToStorage]);

  // 清空離線隊列
  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
    localStorage.removeItem('networkOfflineQueue');
    logger.info('Offline queue cleared');
  }, []);

  // 手動觸發同步
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!status.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    return await processOfflineQueue();
  }, [status.isOnline, processOfflineQueue]);

  // 網路狀態變化處理
  useEffect(() => {
    const updateNetworkStatus = () => {
      setStatus(prev => {
        const next: NetworkStatus = {
          ...prev,
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : prev.isOnline,
          lastOnline: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : prev.lastOnline,
          connectionType: getConnectionType(),
          connectionQuality: getConnectionQuality()
        };
        return shallowEqualNetworkStatus(prev, next) ? prev : next;
      });
    };

    const handleOnline = async () => {
      logger.info('Network back online');
      updateNetworkStatus();
      
      if (autoSync && offlineQueue.length > 0) {
        // 延遲一點時間確保網路穩定
        scheduleRetry(async () => {
          await processOfflineQueue();
        }, retryDelay);
      }
    };

    const handleOffline = () => {
      logger.warn('Network went offline');
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
      logger.debug('Connection type changed', { newType: getConnectionType() });
    };

    // 註冊事件監聽器
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 監聽連線類型變化
    if ('connection' in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection;
      connection?.addEventListener('change', handleConnectionChange);
    }

    // 初始化檢查
    updateNetworkStatus();
    checkServiceWorkerStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as NavigatorWithConnection).connection;
        connection?.removeEventListener('change', handleConnectionChange);
      }
      
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [autoSync, offlineQueue.length, checkServiceWorkerStatus, processOfflineQueue, scheduleRetry, retryDelay]);

  // 初始化時載入離線隊列
  useEffect(() => {
    loadOfflineQueueFromStorage();
  }, [loadOfflineQueueFromStorage]);

  // ============ 返回值 ============

  return {
    // 網路狀態
    ...status,
    
    // 離線隊列
    offlineQueueLength: offlineQueue.length,
    isSyncing,
    
    // 操作方法
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
    syncNow,
    
    // 便利屬性
    isSlowConnection: status.connectionQuality === 'poor',
    canSync: status.isOnline && !isSyncing,
    hasOfflineData: offlineQueue.length > 0,
    
    // 工具方法
    getQueueStatus: () => ({
      total: offlineQueue.length,
      byType: {
        order: offlineQueue.filter(item => item.type === 'order').length,
        table: offlineQueue.filter(item => item.type === 'table').length,
        menu: offlineQueue.filter(item => item.type === 'menu').length
      }
    })
  };
};

export default useNetworkStatus;
