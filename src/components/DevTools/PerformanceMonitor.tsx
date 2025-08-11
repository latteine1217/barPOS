// 性能監控面板組件 - 實時顯示性能指標
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePerformanceMonitor } from '@/hooks/core/usePerformanceMonitor';
import { useCacheStats } from '@/hooks/core/useSmartCache';

interface PerformanceMonitorProps {
  componentName?: string;
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoHide?: boolean;
  onClose?: () => void;
}

export function PerformanceMonitor({
  componentName = 'App',
  show = false,
  position = 'bottom-right',
  autoHide = true,
  onClose
}: PerformanceMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const performanceMonitor = usePerformanceMonitor({
    componentName,
    enabled: show,
    trackMemory: true,
    trackRenderReasons: true,
    onPerformanceIssue: (metrics, issue) => {
      console.warn(`Performance Issue: ${issue}`, metrics);
    }
  });

  const cacheStats = useCacheStats();

  const [systemMetrics, setSystemMetrics] = useState({
    fps: 60,
    memoryTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
    loadTime: 0
  });

  // 追蹤 FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setSystemMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime))
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    if (show) {
      animationId = requestAnimationFrame(measureFPS);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [show]);

  // 自動隱藏邏輯
  useEffect(() => {
    if (autoHide && show && performanceMonitor.metrics.renderCount > 100) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 10000); // 10秒後自動隱藏
      
      return () => clearTimeout(timer);
    }
    // 如果條件不滿足，返回 undefined（無需清理函數）
    return undefined;
  }, [autoHide, show, performanceMonitor.metrics.renderCount, onClose]);

  if (!show) return null;

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      maxWidth: isExpanded ? '400px' : '250px',
      fontSize: '12px',
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '10px', left: '10px' };
      case 'top-right':
        return { ...baseStyles, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '10px', left: '10px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '10px', right: '10px' };
    }
  };

  const getPerformanceColor = (value: number, threshold: number): string => {
    if (value > threshold * 1.5) return 'text-red-600';
    if (value > threshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };

  const { metrics } = performanceMonitor;

  return (
    <div style={getPositionStyles()}>
      <Card className="bg-black/80 text-white backdrop-blur-sm border-gray-600">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">性能監控</h4>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:bg-white/10 p-1 h-6 w-6"
              >
                {isExpanded ? '−' : '+'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/10 p-1 h-6 w-6"
              >
                ×
              </Button>
            </div>
          </div>

          {/* 基本指標 */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={getPerformanceColor(60 - systemMetrics.fps, 10)}>
                {systemMetrics.fps}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>渲染次數:</span>
              <span className={getPerformanceColor(metrics.renderCount, 100)}>
                {metrics.renderCount}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>平均渲染:</span>
              <span className={getPerformanceColor(metrics.averageRenderTime, 10)}>
                {formatNumber(metrics.averageRenderTime)}ms
              </span>
            </div>

            <div className="flex justify-between">
              <span>最後渲染:</span>
              <span className={getPerformanceColor(metrics.lastRenderTime, 16)}>
                {formatNumber(metrics.lastRenderTime)}ms
              </span>
            </div>

            {metrics.memoryUsage > 0 && (
              <div className="flex justify-between">
                <span>記憶體:</span>
                <span className={getPerformanceColor(metrics.memoryUsage, 50)}>
                  {formatNumber(metrics.memoryUsage)}MB
                </span>
              </div>
            )}
          </div>

          {/* 詳細信息 */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>最大渲染:</span>
                  <span className={getPerformanceColor(metrics.maxRenderTime, 16)}>
                    {formatNumber(metrics.maxRenderTime)}ms
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>最小渲染:</span>
                  <span className="text-green-500">
                    {formatNumber(metrics.minRenderTime === Infinity ? 0 : metrics.minRenderTime)}ms
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>總渲染時間:</span>
                  <span>{formatNumber(metrics.totalRenderTime)}ms</span>
                </div>

                {/* 緩存統計 */}
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-xs font-semibold mb-1">緩存統計</div>
                  <div className="flex justify-between text-xs">
                    <span>命中率:</span>
                    <span>
                      {cacheStats.stats.memoryHits + cacheStats.stats.localStorageHits > 0
                        ? formatNumber(
                            ((cacheStats.stats.memoryHits + cacheStats.stats.localStorageHits) / 
                             (cacheStats.stats.memoryHits + cacheStats.stats.localStorageHits + cacheStats.stats.misses)) * 100
                          )
                        : '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>緩存大小:</span>
                    <span>{cacheStats.stats.totalSize}</span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="pt-2 border-t border-gray-700 space-y-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={performanceMonitor.resetMetrics}
                    className="w-full text-xs h-6"
                  >
                    重置指標
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full text-xs h-6"
                  >
                    {showDetails ? '隱藏詳情' : '顯示詳情'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const report = performanceMonitor.exportMetrics();
                      navigator.clipboard?.writeText(report);
                      console.log('Performance Report:', report);
                    }}
                    className="w-full text-xs h-6"
                  >
                    導出報告
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 詳細報告 */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-600 max-h-40 overflow-y-auto">
              <div className="text-xs">
                <div><strong>組件:</strong> {componentName}</div>
                <div><strong>首次渲染:</strong> {formatNumber(metrics.firstRenderTime)}ms</div>
                <div><strong>監控狀態:</strong> {performanceMonitor.isMonitoring ? '啟用' : '停用'}</div>
                
                <div className="mt-2">
                  <strong>緩存詳情:</strong>
                  <div className="pl-2">
                    <div>記憶體命中: {cacheStats.stats.memoryHits}</div>
                    <div>本地存儲命中: {cacheStats.stats.localStorageHits}</div>
                    <div>會話存儲命中: {cacheStats.stats.sessionStorageHits}</div>
                    <div>未命中: {cacheStats.stats.misses}</div>
                    <div>清除次數: {cacheStats.stats.evictions}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default PerformanceMonitor;