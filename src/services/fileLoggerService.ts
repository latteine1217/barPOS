/**
 * 檔案日誌輸出服務
 * 為 opencode agent 提供可讀取的日誌檔案
 */

import { LogEntry } from './consoleInterceptorService';

interface FileLoggerConfig {
  logFilePath?: string;
  maxFileSize?: number;
  rotateFiles?: boolean;
  enableAgentMode?: boolean;
}

class FileLoggerService {
  private config: Required<FileLoggerConfig>;
  private logBuffer: LogEntry[] = [];
  private writeTimer?: NodeJS.Timeout | undefined;

  constructor(config: FileLoggerConfig = {}) {
    this.config = {
      logFilePath: config.logFilePath || './logs/app.log',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      rotateFiles: config.rotateFiles ?? true,
      enableAgentMode: config.enableAgentMode ?? true,
    };
  }

  /**
   * 添加日誌到緩衝區
   */
  public addLog(log: LogEntry): void {
    if (!this.config.enableAgentMode) return;

    this.logBuffer.push(log);

    // 批量寫入機制
    if (this.logBuffer.length >= 10) {
      this.flushLogs();
    } else if (!this.writeTimer) {
      this.writeTimer = setTimeout(() => {
        this.flushLogs();
      }, 2000);
    }
  }

  /**
   * 將緩衝區日誌寫入檔案
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToWrite = [...this.logBuffer];
    this.logBuffer = [];

    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = undefined;
    }

    try {
      // 在開發環境中，寫入到專案根目錄
      if (import.meta.env.DEV) {
        await this.writeToDevLog(logsToWrite);
      }
    } catch {
      console.error('檔案日誌寫入失敗:')
    }
  }

  /**
   * 開發環境日誌寫入 (透過 Vite API)
   */
  private async writeToDevLog(logs: LogEntry[]): Promise<void> {
    const logEntries = logs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      type: log.type,
      component: log.component || 'Unknown',
      message: this.formatMessage(log.message),
      url: window.location.pathname,
    }));

    // 發送到 Vite 開發服務器的自定義端點
    try {
      await fetch('/__vite_dev_log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logEntries,
          source: 'console-interceptor',
        }),
      });
    } catch {
      // 如果 Vite 端點不可用，寫入到 localStorage 供 agent 讀取
      this.writeToLocalStorage(logEntries);
    }
  }

  /**
   * 寫入到 localStorage (備用方案)
   */
  private writeToLocalStorage(logs: unknown[]): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('agent-readable-logs') || '[]');
      const allLogs = [...existingLogs, ...logs];
      
      // 保持最多 1000 條記錄供 agent 讀取
      const trimmedLogs = allLogs.slice(-1000);
      localStorage.setItem('agent-readable-logs', JSON.stringify(trimmedLogs));
      
      // 同時寫入到 sessionStorage (即時性更好)
      sessionStorage.setItem('latest-logs', JSON.stringify(logs));
    } catch {
      console.error('無法寫入本地存儲:')
    }
  }

  /**
   * 格式化日誌訊息
   */
  private formatMessage(message: unknown[]): string {
    return message.map(item => {
      if (typeof item === 'object' && item !== null) {
        try {
          return JSON.stringify(item, null, 2);
    } catch {          return String(item);
        }
      }
      return String(item);
    }).join(' ');
  }

  /**
   * 為 agent 提供的日誌讀取介面
   */
  public static getLogsForAgent(): unknown[] {
    try {
      const logs = localStorage.getItem('agent-readable-logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * 為 agent 提供的最新日誌讀取介面
   */
  public static getLatestLogsForAgent(): unknown[] {
    try {
      const logs = sessionStorage.getItem('latest-logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * 清除 agent 日誌
   */
  public static clearAgentLogs(): void {
    localStorage.removeItem('agent-readable-logs');
    sessionStorage.removeItem('latest-logs');
  }
}

// 創建全域實例
export const fileLogger = new FileLoggerService();

export default FileLoggerService;