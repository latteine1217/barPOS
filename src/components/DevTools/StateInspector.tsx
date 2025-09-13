// 狀態檢查器組件 - 檢查 Store 狀態變更
import { useState, useEffect, useRef, useCallback } from 'react';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { logger } from '@/services/loggerService';

interface StateSnapshot {
  storeName: string;
  state: any;
  timestamp: number;
  changeCount: number;
  lastChanged: string[];
}

interface StateChange {
  storeName: string;
  timestamp: number;
  changedKeys: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
}

interface StateInspectorProps {
  show?: boolean;
  maxSnapshots?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onClose?: () => void;
}

export function StateInspector({
  show = false,
  maxSnapshots = 100,
  position = 'top-right',
  onClose
}: StateInspectorProps) {
  const [stores, setStores] = useState<Record<string, StateSnapshot>>({});
  const [changes, setChanges] = useState<StateChange[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareStores] = useState<string[]>([]); // 移除未使用的 setter
  
  const changesRef = useRef<StateChange[]>([]);
  const previousStatesRef = useRef<Record<string, any>>({});

  // 追蹤 Store 狀態變更（使用 useCallback 穩定引用，避免重複綁定）
  const trackStore = useCallback((storeName: string, state: any) => {
    const previousState = previousStatesRef.current[storeName];
    const hasChanged = !previousState || JSON.stringify(previousState) !== JSON.stringify(state);
    
    if (hasChanged) {
      const changedKeys = previousState 
        ? Object.keys({ ...previousState, ...state }).filter(key => 
            JSON.stringify(previousState[key]) !== JSON.stringify(state[key])
          )
        : Object.keys(state);

      const change: StateChange = {
        storeName,
        timestamp: Date.now(),
        changedKeys,
        oldValues: previousState ? 
          Object.fromEntries(changedKeys.map(key => [key, previousState[key]])) : {},
        newValues: Object.fromEntries(changedKeys.map(key => [key, state[key]]))
      };

      changesRef.current = [change, ...changesRef.current].slice(0, maxSnapshots);
      setChanges([...changesRef.current]);

      setStores(prev => ({
        ...prev,
        [storeName]: {
          storeName,
          state,
          timestamp: Date.now(),
          changeCount: (prev[storeName]?.changeCount || 0) + 1,
          lastChanged: changedKeys
        }
      }));

      previousStatesRef.current[storeName] = JSON.parse(JSON.stringify(state));
    }
  }, [maxSnapshots]);

  // 比較兩個狀態的差異
  const getStateDiff = (state1: any, state2: any) => {
    const diff: any = {};
    const allKeys = new Set([...Object.keys(state1 || {}), ...Object.keys(state2 || {})]);
    
    allKeys.forEach(key => {
      if (JSON.stringify(state1?.[key]) !== JSON.stringify(state2?.[key])) {
        diff[key] = {
          old: state1?.[key],
          new: state2?.[key]
        };
      }
    });
    
    return diff;
  };

  // 格式化值顯示
  const formatValue = (value: any, maxLength = 50): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
      return value.length > maxLength 
        ? `"${value.substring(0, maxLength)}..."` 
        : `"${value}"`;
    }
    if (typeof value === 'function') return '[Function]';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return str.length > maxLength 
        ? str.substring(0, maxLength) + '...' 
        : str;
    }
    return String(value);
  };

  // 導出狀態快照
  const exportSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      stores: Object.values(stores),
      recentChanges: changes.slice(0, 20),
      summary: {
        totalStores: Object.keys(stores).length,
        totalChanges: Object.values(stores).reduce((sum, store) => sum + store.changeCount, 0),
        mostActiveStore: Object.values(stores).length > 0
          ? Object.values(stores).reduce((max, store) => 
              store.changeCount > (max?.changeCount || 0) ? store : max
            )?.storeName
          : null
      }
    };
    
    const jsonString = JSON.stringify(snapshot, null, 2);
    navigator.clipboard?.writeText(jsonString);
    logger.info('State snapshot exported to clipboard', { component: 'StateInspector' });
    return jsonString;
  };

  // 獲取位置樣式
  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9997,
      maxWidth: isExpanded ? '600px' : '350px',
      maxHeight: '700px',
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

  // 暴露 trackStore 到全局（開發模式下）- 僅在掛載時綁定一次
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).__trackStore = trackStore;
    }
    return () => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        if ((window as any).__trackStore === trackStore) {
          delete (window as any).__trackStore;
        }
      }
    };
  }, [trackStore]);

  if (!show) return null;

  const storesList = Object.values(stores).sort((a, b) => b.timestamp - a.timestamp);
  const selectedStoreData = selectedStore ? stores[selectedStore] : null;

  return (
    <div style={getPositionStyles()}>
      <Card className="bg-gray-900 text-white border-gray-700 overflow-hidden">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">狀態檢查器</h4>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCompareMode(!compareMode)}
                className={`text-white hover:bg-white/10 p-1 h-6 w-6 ${compareMode ? 'bg-blue-600' : ''}`}
              >
                ⚖️
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTimeline(!showTimeline)}
                className="text-white hover:bg-white/10 p-1 h-6 w-6"
              >
                📈
              </Button>
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

          {/* 統計信息 */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="text-center">
              <div className="text-gray-400">Stores</div>
              <div className="font-bold">{storesList.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Changes</div>
              <div className="font-bold">{changes.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Active</div>
              <div className="font-bold">
                {storesList.filter(store => Date.now() - store.timestamp < 5000).length}
              </div>
            </div>
          </div>

          {/* 比較模式 */}
          {compareMode && (
            <div className="mb-3 p-2 bg-gray-800 rounded">
              <div className="text-xs text-gray-400 mb-2">選擇要比較的 Store:</div>
              <div className="flex flex-wrap gap-1">
                {storesList.map(store => (
                  <button
                    key={store.storeName}
                    onClick={() => setSelectedStore(store.storeName)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedStore === store.storeName
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {store.storeName} {store.changeCount > 0 && `(${store.changeCount})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stores 列表或時間線 */}
          {!showTimeline ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {storesList.map(store => (
                <div
                  key={store.storeName}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedStore === store.storeName 
                      ? 'bg-blue-600/30 border border-blue-500' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedStore(
                    selectedStore === store.storeName ? null : store.storeName
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-400">{store.storeName}</span>
                    <span className="text-xs text-gray-400">
                      {store.changeCount} changes
                    </span>
                  </div>
                  {store.lastChanged.length > 0 && (
                    <div className="text-xs text-yellow-400">
                      Changed: {store.lastChanged.slice(0, 3).join(', ')}
                      {store.lastChanged.length > 3 && '...'}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {new Date(store.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {storesList.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  沒有追蹤到任何 Store
                </div>
              )}
            </div>
          ) : (
            /* 變更時間線 */
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {changes.map((change, index) => (
                <div key={index} className="p-2 bg-gray-800 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-400 font-medium">{change.storeName}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    {change.changedKeys.map(key => (
                      <div key={key} className="text-gray-300">
                        <span className="text-yellow-400">{key}:</span>{' '}
                        {formatValue(change.oldValues[key], 20)} →{' '}
                        {formatValue(change.newValues[key], 20)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 選中 Store 的詳細信息或比較結果 */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              {compareMode && compareStores.length === 2 ? (
                <div>
                  <h5 className="font-semibold mb-2">
                    比較: {compareStores[0]} vs {compareStores[1]}
                  </h5>
                  <div className="text-xs">
                    {(() => {
                      const store1 = compareStores[0] ? stores[compareStores[0]]?.state : null;
                      const store2 = compareStores[1] ? stores[compareStores[1]]?.state : null;
                      const diff = getStateDiff(store1, store2);
                      
                      return (
                        <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                          {JSON.stringify(diff, null, 2)}
                        </pre>
                      );
                    })()}
                  </div>
                </div>
              ) : selectedStoreData ? (
                <div>
                  <h5 className="font-semibold mb-2">{selectedStoreData.storeName} 詳情</h5>
                  <div className="space-y-1 text-xs">
                    <div><strong>更改次數:</strong> {selectedStoreData.changeCount}</div>
                    <div><strong>最後更新:</strong> {new Date(selectedStoreData.timestamp).toLocaleString()}</div>
                    <div><strong>當前狀態:</strong></div>
                    <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(selectedStoreData.state, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStores({});
                  setChanges([]);
                  changesRef.current = [];
                  previousStatesRef.current = {};
                }}
                className="text-xs h-6"
              >
                清除記錄
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={exportSnapshot}
                className="text-xs h-6"
              >
                導出快照
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded">
                使用 window.__trackStore('storeName', state) 追蹤 Store
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default StateInspector;
