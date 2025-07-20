# 調酒酒吧管理系統 - Cocktail Bar POS

> **🍸 v3.0 基酒分類系統！** 全新基酒分類功能，支援 Gin、Whisky、Rum、Tequila、Vodka、Brandy 專業分類，提供更精確的調酒管理和庫存追蹤！

一個專為調酒酒吧設計的現代化銷售時點情報系統 (POS)，使用 React 19 + Tailwind CSS 構建，支援 **Supabase 雲端資料庫** 和 Notion API 雙重後端選擇。

> **開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## ✨ 功能特色

### 🍸 核心功能
- **📊 儀表板** - 即時顯示營收、訂單數量、客人數量統計
- **🪑 座位管理** - 自訂座位佈局編輯器、視覺化狀態監控、拖拽操作
- **🍸 視覺化點餐** - 專業調酒師界面，支援基酒分類篩選 (Gin/Whisky/Rum/Tequila/Vodka/Brandy)
- **📝 訂單管理** - 新增、加點、更新訂單狀態、結帳功能
- **🍷 酒單管理** - 內建專業調酒酒單，支援基酒分類管理
- **🥃 基酒分類** - 21 種專業調酒按基酒分類 (經典調酒/Signature/Mocktail)
- **📈 分析統計** - 營收分析和酒吧經營數據報表，支援基酒銷售統計
- **☁️ 雲端同步** - Supabase 即時同步或 Notion API 資料備份

### 🎨 使用者體驗
- **響應式設計** - 支援手機、平板、電腦
- **跨平台支援** - Web、Desktop (Electron)、Mobile (Capacitor)
- **離線優先** - 本地儲存 + 雲端同步
- **即時更新** - 多裝置同步狀態變更

### 🔧 技術架構
- **前端**: React 19 + Vite + Tailwind CSS
- **狀態管理**: React Context API + useReducer
- **桌面應用**: Electron 37 (Windows/macOS/Linux)
- **移動端**: Capacitor 7 (iOS/Android)
- **後端選擇**: 
  - 🚀 **Supabase** (推薦): PostgreSQL 雲端資料庫 + 即時同步
  - 📝 **Notion API** (舊版): 文件型資料庫
- **開發工具**: ESLint + Vite HMR + Electron Builder

## 🚀 快速開始

### 1. 安裝專案
```bash
# Clone 專案
git clone https://github.com/your-username/cocktail-bar-pos.git
cd cocktail-bar-pos

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

### 2. 設定資料庫 (二選一)

#### 選項 A: Supabase 設定 (推薦)

**為什麼選擇 Supabase？**
- ✅ 即時同步 (WebSocket)
- ✅ 真正的關聯資料庫 (PostgreSQL) 
- ✅ 離線優先架構
- ✅ 更好的效能和成本效益

**快速設定**:
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard) 建立新專案
2. 在 SQL Editor 執行 [`cocktail-bar-supabase-setup.sql`](./cocktail-bar-supabase-setup.sql)
3. 複製 Project URL 和 API Key (Settings → API)
4. 在應用程式設定中填入並測試連接

📖 **詳細指南**: [`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md)

#### 選項 B: Notion 整合 (舊版)

