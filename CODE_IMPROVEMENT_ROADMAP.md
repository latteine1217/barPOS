# 🍸 調酒酒吧 POS 系統 - 程式碼改善路線圖

> **程式碼審查日期**: 2025-01-25  
> **審查工具**: opencode + GitHub Copilot  
> **整體評分**: B+ (81/100)

## 📊 審查總結

### ✅ **優點**
- ✅ 使用 React 19 + Vite 現代化技術棧
- ✅ 完整的跨平台支援（Web/Desktop/Mobile）
- ✅ Supabase 雲端同步架構良好
- ✅ 組件職責分離清晰
- ✅ 有完整的錯誤邊界保護

### ⚠️ **主要問題**
- 🔴 TypeScript/JavaScript 混用不一致 (24 JSX + 19 TSX + 7 JS + 18 TS)
- 🔴 Context 架構過於複雜，5層嵌套結構
- 🟡 效能優化不足，缺乏 memo 化
- 🟡 ESLint 警告過多 (120個警告, 2個錯誤)

---

## 🚀 階段性改善計畫

### **Phase 1: 🔥 緊急修復 (1-2 天)**

#### **優先級: HIGH 🔴**

#### ✅ **已完成項目**
- [x] 移除重複的 `ErrorContext.jsx` 檔案
- [x] 修復 `dataAnalysis.ts` 語法錯誤
- [x] 優化 `Dashboard.jsx` 性能 (添加 useMemo/useCallback)
- [x] 修復 ErrorContext 導入路徑

#### 🔲 **待完成項目**

##### **1.1 TypeScript 遷移**
```bash
# 目標：統一所有檔案使用 TypeScript
# 檔案清單需要遷移：
- src/components/*.jsx → *.tsx (24 files)
- src/contexts/*.jsx → *.tsx (5 files)  
- src/services/*.js → *.ts (2 files)
- src/utils/*.js → *.ts (1 file)
```

**執行步驟：**
1. 遷移核心 Context 檔案
2. 遷移主要組件
3. 遷移服務層
4. 更新所有導入路徑

##### **1.2 修復 ESLint 錯誤**
```bash
# 目前錯誤：2個
- src/App.jsx:50:21 - Unreachable code
- src/utils/dataAnalysis.ts:150:9 - Unexpected lexical declaration
```

##### **1.3 Context 架構重構**
```typescript
// 目標：簡化 Provider 嵌套結構
// 當前：5層嵌套 → 目標：平行結構

// 重構前 (AppContext.tsx:18-44)
<SettingsProvider>
  <MenuProvider>
    <OrderProvider>
      <TableProvider>
        <StatsConsumer> // 問題：中間層獲取其他 Context

// 重構後 (建議)
<ErrorProvider>
  <SettingsProvider>
    <MenuProvider>
      <TableProvider>
        <OrderProvider>
          <StatsProvider>
```

---

### **Phase 2: ⚡ 性能優化 (3-5 天)**

#### **優先級: MEDIUM 🟡**

##### **2.1 React 性能優化**

**目標組件清單：**
```typescript
// 需要添加 memo 優化的組件
- src/components/Tables.jsx
- src/components/Menu.jsx
- src/components/History.jsx
- src/components/Analytics.jsx
- src/components/Settings.tsx
- src/components/Sidebar.jsx
```

**優化模式：**
```typescript
// 模板
import { memo, useMemo, useCallback } from 'react';

const ComponentName = memo(({ prop1, prop2 }) => {
  // 昂貴計算使用 useMemo
  const expensiveValue = useMemo(() => {
    return heavyCalculation(prop1);
  }, [prop1]);

  // 事件處理使用 useCallback
  const handleEvent = useCallback((data) => {
    // 處理邏輯
  }, [/* dependencies */]);

  return (
    // JSX
  );
});
```

##### **2.2 狀態管理優化**

