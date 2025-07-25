# 🍸 調酒酒吧管理系統 - Cocktail Bar POS

> **🚀 v3.0 營運分析系統！** 全新企業級營運分析與 CRM 客戶分群功能，提供 RFM 分析、營收趨勢、產品分析、時段效率分析，以及完整的 TypeScript 支援！

一個專為調酒酒吧設計的現代化銷售時點情報系統 (POS)，使用 **React 19 + TypeScript + Tailwind CSS** 構建，採用 **Supabase 雲端資料庫** 提供即時同步功能，現在具備企業級的營運分析能力。

> **🤖 開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## ✨ 功能特色

### 🍸 核心功能
- **📊 智能儀表板** - 即時顯示營收、訂單數量、客人數量統計
- **🪑 座位管理** - 自訂座位佈局編輯器、視覺化狀態監控、拖拽操作
- **🍸 視覺化點餐** - 專業調酒師界面，支援基酒分類篩選
- **📝 訂單管理** - 新增、加點、更新訂單狀態、結帳功能
- **🍷 酒單管理** - 內建專業調酒酒單，支援基酒分類管理
- **🥃 基酒分類** - 六大基酒分類 (Gin/Whisky/Rum/Tequila/Vodka/Brandy)
- **☁️ 雲端同步** - Supabase 即時多裝置同步

### 📈 **v3.0 新功能：企業級營運分析**
- **🎯 CRM 客戶分群** - RFM 模型分析 (頻率、近期性、消費金額)
- **📊 營收趨勢分析** - 日/週/月/年度營收圖表與趨勢預測
- **🍹 產品銷售分析** - 基酒分類銷售統計與熱門調酒排行
- **⏰ 時段效率分析** - 24小時營運分析與最佳時段識別
- **🎨 響應式圖表** - 精美的互動式 Recharts 視覺化圖表
- **🔧 TypeScript 支援** - 完整類型安全與開發體驗優化

### 🎨 使用者體驗
- **響應式設計** - 支援手機、平板、電腦
- **跨平台支援** - Web、Desktop (Electron)、Mobile (Capacitor)  
- **離線優先** - 本地儲存 + 雲端同步
- **即時更新** - 多裝置同步狀態變更
- **美觀界面** - 泡泡背景效果與現代化 UI 設計

### 🔧 技術架構
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **狀態管理**: React Context API + useReducer
- **圖表系統**: Recharts + TypeScript 類型安全
- **桌面應用**: Electron 37 (Windows/macOS/Linux)
- **移動端**: Capacitor 7 (iOS/Android)
- **後端**: Supabase PostgreSQL 雲端資料庫 + 即時同步
- **開發工具**: ESLint + TypeScript + Vite HMR + Electron Builder

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

### 2. 設定 Supabase 資料庫

**快速設定**:
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard) 建立新專案
2. 在 SQL Editor 執行 [`cocktail-bar-supabase-setup.sql`](./cocktail-bar-supabase-setup.sql)
3. 複製 Project URL 和 API Key (Settings → API)
4. 在應用程式設定中填入並測試連接

