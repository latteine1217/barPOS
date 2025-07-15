# AGENT.md - 餐廳管理系統

這份文件旨在為 AI 開發代理提供本專案的開發指南，使其能夠理解專案的架構、慣例和核心邏輯。

> **開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## 1. 專案總覽

本專案是一個功能類似 iChef 的餐廳銷售時點情報系統 (POS)，主要使用 Supabase 作為雲端資料庫後端，並保留 Notion API 作為向後相容選項。系統完全在前端運行，透過 React 19 + Vite 實現。

**核心功能:**
- **儀表板**: 即時顯示營收、訂單數等關鍵指標
- **桌位管理**: 自訂桌位佈局編輯器、視覺化狀態監控、拖拽操作
- **點餐系統**: iChef/POS 機風格的格狀菜單界面，支援視覺化點餐
- **訂單管理**: 新增訂單、加點、結帳、更新訂單狀態等功能
- **雲端同步**: Supabase 即時同步或 Notion API 資料備份
- **跨平台**: Web/Desktop/Mobile 全平台支援

**相關文件參考:**
- `@README.md`: 專案總覽、快速開始指南和開發部署說明
- `@SUPABASE_GUIDE.md`: Supabase 雲端資料庫設定詳細指南
- `@supabase-setup-simple.sql`: 資料庫建立腳本

## 2. 技術架構

- **前端**:
    - **框架**: React 19 + Vite
    - **語言**: JavaScript (JSX), HTML5
    - **樣式**: Tailwind CSS (取代傳統 CSS)
    - **架構**: 單頁應用程式 (SPA)，使用 React 組件和 Context API 進行狀態管理
- **後端 / 資料庫**:
    - **主要**: Supabase (PostgreSQL 雲端資料庫 + 即時同步)
    - **備選**: Notion API (向後相容)
- **跨平台支援**:
    - **桌面**: Electron 37 (Windows/macOS/Linux)
    - **移動**: Capacitor 7 (iOS/Android)
- **相依性**: React, Tailwind CSS, @tailwindcss/forms, ESLint plugins
- **開發工具**: opencode + GitHub Copilot (AI 輔助開發)

## 3. 專案結構

```
/
├── android/                # Android 原生專案目錄
├── ios/                    # iOS 原生專案目錄
├── electron/               # Electron 主進程檔案
│   └── main.cjs           # Electron 應用程式入口點
├── src/
│   ├── components/         # React 組件
│   │   ├── Dashboard.jsx   # 儀表板組件
│   │   ├── Tables.jsx      # 桌位管理組件
│   │   ├── TableLayoutEditor.jsx # 桌位佈局編輯器
│   │   ├── Menu.jsx        # 菜單管理組件
│   │   ├── Settings.jsx    # 設定組件
│   │   ├── Sidebar.jsx     # 側邊欄組件
│   │   ├── Analytics.jsx   # 分析統計組件
│   │   ├── History.jsx     # 歷史記錄組件
│   │   ├── ErrorBoundary.jsx # 錯誤邊界組件
│   │   ├── VisualOrderingInterface.jsx # 視覺化點餐介面
│   │   └── OrderDetailsModal.jsx # 訂單詳情模態框
│   ├── contexts/
│   │   └── AppContext.jsx  # 全域狀態管理
│   ├── services/
│   │   ├── supabaseService.js # Supabase API 服務
│   │   ├── notionService.js   # Notion API 服務 (向後相容)
│   │   └── storageService.js  # 跨平台儲存服務
│   ├── types/
│   │   └── global.d.ts     # TypeScript 類型定義
│   ├── App.jsx             # 主要應用組件
│   ├── main.jsx            # React 入口點
│   └── index.css           # Tailwind CSS 樣式
├── dist/                   # 建置後的網頁檔案
├── dist-electron/          # Electron 打包輸出目錄
├── public/                 # 靜態資源
├── capacitor.config.ts     # Capacitor 移動端配置
├── index.html              # HTML 入口點
├── package.json            # 依賴和腳本配置
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── README.md               # 專案總覽說明
├── SUPABASE_GUIDE.md       # Supabase 設定指南
├── supabase-setup-simple.sql # 資料庫建立腳本
├── setup-ios.sh            # iOS 開發環境設置腳本
└── AGENTS.md               # (本檔案) AI 開發代理指南
```

- `index.html`: React 應用的入口 HTML，包含 root div 和 Vite 模組腳本。
- `src/App.jsx`: 主要應用組件，管理路由和整體佈局。
- `src/contexts/AppContext.jsx`: 使用 React Context API 和 useReducer 進行全域狀態管理：
    - **狀態管理**: 所有訂單、菜單、桌位等資料都在 Context 中管理。
    - **Actions**: 提供 addOrder, updateOrder, updateTable 等操作函數。
    - **自動計算**: 統計數據會根據狀態變化自動重新計算。
- `src/components/`: 各個功能的 React 組件，每個組件負責特定的 UI 區塊和邏輯。
- `src/services/notionService.js`: 專門處理 Notion API 的服務類別。
- `src/index.css`: 包含 Tailwind 基礎樣式和自定義組件樣式。

## 4. 設定與啟動

要啟動此應用程式，請遵循以下步驟：

1.  **取得專案**:
    ```bash
    git clone [repository-url]
    cd restaurant-pos
    ```
