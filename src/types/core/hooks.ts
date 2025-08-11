import type { ApiResponse, EventPayload, ValidationResult } from './base';
import type { Order, Table, MenuItem } from './domain';

// ========================
// 🔧 Hook 和服務類型定義
// ========================

// Hook 基礎類型
// =============

export interface HookOptions {
  enabled?: boolean;
  retry?: boolean | number;
  retryDelay?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export interface MutationOptions<T, V = unknown> {
  enabled?: boolean;
  retry?: boolean | number;
  retryDelay?: number;
  onMutate?: (variables: V) => void;
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | undefined, error: Error | undefined, variables: V) => void;
}

export interface QueryOptions<T> extends HookOptions {
  select?: (data: unknown) => T;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
}

// 業務 Hook 類型
// ==============

// Order Management Hook
export interface UseOrderManagementOptions extends HookOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  optimisticUpdates?: boolean;
}

export interface UseOrderManagementReturn {
  // 狀態
  orders: Order[];
  loading: boolean;
  error: string | null;
  
  // 統計
  stats: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  
  // 操作方法
  createOrder: (data: CreateOrderData) => Promise<Order>;
  updateOrder: (id: string, data: UpdateOrderData) => Promise<Order>;
  completeOrder: (id: string) => Promise<Order>;
  cancelOrder: (id: string) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  
  // 查詢方法
  getOrder: (id: string) => Order | undefined;
  getOrdersByTable: (tableNumber: number) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  
  // 工具方法
  refresh: () => Promise<void>;
  reset: () => void;
  validateOrder: (data: CreateOrderData) => ValidationResult<CreateOrderData>;
}

// Table Operations Hook
export interface UseTableOperationsOptions extends HookOptions {
  layout?: 'grid' | 'list';
  autoLayout?: boolean;
}

export interface UseTableOperationsReturn {
  // 狀態
  tables: Table[];
  loading: boolean;
  error: string | null;
  
  // 統計
  stats: {
    total: number;
    available: number;
    occupied: number;
    utilizationRate: number;
  };
  
  // 操作方法
  createTable: (data: CreateTableData) => Promise<Table>;
  updateTable: (id: string, data: UpdateTableData) => Promise<Table>;
  deleteTable: (id: string) => Promise<void>;
  setTableStatus: (id: string, status: TableStatus) => Promise<Table>;
  assignOrder: (tableId: string, orderId: string) => Promise<Table>;
  releaseTable: (id: string) => Promise<Table>;
  
  // 查詢方法
  getTable: (id: string) => Table | undefined;
  getTableByNumber: (number: number) => Table | undefined;
  getTablesByStatus: (status: TableStatus) => Table[];
  getAvailableTables: (capacity?: number) => Table[];
  
  // 布局方法
  updateLayout: (tables: Array<{ id: string; position: Position }>) => Promise<void>;
  resetLayout: () => Promise<void>;
}

// Menu Operations Hook
export interface UseMenuOperationsOptions extends HookOptions {
  categories?: MenuCategory[];
  includeUnavailable?: boolean;
}

export interface UseMenuOperationsReturn {
  // 狀態
  items: MenuItem[];
  categories: MenuCategory[];
  loading: boolean;
  error: string | null;
  
  // 統計
  stats: {
    total: number;
    available: number;
    byCategory: Record<MenuCategory, number>;
  };
  
  // 操作方法
  createItem: (data: CreateMenuItemData) => Promise<MenuItem>;
  updateItem: (id: string, data: UpdateMenuItemData) => Promise<MenuItem>;
  deleteItem: (id: string) => Promise<void>;
  toggleAvailability: (id: string) => Promise<MenuItem>;
  bulkUpdate: (updates: Array<{ id: string; data: UpdateMenuItemData }>) => Promise<MenuItem[]>;
  
  // 查詢方法
  getItem: (id: string) => MenuItem | undefined;
  getItemsByCategory: (category: MenuCategory) => MenuItem[];
  getAvailableItems: () => MenuItem[];
  getFeaturedItems: () => MenuItem[];
  searchItems: (query: string) => MenuItem[];
  
  // 工具方法
  validateItem: (data: CreateMenuItemData) => ValidationResult<CreateMenuItemData>;
  calculatePrice: (basePrice: number, modifiers: OrderModifier[]) => number;
}

