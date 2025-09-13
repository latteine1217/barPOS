// 性能監控 Hook - 追蹤組件渲染和性能指標
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/services/loggerService';

export interface PerformanceMetrics {
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  memoryUsage: number;
  lastRenderTime: number;
  firstRenderTime: number;
}

export interface UsePerformanceMonitorOptions {
  componentName?: string;
  enabled?: boolean;
  sampleRate?: number; // 0-1, 採樣率
  trackMemory?: boolean;
  trackRenderReasons?: boolean;
  onPerformanceIssue?: (metrics: PerformanceMetrics, issue: string) => void;
  thresholds?: {
    maxRenderTime?: number;
    maxAverageRenderTime?: number;
    maxRenderCount?: number;
  };
}

export interface PerformanceMonitorReturn {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  exportMetrics: () => string;
  trackRenderReason?: (props?: any, state?: any) => void;
}

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): PerformanceMonitorReturn {
  const {
    componentName = 'UnknownComponent',
    enabled = true,
    sampleRate = 1.0,
    trackMemory = true,
    trackRenderReasons = true,
    onPerformanceIssue,
    thresholds = {
      maxRenderTime: 16, // 16ms for 60fps
      maxAverageRenderTime: 10,
      maxRenderCount: 1000
    }
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity,
    memoryUsage: 0,
    lastRenderTime: 0,
    firstRenderTime: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(enabled);
  
  // 性能追蹤引用
  const renderStartTimeRef = useRef<number>(0);
  const shouldSampleThisRenderRef = useRef<boolean>(true);
  // 累積待提交的渲染數據（避免每次渲染 setState）
  const pendingRef = useRef<{
    count: number;
    total: number;
    max: number;
    min: number;
    last: number;
    first: number;
    hasFirst: boolean;
    mem: number;
  }>({ count: 0, total: 0, max: 0, min: Infinity, last: 0, first: 0, hasFirst: false, mem: 0 });
  const lastCommitTsRef = useRef<number>(0);
  const maxUpdatesPerSec = 10; // 防止高頻 UI 更新（可調）
  const commitIntervalMs = 250; // 批次提交間隔（可調）
  const previousPropsRef = useRef<any>(null);
  const previousStateRef = useRef<any>(null);
  const renderReasonsRef = useRef<string[]>([]);
  
  // 開始渲染測量
  const startRenderMeasurement = useCallback(() => {
    if (!isMonitoring) return;
    // 根據採樣率決定是否記錄本次渲染
    shouldSampleThisRenderRef.current = Math.random() <= sampleRate;
    if (!shouldSampleThisRenderRef.current) return;

    renderStartTimeRef.current = performance.now();
  }, [isMonitoring, sampleRate]);

  // 結束渲染測量
  const endRenderMeasurement = useCallback(() => {
    if (!isMonitoring || !shouldSampleThisRenderRef.current || renderStartTimeRef.current === 0) return;

    const renderTime = performance.now() - renderStartTimeRef.current;
    renderStartTimeRef.current = 0;

    // 將結果累積到待提交區，不立即 setState 以避免自觸發渲染迴圈
    const p = pendingRef.current;
    p.count += 1;
    p.total += renderTime;
    p.max = Math.max(p.max, renderTime);
    p.min = Math.min(p.min, renderTime);
    p.last = renderTime;
    if (!p.hasFirst) {
      p.first = renderTime;
      p.hasFirst = true;
    }
    if (trackMemory) {
      p.mem = getMemoryUsage();
    }
  }, [isMonitoring, trackMemory]);

  // 獲取內存使用情況
  const getMemoryUsage = useCallback((): number => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      return (window.performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }, []);

  // 檢查性能閾值
  const checkPerformanceThresholds = useCallback((currentMetrics: PerformanceMetrics) => {
    if (!onPerformanceIssue) return;

    const issues: string[] = [];

    if (thresholds.maxRenderTime && currentMetrics.lastRenderTime > thresholds.maxRenderTime) {
      issues.push(`Render time exceeded threshold: ${currentMetrics.lastRenderTime.toFixed(2)}ms > ${thresholds.maxRenderTime}ms`);
    }

    if (thresholds.maxAverageRenderTime && currentMetrics.averageRenderTime > thresholds.maxAverageRenderTime) {
      issues.push(`Average render time exceeded threshold: ${currentMetrics.averageRenderTime.toFixed(2)}ms > ${thresholds.maxAverageRenderTime}ms`);
    }

    if (thresholds.maxRenderCount && currentMetrics.renderCount > thresholds.maxRenderCount) {
      issues.push(`Render count exceeded threshold: ${currentMetrics.renderCount} > ${thresholds.maxRenderCount}`);
    }

    issues.forEach(issue => {
      onPerformanceIssue(currentMetrics, issue);
      logger.warn(`Performance issue detected in ${componentName}: ${issue}`, {
        component: 'usePerformanceMonitor'
      });
    });
  }, [onPerformanceIssue, thresholds, componentName]);

  // 追蹤渲染原因
  const trackRenderReason = useCallback((props?: any, state?: any) => {
    if (!trackRenderReasons || !isMonitoring) return;

    const reasons: string[] = [];

    // 檢查 props 變化
    if (props && previousPropsRef.current) {
      const changedProps = Object.keys(props).filter(
        key => props[key] !== previousPropsRef.current[key]
      );
      if (changedProps.length > 0) {
        reasons.push(`Props changed: ${changedProps.join(', ')}`);
      }
    }

    // 檢查 state 變化
    if (state && previousStateRef.current) {
      const changedState = Object.keys(state).filter(
        key => state[key] !== previousStateRef.current[key]
      );
      if (changedState.length > 0) {
        reasons.push(`State changed: ${changedState.join(', ')}`);
      }
    }

    if (reasons.length === 0 && (previousPropsRef.current || previousStateRef.current)) {
      reasons.push('Unknown reason');
    }

    renderReasonsRef.current = reasons;
    previousPropsRef.current = props;
    previousStateRef.current = state;

    if (reasons.length > 0) {
      logger.debug(`${componentName} re-rendered: ${reasons.join(', ')}`, {
        component: 'usePerformanceMonitor'
      });
    }
  }, [trackRenderReasons, isMonitoring, componentName]);

  // 開始監控
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    logger.info(`Started performance monitoring for ${componentName}`, {
      component: 'usePerformanceMonitor'
    });
  }, [componentName]);

  // 停止監控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    logger.info(`Stopped performance monitoring for ${componentName}`, {
      component: 'usePerformanceMonitor'
    });
  }, [componentName]);

  // 重置指標
  const resetMetrics = useCallback(() => {
    setMetrics({
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity,
      memoryUsage: 0,
      lastRenderTime: 0,
      firstRenderTime: 0
    });
    // 清空暫存
    pendingRef.current = { count: 0, total: 0, max: 0, min: Infinity, last: 0, first: 0, hasFirst: false, mem: 0 };
    renderReasonsRef.current = [];
    logger.info(`Reset performance metrics for ${componentName}`, {
      component: 'usePerformanceMonitor'
    });
  }, [componentName]);

  // 導出指標
  const exportMetrics = useCallback(() => {
    const report = {
      componentName,
      timestamp: new Date().toISOString(),
      metrics,
      recentRenderReasons: renderReasonsRef.current,
      thresholds,
      sessionInfo: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: trackMemory ? getMemoryUsage() : null
      }
    };

    return JSON.stringify(report, null, 2);
  }, [componentName, metrics, thresholds, trackMemory, getMemoryUsage]);

  // 在每次渲染時進行測量，但不直接 setState（避免回饋迴圈）
  useEffect(() => {
    startRenderMeasurement();
    const timeoutId = setTimeout(() => {
      endRenderMeasurement();
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      // 不在清理階段強制提交，避免重入
    };
  });

  // 以固定頻率批次提交累積的度量資料到 state（限制更新頻率）
  useEffect(() => {
    if (!isMonitoring) return;
    const id = setInterval(() => {
      const now = performance.now();
      if (now - lastCommitTsRef.current < 1000 / maxUpdatesPerSec) return;
      const p = pendingRef.current;
      if (p.count === 0) return;

      setMetrics(prev => {
        const renderCount = prev.renderCount + p.count;
        const totalRenderTime = prev.totalRenderTime + p.total;
        const averageRenderTime = totalRenderTime / renderCount;
        const maxRenderTime = Math.max(prev.maxRenderTime, p.max);
        const minRenderTime = Math.min(prev.minRenderTime, p.min);
        const lastRenderTime = p.last || prev.lastRenderTime;
        const firstRenderTime = prev.firstRenderTime || (p.hasFirst ? p.first : 0);
        const memoryUsage = p.mem || prev.memoryUsage;

        const next: PerformanceMetrics = {
          renderCount,
          totalRenderTime,
          averageRenderTime,
          maxRenderTime,
          minRenderTime,
          memoryUsage,
          lastRenderTime,
          firstRenderTime
        };

        // 檢查性能問題（使用合併後的度量）
        checkPerformanceThresholds(next);

        return next;
      });

      // 重置暫存累積
      pendingRef.current = { count: 0, total: 0, max: 0, min: Infinity, last: 0, first: 0, hasFirst: false, mem: 0 };
      lastCommitTsRef.current = now;
    }, commitIntervalMs);

    return () => clearInterval(id);
  }, [isMonitoring, commitIntervalMs, checkPerformanceThresholds]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    exportMetrics,
    // 內部方法暴露給高級用戶
    trackRenderReason: trackRenderReason as any
  };
}

