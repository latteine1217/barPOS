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
- **桌面應用**: Electron 37
- **移動端**: Capacitor 7 (iOS/Android)
- **樣式**: Tailwind CSS + @tailwindcss/forms
- **狀態管理**: React Context API + useReducer
- **後端**: Notion API
- **資料庫**: Notion Database
- **開發工具**: ESLint + Vite HMR + Electron Builder
- **AI 開發**: opencode + GitHub Copilot

## 當前開發狀態

### ✅ 已完成功能
- **基礎架構**: React 19 + Vite + Tailwind CSS
- **核心 POS 功能**: 訂單管理、桌位管理、菜單管理
- **桌面應用程式**: Electron 打包和分發 (Windows/macOS/Linux)
- **移動端應用程式**: Capacitor iOS/Android 支援
- **Notion 整合**: 完整的資料同步功能
- **響應式設計**: 支援手機、平板、電腦使用
- **視覺化介面**: iChef 風格的點餐系統

### 🔄 開發中功能
- **離線模式**: 基本離線使用功能
- **效能優化**: 大量訂單情況下的效能改善
- **進階報表**: 更詳細的營業分析功能

### 📱 移動端開發狀態
- **iOS**: ✅ 開發環境已完成設定，Ruby 相容性問題已解決
- **Android**: ✅ 基本功能正常，待深度測試
- **原生功能**: ✅ 狀態列、啟動畫面、觸覺反饋已整合

### 🐛 已知問題
- ~~Ruby 2.6 相容性問題 (已解決)~~
- ~~CocoaPods 安裝問題 (已解決)~~
- 無重大已知問題

### 🎯 下一階段計劃
1. **移動端完整測試**: 在真實裝置上的全功能測試
2. **效能優化**: 處理大量資料時的流暢度改善  
3. **離線支援**: 網路中斷時的基本 POS 功能
4. **進階功能**: 列印、條碼掃描、多店管理

詳細的移動端問題排解請參考 `ios-setup.md`。

## 安裝與設定

### 1. 下載專案
```bash
# 請用實際的 repository URL 替換下面的 URL
git clone https://github.com/your-username/restaurant-pos.git
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
# 啟動開發服務器 (網頁版)
npm run dev

# 啟動 Electron 開發模式 (桌面應用)
npm run electron-dev

# 建置生產版本
npm run build

# 運行 Electron 應用 (需先建置)
npm run electron-build

# 打包 Electron 應用程式
npm run dist

# 平台特定打包
npm run dist-mac    # macOS
npm run dist-win    # Windows
npm run dist-linux  # Linux

# 移動端開發
npm run mobile:setup           # 初始設置 iOS/Android 平台
npm run mobile:dev:ios         # iOS 開發模式
npm run mobile:dev:android     # Android 開發模式
npm run cap:open:ios           # 開啟 Xcode
npm run cap:open:android       # 開啟 Android Studio
npm run cap:sync               # 同步更新到移動端

# 預覽生產版本 (網頁版)
npm run preview
```

## 專案結構

