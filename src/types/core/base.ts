// 🏗️ 核心基礎類型定義
// ========================

// 基本類型別名
export type ID = string;
export type Timestamp = string | Date;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// 通用工具類型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
};

export type WithID<T> = T & {
  id: ID;
};

export type Entity<T> = WithID<WithTimestamps<T>>;

// 狀態相關類型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T, E = Error> {
  data: Maybe<T>;
  loading: boolean;
  error: Maybe<E>;
  lastFetch?: Timestamp;
}

// API 響應類型
export interface ApiResponse<T = unknown, E = ApiError> {
  success: boolean;
  data?: T;
  error?: E;
  message?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    version?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: Timestamp;
  path?: string;
}

// 驗證相關類型
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

// 事件相關類型
export interface EventPayload<T = unknown> {
  type: string;
  payload: T;
  timestamp: Timestamp;
  source?: string;
}

// 分頁相關類型
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 搜索和過濾類型
export interface FilterOptions<T = Record<string, unknown>> {
  search?: string;
  filters?: T;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: PaginationParams;
}

// 錯誤邊界類型
export interface ErrorBoundary {
  hasError: boolean;
  error?: Error;
  errorInfo?: {
    componentStack: string;
    errorBoundary?: string;
  };
}

// 應用配置類型
export interface AppConfig {
  version: string;
  environment: 'development' | 'testing' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    maxFileSize: number;
    maxRequestTimeout: number;
    maxRetries: number;
  };
}

// 緩存相關類型
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'lfu';
}