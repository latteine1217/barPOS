# 餐廳管理系統 - Restaurant POS

一個功能類似 iChef 的現代化餐廳銷售時點情報系統 (POS)，使用 React 19 + Tailwind CSS 構建，整合 Notion API 作為後端資料庫。

> **開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## 功能特色

### 🏪 核心功能
- **儀表板** - 即時顯示營收、訂單數量、用餐人數統計
- **桌位管理** - 視覺化桌位狀態監控、點擊操作、用餐時間追蹤
- **視覺化點餐** - iChef 風格的 POS 機界面，格狀菜單選擇
- **訂單管理** - 新增、加點、更新訂單狀態、結帳功能
- **菜單管理** - 管理菜品資訊、價格、分類
- **歷史記錄** - 查看過往訂單和營業數據
- **分析統計** - 營收分析和經營數據報表
- **Notion 整合** - 資料自動同步至 Notion 資料庫

### 🎨 使用者介面
- 響應式設計，支援手機、平板、電腦
- 現代化的 Material Design 風格
- Tailwind CSS 提供的優雅樣式
- 直觀的操作流程和即時狀態更新

### 🔧 技術架構
- **前端**: React 19 + Vite
- **樣式**: Tailwind CSS + @tailwindcss/forms
- **狀態管理**: React Context API + useReducer
- **後端**: Notion API
- **資料庫**: Notion Database
- **開發工具**: ESLint + Vite HMR
- **AI 開發**: opencode + GitHub Copilot

## 安裝與設定

### 1. 下載專案
```bash
git clone [repository-url]
cd restaurant-pos
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 設定 Notion 整合

#### 建立 Notion Integration
1. 前往 [Notion Developers](https://www.notion.so/my-integrations)
2. 點選 "New integration"
3. 填入基本資訊，並選擇適當的權限
4. 複製 "Internal Integration Token"

#### 建立 Notion 資料庫
1. 在 Notion 中建立一個新的資料庫
2. 設定以下欄位：
   - **訂單編號** (Title)
   - **桌號** (Number)
   - **人數** (Number)
   - **總額** (Number)
   - **狀態** (Select: pending, preparing, ready, completed)
   - **建立時間** (Date)
   - **餐點** (Rich text) - 用於記錄點餐內容

3. 分享資料庫給你的 Integration
4. 複製資料庫 ID (URL 中的 32 字元字串)

### 4. 啟動應用
```bash
npm run dev
```

應用會在 http://localhost:5173 啟動

### 5. 在應用中設定
1. 點擊側邊欄的「設定」
2. 貼上您的 Notion Integration Token
3. 輸入您的 Database ID 或完整 URL
4. 點擊「測試連接」確認設定正確
5. 點擊「保存設定」

## 開發指令

```bash
# 啟動開發服務器
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

## 專案結構

```
/
├── src/
│   ├── components/         # React 組件
│   │   ├── Dashboard.jsx   # 儀表板
│   │   ├── Tables.jsx      # 桌位管理
│   │   ├── Menu.jsx        # 菜單管理
│   │   ├── Settings.jsx    # 設定
│   │   ├── Sidebar.jsx     # 側邊欄
│   │   ├── Analytics.jsx   # 分析統計
│   │   ├── History.jsx     # 歷史記錄
│   │   ├── ErrorBoundary.jsx # 錯誤邊界
│   │   ├── VisualOrderingInterface.jsx # 視覺化點餐介面
│   │   └── OrderDetailsModal.jsx # 訂單詳情模態框
│   ├── contexts/
│   │   └── AppContext.jsx  # 全域狀態管理
│   ├── services/
│   │   └── notionService.js # Notion API 服務
│   ├── App.jsx             # 主要應用組件
│   ├── main.jsx            # React 入口點
│   └── index.css           # Tailwind CSS 樣式
├── index.html              # HTML 入口點
├── package.json            # 依賴和腳本配置
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── README.md               # 專案說明
├── FEATURES_GUIDE.md       # 功能使用指南
├── NOTION_SETUP.md         # Notion 設定指南
└── AGENTS.md               # AI 開發代理指南
```

## 使用說明

### 📊 儀表板
- 查看今日營收、訂單數量、用餐人數的即時統計
- 快速檢視桌位使用狀況
- 查看最近訂單歷史記錄

### 🧾 訂單管理
- **視覺化點餐**: 使用 POS 機風格的格狀菜單界面快速點餐
- **傳統點餐**: 下拉選單式的傳統點餐模式
- **加點功能**: 為現有桌位添加額外訂單
- **狀態管理**: 待處理 → 製作中 → 已完成 → 已結帳
- **訂單詳情**: 檢視完整訂單內容、金額和時間資訊

