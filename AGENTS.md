# AGENTS.md - Cocktail Bar POS System 🍸

## 🚀 開發指令集

### 基礎開發
```bash
npm run dev              # 開發服務器 (http://localhost:5173)
npm run build            # 生產構建
npm run lint             # ESLint 檢查
npm run type-check       # TypeScript 類型檢查
```

### 測試指令
```bash
npm run test             # 運行所有測試
npm run test:watch       # 監視模式測試
npm run test:coverage    # 生成覆蓋率報告
npm run test:ui          # 打開 Vitest UI
# 特定測試
npx vitest run src/path/to/file.test.ts
npx vitest run --grep "test name"
```

### 平台構建
```bash
npm run electron-dev     # Electron 桌面開發
npm run dist            # 構建桌面應用
npm run cap:run:ios     # iOS 應用
npm run cap:run:android # Android 應用
npm run log-server      # 日誌服務器
```

## 🏗️ 技術架構

### 核心技術棧
- **Frontend**: React 19 + TypeScript + Vite
- **State**: Zustand stores (完整實現)
- **Data**: TanStack Query v5 + Supabase
- **Forms**: React Hook Form + Zod 驗證
- **UI**: Tailwind CSS + Headless UI
- **Testing**: Vitest + Testing Library
- **Multi-platform**: Electron + Capacitor

### 專案結構
```typescript
src/
├── stores/              # Zustand 狀態管理
│   ├── appStore.ts     # 全局狀態
│   ├── orderStore.ts   # 訂單管理
│   └── tableStore.ts   # 餐桌狀態
├── services/           # API 和業務邏輯
│   ├── supabaseService.ts    # 數據庫操作
│   ├── analyticsService.ts   # 分析報告
│   └── storageService.ts     # 存儲管理
├── components/
│   ├── ui/            # 可重用 UI 組件
│   ├── Charts/        # 圖表組件
│   └── ErrorBoundary/ # 錯誤處理
└── types/             # TypeScript 類型定義
```

### 專案目錄樹（v4.0 實際快照）

以下為目前儲存庫主要結構，便於快速定位檔案位置。為精簡閱讀，已略過大型目錄（node_modules、dist、dist-electron、android、ios、public、supabase 等）。

```
ROOT (depth=2)
.
├── .github/
├── AGENTS.md
├── API_GUIDE.md
├── README.md
├── SUPABASE_GUIDE.md
├── TESTING_GUIDE.md
├── TYPE_SYSTEM_BEST_PRACTICES.md
├── electron/
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── components/
    ├── config/
    ├── hooks/
    ├── services/
    ├── stores/
    ├── types/
    ├── utils/
    ├── index.css
    └── main.tsx

SRC (depth=3)
src
├── components
│   ├── Dashboard.tsx
│   ├── Tables.tsx
│   ├── TableLayoutEditor.tsx
│   ├── VisualOrderingInterface.tsx
│   ├── VisualOrderingModal.tsx
│   ├── Members.tsx
│   ├── History.tsx
│   ├── Settings.tsx
│   ├── Sidebar.tsx
│   ├── EnhancedAnalytics.tsx
│   ├── Analytics.tsx
│   ├── LogViewer.tsx
│   ├── OrderDetailsModal.tsx
│   ├── ErrorBoundary/
│   ├── Charts/
│   └── ui/
├── hooks
│   ├── business/
│   ├── core/
│   ├── ui/
│   └── utils/
├── services
│   ├── supabaseService.ts
│   ├── storageService.ts
│   ├── analyticsService.ts
│   ├── loggerService.ts
│   ├── agentLoggerService.ts
│   └── consoleInterceptorService.ts
├── stores
│   ├── appStore.ts
│   ├── orderStore.ts
│   ├── tableStore.ts
│   ├── menuStore.ts
│   ├── membersStore.ts
│   ├── settingsStore.ts
│   └── index.ts
├── types
│   ├── core/
│   └── index.ts
└── utils
    ├── cacheManager.ts
    ├── chartHelpers.ts
    ├── dataAnalysis.ts
    └── performance.ts
```

