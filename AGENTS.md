# AGENTS.md - 調酒酒吧管理系統

## 0. 角色扮演

請扮演一位擅長使用react開發程式的資深工程師，並對於現代化UI/UX的設計有研究

> **開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## 1. 專案總覽

本專案是一個專為調酒酒吧設計的銷售時點情報系統 (POS)，主要使用 Supabase 作為雲端資料庫後端。系統完全在前端運行，透過 React 19 + Vite 實現。

**核心功能:**
- **儀表板**: 即時顯示營收、訂單數等關鍵指標
- **座位管理**: 自訂座位佈局編輯器、視覺化狀態監控、拖拽操作
- **點餐系統**: 專業調酒師風格的格狀酒單界面，支援視覺化點餐
- **訂單管理**: 新增訂單、加點、結帳、更新訂單狀態等功能
- **雲端同步**: Supabase 即時同步&資料備份
- **跨平台**: Web/Desktop/Mobile 全平台支援

**相關文件參考:**
- `@README.md`: 專案總覽、快速開始指南和開發部署說明
- `@SUPABASE_GUIDE.md`: Supabase 雲端資料庫設定詳細指南
- `@supabase-setup.sql`: 資料庫建立腳本（餐廳版）
- `@cocktail-bar-supabase-setup.sql`: 調酒酒吧資料庫建立腳本（推薦）

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
│   │   ├── Tables.jsx      # 座位管理組件
│   │   ├── TableLayoutEditor.jsx # 座位佈局編輯器
│   │   ├── Menu.jsx        # 酒單管理組件
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
├── supabase-setup.sql       # 餐廳版資料庫建立腳本 (舊版)
├── cocktail-bar-supabase-setup.sql # 調酒酒吧資料庫建立腳本 (推薦)
├── setup-ios.sh            # iOS 開發環境設置腳本
└── AGENTS.md               # (本檔案) AI 開發代理指南
```

- `index.html`: React 應用的入口 HTML，包含 root div 和 Vite 模組腳本。
- `src/App.jsx`: 主要應用組件，管理路由和整體佈局。
- `src/contexts/AppContext.jsx`: 使用 React Context API 和 useReducer 進行全域狀態管理：
    - **狀態管理**: 所有訂單、酒單、座位等資料都在 Context 中管理。
    - **Actions**: 提供 addOrder, updateOrder, updateTable 等操作函數。
    - **自動計算**: 統計數據會根據狀態變化自動重新計算。
- `src/components/`: 各個功能的 React 組件，每個組件負責特定的 UI 區塊和邏輯。
- `src/services/supabaseService.js`: 專門處理 Supabase API 的服務類別。
- `src/services/notionService.js`: 專門處理 Notion API 的服務類別 (向後相容)。
- `src/index.css`: 包含 Tailwind 基礎樣式和自定義組件樣式。

## 4. 設定與啟動

要啟動此應用程式，請遵循以下步驟：

1.  **取得專案**:
    ```bash
    git clone [repository-url]
    cd restaurant-pos
    ```
2.  **設定 Supabase (推薦)**:
    - 參考 `@SUPABASE_GUIDE.md` 的說明，建立 Supabase 專案並取得 Project URL 和 API Key。
    - 在 SQL Editor 執行 `@cocktail-bar-supabase-setup.sql` 腳本建立調酒酒吧資料庫結構。
    - 複製 Project URL 和 anon public API key。
3.  **啟動應用**:
    ```bash
    npm run dev
    ```
    這會啟動 Vite 開發服務器，通常在 http://localhost:5173
4.  **在應用中設定**:
    - 點擊側邊欄的「設定」。
    - 選擇 Supabase 或 Notion 作為後端。
    - **Supabase**: 填入 Project URL 和 API Key，點擊「測試連接」確認設定。
    - **Notion**: 在「Notion Integration Token」欄位貼上您的 Token，在「Database ID 或 URL」欄位貼上您的 Database ID。
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
    - 主要透過 `SupabaseService` 類別處理 Supabase API 請求。
    - 向後相容透過 `NotionService` 類別處理 Notion API 請求。
    - 使用 `async/await` 語法處理非同步操作。
- **錯誤處理**:
    - 使用 `try...catch` 區塊來處理 API 呼叫。
    - 使用 `alert()` 或自定義通知組件向使用者顯示訊息。

## 6. 核心邏輯與流程

### 新增訂單流程

1.  使用者點擊「新增訂單」或一個「空座」。
2.  `VisualOrderingInterface` 或其他相關組件被渲染，顯示新增訂單的介面。
3.  使用者選擇座位號、人數和調酒項目。
4.  使用者點擊「建立訂單」，`handleSubmit` 函數被呼叫。
5.  `handleSubmit` 函數會：
    - 呼叫 `actions.addOrder()` 建立新訂單。
    - 呼叫 `actions.updateTable()` 更新座位狀態為 'occupied'。
    - Context 自動重新計算統計數據並更新所有相關組件。
    - 關閉介面或模態視窗。

### Supabase/Notion 同步邏輯

- 當訂單建立時，優先透過 `SupabaseService.createOrder()` 方法將訂單同步到 Supabase。
- 或可透過 `NotionService.createOrder()` 方法將訂單同步到 Notion (向後相容)。
- `SupabaseService` 類別使用 PostgreSQL 原生 SQL 操作，提供更好的效能和一致性。
- `NotionService` 類別會動態建構符合 Notion API 格式的 `properties` 物件。
- 程式會將訂單資料（如座位號、總額、調酒）對應到資料庫的相應欄位。
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

### 基本開發指令
- **Development**: `npm run dev` - 啟動 Vite 開發服務器 (http://localhost:5173)
- **Build**: `npm run build` - 打包生產版本到 dist/
- **Preview**: `npm run preview` - 預覽生產版本
- **Lint**: `npm run lint` - 執行 ESLint 檢查所有檔案
- **Testing**: 目前無自動化測試框架 - 在瀏覽器中手動測試

### Electron 桌面應用
- **Electron Dev**: `npm run electron-dev` - 同時啟動 Vite 和 Electron (熱重載)
- **Electron Build**: `npm run electron-build` - 建置並啟動 Electron
- **Package**: `npm run dist` - 打包 Electron 應用程式
- **Platform Specific**: `npm run dist-mac` / `npm run dist-win` / `npm run dist-linux`

### Mobile (Capacitor)
- **Setup**: `npm run mobile:setup` - 初始設定 iOS 和 Android 平台
- **Sync**: `npm run cap:sync` - 同步 Web 資源到原生平台
- **iOS Dev**: `npm run mobile:dev:ios` - 建置並在 iOS 模擬器執行
- **Android Dev**: `npm run mobile:dev:android` - 建置並在 Android 模擬器執行
- **Open IDE**: `npm run cap:open:ios` / `npm run cap:open:android` - 開啟 Xcode/Android Studio

## 9. Code Style Guidelines

### 語言與框架
- **Language**: React 19 + JSX, JavaScript ES6+ (非 TypeScript)
- **Framework**: Vite + React 19 函數式組件 + React Hooks
- **State Management**: React Context API (全域) + useState (本地)
- **Styling**: Tailwind CSS 優先，避免內聯樣式和自定義 CSS

### 命名慣例
- **Components**: `PascalCase` (如 `Dashboard`, `OrderDetailsModal`)
- **Functions/Variables**: `camelCase` (如 `handleSubmit`, `orderData`)
- **Files**: React 組件用 `PascalCase.jsx`，服務/工具用 `camelCase.js`
- **Constants**: `UPPER_SNAKE_CASE` (如 `SUPABASE_URL`, `NOTION_API_VERSION`)
- **Event Handlers**: 以 `handle` 開頭 (如 `handleClick`, `handleFormSubmit`)

### 匯入與格式化
- **Imports**: ES6 modules，React hooks 優先，Tailwind utilities
- **Formatting**: 2-space 縮排，分號可選，使用 Prettier 格式化
- **JSDoc**: 為複雜函數添加 JSDoc 註解（因無 TypeScript）

### 組件結構與模式
- **Components**: 函數式組件 + Hooks，props 解構，優先使用 `useApp()` hook
- **State**: 全域狀態透過 Context API，本地狀態用 `useState`
- **Effects**: 副作用用 `useEffect`，清理函數記得處理
- **Error Handling**: 使用 `try...catch` 處理 API 呼叫，`alert()` 或通知組件顯示反饋
- **API Calls**: 透過 `supabaseService.js` 或 `notionService.js`，使用 `async/await`

### 檔案組織原則
- 獨立功能寫成獨立函數或檔案
- 程式碼以邏輯清晰、精簡、易讀為主  
- 在功能前面加註解簡略說明
- 輸出使用 '===' 或 '---' 分隔符使其一目瞭然

## 角色扮演
在執行專案時，請扮演一個專業工程師的視角來分析程式碼，並給出階段性計畫的建議

## Git 規則
- 不要主動 git push 到遠端儲存庫
- 檢查是否存在 .gitignore 文件
- 被告知上傳至 GitHub 時先執行 `git status` 查看狀況
- 上傳至 GitHub 前請先更新 @README.md 文檔
- 提交訊息使用清晰的格式：`feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- 為每個新功能建立新分支：`git checkout -b feature/功能名稱`

