# 🎯 類型定義最佳實踐指南

## 📋 目錄

1. [核心原則](#核心原則)
2. [類型組織結構](#類型組織結構)
3. [命名約定](#命名約定)
4. [類型安全策略](#類型安全策略)
5. [實用工具類型](#實用工具類型)
6. [遷移計劃](#遷移計劃)

---

## 🎯 核心原則

### **1. 嚴格類型優於寬鬆類型**

```typescript
// ❌ 避免
interface User {
  data: any;
  config: Record<string, any>;
}

// ✅ 推薦
interface User {
  data: UserProfile;
  config: UserPreferences;
}

interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
}
```

### **2. 組合優於繼承**

```typescript
// ❌ 避免複雜繼承
interface AdminUser extends User {
  permissions: string[];
}

// ✅ 推薦組合
interface AdminUser extends User {
  admin: AdminPermissions;
}

interface AdminPermissions {
  canManageUsers: boolean;
  canAccessReports: boolean;
  canModifySettings: boolean;
}
```

### **3. 顯式優於隱式**

```typescript
// ❌ 隱式 any
const processData = (data) => { /* ... */ };

// ✅ 顯式類型
const processData = <T>(data: T): ProcessResult<T> => { /* ... */ };
```

---

## 🏗️ 類型組織結構

### **建議的文件結構**

```
src/types/
├── core/                    # 核心類型定義
│   ├── base.ts             # 基礎通用類型
│   ├── domain.ts           # 業務域類型
│   ├── hooks.ts            # Hook 相關類型
│   └── utils.ts            # 工具類型和泛型
├── components/             # 組件特定類型
│   ├── ui.ts              # UI 組件類型
│   ├── forms.ts           # 表單類型
│   └── charts.ts          # 圖表類型
├── services/              # 服務層類型
│   ├── api.ts             # API 相關類型
│   ├── storage.ts         # 存儲類型
│   └── logger.ts          # 日誌類型
├── legacy/                # 舊版類型 (標記廢棄)
│   └── index.ts
├── global.d.ts            # 全局類型聲明
├── index.ts               # 主入口 (舊版)
└── index-new.ts           # 新入口
```

### **模塊化導入策略**

```typescript
// ✅ 分層導入
import type { Order, CreateOrderData } from '@/types/core/domain';
import type { ApiResponse } from '@/types/core/base';
import type { UseOrderManagementReturn } from '@/types/core/hooks';

// ✅ 統一入口 (適合少量類型)
import type { 
  Order, 
  CreateOrderData, 
  UseOrderManagementReturn 
} from '@/types';
```

---

## 📝 命名約定

### **類型命名規則**

| 類型分類 | 命名模式 | 示例 |
|---------|----------|------|
| 介面 | `PascalCase` | `OrderItem`, `UserProfile` |
| 類型別名 | `PascalCase` | `OrderStatus`, `TableType` |
| 泛型參數 | `T`, `U`, `K`, `V` | `<T, K extends keyof T>` |
| 工具類型 | `PascalCase` | `DeepPartial<T>`, `ApiResult<T>` |
| 枚舉 | `PascalCase` | `UserRole`, `OrderStatus` |
| 常量類型 | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |

### **語義化命名**

```typescript
// ✅ 語義清晰
interface CreateOrderRequest {
  tableId: string;
  items: OrderItemInput[];
  customerId?: string;
}

interface OrderCreationResponse {
  order: Order;
  estimatedTime: number;
}

// ❌ 語義不清
interface OrderData {
  data: any;
  info: any;
}
```

---

## 🛡️ 類型安全策略

### **1. 邊界類型定義**

```typescript
// ✅ API 邊界嚴格類型化
interface ApiEndpoint<TRequest, TResponse> {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  request: TRequest;
  response: ApiResponse<TResponse>;
}

// ✅ 用戶輸入嚴格驗證
interface CreateOrderInput {
  tableNumber: number;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
}
```

### **2. 錯誤類型處理**

```typescript
// ✅ 結構化錯誤處理
type OrderError = 
  | { type: 'TABLE_OCCUPIED'; tableId: string }
  | { type: 'INVALID_ITEM'; itemId: string }
  | { type: 'INSUFFICIENT_STOCK'; itemId: string; available: number }
  | { type: 'PAYMENT_FAILED'; reason: string };

interface OrderResult {
  success: boolean;
  data?: Order;
  error?: OrderError;
}
```

### **3. 狀態機類型**

```typescript
// ✅ 類型安全的狀態機
type OrderState = 
  | { status: 'draft'; data: Partial<Order> }
  | { status: 'pending'; data: Order; submittedAt: Date }
  | { status: 'processing'; data: Order; estimatedTime: number }
  | { status: 'completed'; data: Order; completedAt: Date }
  | { status: 'cancelled'; data: Order; reason: string };
```

---

## 🔧 實用工具類型

### **1. 條件類型工具**

```typescript
// 智能類型提取
type ExtractApiData<T> = T extends ApiResponse<infer U> ? U : never;

// 深度可選化
type DeepOptional<T> = {
  [P in keyof T]?: T[P] extends object ? DeepOptional<T[P]> : T[P];
};

// 類型過濾
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
```

### **2. 業務特定工具**

```typescript
// 實體操作類型
type EntityOperation<T> = {
  create: (data: CreateData<T>) => Promise<T>;
  update: (id: string, data: UpdateData<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  find: (id: string) => Promise<T | null>;
};

// Hook 返回類型統一化
type AsyncHookReturn<T, E = Error> = {
  data: T | null;
  loading: boolean;
  error: E | null;
  refetch: () => Promise<void>;
  reset: () => void;
};
```

### **3. 表單類型工具**

```typescript
// 表單字段類型
type FormFieldType<T> = {
  [K in keyof T]: {
    value: T[K];
    error?: string;
    touched: boolean;
    validate: () => boolean;
  };
};

// 表單狀態
interface FormState<T> {
  values: T;
  fields: FormFieldType<T>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}
```

---

## 🚀 遷移計劃

### **Phase 1: 基礎設施 (已完成)**

- [x] 創建新的類型系統結構
- [x] 建立核心基礎類型
- [x] 實現工具類型集合
- [x] 設置統一導出入口

### **Phase 2: Hook 系統遷移 (進行中)**

```typescript
// 遷移策略：逐步替換現有 Hook
// 1. 創建新的類型定義
interface UseOrderManagementReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (data: CreateOrderData) => Promise<Order>;
  // ... 其他方法
}

// 2. 更新 Hook 實現
export const useOrderManagement = (): UseOrderManagementReturn => {
  // 實現...
};

// 3. 逐步替換使用處
```

### **Phase 3: 組件類型遷移 (計劃中)**

```typescript
// 組件 Props 類型化
interface OrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateOrderData) => Promise<void>;
}

// 事件處理類型化
type OrderEventHandler = (order: Order) => void;
type OrderErrorHandler = (error: OrderError) => void;
```

### **Phase 4: 服務層遷移 (計劃中)**

```typescript
// 服務接口標準化
interface OrderService {
  create: (data: CreateOrderData) => Promise<ApiResult<Order>>;
  update: (id: string, data: UpdateOrderData) => Promise<ApiResult<Order>>;
  delete: (id: string) => Promise<ApiResult<void>>;
  list: (filters?: OrderFilters) => Promise<ApiResult<Order[]>>;
}
```

---

## ⚡ 性能優化建議

### **1. 類型計算優化**

```typescript
// ✅ 使用映射類型而不是條件類型
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// ❌ 避免過深的條件類型嵌套
type DeepComplexType<T> = T extends A 
  ? T extends B 
    ? T extends C 
      ? ComplexOperation<T>
      : never
    : never
  : never;
```

### **2. 懶加載類型**

```typescript
// ✅ 按需導入類型
const importOrderTypes = () => import('./types/order');

// ✅ 動態類型定義
type DynamicOrderType<T extends string> = T extends 'create' 
  ? CreateOrderData 
  : T extends 'update' 
  ? UpdateOrderData 
  : Order;
```

### **3. 類型緩存策略**

```typescript
// ✅ 類型別名避免重複計算
type CommonOrderFields = Pick<Order, 'id' | 'status' | 'total'>;

interface OrderSummary extends CommonOrderFields {
  itemCount: number;
}

interface OrderPreview extends CommonOrderFields {
  customerName: string;
}
```

---

## 🧪 測試類型定義

### **類型測試工具**

```typescript
// 類型測試輔助
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) 
  ? true 
  : false;

// 使用示例
type test_order_type = Expect<Equal<Order['status'], OrderStatus>>;
type test_api_response = Expect<Equal<ApiResponse<Order>['data'], Order | undefined>>;
```

### **Mock 類型生成**

```typescript
// 自動 Mock 生成
type MockOrderService = Mock<OrderService>;

const mockOrderService: MockOrderService = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};
```

---

## 📚 參考資源

- [TypeScript 官方文檔](https://www.typescriptlang.org/docs/)
- [Utility Types 深度指南](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Advanced Types 最佳實踐](https://www.typescriptlang.org/docs/handbook/advanced-types.html)

---

*本指南會隨著專案發展持續更新*