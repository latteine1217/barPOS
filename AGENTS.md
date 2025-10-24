# AGENTS.md - Cocktail Bar POS System

指南面向可協作的 AI／自動化代理，聚焦於快速融入專案、生產級品質與安全交付。

## 1. 快速指令

### 開發
```bash
npm run dev          # Vite 開發伺服器 (http://localhost:5173)
npm run build        # 生產建置
npm run lint         # ESLint
npm run type-check   # TypeScript
```

### 測試
```bash
npm run test         # 單次測試
npm run test:watch   # 監看模式
npm run test:coverage# 覆蓋率
npm run test:ui      # Vitest UI
npx vitest run src/path/to/file.test.ts  # 單檔 / grep
```

### 跨平台
```bash
npm run electron-dev # Electron 開發
npm run dist         # 桌面建置
npm run cap:run:ios  # iOS
npm run cap:run:android # Android
npm run log-server   # 日誌伺服器
```

## 2. 架構摘要

### 技術拼圖
- 前端體系：React 19、TypeScript、Vite、Tailwind、Headless UI，配合 React Hook Form + Zod 處理表單。
- 資料層：TanStack Query v5 主管 API 緩存，Supabase 提供即時資料同步與儲存。
- 平台支援：Electron (桌面)、Capacitor (行動) 透過 `storageService`、`serviceWorkerManager` 管理離線體驗。
- 測試工具：Vitest + Testing Library (`src/test` 夾層負責對應 mocks 與 setup)。

### 專案架構圖（tree）
```
src
├─ App.tsx                         # 全域路由/Provider/錯誤邊界
├─ main.tsx                        # Vite 入口，掛載 React
├─ components
│  ├─ Dashboard.tsx                # 今日營運儀表板
│  ├─ Tables.tsx                   # 桌位監控與點餐入口
│  ├─ TableLayoutEditor.tsx        # 桌位佈局編輯
│  ├─ VisualOrderingInterface.tsx  # 卡片式點餐介面
│  ├─ Members.tsx                  # 會員杯數管理
│  ├─ DevTools/                    # Hook/State/Performance 調試面板
│  ├─ Charts/                      # 圖表元件
│  └─ ui/                          # 基礎 UI (Button/Input/Modal…)
├─ hooks
│  ├─ business/                    # 業務流程 hook（訂單/菜單/桌位/儀表板）
│  ├─ core/                        # 即時更新、最佳化、網路狀態
│  ├─ utils/                       # 分頁、節流、無限捲動
│  └─ useLocalStorage.ts…          # 通用工具 hook
├─ services
│  ├─ supabaseService.ts           # Supabase CRUD＋同步
│  ├─ storageService.ts            # Web/Electron/Capacitor 儲存抽象
│  ├─ analyticsService.ts          # RFM/趨勢/座位分析
│  ├─ loggerService.ts             # 日誌集中 & 代理寫入
│  └─ consoleInterceptorService.ts # Console 攔截與保護
├─ stores
│  ├─ appStore.ts                  # 協調初始化＋跨 store 操作
│  ├─ orderStore.ts                # 訂單狀態、persist、查詢 selector
│  ├─ tableStore.ts                # 桌位狀態與佈局
│  ├─ menuStore.ts                 # 菜單 CRUD 與預設資料
│  ├─ membersStore.ts              # 會員杯數操作
│  └─ settingsStore.ts             # 主題、Supabase 設定、佈局配置
├─ utils
│  ├─ dataAnalysis.ts              # RFM/尖峰時段/座位分析純函式
│  ├─ cacheManager.ts              # 多層快取策略
│  └─ performance.ts               # Web Vitals/記憶體記錄
├─ types
│  ├─ core/                        # Order/Table/Menu/Member 型別
│  └─ index.ts                     # 型別聚合導出
├─ config
│  └─ menuVisualConfig.ts          # 菜單 emoji 與視覺設定
└─ test/                           # Vitest 測試、mock、StrictMode 偵測

electron/
├─ main.cjs                        # Electron 主進程
└─ preload.cjs                     # Renderer 與 Node 橋接

supabase/
├─ migrations/                     # SQL 遷移
├─ setup_v3_3.sql                  # 初始 schema
└─ migrate_v3_3_from_legacy.sql    # 舊版升級腳本
```

