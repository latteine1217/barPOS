# 🍸 調酒酒吧管理系統 - Cocktail Bar POS

> v3.3（本版）— 修正 React Hooks 呼叫與無限渲染問題、修復多處功能邏輯，並完成 UI/主題強化（雙主題 + 強調色、玻璃質感統一、儀表板與桌位佈局視覺更新、菜單成本標示與表單輔助）。

一個專為調酒酒吧設計的現代化銷售時點情報系統 (POS)，使用 **React 19 + TypeScript + Zustand + Tailwind CSS** 構建，採用 **Supabase 雲端資料庫** 提供即時同步功能，具備企業級的營運分析能力和現代化架構。

> **🤖 開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## ✨ 功能特色（v3.3）

### 🍸 核心能力
- **📊 智能儀表板**：即時營收/訂單/完成數據，快速導航至「歷史/座位/分析」。
- **🪑 座位管理**：佈局編輯器可拖拽調整座位，支援圓桌/方桌/長桌、容量設定，狀態一目了然。
- **🍸 視覺化點餐**：以基酒與分類篩選快速點單；支援加點與狀態更新。
- **📝 訂單管理**：新增、更新、結帳、刪除，並與座位狀態自動聯動。
- **🍷 酒單管理**：維護菜單項目，支援分類、基酒、上下架與描述。
- **☁️ 即時同步**：Supabase 提供跨裝置即時資料更新；離線自動回補。

### 🎨 外觀與主題
- **雙主題 + 系統跟隨**：淺色/深色/自動三種模式；整站以設計 Tokens 控色，對比更佳。
- **強調色可選**：Blue/Violet/Emerald/Amber/Rose/Cyan 六種主色，一鍵切換。
- **統一玻璃質感**：卡片與模組預設即為毛玻璃材質；僅按鈕保留 hover 效果。
- **動態彩色背景**：採用 Gooey Gradients 動態氣泡背景，與主題相容。

### 🧾 菜單與成本
- **成本標示**：在小卡顯示「成本占比」，<60% 綠、60–79% 橘、≥80% 紅。
- **編輯表單輔助**：各欄位帶標籤、說明 i 提示、輔助文字；售價 ≤ 0 或成本 > 售價自動提示錯誤。
- **可供應切換**：改為可及性的 Switch，含用途說明。

### 🧩 儀表板與佈局
- **儀表板**：字色與對比統一到主題 Tokens；「查看全部」與快速操作支援一鍵導頁。
- **佈局編輯器**：桌位節點改為主題化玻璃樣式（available/occupied/reserved/cleaning 狀態色、選取光暈），更融入整體視覺。

### 🔧 架構與穩定性
- **React Hooks 呼叫修復**：移除不安全的事件存取，避免 `currentTarget` 為 null 導致的錯誤。
- **避免無限渲染**：精簡選擇器與副作用依賴、對齊狀態初始化流程，強化穩定性。
- **跨平台儲存**：`StorageService` 自動在 Web/Capacitor/Electron 之間切換（桌面可透過 `electronAPI.store` 落地到本機檔案）。

### 🧪 開發體驗
- TypeScript 嚴格模式、Zustand + Immer、Vitest 測試、日誌與開發者工具（狀態檢查/性能監控）。

## 🚀 快速開始（v3.3）

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

### 🪑 座位管理
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
npm run lint         # ESLint 程式碼檢查
npm run type-check   # TypeScript 類型檢查

# 🧪 測試系統
npm run test         # 執行所有測試
npm run test:watch   # 監視模式測試
npm run test:ui      # Vitest UI 界面
npm run test:coverage # 測試覆蓋率報告

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