2.  **設定 Notion**:
    - 參考 `@NOTION_SETUP.md` 的說明，建立一個 Notion Integration 並取得 **Internal Integration Token**。
    - 建立一個新的 Notion Database，並確保它包含必要的欄位（訂單編號、桌號、總額、狀態等）。
    - 將此 Database 分享給您剛剛建立的 Integration。
    - 複製您的 **Database ID** (通常是 URL 中的 32 位字元字串)。
3.  **啟動應用**:
    ```bash
    npm run dev
    ```
    這會啟動 Vite 開發服務器，通常在 http://localhost:5173
4.  **在應用中設定**:
    - 點擊側邊欄的「設定」。
    - 在「Notion Integration Token」欄位貼上您的 Token。
    - 在「Database ID 或 URL」欄位貼上您的 Database ID 或完整的 URL。
    - 點擊「儲存設定」。系統會自動測試連線並給予提示。

## 5. 開發慣例與程式碼風格

- **框架**: 使用 React 19 和 JSX 語法。所有組件都應該是函數式組件並使用 React Hooks。
- **狀態管理**: 使用 React Context API 進行全域狀態管理，本地狀態使用 useState。
- **樣式**: 使用 Tailwind CSS utility classes，避免自定義 CSS（除非在 @layer components 中定義）。
- **命名**:
    - React 組件使用 `PascalCase`（如 `Dashboard`, `NewOrderModal`）。
    - 變數和函數使用 `camelCase`。
    - 檔案名稱使用 `PascalCase.jsx` 用於組件，`camelCase.js` 用於工具函數。
- **組件結構**:
    - 使用 `useApp()` hook 來存取全域狀態和 actions。
    - 元件內部狀態用 `useState`，副作用用 `useEffect`。
    - 事件處理函數以 `handle` 開頭（如 `handleSubmit`, `handleClick`）。
- **API 呼叫**:
    - 所有 Notion API 請求都透過 `NotionService` 類別處理。
    - 使用 `async/await` 語法處理非同步操作。
- **錯誤處理**:
    - 使用 `try...catch` 區塊來處理 API 呼叫。
    - 使用 `alert()` 或自定義通知組件向使用者顯示訊息。

## 6. 核心邏輯與流程

### 新增訂單流程

1.  使用者點擊「新增訂單」或一個「空桌」。
2.  `VisualOrderingInterface` 或其他相關組件被渲染，顯示新增訂單的介面。
3.  使用者選擇桌號、人數和餐點項目。
4.  使用者點擊「建立訂單」，`handleSubmit` 函數被呼叫。
5.  `handleSubmit` 函數會：
    - 呼叫 `actions.addOrder()` 建立新訂單。
    - 呼叫 `actions.updateTable()` 更新桌位狀態為 'occupied'。
    - Context 自動重新計算統計數據並更新所有相關組件。
    - 關閉介面或模態視窗。

### Notion 同步邏輯

- 當訂單建立時，可以透過 `NotionService.createOrder()` 方法將訂單同步到 Notion。
- `NotionService` 類別會動態建構符合 Notion API 格式的 `properties` 物件。
- 程式會將訂單資料（如桌號、總額、餐點）對應到 Notion Database 的相應欄位。
- 如果同步失敗，錯誤會被捕獲並顯示給使用者。

## 7. Git 工作流程

- **分支**: 為每個新功能或錯誤修復建立一個新的分支。
  ```bash
  git checkout -b feature/your-feature-name
  ```
- **提交**: 撰寫清晰且具描述性的提交訊息。
  ```bash
  git commit -m "feat: Add feature to do X"
  git commit -m "fix: Resolve bug in Y"
  ```
- **拉取請求**: 當功能完成後，向上游儲存庫發起一個拉取請求 (Pull Request)。

## 8. Build/Lint/Test Commands

- **Development**: `npm run dev` - 啟動 Vite 開發服務器
- **Build**: `npm run build` - 打包生產版本
- **Preview**: `npm run preview` - 預覽生產版本
- **Testing**: 目前無自動化測試框架 - 在瀏覽器中手動測試
- **Linting**: 建議安裝 ESLint 和 Prettier 進行代碼風格檢查

## 9. Code Style Guidelines

- **Language**: React 19 + JSX, JavaScript ES6+
- **Naming**: 組件用 `PascalCase`, 函數/變數用 `camelCase`, 檔案用 `PascalCase.jsx`
- **Imports**: ES6 modules, React hooks, Tailwind utilities
- **Formatting**: 使用 Prettier 格式化，2-space 縮排，分號可選
- **Types**: 目前無 TypeScript，使用 JSDoc 註解複雜函數
- **Error Handling**: 使用 `try...catch` 處理 API 呼叫，`alert()` 顯示用戶反饋
- **State**: 全域狀態用 Context API，本地狀態用 `useState`
- **Styling**: 優先使用 Tailwind classes，避免內聯樣式
- **Components**: 函數式組件 + Hooks，props 解構，事件處理以 `handle` 開頭
- **Constants**: 使用 `UPPER_SNAKE_CASE`（如 `NOTION_API_VERSION`）

## Rules
- 說明文件已簡化整合，只保留 README.md (主要)、SUPABASE_GUIDE.md (設定) 和 AGENTS.md (開發)
- README.md 已整合所有重要資訊，新功能說明直接更新到 README.md 中對應章節
- do not push to github automatically
