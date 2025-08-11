/**
 * 即時日誌查看器組件
 * 顯示來自 console 攔截器的日誌訊息
 * 使用 Vite 原生日誌功能
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { LogEntry, LogType, LogLevel, consoleInterceptor } from '../services/consoleInterceptorService';

interface LogViewerProps {
  className?: string;
  maxLogs?: number;
  enableFilters?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
}

interface LogFilters {
  type: LogType | 'all';
  level: LogLevel | 'all';
  component: string;
  searchTerm: string;
}

// 日誌級別顏色映射
const LOG_LEVEL_COLORS = {
  debug: 'text-gray-600 bg-gray-100',
  info: 'text-blue-600 bg-blue-100',
  warn: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
} as const;

// 日誌類型圖標映射
const LOG_TYPE_ICONS = {
  log: '📝',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  debug: '🐛',
  trace: '🔍',
  table: '📊',
  group: '📁',
  groupCollapsed: '📂',
  groupEnd: '📁',
} as const;

// 單個日誌項目組件
const LogItem = memo<{ log: LogEntry; searchTerm?: string }>(({ log, searchTerm }) => {
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const highlightText = (text: string, searchTerm?: string): React.ReactNode => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 text-black">
          {part}
        </mark>
      ) : part
    );
  };

  const formatMessage = (message: any[]): React.ReactNode[] => {
    return message.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return (
          <details key={index} className="inline-block ml-2">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              {item.constructor.name} {'{...}'}
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(item, null, 2)}
            </pre>
          </details>
        );
      }
      
      const textContent = String(item);
      return (
        <span key={index} className="mr-2">
          {highlightText(textContent, searchTerm)}
        </span>
      );
    });
  };

  return (
    <div className="flex items-start gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 font-mono text-sm">
      {/* 時間戳 */}
      <div className="flex-shrink-0 text-xs text-gray-500 w-20">
        {formatTimestamp(log.timestamp)}
      </div>
      
      {/* 圖標與級別 */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <span className="text-lg">
          {LOG_TYPE_ICONS[log.type] || '📝'}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${LOG_LEVEL_COLORS[log.level]}`}>
          {log.level.toUpperCase()}
        </span>
      </div>
      
      {/* 組件名稱 */}
      {log.component && (
        <div className="flex-shrink-0 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
          {log.component}
        </div>
      )}
      
      {/* 訊息內容 */}
      <div className="flex-1 min-w-0">
        <div className="break-words">
          {formatMessage(log.message)}
        </div>
      </div>
    </div>
  );
});

LogItem.displayName = 'LogItem';

export const LogViewer: React.FC<LogViewerProps> = ({
  className = '',
  maxLogs = 500,
  enableFilters = true,
  enableSearch = true,
  enableExport = true,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    type: 'all',
    level: 'all',
    component: '',
    searchTerm: '',
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingLogs, setPendingLogs] = useState<LogEntry[]>([]);
  
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 從本地存儲載入日誌
  const loadLogsFromStorage = useCallback(() => {
    if (isPaused) return;
    
    const localLogs = consoleInterceptor.getLocalLogs();
    const recentLogs = localLogs.slice(-maxLogs);
    
    setLogs(prevLogs => {
      // 只有在有新日誌時才更新
      if (JSON.stringify(prevLogs) !== JSON.stringify(recentLogs)) {
        return recentLogs;
      }
      return prevLogs;
    });
  }, [isPaused, maxLogs]);

  // 設置定期刷新
  useEffect(() => {
    // 立即載入一次
    loadLogsFromStorage();
    
    // 設置定期刷新（每秒一次）
    refreshIntervalRef.current = setInterval(loadLogsFromStorage, 1000);
    
    // 檢查攔截器狀態
    setIsActive(consoleInterceptor.isActive);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadLogsFromStorage]);

  // 自動滾動到底部
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 篩選日誌
  const filteredLogs = logs.filter(log => {
    if (filters.type !== 'all' && log.type !== filters.type) return false;
    if (filters.level !== 'all' && log.level !== filters.level) return false;
    if (filters.component && !log.component?.includes(filters.component)) return false;
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const messageText = log.message.join(' ').toLowerCase();
      if (!messageText.includes(searchLower) && 
          !log.component?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  // 恢復暫停的日誌
  const resumeLogs = () => {
    setIsPaused(false);
    setPendingLogs([]);
    loadLogsFromStorage();
  };

  // 清除日誌
  const clearLogs = () => {
    consoleInterceptor.clearLocalLogs();
    setLogs([]);
    setPendingLogs([]);
  };

  // 匯出日誌
  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vite-console-logs-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // 顯示日誌報告
  const showReport = () => {
    consoleInterceptor.showLogReport();
  };

  // 切換攔截器狀態
  const toggleInterceptor = () => {
    if (consoleInterceptor.isActive) {
      consoleInterceptor.stopIntercepting();
    } else {
      consoleInterceptor.startIntercepting();
    }
    setIsActive(consoleInterceptor.isActive);
  };

  if (isCollapsed) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg transition-colors hover:bg-gray-700 flex items-center gap-2"
          type="button"
          aria-label="展開日誌查看器"
        >
          📊 日誌 ({logs.length})
          {!isActive && <span className="w-2 h-2 bg-red-500 rounded-full" aria-label="攔截器未啟動"></span>}
          {import.meta.env.DEV && <span className="text-xs bg-green-500 px-1 rounded">DEV</span>}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 flex flex-col ${className}`}>
      {/* 標題列 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">
            日誌查看器 
            {import.meta.env.DEV && <span className="text-xs text-green-600">(Vite)</span>}
          </h3>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">({filteredLogs.length})</span>
          {pendingLogs.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
              +{pendingLogs.length} 暫停
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={toggleInterceptor}
            className={`p-1 rounded transition-colors hover:bg-gray-200 ${
              isActive ? 'text-green-600' : 'text-red-600'
            }`}
            type="button"
            title={isActive ? '停止攔截' : '啟動攔截'}
            aria-label={isActive ? '停止攔截器' : '啟動攔截器'}
          >
            {isActive ? '🟢' : '🔴'}
          </button>
          
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1 rounded transition-colors hover:bg-gray-200 ${
              isPaused ? 'text-orange-600' : 'text-gray-600'
            }`}
            type="button"
            title={isPaused ? '恢復' : '暫停'}
            aria-label={isPaused ? '恢復日誌' : '暫停日誌'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          
          <button
            onClick={showReport}
            className="p-1 rounded transition-colors hover:bg-gray-200 text-gray-600"
            type="button"
            title="顯示統計報告"
            aria-label="在控制台顯示日誌統計報告"
          >
            📊
          </button>
          
          <button
            onClick={clearLogs}
            className="p-1 rounded transition-colors hover:bg-gray-200 text-gray-600"
            type="button"
            title="清除日誌"
            aria-label="清除所有日誌"
          >
            🗑️
          </button>
          
          {enableExport && (
            <button
              onClick={exportLogs}
              className="p-1 rounded transition-colors hover:bg-gray-200 text-gray-600"
              type="button"
              title="匯出日誌"
              aria-label="匯出日誌為 JSON 檔案"
            >
              💾
            </button>
          )}
          
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded transition-colors hover:bg-gray-200 text-gray-600"
            type="button"
            title="收合"
            aria-label="收合日誌查看器"
          >
            ➖
          </button>
        </div>
      </div>

      {/* 篩選器 */}
      {enableFilters && (
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 mb-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as LogType | 'all' }))}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">所有類型</option>
              <option value="log">Log</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
            
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as LogLevel | 'all' }))}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">所有級別</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          {enableSearch && (
            <input
              type="text"
              placeholder="搜尋日誌..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            />
          )}
        </div>
      )}

      {/* 日誌列表 */}
      <div
        ref={logsContainerRef}
        className="flex-1 overflow-auto bg-white"
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          setAutoScroll(scrollTop + clientHeight >= scrollHeight - 10);
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm">
                {!isActive ? '攔截器未啟動' : '尚無日誌訊息'}
              </div>
              {!isActive && (
                <button
                  onClick={toggleInterceptor}
                  className="mt-2 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                >
                  啟動攔截器
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {filteredLogs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                searchTerm={filters.searchTerm}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部控制列 */}
      <div className="flex items-center justify-between p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            自動滾動
          </label>
          {import.meta.env.DEV && (
            <span className="text-green-600 font-medium">
              Vite Dev
            </span>
          )}
        </div>
        
        {isPaused && (
          <button
            onClick={resumeLogs}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
          >
            恢復日誌
          </button>
        )}
      </div>
    </div>
  );
};

export default LogViewer;