### 目錄導覽總覽
- `src/App.tsx`、`src/main.tsx`：負責全域 Provider、ErrorBoundary 與 Route 切換。
- `src/components/`：頁面與複合 UI。
  - `Dashboard.tsx` 使用 `useDashboard` 讀取今日統計與最近訂單。
  - `Tables.tsx`、`TableLayoutEditor.tsx` 與 `visualOrderingModalStore.ts` 管理桌位佈局與點餐 modal。
  - `VisualOrderingInterface.tsx`、`VisualOrderingModal.tsx` 搭配 `useVisualOrdering` 實作卡片式點餐與狀態更新。
  - `Members.tsx` 對接會員杯數 store；`LogViewer.tsx`、`DevTools/*` 用於開發排錯。
  - `Charts/*` 集中圖表元件；`ui/*` 提供 Button / Modal / Input 等基礎組件。
- `src/hooks/`：依職能拆分。
  - `business/` 連結 store 與業務流程（點餐、桌位、菜單、儀表板）。
  - `core/` 封裝即時更新、最佳化更新、網路狀態等橫切邏輯。
  - `utils/` 與根目錄 hooks 提供 debounce、localStorage、pagination 等通用工具。
- `src/services/`：後端與系統服務。
  - `supabaseService.ts` 封裝 CRUD 與同步流程，並提供連線測試。
  - `storageService.ts` 提供 Web/Electron/Capacitor 三端一致的資料儲存 API。
  - `analyticsService.ts`、`consoleInterceptorService.ts`、`agentLoggerService.ts`、`serviceWorkerManager.ts` 分別負責指標分析、Console 攔截、Agent 日誌與 PWA 生命週期。
- `src/stores/`：Zustand 狀態配置。
  - `orderStore.ts`、`tableStore.ts`、`menuStore.ts`、`membersStore.ts`、`settingsStore.ts` 以及 `appStore.ts` (協調初始化)。
  - `index.ts` 暴露細粒度 selector，避免 React 19 `useSyncExternalStore` 警示。
- `src/utils/`：快取策略 (`cacheManager.ts`)、資料分析 (`dataAnalysis.ts`)、效能監控 (`performance.ts`) 與圖表格式轉換 (`chartHelpers.ts`)。
- `src/types/`：`types/core` 定義 Domain 型別（Order、Table、Member 等），`index.ts` 聚合導出。
- 其他：`src/config/menuVisualConfig.ts` 儲存菜單 emoji / 色彩策略；`providers/` 與 `schemas/` 暫留擴充點。
- 根目錄輔助：`electron/` (主進程、preload)、`supabase/` (SQL 與 migrations)、`log-server.js` (集中日誌)、`CONSOLE_LOG_GUIDE.md` 與 `INFINITE_LOOP_DEBUG_GUIDE.md` 協助代理除錯。

### 目錄與核心檔案備註
- `src/components/Dashboard.tsx`：顯示營收/訂單指標，消費 `useDashboard`。
- `src/components/Tables.tsx` / `TableLayoutEditor.tsx`：桌位即時狀態與佈局編輯。
- `src/components/VisualOrderingInterface.tsx`：卡片點餐、服務費、狀態更新。
- `src/components/Members.tsx`：會員杯數增減與增刪改。
- `src/components/DevTools/*`：Hook Debugger、State Inspector、性能追蹤。
- `src/hooks/business/useOrderManagement.ts`：管理訂單 CRUD 與 store 交互。
- `src/hooks/business/useVisualOrdering.ts`：點餐流程邏輯、驗證與總金額計算。
- `src/hooks/core/useRealTimeUpdates.ts`：Supabase 實時資料節流與批次更新。
- `src/services/supabaseService.ts`：Supabase CRUD/同步、狀態映射。
- `src/services/storageService.ts`：Web/Electron/Capacitor 統一儲存抽象。
- `src/services/analyticsService.ts`：營運分析（RFM、尖峰時段、座位利用率）。
- `src/services/loggerService.ts`、`agentLoggerService.ts`、`consoleInterceptorService.ts`：應用與代理日誌管線。
- `src/stores/appStore.ts`：協調各 store 初始化、跨 store 操作。
- `src/stores/orderStore.ts` / `tableStore.ts` / `menuStore.ts` / `membersStore.ts` / `settingsStore.ts`：核心資料模組，內含初始化與 persist 邏輯。
- `src/utils/dataAnalysis.ts`：RFM、趨勢、座位分析等純函式。
- `src/utils/cacheManager.ts`：多層快取策略。
- `src/config/menuVisualConfig.ts`：菜單 emoji、色條與分類視覺設定。
- `src/test/*`：Vitest 測試、mock 與 StrictMode 偵測。
- `electron/main.cjs` / `preload.cjs`：Electron 主進程與前端橋接。
- `supabase/migrations/*`、`cocktail-bar-supabase-setup.sql`：資料庫 schema 與遷移腳本。

