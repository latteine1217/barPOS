// ========================
// 🛠️ 類型工具和泛型系統
// ========================

// 高階類型工具
// ============

// 深度選擇性類型
export type DeepOptional<T> = {
  [P in keyof T]?: T[P] extends object ? DeepOptional<T[P]> : T[P];
};

// 深度必需類型
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// 提取類型的所有 key
export type AllKeys<T> = T extends unknown ? keyof T : never;

// 創建聯合類型到交集類型的轉換
export type UnionToIntersection<U> = 
  (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

// 遞歸展平嵌套對象類型
export type Flatten<T> = T extends object 
  ? T extends unknown[]
    ? T
    : { [K in keyof T]: Flatten<T[K]> }
  : T;

// 提取 Promise 的返回類型
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// 創建嚴格的 Pick，排除 undefined
export type StrictPick<T, K extends keyof T> = {
  [P in K]: T[P];
} & {};

// 創建嚴格的 Omit
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// 提取函數參數類型
export type FunctionArgs<T> = T extends (...args: infer A) => unknown ? A : never;

// 提取函數返回類型
export type FunctionReturn<T> = T extends (...args: unknown[]) => infer R ? R : never;

// 條件類型工具
// ============

// 檢查是否為數組類型
export type IsArray<T> = T extends readonly unknown[] ? true : false;

// 檢查是否為函數類型
export type IsFunction<T> = T extends (...args: unknown[]) => unknown ? true : false;

// 檢查是否為對象類型（非數組）
export type IsObject<T> = T extends object 
  ? T extends unknown[] 
    ? false 
    : true 
  : false;

// 檢查是否為 Promise 類型
export type IsPromise<T> = T extends Promise<unknown> ? true : false;

// 映射類型工具
// ============

// 創建所有屬性為可選的版本
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 創建指定屬性為必需的版本
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// 創建所有屬性為字符串類型
export type Stringify<T> = {
  [K in keyof T]: string;
};

// 創建所有屬性為布爾類型
export type Booleanify<T> = {
  [K in keyof T]: boolean;
};

// 過濾類型工具
// ============

// 過濾出指定類型的 keys
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// 過濾出非函數屬性
export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];

// 過濾出函數屬性
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

// 過濾出可選屬性
export type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends Pick<T, K> ? K : never;
}[keyof T];

// 過濾出必需屬性
export type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends Pick<T, K> ? never : K;
}[keyof T];

// 數組類型工具
// ============

// 獲取數組元素類型
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// 獲取數組的第一個元素類型
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;

// 獲取數組除第一個元素外的類型
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer R] ? R : never;

// 獲取數組最後一個元素類型
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;

// 字符串類型工具
// ==============

// 首字母大寫
export type Capitalize<S extends string> = S extends `${infer F}${infer R}` 
  ? `${Uppercase<F>}${R}` 
  : S;

// 首字母小寫
export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}` 
  ? `${Lowercase<F>}${R}` 
  : S;

// 駝峰轉蛇形
export type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

// 蛇形轉駝峰
export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

// 業務特定類型工具
// ================

// 創建實體的創建數據類型
export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

// 創建實體的更新數據類型
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt'>>;

// 創建帶有關聯的實體類型
export type WithRelations<T, R extends Record<string, unknown>> = T & R;

// 創建分頁響應類型
export type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// 創建 API 響應類型
export type ApiResult<T, E = string> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

// Hook 返回類型工具
// ==================

// 異步 Hook 返回類型
export type AsyncHookResult<T, E = Error> = {
  data: T | null;
  loading: boolean;
  error: E | null;
  refetch: () => Promise<void>;
  reset: () => void;
};

// 變異 Hook 返回類型
export type MutationHookResult<T, V, E = Error> = {
  mutate: (variables: V) => Promise<T>;
  mutateAsync: (variables: V) => Promise<T>;
  data: T | null;
  loading: boolean;
  error: E | null;
  reset: () => void;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
};

// 狀態 Hook 返回類型
export type StateHookResult<T> = [
  T,
  React.Dispatch<React.SetStateAction<T>>
];

// 表單 Hook 返回類型
export type FormHookResult<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
  reset: (values?: T) => void;
  validate: () => boolean;
};

// 類型保護工具
// ============

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isNumber = (value: unknown): value is number => 
  typeof value === 'number' && !isNaN(value);

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

export const isFunction = (value: unknown): value is (...args: unknown[]) => unknown => 
  typeof value === 'function';

export const isObject = (value: unknown): value is Record<string, unknown> => 
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value);

export const isPromise = (value: unknown): value is Promise<unknown> => 
  value instanceof Promise;

export const isNull = (value: unknown): value is null => value === null;

export const isUndefined = (value: unknown): value is undefined => value === undefined;

export const isNullish = (value: unknown): value is null | undefined => 
  value === null || value === undefined;

// 類型斷言工具
// ============

export const assertIsString = (value: unknown, message = 'Expected string'): asserts value is string => {
  if (!isString(value)) {
    throw new TypeError(message);
  }
};

export const assertIsNumber = (value: unknown, message = 'Expected number'): asserts value is number => {
  if (!isNumber(value)) {
    throw new TypeError(message);
  }
};

export const assertIsObject = (value: unknown, message = 'Expected object'): asserts value is Record<string, unknown> => {
  if (!isObject(value)) {
    throw new TypeError(message);
  }
};

export const assertIsArray = <T>(value: unknown, message = 'Expected array'): asserts value is T[] => {
  if (!isArray(value)) {
    throw new TypeError(message);
  }
};

// 驗證工具
// ========

export const createValidator = <T>(
  validate: (value: unknown) => value is T
) => (value: unknown): T | never => {
  if (validate(value)) {
    return value;
  }
  throw new TypeError('Validation failed');
};

export const createOptionalValidator = <T>(
  validate: (value: unknown) => value is T
) => (value: unknown): T | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return createValidator(validate)(value);
};

// 性能類型工具
// ============

// 創建只讀的深層代理類型
export type DeepReadonlyProxy<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonlyProxy<T[P]> : T[P];
};

// 創建延遲初始化類型
export type Lazy<T> = () => T;

// 創建可序列化類型過濾器
export type Serializable<T> = T extends 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  ? T
  : T extends Array<infer U>
  ? Array<Serializable<U>>
  : T extends object
  ? { [K in keyof T]: Serializable<T[K]> }
  : never;

// 測試工具類型
// ============

// Mock 類型生成器
export type Mock<T> = {
  [P in keyof T]: T[P] extends (...args: infer A) => infer R
    ? MockFunction<A, R>
    : T[P];
};

// 部分 Mock 類型
export type PartialMock<T> = {
  [P in keyof T]?: T[P] extends (...args: infer A) => infer R
    ? MockFunction<A, R>
    : T[P];
};

// Mock 函數類型定義
export interface MockFunction<A extends readonly unknown[], R> {
  (...args: A): R;
  mock: {
    calls: A[];
    results: Array<{ type: 'return' | 'throw'; value: R | Error }>;
    instances: unknown[];
  };
  mockClear: () => void;
  mockReset: () => void;
  mockRestore: () => void;
  mockImplementation: (fn: (...args: A) => R) => void;
  mockReturnValue: (value: R) => void;
  mockResolvedValue: (value: Awaited<R>) => void;
  mockRejectedValue: (value: unknown) => void;
}

// 類型測試工具
export type Expect<T extends true> = T;
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;