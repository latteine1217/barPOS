/**
 * Agent 可讀日誌服務
 * 將應用程式日誌寫入檔案，供 opencode agent 讀取
 */

import { LogEntry } from './consoleInterceptorService';

const AGENT_LOG_MAX = 200;
const AGENT_LOG_KEYS = { text: 'opencode-agent-logs', json: 'opencode-agent-logs-json' } as const;

interface AgentLogEntry {
  timestamp: string;
  level: string;
  type: string;
  component: string;
  message: string;
  url: string;
  session: string;
}

class AgentLoggerService {
  private logBuffer: AgentLogEntry[] = [];
  private sessionId: string;
  private isEnabled: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = import.meta.env.DEV; // 只在開發環境啟用
  }

  /**
   * 添加日誌條目
   */
  public addLog(log: LogEntry): void {
    if (!this.isEnabled) return;

    const agentLog: AgentLogEntry = {
      timestamp: log.timestamp,
      level: log.level,
      type: log.type,
      component: log.component || 'Unknown',
      message: AgentLoggerService.formatMessageStatic(log.message),
      url: window.location.pathname,
      session: this.sessionId,
    };

    this.logBuffer.push(agentLog);
    
    // 即時寫入重要日誌
    if (log.level === 'error' || log.level === 'warn') {
      this.flushLogs();
    }
    
    // 定期批量寫入
    if (this.logBuffer.length >= 5) {
      this.flushLogs();
    }
  }

  /**
   * 寫入日誌到可讀位置
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToWrite = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // 方案 1: 寫入到 localStorage (agent 可以透過瀏覽器 API 讀取)
      await this.writeToLocalStorage(logsToWrite);
      
      // 方案 2: 寫入到專案目錄 (透過 Vite 開發服務器)
      await this.writeToProjectFile(logsToWrite);
      
    } catch {
      console.error('Agent 日誌寫入失敗:')
    }
  }

  /**
   * 寫入到 localStorage (Agent 可讀)
   */
  private async writeToLocalStorage(logs: AgentLogEntry[]): Promise<void> {
    try {
      // 寫入格式化的日誌
      const formattedLogs = logs.map(log => 
        `[${log.timestamp}] ${log.level.toUpperCase()} (${log.component}) ${log.message}`
      );

      // 讀取現有日誌
      const existingLogs = localStorage.getItem(AGENT_LOG_KEYS.text)?.split('\n') || [];
      
      // 合併並限制數量
      const allLogs = [...existingLogs, ...formattedLogs].slice(-AGENT_LOG_MAX);
      
      // 寫回 localStorage
      localStorage.setItem(AGENT_LOG_KEYS.text, allLogs.join('\n'));
      
      // 同時寫入 JSON 格式供程式讀取
      const existingJsonLogs = JSON.parse(localStorage.getItem(AGENT_LOG_KEYS.json) || '[]');
      const allJsonLogs = [...existingJsonLogs, ...logs].slice(-AGENT_LOG_MAX);
      localStorage.setItem(AGENT_LOG_KEYS.json, JSON.stringify(allJsonLogs, null, 2));
      
    } catch {
      console.error('寫入 localStorage 失敗:')
    }
  }

  /**
   * 嘗試寫入到專案檔案 (透過 fetch API)
   */
  private async writeToProjectFile(logs: AgentLogEntry[]): Promise<void> {
    try {
      // 建立日誌內容
      const logContent = logs.map(log => 
        `[${log.timestamp}] ${log.level.toUpperCase()} (${log.component}@${log.url}) ${log.message}`
      ).join('\n') + '\n';

      // 嘗試透過自定義端點寫入
      const response = await fetch('/api/write-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: logContent,
          session: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`日誌寫入回應錯誤: ${response.status}`);
      }
    } catch {
      // 如果無法寫入檔案，這是正常的（沒有後端支援）
      // console.warn('無法寫入專案日誌檔案:', error);
    }
  }

  /**
   * 格式化日誌訊息
   */
  public static formatMessageStatic(message: unknown[] | unknown): string {
    // 確保 message 是數組
    const messageArray = Array.isArray(message) ? message : [message];
    
    return messageArray.map(item => {
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
   * 生成會話 ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 為 Agent 提供的讀取介面
   */
  public static getLogsForAgent(): string {
    try {
      return localStorage.getItem(AGENT_LOG_KEYS.text) || '';
    } catch {
      return '';
    }
  }

  /**
   * 為 Agent 提供的 JSON 格式讀取介面
   */
  public static getLogsJsonForAgent(): AgentLogEntry[] {
    try {
      const logs = localStorage.getItem(AGENT_LOG_KEYS.json);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * 清除 Agent 日誌
   */
  public static clearAgentLogs(): void {
    localStorage.removeItem(AGENT_LOG_KEYS.text);
    localStorage.removeItem(AGENT_LOG_KEYS.json);
    console.log('🗑️ Agent 日誌已清除');
  }

  /**
   * 獲取當前會話統計
   */
  public getSessionStats(): { sessionId: string; logCount: number; isEnabled: boolean } {
    const logs = AgentLoggerService.getLogsJsonForAgent();
    const sessionLogs = logs.filter(log => log.session === this.sessionId);
    
    return {
      sessionId: this.sessionId,
      logCount: sessionLogs.length,
      isEnabled: this.isEnabled,
    };
  }
}

// 創建全域實例
export const agentLogger = new AgentLoggerService();

// 為 Agent 提供全域存取方法
if (import.meta.env.DEV) {
  (window as any).__agent_logger__ = {
    getLogs: AgentLoggerService.getLogsForAgent,
    getLogsJson: AgentLoggerService.getLogsJsonForAgent,
    clear: AgentLoggerService.clearAgentLogs,
    stats: () => agentLogger.getSessionStats(),
  };
}

export default AgentLoggerService;