## Markdown 檔案原則（此處不包含 AGENTS.md）
- README.md 中必須要標示本專案使用 opencode + GitHub Copilot 開發
- 說明檔案請盡可能簡潔明瞭
- 避免建立過多的 markdown 文件來描述專案
- markdown 文件可以多使用 emoji 以及豐富排版來增加豐富度

## 程式建構規則
- 程式碼以邏輯清晰、精簡、易讀、高效這四點為主
- 將各種獨立功能獨立成一個定義函數或是 api 檔案，並提供 api 文檔
- 各 api 檔案需要有獨立性，避免循環嵌套
- 盡量避免大於 3 層的迴圈以免程式效率低下
- 使用註解在功能前面簡略說明
- 若程式有輸出需求，讓輸出能一目瞭然並使用 '===' 或是 '---' 來做分隔

## 檔案參考
重要： 當您遇到檔案參考 (例如 @rules/general.md)，請使用你的 read 工具，依需要載入。它們與當前的 SPECIFIC 任務相關。

### 說明：

- 請勿預先載入所有參考資料 - 根據實際需要使用懶惰載入。
- 載入時，將內容視為覆寫預設值的強制指示
- 需要時，以遞迴方式跟蹤參照
- 回應用戶時盡量先以計畫的方式告知用戶
- 除非用戶說「請開始實作」這種直接命令，否則不要直接執行修改