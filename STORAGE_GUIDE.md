# 跨平台資料儲存策略

本專案實現了統一的資料儲存解決方案，支援網頁端、桌面端和行動端。

## 🌐 **支援平台**

### 1. **網頁端** (Web)
- **儲存方式**: `localStorage`
- **適用範圍**: 所有現代瀏覽器
- **資料位置**: 瀏覽器本地儲存
- **優點**: 簡單、快速、無需額外配置
- **限制**: 清除瀏覽器資料時會遺失

### 2. **桌面端** (Electron)
- **儲存方式**: 檔案系統 JSON 儲存
- **適用範圍**: Windows, macOS, Linux
- **資料位置**: 
  - Windows: `%APPDATA%/restaurant-pos-system/storage.json`
  - macOS: `~/Library/Application Support/restaurant-pos-system/storage.json`
  - Linux: `~/.config/restaurant-pos-system/storage.json`
- **優點**: 持久化儲存、支援檔案匯出/匯入
- **特色**: 支援原生檔案對話框進行資料備份

### 3. **行動端** (Capacitor)
- **儲存方式**: `@capacitor/preferences`
- **適用範圍**: iOS, Android
- **資料位置**: 
  - iOS: NSUserDefaults
  - Android: SharedPreferences
- **優點**: 原生儲存、效能優異
- **特色**: 即使應用重新安裝也能保留部分資料

## 📊 **儲存的資料類型**

| 資料類型 | 儲存 Key | 說明 |
|---------|----------|------|
| 訂單記錄 | `restaurant_pos_orders` | 所有訂單的完整資料 |
| 菜單項目 | `restaurant_pos_menu` | 自訂菜單項目（會與預設菜單合併） |
| 桌位資訊 | `restaurant_pos_tables` | 桌位狀態、佈局、自訂名稱等 |
| 佈局設定 | `restaurant_pos_layout` | 桌位編輯器的畫布設定 |
| 統計數據 | `restaurant_pos_stats` | 營收、訂單數等統計資訊 |
| Notion Token | `notionToken` | Notion 整合的驗證 Token |
| Database ID | `databaseId` | Notion 資料庫 ID |

## 🔧 **技術實現**

### StorageService 類別
```javascript
// 自動偵測平台
const platform = detectPlatform(); // 'web', 'electron', 'mobile'

// 統一的儲存介面
await storageService.setItem(key, value);
const value = await storageService.getItem(key, defaultValue);
await storageService.removeItem(key);
await storageService.clear();
```

### 平台偵測邏輯
1. 檢查 `window.Capacitor` → 行動端
2. 檢查 `window.electronAPI` → 桌面端  
3. 其他情況 → 網頁端

### 自動儲存機制
- 使用 React `useEffect` 監聽狀態變化
- 只在應用初始化完成後才開始自動儲存
- 錯誤處理確保儲存失敗不會影響應用運行

## 📱 **各平台執行指令**

### 網頁端開發
```bash
npm run dev          # 開發模式
npm run build        # 打包
npm run preview      # 預覽打包結果
```

### 桌面端開發
```bash
npm run electron-dev    # 開發模式
npm run electron-build  # 打包並執行
npm run dist           # 建置安裝包
npm run dist-mac       # macOS 安裝包
npm run dist-win       # Windows 安裝包
npm run dist-linux     # Linux 安裝包
```

### 行動端開發
```bash
# Android
npm run cap:run:android     # 建置並在 Android 執行
npm run cap:open:android    # 開啟 Android Studio

# iOS
npm run cap:run:ios         # 建置並在 iOS 執行  
npm run cap:open:ios        # 開啟 Xcode
```

## 🔄 **資料同步策略**

### 單機使用
- 所有資料儲存在本地
- 支援資料匯出/匯入進行備份
- 不同平台間可透過檔案傳輸同步

### 雲端同步（Notion 整合）
- 訂單資料可選擇同步到 Notion
- 本地儲存作為快取和備份
- 支援離線操作，連線時再同步

### 多設備使用
- 每個設備維護獨立的本地資料
- 透過 Notion 進行中央化資料管理
- 支援資料匯出/匯入在設備間轉移

## 🛡️ **資料安全性**

### 備份機制
- **自動備份**: 即時儲存到本地
- **手動備份**: 支援匯出 JSON 檔案
- **雲端備份**: 透過 Notion 同步重要資料

### 錯誤處理
- 儲存失敗時自動降級到備用方案
- 載入失敗時使用預設值
- 詳細的錯誤日誌方便除錯

### 隱私保護
- 敏感資料（Notion Token）加密儲存
- 本地資料不會自動上傳
- 用戶可完全控制資料同步行為

## 🚀 **效能優化**

### 載入優化
- 異步初始化儲存系統
- 分批載入大量資料
- 只載入必要的資料項目

### 儲存優化
- 防抖儲存避免頻繁寫入
- 只儲存變更的資料項目
- 壓縮和清理無用資料

### 記憶體管理
- 適當的垃圾回收
- 避免記憶體洩漏
- 大資料集的分頁處理

這套跨平台儲存系統確保了餐廳 POS 系統在任何平台上都能提供一致且可靠的資料管理體驗。