// 渲染追蹤 Hook
export function useRenderTracker(componentName: string, dependencies: any[] = []) {
  const renderCountRef = useRef(0);
  const previousDependenciesRef = useRef<any[]>(dependencies);
  
  useEffect(() => {
    renderCountRef.current++;
    
    // 檢查依賴變化
    const changedDeps = dependencies
      .map((dep, index) => ({ index, dep, prev: previousDependenciesRef.current[index] }))
      .filter(({ dep, prev }) => dep !== prev)
      .map(({ index }) => index);

    if (changedDeps.length > 0) {
      logger.debug(`${componentName} re-rendered due to dependency changes at indices: ${changedDeps.join(', ')}`, {
        component: 'useRenderTracker',
        renderCount: renderCountRef.current
      });
    } else if (renderCountRef.current > 1) {
      logger.debug(`${componentName} re-rendered with no dependency changes`, {
        component: 'useRenderTracker',
        renderCount: renderCountRef.current
      });
    }

    previousDependenciesRef.current = dependencies;
  });

  return renderCountRef.current;
}

// 組件大小追蹤 Hook
export function useComponentSizeTracker(componentName: string) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
        
        logger.debug(`${componentName} size changed`, {
          component: 'useComponentSizeTracker',
          width: Math.round(width),
          height: Math.round(height)
        });
      }
    });

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [componentName]);

  return { size, ref: elementRef };
}

export default usePerformanceMonitor;