1. 前往 [Notion Developers](https://www.notion.so/my-integrations) 建立 Integration
2. 建立包含訂單欄位的 Notion 資料庫 (訂單編號、桌號、總額、狀態等)
3. 分享資料庫給 Integration 並複製 Database ID
4. 在應用程式設定中輸入 Token 和 Database ID

### 3. 完成設定
1. 啟動應用後進入「設定」頁面
2. 選擇 Supabase 或 Notion 並填入相關資訊
3. 點擊「測試連接」→「保存設定」
4. 開始使用！

## 💡 主要功能使用

### 📊 儀表板
- 即時查看今日營收、訂單數量、用餐人數
- 快速檢視桌位使用狀況和最近訂單

### 🪑 座位管理 (新功能)
- **座位佈局編輯器**: 自訂座位名稱、位置、大小、形狀
- **拖拽操作**: 可視化調整座位佈局
- **智能狀態**: 空座 (點擊開始點餐) / 用餐中 (點擊查看詳情)
- **座位詳情**: 查看該座所有訂單、消費金額、快速結帳

### 🍸 點餐系統
- **視覺化點餐**: POS 機風格格狀酒單，快速點選
- **專業酒單**: 21 種精選調酒，含經典調酒、Signature、Mocktail
- **🥃 基酒篩選**: 支援 Gin、Whisky、Rum、Tequila、Vodka、Brandy 分類篩選
- **加點功能**: 為現有座位添加額外訂單
- **狀態追蹤**: 待處理 → 調製中 → 已完成 → 已結帳

### 📈 分析功能
- 營收統計和趨勢分析
- 熱門菜品排行
- 訂單歷史記錄查詢

## 🔨 開發指令

```bash
# 🌐 網頁版開發
npm run dev          # 啟動開發服務器
npm run build        # 建置生產版本
npm run preview      # 預覽生產版本

# 💻 桌面應用 (Electron)
npm run electron-dev      # Electron 開發模式
npm run electron-build    # 建置桌面應用
npm run dist             # 打包桌面應用
npm run dist-mac         # macOS 專用打包
npm run dist-win         # Windows 專用打包

# 📱 移動端應用 (Capacitor)
npm run mobile:setup           # 初始設置 iOS/Android
npm run mobile:dev:ios         # iOS 開發模式
npm run mobile:dev:android     # Android 開發模式
npm run cap:sync               # 同步更新到移動端
```

## 📁 專案結構

```
/
├── src/
│   ├── components/           # React 組件
│   │   ├── Dashboard.jsx     # 儀表板
│   │   ├── Tables.jsx        # 桌位管理
│   │   ├── TableLayoutEditor.jsx  # 桌位佈局編輯器
│   │   ├── VisualOrderingInterface.jsx  # 視覺化點餐
│   │   ├── Menu.jsx          # 菜單管理
│   │   ├── Settings.jsx      # 設定
│   │   └── ...
│   ├── contexts/
│   │   └── AppContext.jsx    # 全域狀態管理
│   ├── services/
│   │   ├── supabaseService.js  # Supabase API 服務
│   │   ├── notionService.js    # Notion API 服務
│   │   └── storageService.js   # 跨平台儲存服務
│   └── ...
├── electron/                 # Electron 桌面應用檔案
├── android/                  # Android 原生專案
├── ios/                      # iOS 原生專案
├── supabase-setup.sql # 餐廳版資料庫設定腳本 (舊版)
├── cocktail-bar-supabase-setup.sql # 調酒酒吧資料庫設定腳本 (推薦)
└── ...
```

## 🎯 開發狀態

### ✅ 已完成
- 🚀 **Supabase 雲端整合** - 即時同步、離線支援
- 🍸 **調酒酒吧系統** - 專業酒單、座位管理、調製狀態
- 🥃 **基酒分類系統** - 六大基酒分類篩選與管理 (v3.0 新功能)
- 🎨 **座位佈局編輯器** - 拖拽式自訂設計
- 📱 **跨平台支援** - Web/Desktop/Mobile
- 🎯 **視覺化點餐** - iChef 風格 POS 介面
- 💾 **智能儲存** - 本地 + 雲端雙重備份
- 🔧 **資料庫優化** - BIGINT 支援，解決 ID 溢位問題

### 🔄 開發中
- 📊 **進階報表** - 更詳細的營業分析
- ⚡ **效能優化** - 大量資料處理改善
- 🔒 **權限管理** - 員工角色和權限系統

## 🚀 部署指南

### 🌐 網頁版
```bash
npm run build
# 將 dist/ 目錄部署至 Vercel、Netlify 等靜態託管服務
```

### 💻 桌面應用
```bash
npm run dist-mac     # macOS (.dmg)
npm run dist-win     # Windows (.exe)
npm run dist-linux   # Linux (.AppImage, .deb)
```

### 📱 移動端
```bash
# iOS (需要 Xcode 和 Apple Developer Account)
npm run cap:open:ios

# Android (需要 Android Studio)
npm run cap:open:android
```

## 🛠️ 疑難排解

### 常見問題
1. **連線失敗**: 檢查 API Key 和網路連線
2. **資料同步問題**: 確認資料庫設定和權限
3. **移動端問題**: 參考 `setup-ios.sh` 解決 Ruby/CocoaPods 問題
4. **基酒分類錯誤**: 在設定中點擊「重新載入菜單」清除快取

### 開發除錯
```bash
# 清除快取重新安裝
rm -rf node_modules package-lock.json
npm install

# 檢查建置問題
npm run build -- --debug
```

## 📚 相關文件

- [`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md) - Supabase 詳細設定指南
- [`AGENTS.md`](./AGENTS.md) - AI 開發代理指南 (opencode 專用)
- [`cocktail-bar-supabase-setup.sql`](./cocktail-bar-supabase-setup.sql) - 調酒酒吧資料庫設定腳本
- [`supabase-bigint-migration.sql`](./supabase-bigint-migration.sql) - 資料庫 BIGINT 修復腳本

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！本專案使用 opencode + GitHub Copilot 進行 AI 輔助開發。

## 📄 授權

MIT License

---

**🎉 立即體驗現代化調酒酒吧管理系統！**