// ========================
// 🚀 統一類型系統入口
// ========================

// 核心基礎類型
export * from './core/base';
export * from './core/domain';
export * from './core/hooks';
export * from './core/utils';

// 重新導出常用類型以提供簡潔的導入路徑
export type {
  // 基礎類型
  ID, Timestamp, Maybe, Optional, Nullable,
  DeepPartial, DeepReadonly,
  ApiResponse, ApiError, ValidationResult, ValidationError,
  AsyncState, LoadingState
} from './core/base';

export type {
  // 業務類型
  Order, OrderItem, OrderStatus, CreateOrderData, UpdateOrderData,
  Table, TableStatus, TableType, CreateTableData, UpdateTableData,
  MenuItem, MenuCategory, CreateMenuItemData, UpdateMenuItemData
} from './core/domain';

export type {
  // Hook 類型
  UseOrderManagementReturn, UseTableOperationsReturn, UseMenuOperationsReturn,
  UseNetworkStatusReturn, UsePerformanceMonitorReturn, UseSmartCacheReturn
} from './core/hooks';

export type {
  // 工具類型
  AsyncHookResult, MutationHookResult, FormHookResult,
  CreateData, UpdateData, Paginated, ApiResult
} from './core/utils';

// 類型守衛和工具函數
export {
  isString, isNumber, isBoolean, isFunction, isObject, isArray,
  isPromise, isNull, isUndefined, isNullish,
  assertIsString, assertIsNumber, assertIsObject, assertIsArray,
  createValidator, createOptionalValidator
} from './core/utils';

// 舊系統兼容性類型 (標記為已棄用)
// @deprecated 使用新的類型系統
export type LegacyID = string;
// @deprecated 使用新的 Timestamp 類型
export type LegacyTimestamp = string;