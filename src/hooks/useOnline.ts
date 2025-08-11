import { useNetworkStatus } from './core/useNetworkStatus';
import { logger } from '@/services/loggerService';

// 向後兼容的接口
interface LegacyOnlineStatus {
  isOnline: boolean;
  isOfflineReady: boolean;
  lastOnline: Date | null;
  connectionType: string;
}

/**
 * 向後兼容的 useOnline Hook
 * 內部使用新的 useNetworkStatus，保持現有 API 不變
 * @deprecated 建議使用新的 useNetworkStatus Hook
 */
export const useOnline = () => {
  // 只在開發模式下顯示警告，避免生產環境日誌污染
  if (process.env.NODE_ENV === 'development') {
    logger.warn('useOnline is deprecated, please use useNetworkStatus instead');
  }

  const {
    isOnline,
    isOfflineReady,
    lastOnline,
    connectionType,
    connectionQuality,
    offlineQueueLength,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
    isSlowConnection
  } = useNetworkStatus({
    maxRetries: 3,
    autoSync: true
  });

  // 向後兼容的狀態格式
  const legacyStatus: LegacyOnlineStatus = {
    isOnline,
    isOfflineReady,
    lastOnline,
    connectionType
  };

  return {
    ...legacyStatus,
    offlineQueueLength,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
    
    // 便利方法（保持向後兼容）
    get isSlowConnection() {
      return isSlowConnection;
    },
    
    get connectionQuality() {
      return connectionQuality;
    }
  };
};