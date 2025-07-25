import { useState, useEffect, useCallback } from 'react';
import { useError } from '../contexts/ErrorContext';

interface OnlineStatus {
  isOnline: boolean;
  isOfflineReady: boolean;
  lastOnline: Date | null;
  connectionType: string;
}

// 定義離線隊列數據的類型
type OfflineActionData = Record<string, unknown>;

interface OfflineQueue {
  id: string;
  type: 'order' | 'table' | 'menu';
  action: string;
  data: OfflineActionData;
  timestamp: Date;
  retryCount: number;
}

// 為navigator.connection擴展類型
interface NavigatorWithConnection extends Navigator {
  connection?: {
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

export const useOnline = () => {
  const { showInfo, showWarning, showSuccess } = useError();
  
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: navigator.onLine,
    isOfflineReady: false,
    lastOnline: navigator.onLine ? new Date() : null,
    connectionType: getConnectionType()
  });
  
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueue[]>([]);

  // 儲存離線隊列到 localStorage
  const saveOfflineQueueToStorage = useCallback((queue: OfflineQueue[]) => {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(queue));
    } catch (error) {
      console.error('[Offline] Error saving offline queue to storage:', error);
    }
  }, []);

  // 從 localStorage 載入離線隊列
  const loadOfflineQueueFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('offlineQueue');
      if (stored) {
        const queue = JSON.parse(stored);
        setOfflineQueue(queue);
      }
    } catch (error) {
      console.error('[Offline] Error loading offline queue from storage:', error);
    }
  }, []);

  // 檢查 Service Worker 是否就緒
  const checkServiceWorkerStatus = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          setStatus(prev => ({ ...prev, isOfflineReady: true }));
          console.log('[Offline] Service Worker is ready');
        }
      } catch (error) {
        console.error('[Offline] Error checking Service Worker:', error);
      }
    }
  }, []);

  // 處理離線隊列
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    
    const failedItems: OfflineQueue[] = [];
    
    for (const item of offlineQueue) {
      try {
        await executeOfflineItem(item);
        console.log('[Offline] Successfully synced offline item:', item.id);
      } catch (error) {
        console.error('[Offline] Failed to sync offline item:', item.id, error);
        
        // 重試次數限制
        if (item.retryCount < 3) {
          failedItems.push({
            ...item,
            retryCount: item.retryCount + 1
          });
        } else {
          showWarning(`離線操作同步失敗: ${item.action} (已達最大重試次數)`);
        }
      }
    }
    
    setOfflineQueue(failedItems);
    saveOfflineQueueToStorage(failedItems);
    
    if (failedItems.length === 0) {
      showSuccess('所有離線資料已成功同步');
    }
  }, [offlineQueue, showSuccess, showWarning, saveOfflineQueueToStorage]);

  // 檢測網路狀態變化
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline] Network back online');
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date(),
        connectionType: getConnectionType()
      }));
      
      showSuccess('網路連線已恢復，正在同步離線資料...');
      
      // 處理離線隊列
      processOfflineQueue();
    };

    const handleOffline = () => {
      console.log('[Offline] Network went offline');
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        connectionType: 'none'
      }));
      
      showWarning('網路連線中斷，已切換至離線模式');
    };

    const handleConnectionChange = () => {
      setStatus(prev => ({
        ...prev,
        connectionType: getConnectionType()
      }));
    };

    // 註冊事件監聽器
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 監聽連線類型變化 (如果支援)
    if ('connection' in navigator) {
      (navigator as NavigatorWithConnection).connection?.addEventListener('change', handleConnectionChange);
    }

    // 檢查 Service Worker 狀態
    checkServiceWorkerStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        (navigator as NavigatorWithConnection).connection?.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [showSuccess, showWarning, checkServiceWorkerStatus, processOfflineQueue]);

  // 加入離線隊列
  const addToOfflineQueue = useCallback((
    type: OfflineQueue['type'],
    action: string,
    data: OfflineActionData
  ): string => {
    const queueItem: OfflineQueue = {
      id: Date.now().toString(),
      type,
      action,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    setOfflineQueue(prev => [...prev, queueItem]);
    
    // 儲存到 localStorage 以防頁面重新載入
    saveOfflineQueueToStorage([...offlineQueue, queueItem]);
    
    showInfo(`操作已加入離線隊列，將在網路恢復時自動同步`);
    
    return queueItem.id;
  }, [offlineQueue, showInfo, saveOfflineQueueToStorage]);

  // 執行單個離線操作
  const executeOfflineItem = async (item: OfflineQueue): Promise<void> => {
    // 這裡需要根據 item.type 和 action 來執行對應的 API 呼叫
    // 實際實作會依賴於具體的 API service
    
    switch (item.type) {
      case 'order':
        // 處理訂單相關操作
        await handleOfflineOrder(item);
        break;
      case 'table':
        // 處理桌位相關操作
        await handleOfflineTable(item);
        break;
      case 'menu':
        // 處理菜單相關操作
        await handleOfflineMenu(item);
        break;
      default:
        throw new Error(`Unknown offline item type: ${item.type}`);
    }
  };

  // 清空離線隊列
  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
    localStorage.removeItem('offlineQueue');
    showInfo('離線隊列已清空');
  }, [showInfo]);

  // 初始化時載入離線隊列
  useEffect(() => {
    loadOfflineQueueFromStorage();
  }, [loadOfflineQueueFromStorage]);

  return {
    ...status,
    offlineQueueLength: offlineQueue.length,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
    
    // 便利方法
    get isSlowConnection() {
      return status.connectionType === '2g' || status.connectionType === 'slow-2g';
    },
    
    get connectionQuality() {
      if (!status.isOnline) return 'offline';
      if (status.connectionType === '4g') return 'excellent';
      if (status.connectionType === '3g') return 'good';
      if (status.connectionType === '2g') return 'poor';
      return 'unknown';
    }
  };
};

// === 工具函數 ===

function getConnectionType(): string {
  if ('connection' in navigator) {
    const connection = (navigator as NavigatorWithConnection).connection;
    return connection?.effectiveType || 'unknown';
  }
  return navigator.onLine ? 'unknown' : 'none';
}

// 這些函數需要根據實際的 API service 來實作
async function handleOfflineOrder(item: OfflineQueue): Promise<void> {
  // TODO: 實作訂單離線同步邏輯
  // 例如: await orderService.createOrder(item.data);
  console.log('[Offline] Syncing offline order:', item);
}

async function handleOfflineTable(item: OfflineQueue): Promise<void> {
  // TODO: 實作桌位離線同步邏輯
  // 例如: await tableService.updateTable(item.data);
  console.log('[Offline] Syncing offline table:', item);
}

async function handleOfflineMenu(item: OfflineQueue): Promise<void> {
  // TODO: 實作菜單離線同步邏輯
  // 例如: await menuService.updateMenu(item.data);
  console.log('[Offline] Syncing offline menu:', item);
}