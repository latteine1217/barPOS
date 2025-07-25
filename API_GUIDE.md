# 🚀 API 呼叫統一指南

> **開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## 📋 目錄
- [架構概覽](#架構概覽)
- [狀態管理層](#狀態管理層)
- [API 服務層](#api-服務層)
- [錯誤處理策略](#錯誤處理策略)
- [快取與同步](#快取與同步)
- [開發規範](#開發規範)

---

## 🏗️ 架構概覽

### 現代化三層架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │────│  Zustand Stores │────│  Service Layer  │
│                 │    │                 │    │                 │
│ • React 19      │    │ • State Mgmt    │    │ • API Client    │
│ • TypeScript    │    │ • Actions       │    │ • Supabase      │
│ • TailwindCSS   │    │ • Selectors     │    │ • Error Handler │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 資料流向
```
User Action → Component → Store Action → Service → API → Store Update → UI Render
```

---

## 🏪 狀態管理層

### Zustand Store 結構

#### 1. 主要 Store
```typescript
// src/stores/index.ts - 統一導出
export {
  // 訂單管理
  useOrderStore, useOrders, useOrderActions,
  // 桌位管理  
  useTableStore, useTables, useTableActions,
  // 菜單管理
  useMenuStore, useMenuItems, useMenuActions,
  // 應用狀態
  useAppStore, useAppState, useAppActions,
  // 設定管理
  useSettingsStore, useSettings
} from './[respective-stores]';
```

#### 2. Store 使用模式
```typescript
// ✅ 推薦：使用選擇器 hooks
const orders = useOrders();              // 獲取訂單列表
const orderActions = useOrderActions();  // 獲取訂單操作

// ✅ 推薦：組合使用
const { orders, isLoading } = useOrderStore(state => ({
  orders: state.orders,
  isLoading: state.isLoading
}));

// ❌ 避免：直接使用整個 store
const entireStore = useOrderStore(); // 會導致不必要的重新渲染
```

---

## 🔧 API 服務層

### 1. 服務層結構
```
src/services/
├── supabaseService.ts     # 主要資料庫服務
├── analyticsService.ts    # 分析服務
├── storageService.ts      # 跨平台儲存
├── notionService.ts       # Notion 整合 (向後相容)
└── serviceWorkerManager.ts # PWA 支援
```

### 2. API 呼叫標準模式

#### 基礎 API 回應類型
```typescript
// src/types/index.ts
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

#### 統一服務模式
```typescript
// src/services/supabaseService.ts
class SupabaseService {
  // ✅ 標準 CRUD 操作
  async fetchOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return {
        success: true,
        data: data || [],
        message: `成功獲取 ${data?.length || 0} 筆訂單`
      };
    } catch (error) {
      return this.handleError(error, 'fetchOrders');
    }
  }

  // ✅ 統一錯誤處理
  private handleError(error: unknown, context: string): ApiResponse {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    console.error(`[${context}] API 錯誤:`, error);
    
    return {
      success: false,
      error: errorMessage,
      message: `${context} 操作失敗: ${errorMessage}`
    };
  }
}
```

### 3. Store 中的 API 整合
```typescript
// src/stores/orderStore.ts
export const useOrderStore = create<OrderStore>()(
  immer((set, get) => ({
    orders: [],
    isLoading: false,
    error: null,

    // ✅ 異步 action 模式
    fetchOrders: async () => {
      set(state => { state.isLoading = true; });
      
      try {
        const supabaseService = new SupabaseService();
        const result = await supabaseService.fetchOrders();
        
        if (result.success) {
          set(state => {
            state.orders = result.data || [];
            state.error = null;
          });
        } else {
          set(state => {
            state.error = result.error || '獲取訂單失敗';
          });
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : '未知錯誤';
        });
      } finally {
        set(state => { state.isLoading = false; });
      }
    },

    // ✅ 樂觀更新模式
    addOrder: async (orderData: NewOrderData) => {
      const tempId = `temp-${Date.now()}`;
      const tempOrder: Order = {
        id: tempId,
        ...orderData,
        status: 'pending',
        total: orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        subtotal: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 樂觀更新
      set(state => {
        state.orders.unshift(tempOrder);
      });

      try {
        const supabaseService = new SupabaseService();
        const result = await supabaseService.createOrder(orderData);
        
        if (result.success && result.data) {
          // 替換臨時訂單
          set(state => {
            const index = state.orders.findIndex(o => o.id === tempId);
            if (index !== -1) {
              state.orders[index] = result.data;
            }
          });
          return result.data;
        } else {
          // 回滾樂觀更新
          set(state => {
            state.orders = state.orders.filter(o => o.id !== tempId);
            state.error = result.error || '創建訂單失敗';
          });
          throw new Error(result.error || '創建訂單失敗');
        }
      } catch (error) {
        // 回滾樂觀更新
        set(state => {
          state.orders = state.orders.filter(o => o.id !== tempId);
          state.error = error instanceof Error ? error.message : '未知錯誤';
        });
        throw error;
      }
    }
  }))
);
```

---

## ⚠️ 錯誤處理策略

### 1. 分層錯誤處理
```typescript
// 服務層錯誤處理
class ApiErrorHandler {
  static handleError(error: unknown, context: string): ApiResponse {
    if (error instanceof Error) {
      // 網路錯誤
      if (error.message.includes('fetch')) {
        return {
          success: false,
          error: '網路連線錯誤，請檢查網路設定',
          code: 'NETWORK_ERROR'
        };
      }
      
      // 認證錯誤
      if (error.message.includes('unauthorized')) {
        return {
          success: false,
          error: '認證失敗，請重新登入',
          code: 'AUTH_ERROR'
        };
      }
    }
    
    // 通用錯誤
    return {
      success: false,
      error: '系統暫時無法處理您的請求，請稍後再試',
      code: 'UNKNOWN_ERROR'
    };
  }
}
```

### 2. 組件層錯誤處理
```typescript
// src/components/OrderList.tsx
const OrderList: React.FC = () => {
  const { orders, isLoading, error } = useOrders();
  const { fetchOrders } = useOrderActions();
  
  // ✅ 錯誤重試機制
  const handleRetry = useCallback(async () => {
    try {
      await fetchOrders();
    } catch (error) {
      console.error('重試失敗:', error);
    }
  }, [fetchOrders]);

  if (isLoading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={handleRetry}
        message="載入訂單時發生錯誤"
      />
    );
  }

  return <div>{/* 訂單列表 */}</div>;
};
```

---

## 🔄 快取與同步

### 1. 本地快取策略
```typescript
// src/services/storageService.ts
class StorageService {
  // ✅ 跨平台儲存抽象
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, serialized);
      }
      
      // Capacitor 原生儲存
      if (window.Capacitor) {
        await Preferences.set({ key, value: serialized });
      }
    } catch (error) {
      console.error('儲存失敗:', error);
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      let value: string | null = null;
      
      if (typeof window !== 'undefined') {
        value = localStorage.getItem(key);
      }
      
      if (!value && window.Capacitor) {
        const result = await Preferences.get({ key });
        value = result.value;
      }
      
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('讀取失敗:', error);
      return null;
    }
  }
}
```

### 2. 離線支援
```typescript
// src/hooks/useOnline.ts
export const useOnline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Store 中的離線處理
const syncPendingActions = async () => {
  const pendingActions = await StorageService.getItem<PendingAction[]>('pendingActions') || [];
  
  for (const action of pendingActions) {
    try {
      await executeAction(action);
      // 移除已同步的動作
      await StorageService.setItem('pendingActions', 
        pendingActions.filter(a => a.id !== action.id)
      );
    } catch (error) {
      console.error('同步失敗:', action, error);
    }
  }
};
```

---

## 📝 開發規範

### 1. API 呼叫最佳實踐

#### ✅ 推薦做法
```typescript
// 使用 TypeScript 泛型確保類型安全
const fetchData = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  // 實作
};