📖 **詳細指南**: [`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md)

### 3. 完成設定
1. 啟動應用後進入「設定」頁面
2. 填入 Supabase Project URL 和 API Key
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

### 📈 **v3.0 營運分析功能**
- **CRM 客戶分析**: RFM 模型自動分群 (高價值客戶/新客戶/流失風險客戶)
- **營收趨勢**: 多時間軸營收分析，支援同比/環比增長率
- **產品熱銷**: 基酒分類銷售排行、調酒熱度分析
- **時段分析**: 24小時/週間營運效率分析
- **互動圖表**: 柱狀圖、折線圖、圓餅圖等專業圖表展示

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
│   ├── components/              # React 組件
│   │   ├── Dashboard.tsx        # 智能儀表板
│   │   ├── Tables.jsx          # 桌位管理
│   │   ├── TableLayoutEditor.jsx # 桌位佈局編輯器
│   │   ├── VisualOrderingInterface.jsx # 視覺化點餐
│   │   ├── EnhancedAnalytics.tsx # 營運分析主頁 (v3.0)
│   │   ├── Charts/             # 圖表組件庫 (v3.0)
│   │   │   ├── BarChart.tsx    # 柱狀圖
│   │   │   ├── LineChart.tsx   # 折線圖
│   │   │   ├── PieChart.tsx    # 圓餅圖
│   │   │   └── MetricCard.tsx  # 指標卡片
│   │   ├── ui/                 # UI 組件庫
│   │   └── ...
│   ├── contexts/
│   │   └── AppContext.tsx      # 全域狀態管理 (TypeScript)
│   ├── services/
│   │   ├── supabaseService.ts  # Supabase API 服務 (TypeScript)
│   │   ├── analyticsService.ts # 營運分析服務 (v3.0)
│   │   └── storageService.js   # 跨平台儲存服務
│   ├── utils/                  # 工具函數 (v3.0)
│   │   ├── dataAnalysis.ts     # 數據分析工具
│   │   └── chartHelpers.ts     # 圖表輔助函數
│   ├── types/                  # TypeScript 類型定義 (v3.0)
│   │   └── index.ts           # 全域類型定義
│   └── ...
├── electron/                   # Electron 桌面應用檔案
├── android/                    # Android 原生專案
├── ios/                        # iOS 原生專案
├── cocktail-bar-supabase-setup.sql # 調酒酒吧資料庫設定腳本 (推薦)
└── ...
```

## 🎯 開發狀態

### ✅ v3.0 已完成
- 🚀 **企業級營運分析** - CRM 客戶分群、營收趨勢、產品分析、時段效率
- 🔧 **TypeScript 完整支援** - 類型安全的分析模組與圖表系統
- 📊 **Recharts 圖表庫** - 專業互動式圖表 (柱狀圖/折線圖/圓餅圖)
- 🎯 **RFM 客戶分析** - 自動客戶分群與價值評估
- 🍸 **基酒分類系統** - 六大基酒分類篩選與管理
- 🎨 **視覺效果優化** - 泡泡背景、文字對比度、動畫效果
- 📱 **跨平台支援** - Web/Desktop/Mobile 完整支援

### ✅ 核心功能
- 🚀 **Supabase 雲端整合** - 即時同步、離線支援
- 🍸 **調酒酒吧系統** - 專業酒單、座位管理、調製狀態
- 🎨 **座位佈局編輯器** - 拖拽式自訂設計
- 🎯 **視覺化點餐** - iChef 風格 POS 介面
- 💾 **智能儲存** - 本地 + 雲端雙重備份

### 🔄 未來規劃
- 🔒 **權限管理** - 員工角色和權限系統
- 📧 **客戶通知** - 自動化行銷與客戶關係管理
- 🤖 **AI 預測** - 銷售預測與庫存建議
- 🌐 **多語言** - 國際化支援

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
1. **連線失敗**: 檢查 Supabase API Key 和網路連線
2. **資料同步問題**: 確認資料庫設定和權限
3. **移動端問題**: 參考 `setup-ios.sh` 解決 Ruby/CocoaPods 問題
4. **圖表顯示異常**: 檢查瀏覽器是否支援現代 JavaScript 功能
5. **TypeScript 編譯錯誤**: 確認 TypeScript 版本和類型定義

### 開發除錯
```bash
# 清除快取重新安裝
rm -rf node_modules package-lock.json
npm install

# 檢查 TypeScript 編譯
npm run type-check

# 檢查建置問題
npm run build -- --debug
```

## 📚 相關文件

- [`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md) - Supabase 詳細設定指南
- [`AGENTS.md`](./AGENTS.md) - AI 開發代理指南 (opencode 專用)
- [`cocktail-bar-supabase-setup.sql`](./cocktail-bar-supabase-setup.sql) - 調酒酒吧資料庫設定腳本
- [`PHASE4_COMPLETION_REPORT.md`](./PHASE4_COMPLETION_REPORT.md) - v3.0 營運分析功能完成報告
- [`DESIGN_SYSTEM_GUIDE.md`](./DESIGN_SYSTEM_GUIDE.md) - 設計系統與 UI 組件指南
- [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) - 測試策略與品質保證

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！本專案使用 **opencode + GitHub Copilot** 進行 AI 輔助開發，具備完整的 TypeScript 類型安全和現代化開發體驗。

### 開發流程
1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

MIT License

---

**🎉 立即體驗最先進的調酒酒吧管理系統！v3.0 帶來企業級營運分析，讓您的酒吧經營更智能、更高效！**