# 🔧 開發工具
npm run log-server    # 啟動日誌服務器
node check-status.cjs # 檢查專案狀態
```

## 📁 專案結構

```
/
├── src/
│   ├── components/              # React 組件 (全 TypeScript)
│   │   ├── Dashboard.tsx        # 智能儀表板
│   │   ├── Tables.tsx          # 桌位管理
│   │   ├── TableLayoutEditor.tsx # 桌位佈局編輯器
│   │   ├── VisualOrderingInterface.tsx # 視覺化點餐
│   │   ├── EnhancedAnalytics.tsx # 營運分析主頁
│   │   ├── LogViewer.tsx       # 日誌檢視器 (v3.2)
│   │   ├── VisualOrderingModal.tsx # 視覺化點餐彈窗 (v3.2)
│   │   ├── DevTools/           # 開發者工具套件 (v3.2)
│   │   │   ├── HookDebugger.tsx    # Hook 偵錯器
│   │   │   ├── PerformanceMonitor.tsx # 性能監控
│   │   │   └── StateInspector.tsx  # 狀態檢查器
│   │   ├── Charts/             # 圖表組件庫
│   │   │   ├── BarChart.tsx    # 柱狀圖
│   │   │   ├── LineChart.tsx   # 折線圖
│   │   │   ├── PieChart.tsx    # 圓餅圖
│   │   │   └── MetricCard.tsx  # 指標卡片
│   │   ├── ui/                 # UI 組件庫
│   │   └── ErrorBoundary/      # 錯誤邊界系統
│   ├── stores/                 # Zustand 狀態管理
│   │   ├── appStore.ts         # 主應用狀態
│   │   ├── orderStore.ts       # 訂單狀態管理
│   │   ├── tableStore.ts       # 桌位狀態管理
│   │   ├── menuStore.ts        # 菜單狀態管理
│   │   └── index.ts           # Store 統一導出
│   ├── hooks/                  # 自定義 Hook 系統 (v3.2)
│   │   ├── business/          # 業務邏輯 Hook
│   │   ├── core/              # 核心功能 Hook
│   │   ├── ui/                # UI 相關 Hook
│   │   └── utils/             # 工具類 Hook
│   ├── services/              # 服務層
│   │   ├── supabaseService.ts  # Supabase API 服務
│   │   ├── analyticsService.ts # 營運分析服務
│   │   ├── storageService.ts   # 跨平台儲存服務
│   │   ├── loggerService.ts    # 日誌服務 (v3.2)
│   │   ├── agentLoggerService.ts # 代理日誌服務 (v3.2)
│   │   └── consoleInterceptorService.ts # 控制台攔截器 (v3.2)
│   ├── types/                  # TypeScript 類型定義
│   │   ├── core/              # 核心類型定義 (v3.2)
│   │   └── index.ts           # 全域類型定義
│   ├── utils/                  # 工具函數
│   │   ├── dataAnalysis.ts     # 數據分析工具
│   │   ├── chartHelpers.ts     # 圖表輔助函數
│   │   ├── cacheManager.ts     # 快取管理 (v3.2)
│   │   └── performance.ts      # 性能工具 (v3.2)
│   └── test/                   # 測試檔案 (TypeScript)
├── electron/                   # Electron 桌面應用檔案
├── android/                    # Android 原生專案
├── ios/                        # iOS 原生專案
├── .github/workflows/          # GitHub Actions CI/CD
├── cocktail-bar-supabase-setup.sql # 調酒酒吧資料庫設定腳本
├── HOOK_REFACTORING_GUIDE.md   # Hook 重構指南 (v3.2)
├── PHASE3_PERFORMANCE_REPORT.md # 性能優化報告 (v3.2)
├── TYPE_SYSTEM_BEST_PRACTICES.md # TypeScript 最佳實踐 (v3.2)
└── ...
```

## 🖥️ 打包成 mac 桌面 App

- 使用 `npm run electron-dev` 在桌面環境開發；使用 `npm run dist` 產生安裝包。
- 本地儲存已內建跨平台抽象：
  - Web 使用 `localStorage`
  - Mobile 使用 Capacitor Preferences
  - Desktop 透過 `window.electronAPI.store`（你可在 Electron preload/main 以 `electron-store` 實作）。
- 建議：提供「資料備份/還原」入口，直接使用 `StorageService.exportData/importData`。

## ✅ 核心功能一覽
- 🚀 **Supabase 雲端整合** - 即時同步、離線支援
- 🍸 **調酒酒吧系統** - 專業酒單、座位管理、調製狀態
- 🎨 **座位佈局編輯器** - 拖拽式自訂設計
- 🎯 **視覺化點餐** - iChef 風格 POS 介面
- 💾 **智能儲存** - 本地 + 雲端雙重備份

### 🔄 近期規劃 (v3.3)
- 🎯 **業務 Hook 完善** - 持續優化 useOrderManagement、useTableOperations
- 🛡️ **錯誤邊界擴展** - 更細緻的錯誤處理和用戶反饋系統
- 📱 **PWA 功能實現** - 離線使用和推播通知支援
- 🎨 **UI/UX 持續優化** - 響應式設計和使用者體驗改進

### 🔄 未來規劃 (v4.0+)
- 🔒 **權限管理系統** - 員工角色和權限管控
- 📧 **自動化客戶關係** - 客戶通知與行銷自動化
- 🤖 **AI 智能預測** - 銷售預測與庫存建議
- 🌐 **多語言國際化** - 完整的 i18n 支援

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
1. **應用程式啟動時卡住或無限載入**:
   - **原因一：無限遞迴 (Infinite Recursion)**：`consoleInterceptorService.ts` 中的日誌攔截器可能錯誤地呼叫了被攔截後的 `console` 方法，導致無限循環。
     - **解決方案**：確保 `consoleInterceptorService.ts` 在其內部日誌輸出時，使用備份的原始 `console` 方法（例如 `this.originalConsole.log`），而非被替換後的 `console` 方法。
   - **原因二：本地儲存資料損壞 (Corrupted Local Storage Data)**：`localStorage` 中儲存的資料可能已損壞或格式不正確，導致應用程式在載入時解析失敗。
     - **解決方案**：清除瀏覽器的 `localStorage`。您可以在瀏覽器開發者工具的控制台中執行 `localStorage.clear()`，或運行專案根目錄下的 `clear_storage.ts` 腳本。
2. **連線失敗**: 檢查 Supabase API Key 和網路連線
3. **資料同步問題**: 確認資料庫設定和權限
4. **移動端問題**: 參考 `setup-ios.sh` 解決 Ruby/CocoaPods 問題
5. **圖表顯示異常**: 檢查瀏覽器是否支援現代 JavaScript 功能
6. **TypeScript 編譯錯誤**: 確認 TypeScript 版本和類型定義

### 開發除錯
```bash
# 清除快取重新安裝
rm -rf node_modules package-lock.json
npm install