### 核心資料流
1. UI 經由 `hooks/business/*` 操作 `stores/*`，store 透過 `storageService` 永續儲存並可交由 `supabaseService` 同步。
2. `analyticsService` 以 `dataAnalysis` 的 RFM、趨勢計算供 `Dashboard.tsx`、`EnhancedAnalytics.tsx` 顯示。
3. `consoleInterceptorService` → `loggerService` → `agentLoggerService` 建立跨代理、文件、控制台的監控串流。
4. `useRealTimeUpdates`、`useOptimisticUpdates` 等核心 hooks 讓 Supabase 實時事件不會造成重複渲染。

更多詳細背景：`README.md`（版本與功能）、`API_GUIDE.md`、`SUPABASE_GUIDE.md`、`TESTING_GUIDE.md`。

## 3. 開發準則

- **TypeScript 嚴格模式**：禁止 `any`／未注解匯出；偏好明確 `interface`/`type`；跨模組型別集中於 `src/types`。
- **導入順序**：React → 第三方 → `@/` 內部 → `type` 匯入。
- **命名**：組件 PascalCase、hook `useXx`、store action 為動詞、常數 UPPER_SNAKE_CASE。
- **錯誤處理**：服務層統一回傳 `ApiResponse<T>`；核心頁面包在 `ErrorBoundary`。
- **效能**：維持淺層組件、使用 `React.memo`/`useCallback` 控制重渲染；大型模組 Lazy load；追蹤 Web Vitals。

## 4. 工作流程

1. **需求→設計→實作→測試→文件**：在每一步記錄假設與限制。  
2. **Git 規範**：不主動 commit/push；被要求才 `git status`；提交前確保 `npm run lint && npm run test`。  
3. **檔案操作**：遵循懶載策略（需要時才讀檔）；維持既有 ASCII 風格；避免破壞使用者先前變更。  
4. **記錄**：關鍵邏輯才加註解；複雜流程前給一句式說明。

## 5. 測試與品質

- 覆蓋率目標：業務 ≥ 90%，UI ≥ 80%，服務 ≥ 95%。  
- 測試命名：`ComponentName.test.tsx`、`useHookName.test.ts`、`serviceName.test.ts`。  
- 優先驗證：訂單流程、會員儲值、桌位同步、Supabase 實時事件。  
- 若無法執行測試，需列出阻礙與驗證建議。

## 6. 功能指引

- **視覺化點餐** (`src/components/VisualOrderingInterface.tsx`, `src/hooks/business/useVisualOrdering.ts`)：管理分類/基酒篩選、加點、備註、服務費與狀態更新；透過 `useTableStore.updateTable` 即時回寫桌位狀態。  
- **桌位佈局與現場狀態** (`src/components/Tables.tsx`, `src/components/TableLayoutEditor.tsx`)：`tableStore` 保存座位位置/容量；`settingsStore.layoutConfig` 控制畫布尺寸與格線；`visualOrderingModalStore.ts` 控制桌位點餐彈窗。  
- **會員杯數** (`src/components/Members.tsx`, `src/stores/membersStore.ts`)：提供新增、刪除、改名、儲值/扣抵/直接設定杯數的 action；初始化邏輯會先讀取 persist snapshot，再回退到 `storageService`。  
- **菜單與分析** (`src/stores/menuStore.ts`, `src/utils/dataAnalysis.ts`, `src/services/analyticsService.ts`, `src/components/EnhancedAnalytics.tsx`)：內建預設菜單、搜尋/上下架與客製統計（RFM、座位利用率、尖峰時段）。  
- **設定與同步** (`src/components/Settings.tsx`, `src/services/supabaseService.ts`, `src/services/storageService.ts`)：支援 Supabase 連線測試、本地資料備份/還原、上雲同步以及行事曆截點與主題設定。  
- **日誌與性能監控** (`src/services/loggerService.ts`, `src/services/consoleInterceptorService.ts`, `src/services/agentLoggerService.ts`, `src/utils/performance.ts`, `src/components/DevTools/*`)：集中管理應用與代理日誌，並提供 Hook Debugger、State Inspector、PerformanceMonitor。  
- **多端適配** (`storageService.ts`, `serviceWorkerManager.ts`, Capacitor/Electron 檔案)：分別處理 localStorage、Capacitor Preferences、Electron Store；Service Worker 支援 PWA 更新與快取清理。

## 7. 參考與更新

- 持續同步 `TYPE_SYSTEM_BEST_PRACTICES.md` 及 `SUPABASE_GUIDE.md` 以維持規範一致。  
- 若引入新工具或流程，需在此檔案與對應指南同步更新。  
- 本檔案最後更新：2025-09-12；調整時請改寫日期並紀錄重大變更。

---

*本專案使用 OpenCode + GitHub Copilot 協作開發*
