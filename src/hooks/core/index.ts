// 核心系統 hooks 導出
export { useNetworkStatus } from './useNetworkStatus';
export { useSmartCache, useCacheStats, useBatchCache } from './useSmartCache';
export { useRealTimeUpdates, useRealtimeSubscription, createFieldsComparator, createDeepComparator } from './useRealTimeUpdates';
export { useOptimisticUpdates, useOptimisticBatch } from './useOptimisticUpdates';
export { usePerformanceMonitor, useRenderTracker, useComponentSizeTracker } from './usePerformanceMonitor';
// Phase 3 預留
// export { useAppLifecycle } from './useAppLifecycle';