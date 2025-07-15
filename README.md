# 餐廳管理系統 - Restaurant POS

## 🚀 重大更新：已遷移至 React + Tailwind CSS

這是一個類似 iChef 功能的現代化餐廳管理系統，使用sst/opencode搭配github copilot進行開發。
專案架構為 React + Tailwind CSS，提供更好的開發體驗和性能，並整合 Notion API 作為後端資料庫。

## 功能特色

### 🏪 核心功能
- **儀表板** - 即時顯示營收、訂單數量、用餐人數統計
- **訂單管理** - 新增、編輯、更新訂單狀態
- **菜單管理** - 管理菜品資訊、價格、分類
- **桌位管理** - 監控桌位狀態、容納人數、視覺化操作
- **營收報表** - 查看營業數據分析
- **Notion 整合** - 資料同步至 Notion 資料庫

### 🎨 使用者介面
- 響應式設計，支援手機、平板、電腦
- 現代化的 Material Design 風格
- Tailwind CSS 提供的優雅樣式
- 直觀的操作流程和即時狀態更新

### 🔧 技術架構
- **前端**: React 18 + Vite
- **樣式**: Tailwind CSS + @tailwindcss/forms
- **狀態管理**: React Context API + useReducer
- **後端**: Notion API
- **資料庫**: Notion Database
- **圖示**: Font Awesome 6

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
│   │   ├── Orders.jsx      # 訂單管理
│   │   ├── Tables.jsx      # 桌位管理
│   │   ├── Menu.jsx        # 菜單管理
│   │   ├── Settings.jsx    # 設定
│   │   ├── Sidebar.jsx     # 側邊欄
│   │   └── NewOrderModal.jsx # 新增訂單模態框
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
└── postcss.config.js       # PostCSS 配置
```

## 使用說明

### 📊 儀表板
- 查看今日營收、訂單數量、用餐人數的即時統計
- 快速檢視桌位使用狀況
- 查看最近訂單歷史記錄

### 🧾 訂單管理
- **新增訂單**: 選擇桌號、人數，從菜單選擇餐點
- **更新狀態**: 待處理 → 製作中 → 已完成 → 已取消
- **查看詳情**: 檢視訂單內容、總額和建立時間

### 🍽️ 菜單管理
- **新增菜品**: 設定名稱、價格、分類
- **編輯菜品**: 修改現有菜品資訊
- **分類管理**: 建立和管理菜品分類
- **刪除菜品**: 移除不再供應的菜品

### 🪑 桌位管理
- **視覺化桌位圖**: 一目了然的桌位狀態顯示
- **快速點餐**: 點擊空桌直接開始新增訂單
- **結帳功能**: 直接在桌位卡片上結帳
- **狀態監控**: 空桌、用餐中、清潔中狀態管理

## 遷移日誌

### v2.0.0 - React + Tailwind 重構 (2025)
- ✅ 完全遷移至 React 18 + Vite
- ✅ 使用 Tailwind CSS 替代傳統 CSS
- ✅ 實現 React Context API 狀態管理
- ✅ 重構所有 UI 組件為現代化 React 組件
- ✅ 優化 Notion API 集成服務
- ✅ 改善響應式設計和用戶體驗
- ✅ 新增模態框組件化設計
- ✅ 優化開發者體驗和代碼維護性

### 技術改進
- **狀態管理**: 從全域變數改為 React Context + useReducer
- **組件化**: 將單體 HTML 拆分為可復用的 React 組件
- **樣式系統**: 從自定義 CSS 遷移至 Tailwind utility classes
- **開發工具**: 新增 Vite 快速構建和 HMR 熱重載
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
- **React 18**: 現代化 React hooks 和函數式組件
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

### 連接問題
1. 檢查 Notion Token 是否正確
2. 確認 Database ID 格式正確
3. 驗證 Integration 權限設定

### 資料同步問題
1. 確認網路連線狀態
2. 檢查 Notion API 限制
3. 查看瀏覽器 Console 錯誤訊息

## 授權
MIT License

## 聯絡資訊
如有問題或建議，請建立 Issue 或聯絡開發團隊。
