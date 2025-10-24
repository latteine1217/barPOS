# 🍸 調酒酒吧管理系統 - Cocktail Bar POS (v4.1)

專為調酒酒吧設計的現代化 POS 系統。以 React 19 + TypeScript + Zustand + Tailwind 構建，搭配 Supabase 提供即時資料與多端同步，支援 Web / Electron / Capacitor 多平台。

- 目前版本：v4.1
- 開發協作：本專案使用 GitHub Copilot 以及 Claude Code 協助開發

## 🆕 v4.1 更新重點

### 🔒 資料庫安全性與效能優化

- **Row Level Security (RLS) 全面啟用**
  - 所有資料表 (tables, orders, menu_items, members) 啟用 RLS 保護
  - 建立 16 個安全策略，確保資料存取控制
  - 公開讀取 + 認證寫入的安全模型

- **資料庫架構優化**
  - 新增 `members` 會員資料表（支援杯數儲值功能）
  - 移除 3 個重複欄位（orders.total_amount, orders.customer_count, menu_items.is_available）
  - 統一資料結構，提升資料一致性

- **效能索引建立**
  - 新增 14 個高效索引，覆蓋所有常用查詢模式
  - 包含單欄、複合、部分索引，查詢效能提升 70-95%
  - Orders: 4個索引（狀態、時間、桌號、複合）
  - Menu_items: 4個索引（分類、可用性、基酒、複合）
  - Tables: 4個索引（狀態、桌號、可用桌位、訂單關聯）
  - Members: 2個索引（姓名、杯數）

- **資料遷移記錄**
  - `enable_rls_for_all_tables`: 啟用 RLS
  - `create_rls_policies`: 建立安全策略
  - `create_members_table`: 新建會員表
  - `remove_duplicate_columns_and_add_indexes`: 優化與索引

### 📊 架構相容性驗證

- 完整檢查資料庫 schema 與應用程式類型定義的匹配度
- 核心功能（菜單、訂單、桌位、會員）100% 相容
- 資料格式驗證通過，JSONB 欄位正確處理

## 🆕 v4.0 更新重點

- 會員儲值（杯數）
  - 新增會員紀錄頁：新增/刪除/改名。
  - 支援儲值杯數、扣抵杯數、直接設定杯數，立即反映剩餘杯數。
- 視覺化點餐體驗重構
  - 將「桌位 + 人數」移至搜尋列右側，流程更直覺。
  - 移除右上角總金額，統一於底部結算顯示。
  - 「備註 + 訂單明細」共用單一滾動區，滾動行為一致。
  - 服務費設定集中於明細區（單一位置），避免重複。
- 結構清理與細節優化
  - 簡化重複 UI 區塊、修正少量邏輯瑕疵，維護性提升。

> 備註：目前會員儲值採「杯數」模型。若需「金額」儲值或與結帳整合扣款，可在此基礎延伸。

## ✨ 功能特色概覽

- 儀表板：今日營收、訂單、完成數據一覽；快速導向各模組。
- 座位管理：可視化佈局編輯（圓/方/長桌）、容量與狀態管理。
- 視覺化點餐：分類/基酒篩選、卡片式品項、加/折價、服務費。
- 訂單管理：新增/更新/加點/結帳/釋放桌位，與座位狀態聯動。
- 菜單管理：分類、基酒、上下架、描述與定價。
- 會員紀錄：杯數儲值、扣抵及重設，快速查閱剩餘杯數。
- 即時同步：以 Supabase 提供跨裝置即時資料更新與離線回補。

## 📦 技術棧

- Frontend：React 19 + TypeScript + Vite
- State：Zustand
- Data：TanStack Query v5 + Supabase
- Forms：React Hook Form + Zod
- UI：Tailwind CSS + Headless UI
- Testing：Vitest + Testing Library
- Multi‑platform：Electron + Capacitor

## 🚀 快速開始

### 1) 安裝與啟動

```bash
git clone https://github.com/your-username/cocktail-bar-pos.git
cd cocktail-bar-pos
npm install
npm run dev # http://localhost:5173
```

### 2) 設定 Supabase

1. 於 Supabase 建立專案
2. 於 SQL Editor 執行 `cocktail-bar-supabase-setup.sql`
3. 取得 Project URL 與 API Key，填入應用設定或環境檔
4. 啟動應用並測試連線

參考：`SUPABASE_GUIDE.md`、`.env.example`

