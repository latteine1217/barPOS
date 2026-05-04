import FileLoggerService from './fileLoggerService';
import AgentLoggerService from './agentLoggerService';
import type { LogEntry as InterceptorLogEntry } from './consoleInterceptorService';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let __logSeq = 0;
const nextLogId = (): string => `log-${Date.now().toString(36)}-${(__logSeq++).toString(36)}`;

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  orderId?: string;
  tableId?: string | number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
}

// 創建服務實例
const fileLoggerInstance = new FileLoggerService();
const agentLoggerInstance = new AgentLoggerService();

class LoggerService {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  // 統一的日誌方法
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const timestamp = new Date().toISOString();
    
    // 開發環境：輸出到控制台和代理日誌
    if (this.isDevelopment) {
      this.logToConsole(level, message, context, error);
      agentLoggerInstance.addLog(this.toInterceptorEntry(level, timestamp, message, context));
    }

    // 生產環境：寫入檔案日誌
    if (this.isProduction) {
      fileLoggerInstance.addLog(this.toInterceptorEntry(level, timestamp, message, context, error));
    }

    // 錯誤等級始終輸出到控制台
    if (level === 'error') {
      console.error(`[${level.toUpperCase()}] ${message}`, { context, error });
    }
  }

  private logToConsole(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const prefix = `[${level.toUpperCase()}]`;
    const formatted = this.formatMessage(message, context, error);
    
    switch (level) {
      case 'debug':
        console.debug(prefix, formatted);
        break;
      case 'info':
        console.info(prefix, formatted);
        break;
      case 'warn':
        console.warn(prefix, formatted);
        break;
      case 'error':
        console.error(prefix, formatted, error);
        break;
    }
  }

  private toInterceptorEntry(
    level: LogLevel,
    timestamp: string,
    message: string,
    context?: LogContext,
    error?: Error,
  ): InterceptorLogEntry {
    return {
      id: nextLogId(),
      timestamp,
      level,
      type: level === 'debug' ? 'debug' : level,
      message: [this.formatMessage(message, context, error)],
      ...(context?.component ? { component: context.component } : {}),
      ...(typeof window !== 'undefined' ? { url: window.location.href } : {}),
    };
  }

  private formatMessage(message: string, context?: LogContext, error?: Error): string {
    const parts = [message];
    
    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      if (contextStr) parts.push(`[${contextStr}]`);
    }
    
    if (error) {
      parts.push(`Error: ${error.message}`);
    }
    
    return parts.join(' ');
  }

  // 公開的日誌方法
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  // 便利方法：為特定場景提供預設上下文
  orderLog = {
    create: (orderId: string, tableId: string | number, context?: Omit<LogContext, 'orderId' | 'tableId'>) => 
      this.info('Order created', { component: 'OrderService', action: 'create', orderId, tableId, ...context }),
    
    update: (orderId: string, updates: Record<string, unknown>, context?: Omit<LogContext, 'orderId'>) => 
      this.info('Order updated', { component: 'OrderService', action: 'update', orderId, updates, ...context }),
    
    complete: (orderId: string, context?: Omit<LogContext, 'orderId'>) => 
      this.info('Order completed', { component: 'OrderService', action: 'complete', orderId, ...context }),
    
    error: (orderId: string, error: Error, context?: Omit<LogContext, 'orderId'>) => 
      this.error('Order operation failed', { component: 'OrderService', orderId, ...context }, error),
  };

  tableLog = {
    update: (tableId: string | number, updates: Record<string, unknown>, context?: Omit<LogContext, 'tableId'>) => 
      this.info('Table updated', { component: 'TableService', action: 'update', tableId, updates, ...context }),
    
    release: (tableId: string | number, orderId?: string, context?: Omit<LogContext, 'tableId' | 'orderId'>) => 
      this.info('Table released', { component: 'TableService', action: 'release', tableId, ...(orderId && { orderId }), ...context }),
    
    error: (tableId: string | number, error: Error, context?: Omit<LogContext, 'tableId'>) => 
      this.error('Table operation failed', { component: 'TableService', tableId, ...context }, error),
  };

  storeLog = {
    init: (storeName: string, context?: LogContext) => 
      this.info('Store initialized', { component: 'StoreService', action: 'initialize', storeName, ...context }),
    
    error: (storeName: string, error: Error, context?: LogContext) => 
      this.error('Store operation failed', { component: 'StoreService', storeName, ...context }, error),
  };

  apiLog = {
    request: (endpoint: string, method: string, context?: LogContext) => 
      this.debug('API request', { component: 'ApiService', action: 'request', endpoint, method, ...context }),
    
    response: (endpoint: string, status: number, context?: LogContext) => 
      this.debug('API response', { component: 'ApiService', action: 'response', endpoint, status, ...context }),
    
    error: (endpoint: string, error: Error, context?: LogContext) => 
      this.error('API request failed', { component: 'ApiService', endpoint, ...context }, error),
  };
}

// 導出單例實例
export const logger = new LoggerService();

export default logger;