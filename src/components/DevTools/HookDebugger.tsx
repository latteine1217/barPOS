// Hook 調試器組件 - 可視化 Hook 狀態變更
import { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { logger } from '@/services/loggerService';

interface HookState {
  name: string;
  value: any;
  timestamp: number;
  changeCount: number;
  lastChangeReason: string | undefined;
}

interface HookHistory {
  timestamp: number;
  changes: Array<{
    hookName: string;
    oldValue: any;
    newValue: any;
    reason: string | undefined;
  }>;
}

interface HookDebuggerProps {
  show?: boolean;
  maxHistoryItems?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onClose?: () => void;
}

export function HookDebugger({
  show = false,
  maxHistoryItems = 50,
  position = 'top-left',
  onClose
}: HookDebuggerProps) {
  const [hooks, setHooks] = useState<Record<string, HookState>>({});
  const [history, setHistory] = useState<HookHistory[]>([]);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const historyRef = useRef<HookHistory[]>([]);

  // 註冊 Hook 狀態追蹤
  const trackHook = (name: string, value: any, reason?: string) => {
    setHooks(prev => {
      const existing = prev[name];
      const hasChanged = !existing || JSON.stringify(existing.value) !== JSON.stringify(value);
      
      if (hasChanged) {
        // 記錄歷史
        const historyEntry: HookHistory = {
          timestamp: Date.now(),
          changes: [{
            hookName: name,
            oldValue: existing?.value,
            newValue: value,
            reason
          }]
        };
        
        historyRef.current = [historyEntry, ...historyRef.current].slice(0, maxHistoryItems);
        setHistory([...historyRef.current]);

        return {
          ...prev,
          [name]: {
            name,
            value,
            timestamp: Date.now(),
            changeCount: (existing?.changeCount || 0) + 1,
            lastChangeReason: reason
          }
        };
      }
      
      return prev;
    });
  };

  // 導出 Hook 狀態
  const exportHookState = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      hooks: Object.values(hooks),
      history: history.slice(0, 10), // 只導出最近10條歷史
      summary: {
        totalHooks: Object.keys(hooks).length,
        totalChanges: Object.values(hooks).reduce((sum, hook) => sum + hook.changeCount, 0),
        mostActiveHook: Object.values(hooks).length > 0 
          ? Object.values(hooks).reduce((max, hook) => 
              hook.changeCount > (max?.changeCount || 0) ? hook : max
            )?.name 
          : null
      }
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard?.writeText(jsonString);
    logger.info('Hook state exported to clipboard', { component: 'HookDebugger' });
    return jsonString;
  };

  // 清除歷史記錄
  const clearHistory = () => {
    setHistory([]);
    historyRef.current = [];
    setHooks(prev => {
      const cleared: Record<string, HookState> = {};
      Object.keys(prev).forEach(key => {
        cleared[key] = { 
          ...prev[key], 
          changeCount: 0,
          name: prev[key]?.name || '',
          value: prev[key]?.value,
          timestamp: prev[key]?.timestamp || Date.now(),
          lastChangeReason: prev[key]?.lastChangeReason || ''
        };
      });
      return cleared;
    });
  };

  // 格式化值顯示
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'function') return '[Function]';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return keys.length > 3 
        ? `{${keys.slice(0, 3).join(', ')}...}` 
        : JSON.stringify(value);
    }
    return String(value);
  };

  // 獲取位置樣式
  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9998,
      maxWidth: isExpanded ? '500px' : '300px',
      maxHeight: '600px',
      fontSize: '12px'
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

  // 暴露 trackHook 到全局（開發模式下）- 必須在 early return 之前
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).__trackHook = trackHook;
    }
  }, [trackHook]);

  if (!show) return null;

  const hooksList = Object.values(hooks).sort((a, b) => b.timestamp - a.timestamp);
  const selectedHookData = selectedHook ? hooks[selectedHook] : null;

  return (
    <div style={getPositionStyles()}>
      <Card className="bg-gray-900 text-white border-gray-700 overflow-hidden">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Hook 調試器</h4>
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
                onClick={() => setShowHistory(!showHistory)}
                className="text-white hover:bg-white/10 p-1 h-6 w-6"
              >
                📜
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

          {/* 統計信息 */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="text-center">
              <div className="text-gray-400">Hooks</div>
              <div className="font-bold">{hooksList.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Changes</div>
              <div className="font-bold">
                {hooksList.reduce((sum, hook) => sum + hook.changeCount, 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">History</div>
              <div className="font-bold">{history.length}</div>
            </div>
          </div>

          {/* Hooks 列表 */}
          {!showHistory ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {hooksList.map(hook => (
                <div
                  key={hook.name}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedHook === hook.name 
                      ? 'bg-blue-600/30 border border-blue-500' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedHook(
                    selectedHook === hook.name ? null : hook.name
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-400">{hook.name}</span>
                    <span className="text-xs text-gray-400">
                      {hook.changeCount} changes
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 truncate">
                    {formatValue(hook.value)}
                  </div>
                  {hook.lastChangeReason && (
                    <div className="text-xs text-yellow-400 italic">
                      {hook.lastChangeReason}
                    </div>
                  )}
                </div>
              ))}
              
              {hooksList.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  沒有追蹤到任何 Hook
                </div>
              )}
            </div>
          ) : (
            /* 歷史記錄 */
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((entry, index) => (
                <div key={index} className="p-2 bg-gray-800 rounded">
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                  {entry.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="text-xs">
                      <span className="text-blue-400">{change.hookName}</span>
                      <div className="text-gray-300">
                        {formatValue(change.oldValue)} → {formatValue(change.newValue)}
                      </div>
                      {change.reason && (
                        <div className="text-yellow-400 italic">{change.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* 選中 Hook 的詳細信息 */}
          {isExpanded && selectedHookData && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <h5 className="font-semibold mb-2">{selectedHookData.name} 詳情</h5>
              <div className="space-y-1 text-xs">
                <div><strong>當前值:</strong></div>
                <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedHookData.value, null, 2)}
                </pre>
                <div><strong>更改次數:</strong> {selectedHookData.changeCount}</div>
                <div><strong>最後更新:</strong> {new Date(selectedHookData.timestamp).toLocaleString()}</div>
                {selectedHookData.lastChangeReason && (
                  <div><strong>更改原因:</strong> {selectedHookData.lastChangeReason}</div>
                )}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearHistory}
                className="text-xs h-6"
              >
                清除記錄
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={exportHookState}
                className="text-xs h-6"
              >
                導出狀態
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded">
                使用 window.__trackHook('hookName', value, 'reason') 追蹤 Hook
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default HookDebugger;