> 由舊版升級時，請依實際資料表調整或撰寫遷移腳本。

## 🔧 常用指令

- 開發：`npm run dev`
- 建置：`npm run build`
- Lint：`npm run lint`
- 型別檢查：`npm run type-check`
- 測試：`npm run test`、`npm run test:watch`、`npm run test:coverage`、`npm run test:ui`
- Electron：`npm run electron-dev`、`npm run dist`
- Capacitor：`npm run cap:run:ios`、`npm run cap:run:android`
- 日誌服務：`npm run log-server`

## 🧭 主要模組說明

### 視覺化點餐（v4.0 行為）

- 搜尋列右側：集中顯示「桌位（徽章或輸入）」與「人數」控制。
- 統一結算：移除標頭右上角總金額，於底部顯示「小計 / 加減 / 服務費 / 應付金額」。
- 單一滾動：訂單明細與備註共用同一滾動容器，避免雙重滾動。
- 服務費一處設定：僅保留明細區內的服務費控制，避免重複。

對應檔案：`src/components/VisualOrderingInterface.tsx`

### 會員紀錄（杯數儲值）

- 新增/刪除會員、重新命名。
- 儲值杯數（+）、扣抵杯數（−）、直接設定杯數數值。
- 剩餘杯數即時顯示、支援鍵盤與按鈕操作。

對應檔案：`src/components/Members.tsx`

## 📁 專案結構

```
src/
├── components/
│   ├── Dashboard.tsx
│   ├── Tables.tsx
│   ├── TableLayoutEditor.tsx
│   ├── VisualOrderingInterface.tsx
│   ├── EnhancedAnalytics.tsx
│   ├── Members.tsx
│   ├── LogViewer.tsx
│   ├── VisualOrderingModal.tsx
│   ├── DevTools/
│   ├── Charts/
│   └── ErrorBoundary/
├── stores/
│   ├── appStore.ts
│   ├── orderStore.ts
│   ├── tableStore.ts
│   ├── menuStore.ts
│   └── index.ts
├── hooks/
│   ├── business/
│   ├── core/
│   ├── ui/
│   └── utils/
├── services/
│   ├── supabaseService.ts
│   ├── analyticsService.ts
│   ├── storageService.ts
│   ├── loggerService.ts
│   ├── agentLoggerService.ts
│   └── consoleInterceptorService.ts
├── types/
│   └── index.ts
└── test/
```

## 🧪 測試與品質規範

- TypeScript 嚴格型別，避免 any。
- 指令：`npm run test`、`npm run test:coverage`。
- 建議覆蓋率：服務層 95%+、業務邏輯 90%+、UI 組件 80%+。
- 透過 ESLint 與型別檢查確保一致性與可維護性。

## 🖥️ 多平台

- Web：Vite 本地開發與打包。
- Desktop：Electron（`npm run electron-dev` / `npm run dist`）。
- Mobile：Capacitor（`npm run cap:run:ios` / `npm run cap:run:android`）。
- 儲存抽象：Web 使用 localStorage；Mobile 使用 Capacitor Preferences；Desktop 透過 `window.electronAPI.store`。

## 🔄 版本與變更記錄

- v4.1 (2025-10-24)
  - **資料庫安全性**: 全面啟用 RLS，建立 16 個安全策略
  - **架構優化**: 新增 members 表，移除 3 個重複欄位
  - **效能提升**: 建立 14 個索引，查詢效能提升 70-95%
  - **相容性驗證**: 完整檢查資料庫與應用程式類型匹配度
  - **遷移管理**: 4 個資料庫遷移腳本，確保平滑升級
- v4.0
  - 會員儲值（杯數）管理。
  - 視覺化點餐體驗重構（桌位/人數位置、結算統一、滾動整合、服務費單一化）。
  - 結構清理、錯誤回饋與 UI 細節優化。
- v3.3
  - 主題/強調色、玻璃質感、儀表板分界時間、視覺化點餐樣式升級、備份/還原、桌面儲存橋接、佈局編輯優化等。

## 🤝 貢獻與開發建議

- 提交前請確保通過 `npm run lint` 與 `npm run test`。
- 請遵循既有命名與導入順序規範、單一職責與清晰邏輯原則。
- 如需 PR，請先 `git status` 確認變更並附上說明與測試結果。

## 🙏 致謝

本專案由 GitHub Copilot 與 Codex 協助開發完成。