// 核心系統 Hook 類型
// ==================

// Network Status Hook
export interface UseNetworkStatusOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoSync?: boolean;
  offlineStorage?: boolean;
}

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  isOfflineReady: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  connectionQuality: 'poor' | 'good' | 'excellent';
  isSlowConnection: boolean;
  lastOnline: Date | null;
  
  // 離線隊列
  offlineQueueLength: number;
  addToOfflineQueue: (operation: OfflineOperation) => void;
  processOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
  
  // 重試機制
  retryCount: number;
  retry: () => Promise<void>;
  resetRetries: () => void;
}

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: unknown;
  timestamp: number;
  retries: number;
}

// Performance Monitor Hook
export interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  sampleRate?: number;
  thresholds?: {
    renderTime?: number;
    memoryUsage?: number;
    fps?: number;
  };
}

export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  renderCount: number;
  reRenderCount: number;
  slowRenders: number;
  memoryLeaks: number;
  componentMounts: number;
  componentUnmounts: number;
}

export interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  warnings: PerformanceWarning[];
  
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  takeSnapshot: () => PerformanceSnapshot;
  exportMetrics: () => string;
}

export interface PerformanceWarning {
  id: string;
  type: 'memory' | 'render' | 'fps' | 'leak';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
  warnings: PerformanceWarning[];
  systemInfo: {
    userAgent: string;
    platform: string;
    memory?: number;
    connection?: string;
  };
}

// Smart Cache Hook
export interface UseSmartCacheOptions<T> {
  key: string;
  ttl?: number;
  strategy?: 'memory' | 'session' | 'local' | 'hybrid';
  maxSize?: number;
  serialize?: (data: T) => string;
  deserialize?: (data: string) => T;
  validate?: (data: T) => boolean;
}

export interface UseSmartCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  lastUpdate: number | null;
  hitCount: number;
  
  set: (data: T) => void;
  get: () => T | null;
  invalidate: () => void;
  clear: () => void;
  refresh: () => Promise<T | null>;
  preload: (keys: string[]) => Promise<void>;
  
  stats: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  };
}

// 工具 Hook 類型
// ==============

// Throttle Hook
export interface UseThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
}

// Pagination Hook
export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  maxPageSize?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

export interface UsePaginationReturn<T> {
  // 當前狀態
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  
  // 分頁數據
  items: T[];
  hasNext: boolean;
  hasPrev: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  
  // 操作方法
  goToPage: (page: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  setPageSize: (size: number) => void;
  
  // 工具方法
  getPageInfo: () => string;
  getVisibleRange: () => { start: number; end: number };
}

// Infinite Scroll Hook
export interface UseInfiniteScrollOptions<T> {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => Promise<T[]>;
  onError?: (error: Error) => void;
}

export interface UseInfiniteScrollReturn<T> {
  items: T[];
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: Error | null;
  
  fetchNextPage: () => Promise<void>;
  reset: () => void;
  setItems: (items: T[]) => void;
  
  // Ref for intersection observer
  ref: React.RefObject<HTMLElement>;
}

// 服務類型定義
// ============

export interface ApiServiceConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface ApiService {
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

// Storage Service
export interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// Logger Service
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  category?: string;
  data?: unknown;
  stack?: string;
}

export interface LoggerService {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  getLogs(filter?: { level?: LogLevel; category?: string }): LogEntry[];
  clearLogs(): void;
  exportLogs(): string;
}

// Event Bus Service
export interface EventBusService {
  on<T = unknown>(event: string, handler: (payload: T) => void): () => void;
  off(event: string, handler: (payload: unknown) => void): void;
  emit<T = unknown>(event: string, payload: T): void;
  clear(): void;
  
  // 類型安全的事件定義
  subscribe<T extends EventPayload>(
    eventType: T['type'], 
    handler: (event: T) => void
  ): () => void;
}

// 導入類型
import type { 
  OrderStatus, TableStatus, MenuCategory, 
  CreateOrderData, UpdateOrderData,
  CreateTableData, UpdateTableData,
  CreateMenuItemData, UpdateMenuItemData,
  Position, OrderModifier
} from './domain';