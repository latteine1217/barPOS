/**
 * Console Log 攔截器服務 - 修復無限循環版本
 * 攔截所有 console 方法並使用 Vite 原生日誌查看功能
 * 配置使用 localhost:5173 (Vite 開發服務器)
 * 🛡️ 添加了循環檢測、防抖和異步處理機制
 */

// 日誌類型定義
export interface LogEntry {
  id: string | number;
  timestamp: string;
  type: LogType;
  level: LogLevel;
  message: unknown[];
  component?: string;
  userAgent?: string;
  url?: string;
}

export type LogType = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'table' | 'group' | 'groupCollapsed' | 'groupEnd';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 配置選項
interface ConsoleInterceptorConfig {
  viteDevUrl?: string;
  enabledTypes?: LogType[];
  componentName?: string;
  enableLocalStorage?: boolean;
  enableViteLogger?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  flushInterval?: number;
}

class ConsoleInterceptorService {
  private config: Required<ConsoleInterceptorConfig>;
  private originalConsole: Partial<{ [key in LogType]: (...args: any[]) => void }> = {};
  private isIntercepting = false;
  private logQueue: LogEntry[] = [];
  private retryQueue: LogEntry[] = [];
  private flushTimer: number | undefined = undefined;
  
  // 🛡️ 安全防護機制
  private circularGuard = new Map<string, number>();
  private suspendInterception = false;
  private lastLogTime = 0;
  private pendingLogs: { type: LogType; args: unknown[]; timestamp: number }[] = [];
  private processingScheduled = false;
  private emergencyStopCount = 0;

  constructor(config: ConsoleInterceptorConfig = {}) {
    this.config = {
      viteDevUrl: config.viteDevUrl || 'http://localhost:5173',
      enabledTypes: config.enabledTypes || ['log', 'info', 'warn', 'error', 'debug'],
      componentName: config.componentName || 'React-POS-App',
      enableLocalStorage: config.enableLocalStorage ?? true,
      enableViteLogger: config.enableViteLogger ?? true,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 2000,
    };
  }

  // 🛡️ 循環檢測方法
  private detectCircularCall(type: LogType): boolean {
    const key = type;
    const count = this.circularGuard.get(key) || 0;
    
    // 如果同一類型日誌在短時間內調用過多次，觸發保護機制
    if (count > 15) {
      this.emergencyStop();
      return true;
    }
    
    this.circularGuard.set(key, count + 1);
    
    // 1秒後清理計數器
    setTimeout(() => {
      const currentCount = this.circularGuard.get(key) || 0;
      if (currentCount <= 1) {
        this.circularGuard.delete(key);
      } else {
        this.circularGuard.set(key, currentCount - 1);
      }
    }, 1000);
    
    return false;
  }

  // 🚨 緊急停止機制
  private emergencyStop(): void {
    this.emergencyStopCount++;
    this.suspendInterception = true;
    this.logQueue = [];
    this.pendingLogs = [];
    
    // 使用原始console避免觸發攔截
    if (this.originalConsole.warn) {
      this.originalConsole.warn('🚨 Console interceptor: Emergency stop due to potential infinite loop');
    }
    
    // 5秒後恢復，但增加延遲以防持續問題
    const resumeDelay = Math.min(5000 * this.emergencyStopCount, 30000);
    setTimeout(() => {
      this.suspendInterception = false;
      if (this.originalConsole.info) {
        this.originalConsole.info('🔄 Console interceptor: Resumed after emergency stop');
      }
    }, resumeDelay);
  }

  // 🚦 防抖檢查
  private shouldThrottleLog(type: LogType): boolean {
    const now = Date.now();
    const minInterval = type === 'error' ? 50 : 100; // 錯誤日誌允許更頻繁
    
    if (now - this.lastLogTime < minInterval) {
      return true;
    }
    
    this.lastLogTime = now;
    return false;
  }

