// 性能監控工具
export class PerformanceMonitor {
  /**
   * 測量函數執行時間
   */
  static measureFunction(name, fn) {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`)
    
    // 在開發環境中記錄到控制台
    if (import.meta.env.DEV) {
      performance.mark(`${name}-start`)
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }
    
    return result
  }
  
  /**
   * 測量異步函數執行時間
   */
  static async measureAsyncFunction(name, asyncFn) {
    const start = performance.now()
    const result = await asyncFn()
    const end = performance.now()
    
    console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`)
    
    return result
  }
  
  /**
   * 測量 React 組件渲染時間
   */
  static measureComponent(WrappedComponent) {
    return function MeasuredComponent(props) {
      const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component'
      const start = performance.now()
      
      React.useEffect(() => {
        const end = performance.now()
        console.log(`[Component Performance] ${componentName} render took ${(end - start).toFixed(2)}ms`)
      })
      
      return React.createElement(WrappedComponent, props)
    }
  }
  
  /**
   * 收集 Web Vitals 指標
   */
  static collectWebVitals() {
    if ('web-vitals' in window || typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      }).catch(() => {
        console.log('[Performance] Web Vitals not available')
      })
    }
  }
  
  /**
   * 監控記憶體使用情況
   */
  static monitorMemory() {
    if ('memory' in performance) {
      const memory = performance.memory
      console.log('[Memory]', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }
  
  /**
   * 初始化性能監控
   */
  static init() {
    // 只在開發環境中啟用詳細監控
    if (import.meta.env.DEV) {
      console.log('[Performance Monitor] Initialized in development mode')
      
      // 定期檢查記憶體使用
      setInterval(() => {
        this.monitorMemory()
      }, 30000) // 30秒檢查一次
      
      // 收集 Web Vitals
      this.collectWebVitals()
    }
  }
}

// 在生產環境中報告 Web Vitals 的函數
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
  }
}

// Bundle 大小分析工具
export class BundleAnalyzer {
  /**
   * 分析載入的模組大小
   */
  static analyzeModules() {
    if (import.meta.env.DEV) {
      // 在開發模式中，可以分析 import 的模組
      console.log('[Bundle Analyzer] Module analysis available in build mode')
    }
  }
  
  /**
   * 檢查未使用的依賴
   */
  static checkUnusedDependencies() {
    // 這個功能需要配合 webpack-bundle-analyzer 或類似工具
    console.log('[Bundle Analyzer] Check build stats for unused dependencies')
  }
}

export default PerformanceMonitor