**Context 選擇性訂閱：**
```typescript
// 實作選擇性狀態訂閱，減少不必要重渲染
export function useOrdersSelector<T>(selector: (state: OrderState) => T): T {
  const { state } = useOrder();
  return useMemo(() => selector(state), [state, selector]);
}

// 使用範例
const recentOrders = useOrdersSelector(state => 
  state.orders.slice().sort(...).slice(0, 5)
);
```

**防抖儲存機制：**
```typescript
// 避免頻繁 localStorage 寫入
const debouncedSave = useMemo(
  () => debounce((data: any) => {
    saveToStorage(STORAGE_KEYS.ORDERS, data);
  }, 1000),
  []
);
```

##### **2.3 API 呼叫優化**

**目標檔案：**
- `src/services/supabaseService.js` → `.ts`
- `src/services/notionService.js` → `.ts`

**優化重點：**
- 添加請求快取機制
- 實作請求去重
- 添加重試邏輯
- 優化批量操作

---

### **Phase 3: 🧹 程式碼品質提升 (1 週)**

#### **優先級: MEDIUM 🟡**

##### **3.1 TypeScript 類型優化**

**減少 `any` 類型使用：**
```bash
# 目前 any 類型統計
- Chart components: 15 instances
- Hook files: 8 instances  
- Type definitions: 10 instances
- Utility functions: 6 instances
```

**具體檔案：**
- `src/components/Charts/*.tsx` - 圖表組件類型定義
- `src/hooks/*.ts` - Hook 類型優化
- `src/types/index.ts` - 強化類型定義

##### **3.2 React Hooks 依賴優化**

**修復 useEffect/useCallback 依賴：**
```typescript
// 需要修復的檔案
- src/components/History.jsx:91
- src/components/TableLayoutEditor.jsx:94,184
- src/contexts/ErrorContext.tsx:131
- src/contexts/TableContext.jsx:181
- src/hooks/useApiError.js:58
- src/hooks/useKeyboardNavigation.ts:57,86,109,151
- src/hooks/useOnline.ts:87,127,160
```

##### **3.3 程式碼一致性**

**統一命名慣例：**
- 組件檔案：`PascalCase.tsx`
- Hook 檔案：`camelCase.ts`  
- 工具函數：`camelCase.ts`
- 常數：`UPPER_SNAKE_CASE`

**統一匯出模式：**
```typescript
// 推薦模式
export default ComponentName;
export { namedExport1, namedExport2 };

// 避免 fast-refresh 警告
// 將常數和工具函數移到單獨檔案
```

---

### **Phase 4: 🧪 測試與文檔 (3-5 天)**

#### **優先級: LOW 🟢**

##### **4.1 單元測試擴充**

**測試覆蓋目標：**
```bash
# 當前測試檔案
- src/test/components/basic.test.jsx
- src/test/contexts/AppContext.test.jsx  
- src/test/hooks/hooks.test.js
- src/test/services/storage.test.js
- src/test/framework.test.jsx

# 需要新增
- Context 測試完整覆蓋
- 核心組件測試
- API 服務測試
- Hook 測試
```