  // ⏰ 異步日誌處理排程
  private scheduleLogProcessing(type: LogType, args: unknown[]): void {
    this.pendingLogs.push({ type, args, timestamp: Date.now() });
    
    // 限制待處理隊列長度
    if (this.pendingLogs.length > 100) {
      this.pendingLogs = this.pendingLogs.slice(-50); // 保留最新的50條
    }
    
    if (!this.processingScheduled) {
      this.processingScheduled = true;
      
      // 使用 requestIdleCallback 或 setTimeout 異步處理
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => {
          this.processPendingLogs();
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          this.processPendingLogs();
        }, 0);
      }
    }
  }

  // 📦 批量處理待處理日誌
  private processPendingLogs(): void {
    this.processingScheduled = false;
    
    if (this.suspendInterception || this.pendingLogs.length === 0) {
      return;
    }
    
    const logsToProcess = [...this.pendingLogs];
    this.pendingLogs = [];
    
    // 批量處理日誌，避免阻塞主線程
    logsToProcess.forEach(({ type, args }) => {
      try {
        this.processViteLogSafe(type, args);
      } catch (error) {
        // 靜默處理錯誤，避免觸發更多日誌
      }
    });
  }

  // 🔒 安全的日誌處理方法
  private processViteLogSafe(type: LogType, message: unknown[]): void {
    // 檢查是否需要暫停處理
    if (this.suspendInterception) {
      return;
    }
    
    try {
      const logEntry: LogEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type,
        level: this.getLogLevel(type),
        message: this.serializeMessage(message),
        component: this.config.componentName,
        url: window.location.href,
      };

      // 添加到佇列（用於本地存儲和統計）
      this.logQueue.push(logEntry);

      // 如果佇列滿了，異步處理日誌
      if (this.logQueue.length >= this.config.batchSize) {
        setTimeout(() => this.flushLogs(), 0);
      }

      // 異步本地儲存（如果啟用）
      if (this.config.enableLocalStorage) {
        setTimeout(() => this.saveToLocalStorage(logEntry), 0);
      }

      // 異步寫入 Agent 可讀日誌
      setTimeout(() => this.writeToAgentLog(logEntry), 0);
    } catch (error) {
      // 靜默處理所有錯誤
    }
  }

  /**
   * 開始攔截 console 方法
   */
  public startIntercepting(): void {
    if (this.isIntercepting) {
      if (this.originalConsole.warn) {
        this.originalConsole.warn('🚨 Console interceptor is already running');
      }
      return;
    }

    // 備份原始 console 方法
    this.config.enabledTypes.forEach(type => {
      if (console[type]) {
        this.originalConsole[type] = console[type].bind(console);
      }
    });

    // 替換 console 方法 - 添加安全防護
    this.config.enabledTypes.forEach(type => {
      console[type] = (...args: any[]) => {
        // 🛡️ 循環檢測
        if (this.detectCircularCall(type)) {
          // 如果檢測到循環，僅執行原始console方法
          if (this.originalConsole[type]) {
            this.originalConsole[type]!(...args);
          }
          return;
        }
        
        // 🚦 防抖檢查
        if (this.shouldThrottleLog(type)) {
          // 高頻調用時僅執行原始方法
          if (this.originalConsole[type]) {
            this.originalConsole[type]!(...args);
          }
          return;
        }
        
        // ✅ 安全地執行原始console方法
        try {
          if (this.originalConsole[type]) {
            this.originalConsole[type]!(...args);
          }
        } catch (error) {
          // 靜默處理console錯誤
        }

        // 🔄 異步處理日誌（如果未暫停）
        if (this.config.enableViteLogger && !this.suspendInterception) {
          this.scheduleLogProcessing(type, args);
        }
      };
    });

    this.isIntercepting = true;
    this.startFlushTimer();
    
    // 記錄攔截器啟動
    if (this.originalConsole.info) {
      this.originalConsole.info('🚀 Console 攔截器已啟動 - 安全版本');
    }
  }

  /**
   * 停止攔截 console 方法
   */
  public stopIntercepting(): void {
    if (!this.isIntercepting) {
      return;
    }

    // 還原原始 console 方法
    Object.keys(this.originalConsole).forEach(type => {
      const consoleMethod = this.originalConsole[type as LogType];
      if (consoleMethod) {
        console[type as LogType] = consoleMethod;
      }
    });

    this.isIntercepting = false;
    this.stopFlushTimer();
    
    // 清空佇列
    this.flushLogs();
    
    if (this.originalConsole.info) {
      this.originalConsole.info('⏹️ Console 攔截器已停止');
    }
  }

  /**
   * 批量處理日誌（主要用於統計和本地存儲）- 優化版本
   */
  private flushLogs(): void {
    if (this.logQueue.length === 0 || this.suspendInterception) {
      return;
    }

    const logsToProcess = [...this.logQueue];
    this.logQueue = [];

    // 🚫 移除可能觸發循環的 console.group/table 調用
    // 在開發環境下，使用更安全的統計顯示方式
    if (import.meta.env.DEV && logsToProcess.length > 0) {
      this.displayStatsQuietly(logsToProcess);
    }

    // 清理舊的重試佇列
    this.retryQueue = this.retryQueue.filter(
      retryLog => !logsToProcess.some(processedLog => processedLog.id === retryLog.id)
    );
  }

  // 📊 安全的統計顯示方法
  private displayStatsQuietly(logs: LogEntry[]): void {
    try {
      const stats = this.generateLogStats(logs);
      
      // 使用原始 console.debug 而不是 group/table 來避免觸發攔截
      if (this.originalConsole.debug) {
        this.originalConsole.debug('📊 Log Stats:', {
          totalLogs: stats['總計'],
          errorCount: stats['error'] || 0,
          warnCount: stats['warn'] || 0,
          timeRange: `${stats['時間範圍']}s`
        });
      }
    } catch (error) {
      // 靜默處理統計顯示錯誤
    }
  }

  /**
   * 寫入 Agent 可讀日誌
   */
  private writeToAgentLog(logEntry: LogEntry): void {
    try {
      // 格式化為 Agent 友好的格式
      const agentLogEntry = {
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        type: logEntry.type,
        component: logEntry.component || 'Unknown',
        message: this.formatMessageForAgent(logEntry.message),
        url: window.location.pathname,
        session: `dev-session-${Date.now()}`,
      };

      // 寫入到 localStorage 供 Agent 讀取
      const existingLogs = JSON.parse(localStorage.getItem('opencode-agent-logs-json:v1') || '[]');
      existingLogs.push(agentLogEntry);
      
      // 保持最多 500 條記錄供 Agent 讀取
      const trimmedLogs = existingLogs.slice(-500);
      localStorage.setItem('opencode-agent-logs-json:v1', JSON.stringify(trimmedLogs, null, 2));
      
      // 同時寫入格式化的文字版本
      const formattedLog = `[${agentLogEntry.timestamp}] ${agentLogEntry.level.toUpperCase()} (${agentLogEntry.component}) ${agentLogEntry.message}`;
      const existingTextLogs = localStorage.getItem('opencode-agent-logs:v1')?.split('\\n') || [];
      existingTextLogs.push(formattedLog);
      const trimmedTextLogs = existingTextLogs.slice(-500);
      localStorage.setItem('opencode-agent-logs:v1', trimmedTextLogs.join('\\n'));
      
    } catch {
      // 安靜地處理錯誤，不干擾主要功能
    }
  }

  /**
   * 為 Agent 格式化訊息
   */
  private formatMessageForAgent(message: unknown[]): string {
    return message.map(item => {
      if (typeof item === 'object' && item !== null) {
        try {
          return JSON.stringify(item);
        } catch {
          return '[Object]';
        }
      }
      return String(item);
    }).join(' ');
  }

  /**
   * 生成日誌統計
   */
  private generateLogStats(logs: LogEntry[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    logs.forEach(log => {
      stats[log.level] = (stats[log.level] || 0) + 1;
    });

    return {
      '總計': logs.length,
      ...stats,
      '時間範圍': logs.length > 0 ? 
        Math.round((Date.now() - new Date(logs[0]?.timestamp || 0).getTime()) / 1000) : 0,
    };
  }

  /**
   * 啟動定時器定期處理日誌
   */
  private startFlushTimer(): void {
    this.flushTimer = window.setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  /**
   * 停止定時器
   */
  private stopFlushTimer(): void {
    if (this.flushTimer !== undefined) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * 根據 console 類型獲取日誌級別
   */
  private getLogLevel(type: LogType): LogLevel {
    switch (type) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warn';
      case 'debug':
      case 'trace':
        return 'debug';
      default:
        return 'info';
    }
  }

  /**
   * 序列化訊息內容
   */
  private serializeMessage(message: unknown[]): unknown[] {
    return message.map(item => {
      if (typeof item === 'object' && item !== null) {
        try {
          return JSON.parse(JSON.stringify(item));
        } catch {
          return String(item);
        }
      }
      return item;
    });
  }

  /**
   * 儲存到本地 Storage
   */
  private saveToLocalStorage(logEntry: LogEntry): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('vite-console-logs:v1') || '[]');
      existingLogs.push(logEntry);
      
      // 保持最多 200 條記錄（增加容量用於開發調試）
      const trimmedLogs = existingLogs.slice(-200);
      localStorage.setItem('vite-console-logs:v1', JSON.stringify(trimmedLogs));
    } catch {
      // 本地儲存失敗，靜默處理
    }
  }

  /**
   * 從本地 Storage 獲取日誌
   */
  public getLocalLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('vite-console-logs:v1') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * 清除本地日誌
   */
  public clearLocalLogs(): void {
    localStorage.removeItem('vite-console-logs:v1');
    if (this.originalConsole.info) {
      this.originalConsole.info('🗑️ 本地日誌已清除');
    }
  }

  /**
   * 手動發送日誌（用於特殊情況的日誌記錄）
   */
  public logManual(type: LogType, message: unknown[], component?: string): void {
    const logEntry: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      level: this.getLogLevel(type),
      message: this.serializeMessage(message),
      component: component || this.config.componentName,
      url: window.location.href,
    };

    // 直接使用原始 console 方法輸出
    if (this.originalConsole[type]) {
      this.originalConsole[type]!(...message);
    }

    // 保存到本地存儲
    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage(logEntry);
    }
  }

  /**
   * 獲取 Vite 開發服務器狀態
   */
  public async getViteServerStatus(): Promise<{ status: string; url: string; timestamp: string }> {
    try {
      // 檢查 Vite HMR 連接狀態
      const isHMRConnected = !!(window as any).__vite_is_modern_browser;
      
      return {
        status: isHMRConnected ? 'connected' : 'disconnected',
        url: this.config.viteDevUrl,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        url: this.config.viteDevUrl,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 顯示日誌統計報告 - 安全版本
   */
  public showLogReport(): void {
    const logs = this.getLocalLogs();
    
    if (logs.length === 0) {
      if (this.originalConsole.info) {
        this.originalConsole.info('📈 無日誌記錄');
      }
      return;
    }

    const stats = this.generateLogStats(logs);
    const recent = logs.slice(-10);

    // 使用原始console方法避免觸發攔截
    if (this.originalConsole.group && this.originalConsole.table && this.originalConsole.groupEnd) {
      this.originalConsole.group('📊 日誌報告');
      this.originalConsole.table(stats);
      this.originalConsole.group('📝 最近 10 條日誌');
      recent.forEach(log => {
        if (this.originalConsole.log) {
          this.originalConsole.log(`[${log.timestamp}] ${log.type}: `, ...(log.message as unknown[]));
        }
      });
      this.originalConsole.groupEnd();
      this.originalConsole.groupEnd();
    }
  }

  /**
   * 獲取配置資訊
   */
  public getConfig(): Required<ConsoleInterceptorConfig> {
    return { ...this.config };
  }

  /**
   * 檢查是否正在攔截
   */
  public get isActive(): boolean {
    return this.isIntercepting;
  }

  /**
   * 為 Agent 提供的日誌讀取介面
   */
  public static getAgentLogs(): string {
    try {
      return localStorage.getItem('opencode-agent-logs:v1') || '';
    } catch {
      return '';
    }
  }

  /**
   * 為 Agent 提供的 JSON 格式日誌讀取介面
   */
  public static getAgentLogsJson(): unknown[] {
    try {
      const logs = localStorage.getItem('opencode-agent-logs-json:v1');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * 清除 Agent 日誌
   */
  public static clearAgentLogs(): void {
    localStorage.removeItem('opencode-agent-logs:v1');
    localStorage.removeItem('opencode-agent-logs-json:v1');
  }
}

// 創建全域實例
export const consoleInterceptor = new ConsoleInterceptorService();

// 初始化函數（適配 Vite 開發環境）
export const initializeConsoleInterceptor = (config?: ConsoleInterceptorConfig): void => {
  // 只在開發環境中自動啟動
  if (import.meta.env.DEV) {
    if (config) {
      const next = new ConsoleInterceptorService({
        ...config,
        viteDevUrl: config.viteDevUrl || 'http://localhost:5173',
      });
      (consoleInterceptor as any).config = (next as any).config;
    }
    
    consoleInterceptor.startIntercepting();
    
    // 在 window 關閉前停止攔截器
    window.addEventListener('beforeunload', () => {
      consoleInterceptor.stopIntercepting();
    });

    // 開發環境專用：添加全域調試方法
    (window as any).__console_interceptor__ = {
      report: () => consoleInterceptor.showLogReport(),
      clear: () => consoleInterceptor.clearLocalLogs(),
      status: () => consoleInterceptor.getViteServerStatus(),
      logs: () => consoleInterceptor.getLocalLogs(),
      // Agent 相關方法
      agentLogs: ConsoleInterceptorService.getAgentLogs,
      agentLogsJson: ConsoleInterceptorService.getAgentLogsJson,
      clearAgentLogs: ConsoleInterceptorService.clearAgentLogs,
    };

    console.info('🛠️ 開發模式：控制台增強功能已啟用（安全版本）');
    console.info('💡 使用 __console_interceptor__.report() 查看日誌報告');
  }
};

export default ConsoleInterceptorService;