查找指引：
- 視覺化點餐：`src/components/VisualOrderingInterface.tsx`，業務邏輯 Hook 在 `src/hooks/business/useVisualOrdering.ts`
- 桌位管理（格狀/地圖）：`src/components/Tables.tsx`、`src/components/TableLayoutEditor.tsx`
- 會員儲值（杯數）：`src/components/Members.tsx`，Zustand 在 `src/stores/membersStore.ts`
- Supabase 與儲存：`src/services/supabaseService.ts`、`src/services/storageService.ts`
- 狀態管理：`src/stores/*.ts`（各模組分檔，`index.ts` 聚合導出）
- UI 元件：`src/components/ui/*`
- 型別：`src/types/*`（核心型別於 `types/core`）

## 👨‍💻 開發者指引

### 🎯 專家角色
> 扮演 **TypeScript React 全端專家**，具備：
> - 🔒 **類型安全至上** - 嚴格 TypeScript，避免 any
> - ⚡ **性能優化導向** - 關注用戶體驗和響應速度
> - 🧪 **測試驅動開發** - 80%+ 覆蓋率，重視品質
> - 🏛️ **現代化架構** - Clean Code 和 SOLID 原則

### 📋 標準執行流程
1. **📖 需求分析**
   - 理解用戶故事和接受標準
   - 識別技術依賴和潛在風險
   - 評估對現有系統的影響

2. **🏗️ 架構設計**
   - 制定分階段實現計劃
   - 設計數據流和狀態管理策略
   - 考慮性能優化點和擴展性

3. **👨‍💻 編碼實現**
   - 遵循專案編碼規範
   - 編寫高品質、可維護的程式碼
   - 添加適當的類型定義和錯誤處理

4. **🧪 測試驗證**
   - 編寫單元測試和集成測試
   - 確保關鍵用戶流程正常運作
   - 驗證跨平台兼容性

5. **📝 文檔更新**
   - 更新 API 文檔和使用說明
   - 補充程式碼註釋和範例

## 💻 編碼規範

### TypeScript 嚴格規則
```typescript
// ✅ 推薦：明確的類型定義
interface OrderProps {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
}

type OrderStatus = 'pending' | 'completed' | 'cancelled';

// ❌ 避免：any 類型
// const data: any = response;

// ✅ 推薦：具體類型
const data: ApiResponse<Order> = response;
```

### 導入順序規範
```typescript
// 1. React 核心
import React, { useState, useEffect } from 'react';

// 2. 第三方庫
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. 內部模塊 (@/ 路徑)
import { Button, Modal } from '@/components/ui';
import { useOrderStore } from '@/stores/orderStore';

// 4. 類型定義 (單獨導入)
import type { Order, OrderItem } from '@/types/order';
```

### 命名約定
```typescript
// 組件: PascalCase
const OrderModal: React.FC<OrderModalProps> = () => {};

// Hook: camelCase + use 前綴
const useOrderData = () => {};

// 服務: camelCase
const orderService = {};

// 常量: UPPER_SNAKE_CASE
const API_ENDPOINTS = {};

// 檔案命名
// - 組件: OrderModal.tsx
// - Hook: useOrderData.ts
// - 服務: orderService.ts
```

## 🛡️ 錯誤處理標準

### API 響應格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 標準錯誤處理範例
const handleApiCall = async (): Promise<ApiResponse<Order[]>> => {
  try {
    const response = await orderService.getOrders();
    return { success: true, data: response };
  } catch (error) {
    console.error('API Error:', error);
    return { 
      success: false, 
      error: '無法載入數據，請稍後重試',
      code: 'FETCH_ERROR'
    };
  }
};
```

### React 錯誤邊界
```typescript
// 關鍵業務組件必須包裹錯誤邊界
<ErrorBoundary fallback={<ErrorFallback />}>
  <OrderManagement />