```
/
├── android/                # Android 原生專案目錄
├── ios/                    # iOS 原生專案目錄  
├── electron/               # Electron 主進程檔案
│   └── main.cjs           # Electron 應用程式入口點
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
├── dist/                   # 建置後的網頁檔案
├── dist-electron/          # Electron 打包輸出目錄
├── public/                 # 靜態資源
├── capacitor.config.ts     # Capacitor 移動端配置
├── index.html              # HTML 入口點
├── package.json            # 依賴和腳本配置
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── README.md               # 專案說明
├── FEATURES_GUIDE.md       # 功能使用指南
├── NOTION_SETUP.md         # Notion 設定指南
├── ELECTRON_GUIDE.md       # Electron 開發指南
├── MOBILE_GUIDE.md         # 移動端開發指南
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

### v2.0.0 - React 19 + Electron + 移動端重構 (2025)
- ✅ 完全遷移至 React 19 + Vite
- ✅ 新增 Electron 桌面應用程式支援
- ✅ 新增 Capacitor 移動端應用程式支援
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
- ✅ 新增原生菜單和鍵盤快捷鍵
- ✅ 支援跨平台桌面應用程式打包
- ✅ 支援 iOS 和 Android 原生應用程式
- ✅ 移動端觸控優化和原生功能整合

### 技術改進
- **狀態管理**: 從全域變數改為 React Context + useReducer
- **組件化**: 將單體 HTML 拆分為可復用的 React 組件
- **樣式系統**: 從自定義 CSS 遷移至 Tailwind utility classes
- **開發工具**: 新增 Vite 快速構建和 HMR 熱重載
- **用戶體驗**: 實現 iChef 風格的直觀操作界面
- **代碼結構**: 更清晰的檔案組織和關注點分離
- **桌面整合**: 新增 Electron 支援，提供原生桌面體驗
- **移動端支援**: 使用 Capacitor 框架支援 iOS/Android
- **跨平台**: 支援網頁、Windows、macOS、Linux、iOS、Android
- **部署選項**: 多平台同時支援，滿足不同使用場景
- **觸控優化**: 移動端觸控體驗和原生功能整合

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
- **Electron 37**: 跨平台桌面應用程式框架
- **Capacitor 7**: 原生移動端應用程式框架
- **Vite**: 快速構建工具和開發服務器
- **Tailwind CSS**: Utility-first CSS 框架
- **Context API**: React 原生狀態管理
- **ES6+ JavaScript**: 現代 JavaScript 特性
- **Electron Builder**: 桌面應用程式打包工具
- **Android Studio**: Android 開發環境
- **Xcode**: iOS 開發環境

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

## 部署

### 🌐 網頁版部署
1. 執行 `npm run build` 建置專案
2. 將 `dist/` 目錄部署到靜態網站託管服務
3. 支援平台：Vercel、Netlify、GitHub Pages 等

### 💻 桌面應用程式打包

#### 開發環境測試
```bash
# 啟動 Electron 開發模式
npm run electron-dev

# 建置並測試桌面應用
npm run electron-build
```

#### 生產環境打包
```bash
# 打包所有平台（需要對應平台進行）
npm run dist

# 特定平台打包
npm run dist-mac    # 需在 macOS 上執行
npm run dist-win    # 需在 Windows 上執行
npm run dist-linux  # 可在 Linux/macOS 上執行
```

#### 打包輸出
- **macOS**: `dist-electron/*.dmg` - DMG 安裝檔
- **Windows**: `dist-electron/*.exe` - NSIS 安裝程式
- **Linux**: `dist-electron/*.AppImage` 和 `dist-electron/*.deb`

#### 系統需求
- **macOS**: 10.13 或更新版本
- **Windows**: Windows 10 或更新版本
- **Linux**: Ubuntu 18.04 或同等 Linux 發行版

### 📱 移動端應用程式開發

#### iOS 開發設定
> ✅ **狀態**: iOS 開發環境已成功設定完成！Ruby 相容性問題已解決。

**重要**: iOS 開發需要解決 Ruby 版本相容性問題（已解決）

```bash
# 設定開發環境（一次性設定）
# 1. 安裝更新的 Ruby 和 CocoaPods
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
gem install cocoapods

# 2. 設置 Xcode 開發者目錄
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# 3. iOS 開發流程
npm run build
npx cap sync ios
npm run mobile:dev:ios  # 在 iOS 模擬器中運行

# 或者手動開啟 Xcode
npx cap open ios
```

**已知問題已解決**: 
- ✅ Ruby 2.6 相容性問題：已升級至 Ruby 3.4.4
- ✅ CocoaPods 安裝問題：已使用新版 Ruby 重新安裝

#### Android 開發設定
```bash
# Android 開發流程  
npm run build
npx cap sync android
npm run mobile:dev:android  # 在 Android 模擬器中運行
```

#### 移動端功能
- ✅ **iOS**: 支援 iOS 13.0+，包含原生狀態列、啟動畫面、觸覺反饋
- ✅ **Android**: 支援 Android API 21+，完整原生功能整合
- ✅ **觸控優化**: 針對觸控操作優化的使用者介面
- ✅ **原生整合**: 狀態列、鍵盤、啟動畫面等原生功能

詳細移動端開發指南請參考：
- `MOBILE_GUIDE.md` - 完整移動端開發指南
- `ios-setup.md` - iOS 特定設定步驟

## 瀏覽器支援

### 🌐 網頁版
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- 支援 ES6 和現代 JavaScript 特性的瀏覽器

### 💻 桌面應用程式
- **macOS**: 10.13 High Sierra 或更新版本
- **Windows**: Windows 10 或更新版本  
- **Linux**: Ubuntu 18.04 或同等發行版

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
