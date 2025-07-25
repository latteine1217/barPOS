import React from 'react';

// Web Vitals 指標類型
interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

type WebVitalsCallback = (metric: Metric) => void;

// 記憶體資訊介面
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// 擴展 Performance 介面
declare global {
  interface Performance {
    memory?: MemoryInfo;
  }
}

// 性能監控工具
export class PerformanceMonitor {
  /**
   * 測量函數執行時間
   */
  static measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
    
    // 在開發環境中記錄到控制台
    if (import.meta.env.DEV) {
      performance.mark(`${name}-start`);
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    
    return result;
  }
  
  /**
   * 測量異步函數執行時間
   */
  static async measureAsyncFunction<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await asyncFn();
    const end = performance.now();
    
    console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
    
    return result;
  }
  
  /**
   * 測量 React 組件渲染時間
   */
  static measureComponent<P extends object>(WrappedComponent: React.ComponentType<P>): React.FC<P> {
    return function MeasuredComponent(props: P) {
      const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
      const start = performance.now();
      
      React.useEffect(() => {
        const end = performance.now();
        console.log(`[Component Performance] ${componentName} render took ${(end - start).toFixed(2)}ms`);
      });
      
      return React.createElement(WrappedComponent, props);
    };
  }
  
  /**
   * 收集 Web Vitals 指標
   */
  static collectWebVitals(): void {
    if (typeof window !== 'undefined') {
      import('web-vitals').then((webVitals) => {
        if (webVitals.onCLS) webVitals.onCLS(console.log);
        if (webVitals.onINP) webVitals.onINP(console.log);
        if (webVitals.onFCP) webVitals.onFCP(console.log);
        if (webVitals.onLCP) webVitals.onLCP(console.log);
        if (webVitals.onTTFB) webVitals.onTTFB(console.log);
      }).catch(() => {
        console.log('[Performance] Web Vitals not available');
      });
    }
  }
  
  /**
   * 監控記憶體使用情況
   */
  static monitorMemory(): void {
    if (performance.memory) {
      const memory = performance.memory;
      console.log('[Memory]', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }
  
  /**
   * 初始化性能監控
   */
  static init(): void {
    // 只在開發環境中啟用詳細監控
    if (import.meta.env.DEV) {
      console.log('[Performance Monitor] Initialized in development mode');
      
      // 定期檢查記憶體使用
      setInterval(() => {
        this.monitorMemory();
      }, 30000); // 30秒檢查一次
      
      // 收集 Web Vitals
      this.collectWebVitals();
    }
  }
}

// 在生產環境中報告 Web Vitals 的函數
export const reportWebVitals = (onPerfEntry?: WebVitalsCallback): void => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then((webVitals) => {
      if (webVitals.onCLS) webVitals.onCLS(onPerfEntry);
      if (webVitals.onINP) webVitals.onINP(onPerfEntry);
      if (webVitals.onFCP) webVitals.onFCP(onPerfEntry);
      if (webVitals.onLCP) webVitals.onLCP(onPerfEntry);
      if (webVitals.onTTFB) webVitals.onTTFB(onPerfEntry);
    });
  }
};

// Bundle 大小分析工具
export class BundleAnalyzer {
  /**
   * 分析載入的模組大小
   */
  static analyzeModules(): void {
    if (import.meta.env.DEV) {
      // 在開發模式中，可以分析 import 的模組
      console.log('[Bundle Analyzer] Module analysis available in build mode');
    }
  }
  
  /**
   * 檢查未使用的依賴
   */
  static checkUnusedDependencies(): void {
    // 這個功能需要配合 webpack-bundle-analyzer 或類似工具
    console.log('[Bundle Analyzer] Check build stats for unused dependencies');
  }
}

export default PerformanceMonitor;