// 使用 async/await 替代 Promise.then()
const handleSubmit = async (data: FormData) => {
  try {
    const result = await apiCall(data);
    // 處理成功情況
  } catch (error) {
    // 處理錯誤情況
  }
};

// 使用統一的錯誤處理
const { showError, showSuccess } = useError();
```

#### ❌ 避免做法
```typescript
// 避免直接使用 fetch 沒有錯誤處理
fetch('/api/data').then(res => res.json()); // ❌

// 避免忽略錯誤處理
apiCall().then(data => { /* 只處理成功情況 */ }); // ❌

// 避免在組件中直接呼叫 API
const Component = () => {
  useEffect(() => {
    fetch('/api/data'); // ❌ 應該透過 store action
  }, []);
};
```

### 2. 命名規範
```typescript
// API 方法命名
interface OrderService {
  fetchOrders(): Promise<ApiResponse<Order[]>>;     // 獲取
  createOrder(data: NewOrderData): Promise<ApiResponse<Order>>; // 創建
  updateOrder(id: string, updates: Partial<Order>): Promise<ApiResponse<void>>; // 更新
  deleteOrder(id: string): Promise<ApiResponse<void>>; // 刪除
}

// Store Action 命名
interface OrderActions {
  loadOrders(): Promise<void>;        // 載入資料
  addOrder(data: NewOrderData): Promise<Order>; // 添加
  updateOrder(id: string, updates: Partial<Order>): Promise<void>; // 更新
  removeOrder(id: string): Promise<void>; // 移除
  clearOrders(): void;                // 清空
}
```

### 3. 測試策略
```typescript
// src/test/services/orderService.test.ts
describe('OrderService', () => {
  it('should fetch orders successfully', async () => {
    const mockOrders = [{ id: '1', name: 'Test Order' }];
    
    // Mock Supabase 回應
    jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockOrders, error: null })
    });
    
    const service = new OrderService();
    const result = await service.fetchOrders();
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockOrders);
  });
  
  it('should handle errors gracefully', async () => {
    const mockError = new Error('Network error');
    
    jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockRejectedValue(mockError)
    });
    
    const service = new OrderService();
    const result = await service.fetchOrders();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
```

---

## 🎯 開發檢查清單

### API 開發
- [ ] 定義清晰的 TypeScript 介面
- [ ] 實作統一的錯誤處理
- [ ] 添加適當的載入狀態
- [ ] 實作離線支援（如需要）
- [ ] 撰寫單元測試
- [ ] 更新 API 文檔

### Store 開發  
- [ ] 使用 Immer 進行不可變更新
- [ ] 實作樂觀更新（如適用）
- [ ] 添加適當的選擇器 hooks
- [ ] 實作資料持久化
- [ ] 處理競態條件
- [ ] 撰寫整合測試

### 組件開發
- [ ] 使用適當的錯誤邊界
- [ ] 實作載入和錯誤狀態
- [ ] 使用 memo 化避免不必要重新渲染
- [ ] 實作無障礙功能
- [ ] 撰寫組件測試
- [ ] 更新 Storybook（如使用）

---

## 🔗 相關文檔

- [AGENTS.md](./AGENTS.md) - 開發者指引與專案規範
- [README.md](./README.md) - 專案總覽與快速開始
- [SUPABASE_GUIDE.md](./SUPABASE_GUIDE.md) - 資料庫設定指南
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 測試規範與策略

---

*📝 最後更新: 2025年 | 🛠️ 開發工具: [opencode](https://opencode.ai) + GitHub Copilot*