# 檢查 TypeScript 編譯
npm run type-check

# 啟動開發服務器（建議在瀏覽器中檢查實際問題）
npm run dev
# 然後前往 http://localhost:5173 檢查實際運行狀況

# 檢查建置問題
npm run build -- --debug
```

### v3.1 已知問題與解決方案
- **狀態管理**: 已從 Context API 遷移至 Zustand，解決了循環更新問題
- **無限循環錯誤**: 已修復 "Maximum update depth exceeded" 問題
- **TypeScript 支援**: v3.2 已完成全面 TypeScript 重構，移除所有 JSX 檔案
- **開發體驗**: 新增開發者工具套件和完整日誌系統，提升開發效率

## 📚 相關文件

- [`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md) - Supabase 詳細設定指南
- [`AGENTS.md`](./AGENTS.md) - AI 開發代理指南 (opencode 專用)
- [`cocktail-bar-supabase-setup.sql`](./cocktail-bar-supabase-setup.sql) - 調酒酒吧資料庫設定腳本
- [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) - 測試策略與品質保證
- [`HOOK_REFACTORING_GUIDE.md`](./HOOK_REFACTORING_GUIDE.md) - Hook 重構指南 (v3.2)
- [`PHASE3_PERFORMANCE_REPORT.md`](./PHASE3_PERFORMANCE_REPORT.md) - 性能優化報告 (v3.2)
- [`TYPE_SYSTEM_BEST_PRACTICES.md`](./TYPE_SYSTEM_BEST_PRACTICES.md) - TypeScript 最佳實踐 (v3.2)
- [`CONSOLE_LOG_GUIDE.md`](./CONSOLE_LOG_GUIDE.md) - 控制台日誌指南 (v3.2)

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

**🎉 立即體驗最先進的調酒酒吧管理系統！v3.2 帶來完整的 TypeScript 重構與現代化工具鏈，v3.1 提供穩定的狀態管理架構，v3.0 提供企業級營運分析，讓您的酒吧經營更智能、更高效！**

---

### 📝 版本更新日誌

**v3.2.0** (2025-01-25)
- 🔄 **完整 TypeScript 重構** - 移除所有 JSX 檔案，全面採用 TypeScript 嚴格模式
- 🛠️ **現代化工具鏈升級** - Vite 5、Tailwind 3、PostCSS 8 最新版本配置  
- 📊 **開發者工具套件** - 新增 HookDebugger、PerformanceMonitor、StateInspector
- 📝 **完整日誌系統** - 控制台攔截、檔案記錄、代理日誌、日誌檢視器
- 🏗️ **Hook 架構重組** - 業務邏輯、核心功能、UI、工具類 Hook 分類整理
- 📋 **專案文檔完善** - Hook 重構指南、性能報告、TypeScript 最佳實踐

**v3.1.1** (2025-01-25)
- 🔧 **修復無限循環錯誤** - 徹底解決 "Maximum update depth exceeded" 問題
- 🖱️ **桌面管理功能修復** - 修復 TableLayoutEditor 按鈕點擊無響應問題
- ⚡ **事件處理優化** - 使用 useCallback 包裝所有事件處理器，確保穩定性
- 🎯 **useEffect 優化** - 修復循環依賴，改進組件更新邏輯
- 🛡️ **選擇器穩定性** - 正在優化 Zustand 選擇器，防止不必要的重渲染

**v3.1.0** (2025-01-25)
- 🏗️ 完成 Zustand 狀態管理架構遷移
- 🔧 修復 "Maximum update depth exceeded" 循環更新問題  
- ⚡ 優化組合選擇器效能
- 🛡️ 增強 TypeScript 類型安全

**v3.0.0** (2024)
- 📊 新增企業級營運分析功能
- 🎯 實現 RFM 客戶分群模型
- 📈 完整圖表系統整合
- 🔧 全面 TypeScript 支援