</ErrorBoundary>
```

## 📊 性能與品質基準

### 量化指標
```typescript
// Bundle 大小
// - 主包: < 500KB gzipped
// - 懶加載塊: < 200KB gzipped

// Web Vitals
// - First Contentful Paint: < 1.5s
// - Largest Contentful Paint: < 2.5s
// - First Input Delay: < 100ms

// 測試覆蓋率
// - 業務邏輯: 90%+
// - UI 組件: 80%+
// - 服務層: 95%+
```

### 優化策略
```typescript
// ✅ 防止不必要的重渲染
const OrderItem = React.memo<OrderItemProps>(({ order, onUpdate }) => {
  const handleUpdate = useCallback(
    (updates: Partial<Order>) => onUpdate(order.id, updates),
    [order.id, onUpdate]
  );
  return <div>{/* ... */}</div>;
});

// ✅ 懶加載重型組件
const Analytics = lazy(() => import('@/components/Analytics'));

// ✅ 避免深層嵌套 (< 3 層)
const processOrder = (order: Order) => {
  if (!order.items?.length) return;
  
  const validItems = order.items.filter(item => item.quantity > 0);
  return validItems.map(processOrderItem);
};
```

## 🧪 測試策略

### 測試範例
```typescript
// 組件測試
describe('OrderModal', () => {
  it('應該正確顯示訂單信息', () => {
    const mockOrder = createMockOrder();
    render(<OrderModal order={mockOrder} />);
    
    expect(screen.getByText(mockOrder.customerName)).toBeInTheDocument();
  });
  
  it('應該處理確認動作', async () => {
    const onConfirm = vi.fn();
    render(<OrderModal order={mockOrder} onConfirm={onConfirm} />);
    
    await user.click(screen.getByRole('button', { name: '確認' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

// 測試檔案命名
// - 組件: ComponentName.test.tsx
// - Hook: useHookName.test.ts
// - 服務: serviceName.test.ts
```

## ⚠️ 重要開發約定

### Git 工作流程
- **🚫 不主動執行** git commit/push
- **✅ 檢查狀態** 被要求時先執行 `git status`
- **✅ 提交前測試** 確保 `npm run test` 和 `npm run lint` 通過
- **✅ 更新文檔** 上傳前更新 README.md (註明使用 OpenCode + GitHub Copilot)

### 檔案處理策略
- **📁 懶惰載入** - 遇到 @filename 時才使用 Read 工具載入
- **🔄 遞迴追蹤** - 根據需要逐步載入相關檔案
- **💬 優先建議** - 提供計劃和建議，除非明確要求立即實作

### 程式碼品質要求
```typescript
// 核心原則: 邏輯清晰 > 精簡 > 易讀 > 高效

// ✅ 清晰的輸出格式
console.log('=== 訂單處理結果 ===');
console.log(`訂單ID: ${order.id}`);
console.log(`總金額: $${total}`);
console.log('========================');

// ✅ 函數職責單一
const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};
```

## 🎯 專案特定指導

### Zustand 狀態管理
```typescript
interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  
  // 動作函數使用動詞命名
  fetchOrders: () => Promise<void>;
  addOrder: (order: CreateOrderRequest) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  
  // 重置和清理
  reset: () => void;
  clearError: () => void;
}
```

### Supabase 實時集成
```typescript
// 實時訂閱處理
const setupOrderSubscription = () => {
  return supabase
    .channel('orders')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        handleOrderChange
    )
    .subscribe();
};
```

### 多平台適配
```typescript
// 平台檢測
const isPlatform = {
  web: !window.electronAPI && !window.Capacitor,
  electron: !!window.electronAPI,
  mobile: !!window.Capacitor
};

// 響應式設計 (移動優先)
.order-card {
  @apply w-full p-4;           /* 手機 */
  @apply md:w-1/2 md:p-6;      /* 平板 */
  @apply lg:w-1/3 lg:p-8;      /* 桌面 */
}

// 觸摸友好設計
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}
```

---

*本專案使用 **OpenCode + GitHub Copilot** 開發 | 最後更新: 2025-08-09*