### 🍽️ 菜單管理
- **新增菜品**: 設定名稱、價格、分類
- **編輯菜品**: 修改現有菜品資訊
- **分類管理**: 建立和管理菜品分類
- **刪除菜品**: 移除不再供應的菜品

### 🪑 桌位管理
- **視覺化桌位圖**: 12 桌的直觀狀態顯示（空桌/用餐中）
- **智能操作**: 點擊空桌開始點餐，點擊用餐中桌位查看詳情
- **用餐時間追蹤**: 自動計算並顯示每桌用餐時長
- **桌位詳情**: 查看該桌所有訂單、總消費金額和操作選項
- **快速結帳**: 直接在桌位詳情中完成整桌結帳

## 遷移日誌

### v2.0.0 - React 19 重構 (2025)
- ✅ 完全遷移至 React 19 + Vite
- ✅ 使用 Tailwind CSS 替代傳統 CSS
- ✅ 實現 React Context API 狀態管理
- ✅ 重構所有 UI 組件為現代化 React 組件
- ✅ 新增視覺化點餐界面 (POS 風格)
- ✅ 實現智能桌位管理系統
- ✅ 新增加點和結帳功能
- ✅ 優化 Notion API 集成服務
- ✅ 改善響應式設計和用戶體驗
- ✅ 新增錯誤邊界和異常處理
- ✅ 優化開發者體驗和代碼維護性

### 技術改進
- **狀態管理**: 從全域變數改為 React Context + useReducer
- **組件化**: 將單體 HTML 拆分為可復用的 React 組件
- **樣式系統**: 從自定義 CSS 遷移至 Tailwind utility classes
- **開發工具**: 新增 Vite 快速構建和 HMR 熱重載
- **用戶體驗**: 實現 iChef 風格的直觀操作界面
- **代碼結構**: 更清晰的檔案組織和關注點分離

## API 整合

### Notion API 設定
```javascript
const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

// NotionService 類別處理所有 API 請求
const notionService = new NotionService(token, databaseId);
```

### 資料同步
- 自動同步訂單資料至 Notion
- 本地儲存設定資訊（localStorage）
- 支援從 Notion 同步訂單回本地
- 錯誤處理和連線測試功能

## 開發指南

### 技術棧
- **React 19**: 現代化 React hooks 和函數式組件
- **Vite**: 快速構建工具和開發服務器
- **Tailwind CSS**: Utility-first CSS 框架
- **Context API**: React 原生狀態管理
- **ES6+ JavaScript**: 現代 JavaScript 特性

### 程式碼風格
- 組件使用 `PascalCase` 命名（如 `Dashboard.jsx`）
- 函數和變數使用 `camelCase`
- 事件處理函數以 `handle` 開頭
- 使用 JSDoc 註解複雜函數
- 優先使用 Tailwind classes 而非自定義樣式

### 狀態管理模式
```javascript
// 使用 Context 存取全域狀態
const { state, actions } = useApp();

// 新增訂單
actions.addOrder(orderData);

// 更新桌位狀態
actions.updateTable(tableId, updates);
```

## 瀏覽器支援
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- 支援 ES6 和現代 JavaScript 特性的瀏覽器

## 安全性考量
- Notion Token 儲存在 localStorage
- 建議在生產環境使用 HTTPS
- 定期更新 Notion Integration Token

## 疑難排解

### 常見問題
1. **無法啟動開發服務器**
   - 確認已安裝 Node.js 16+
   - 執行 `npm install` 重新安裝依賴

2. **Notion 連接失敗**
   - 檢查 Notion Token 是否正確（應以 `secret_` 開頭）
   - 確認 Database 已分享給 Integration
   - 驗證 Database ID 格式正確（32字元）

3. **資料同步問題**
   - 確認網路連線狀態
   - 檢查 Notion API 限制
   - 查看瀏覽器 Console 錯誤訊息

4. **樣式顯示異常**
   - 確認已正確安裝 Tailwind CSS
   - 檢查 `postcss.config.js` 配置

### 開發除錯
```bash
# 檢查依賴
npm list

# 清除快取重新安裝
rm -rf node_modules package-lock.json
npm install

# 檢查 Vite 配置
npm run build -- --debug
```

詳細疑難排解請參考 `TROUBLESHOOTING.md`。

## 授權
MIT License

## 聯絡資訊
如有問題或建議，請建立 Issue 或聯絡開發團隊。