**測試框架：Vitest + Testing Library**
```typescript
// 測試模板
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

##### **4.2 文檔更新**

**需要更新的文檔：**
- `README.md` - 專案說明更新
- `AGENTS.md` - 開發指南更新  
- API 文檔 - 服務層介面文檔
- 組件文檔 - 主要組件使用說明

---

### **Phase 5: 🔍 監控與維護 (持續進行)**

#### **優先級: LOW 🟢**

##### **5.1 性能監控**

**實作監控指標：**
```typescript
// 性能監控
- 組件渲染時間
- API 請求延遲
- 記憶體使用狀況
- Bundle 大小追蹤
```

**工具整合：**
- Web Vitals 監控
- React DevTools Profiler
- Bundle Analyzer

##### **5.2 持續改善**

**建立流程：**
- 定期程式碼審查
- 性能基準測試
- 依賴更新檢查
- 安全漏洞掃描

---

## 📋 執行檢查清單

### **Phase 1 檢查清單**
- [ ] 完成所有 `.jsx` → `.tsx` 遷移
- [ ] 修復所有 ESLint 錯誤
- [ ] 重構 Context Provider 架構
- [ ] 更新所有導入路徑
- [ ] 執行 `npm run lint` 無錯誤

### **Phase 2 檢查清單**  
- [ ] 主要組件添加 memo 優化
- [ ] 實作選擇性狀態訂閱
- [ ] 添加防抖儲存機制
- [ ] API 服務遷移到 TypeScript
- [ ] 性能測試通過

### **Phase 3 檢查清單**
- [ ] 減少 `any` 類型使用 50%
- [ ] 修復所有 React Hooks 依賴警告
- [ ] 統一程式碼風格
- [ ] ESLint 警告降到 20 個以下

### **Phase 4 檢查清單**
- [ ] 測試覆蓋率達到 70%
- [ ] 所有核心功能有測試
- [ ] 文檔更新完成
- [ ] API 文檔建立

### **Phase 5 檢查清單**
- [ ] 性能監控系統建立
- [ ] 基準性能測試建立
- [ ] 持續整合流程建立
- [ ] 監控警報設置

---

## 🎯 成功指標

### **短期目標 (2 週內)**
- ✅ ESLint 錯誤: 2 → 0
- 🎯 ESLint 警告: 120 → < 20
- 🎯 TypeScript 覆蓋率: 60% → 95%
- 🎯 程式碼一致性評分: C → A

### **中期目標 (1 個月內)**
- 🎯 性能評分: 70/100 → 85/100
- 🎯 測試覆蓋率: 20% → 70%
- 🎯 Bundle 大小優化: 10% 減少
- 🎯 初次載入時間: 20% 改善

### **長期目標 (3 個月內)**
- 🎯 整體程式碼評分: B+ → A
- 🎯 維護性評分: 80/100 → 90/100
- 🎯 開發體驗評分: A
- 🎯 生產準備度: A

---

## 🔧 實用工具命令

### **開發命令**
```bash
# 基本開發
npm run dev              # 啟動開發服務器
npm run build            # 建置生產版本
npm run preview          # 預覽生產版本

# 程式碼檢查
npm run lint             # ESLint 檢查
npm run type-check       # TypeScript 檢查
npm run test             # 執行測試
npm run test:coverage    # 測試覆蓋率

# 跨平台開發
npm run electron-dev     # Electron 開發
npm run cap:sync         # Capacitor 同步
npm run mobile:dev:ios   # iOS 開發
```

### **檢查命令**
```bash
# 檔案統計
find src -name "*.tsx" | wc -l    # TypeScript React 檔案數
find src -name "*.jsx" | wc -l    # JavaScript React 檔案數

# ESLint 特定檢查
npx eslint src --ext .tsx,.jsx    # 只檢查 React 檔案
npx eslint src --fix              # 自動修復

# 依賴分析
npm ls                            # 依賴樹狀圖
npm audit                         # 安全漏洞檢查
```

---

## 📝 注意事項

### **重要提醒**
1. **備份**: 每個 Phase 開始前請建立 Git 分支
2. **測試**: 每次修改後請執行完整測試
3. **漸進式**: 不要一次修改太多檔案
4. **文檔**: 重大變更請更新相關文檔

### **風險管控**
- **高風險**: Context 架構重構 - 需要充分測試
- **中風險**: TypeScript 遷移 - 可能有類型錯誤
- **低風險**: 性能優化 - 向後相容性好

### **推薦工具**
- **VS Code Extensions**: TypeScript Hero, Auto Rename Tag
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions
- **監控**: Sentry, Web Vitals

---

## 📞 技術支援

如果在執行過程中遇到問題，請參考：
- [React 19 官方文檔](https://react.dev/)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [Vite 配置指南](https://vitejs.dev/guide/)
- [ESLint 規則說明](https://eslint.org/docs/rules/)

**最後更新**: 2025-01-25  
**建立工具**: opencode + GitHub Copilot 🤖