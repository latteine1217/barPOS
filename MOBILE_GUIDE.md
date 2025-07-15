# 移動端開發指南

本專案現已支援 iOS 和 Android 原生移動端應用程式！使用 Capacitor 框架將 React 網頁應用包裝成原生 App。

## 📱 快速開始

### 🛠️ 系統需求

**Android 開發：**
- Android Studio 4.0 或更新版本
- Android SDK (API level 21+)
- Java 8 或更新版本

**iOS 開發：**
- macOS 系統
- Xcode 12 或更新版本
- iOS 13.0 或更新版本
- CocoaPods

### 🚀 移動端開發流程

#### 1. 初始設置（僅需一次）
```bash
# 建立 iOS 和 Android 平台
npm run mobile:setup
```

#### 2. 開發和測試
```bash
# Android 開發
npm run mobile:dev:android

# iOS 開發（需要 macOS + Xcode）
npm run mobile:dev:ios
```

#### 3. 手動開啟原生 IDE
```bash
# 開啟 Android Studio
npm run cap:open:android

# 開啟 Xcode（僅 macOS）
npm run cap:open:ios
```

#### 4. 同步更新
```bash
# 同步 React 建置到移動端平台
npm run cap:sync
```

## 🔧 移動端特有功能

### 原生功能整合
- **狀態列管理** - 自動調整狀態列樣式
- **啟動畫面** - 2秒品牌啟動動畫
- **觸覺反饋** - 按鈕點擊震動反饋
- **鍵盤管理** - 自動處理軟體鍵盤
- **返回按鈕** - Android 返回按鈕處理

### 移動端 UI 最佳化
- **觸控目標** - 44px 最小觸控區域
- **安全區域** - 支援 iPhone 瀏海和 Android 手勢導航
- **字體大小** - 防止 iOS 輸入框縮放
- **滑動優化** - 流暢的觸控滾動體驗

### 餐廳 POS 特殊功能
- **離線模式** - 基本功能可離線使用
- **手勢操作** - 滑動切換功能頁面
- **快捷操作** - 長按快速功能
- **通知提醒** - 訂單狀態推送通知

## 📦 發布流程

### Android 發布
1. **建置 APK**
   ```bash
   # 在 Android Studio 中：
   # Build → Build Bundle(s)/APK(s) → Build APK(s)
   ```

2. **Google Play 上架**
   - 註冊 Google Play Console 開發者帳號
   - 建立應用程式列表
   - 上傳 APK 或 AAB 檔案
   - 填寫應用程式資訊和截圖

### iOS 發布
1. **建置 IPA**
   ```bash
   # 在 Xcode 中：
   # Product → Archive → Distribute App
   ```

2. **App Store 上架**
   - 註冊 Apple Developer Program ($99/年)
   - 在 App Store Connect 建立應用程式
   - 上傳 IPA 檔案
   - 提交審核

## 🎨 移動端設計指南

### 觸控優化
- 按鈕最小尺寸：44x44px
- 間距充足，避免誤觸
- 清晰的視覺反饋

### 餐廳 POS 專用
- **橫屏支援** - 平板橫屏使用體驗
- **大字體模式** - 適合快節奏環境
- **高對比度** - 廚房環境清晰可見
- **防誤觸** - 關鍵操作需要確認

### 平台差異
- **iOS** - 遵循 Human Interface Guidelines
- **Android** - 遵循 Material Design
- **通用** - 保持品牌一致性

## 🔍 除錯和測試

### 開發工具
```bash
# 即時預覽（瀏覽器）
npm run dev

# 裝置測試（需要連接實體裝置）
npm run cap:run:android
npm run cap:run:ios
```

### 常見問題

1. **Android Studio 找不到專案**
   ```bash
   npm run cap:sync
   npm run cap:open:android
   ```

2. **iOS 無法編譯**
   - 確保安裝 Xcode
   - 安裝 CocoaPods: `sudo gem install cocoapods`
   - 執行: `cd ios/App && pod install`

3. **Capacitor 插件無法使用**
   ```bash
   npm run cap:sync
   ```

4. **應用程式白屏**
   - 檢查 `capacitor.config.ts` 中的 `webDir` 設定
   - 確保執行過 `npm run build`

## 📋 開發檢查清單

### 發布前檢查
- [ ] 所有功能在實體裝置上測試通過
- [ ] 應用程式圖示和啟動畫面設置完成
- [ ] 不同螢幕尺寸適配良好
- [ ] 網路連線中斷處理正常
- [ ] 效能表現符合預期

### 上架準備
- [ ] 應用程式截圖（各種裝置尺寸）
- [ ] 應用程式描述和關鍵字
- [ ] 隱私政策和使用條款
- [ ] 測試帳號和說明
- [ ] 應用程式分級設定

## 🔄 持續整合

### 自動化建置
可以設置 GitHub Actions 自動建置：
- 程式碼推送時自動建置
- 自動執行測試
- 產生測試版本供測試

### 版本管理
- 使用 semantic versioning
- 標記重要發布節點
- 維護更新日誌

---

**開發工具**: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發

## 🎯 下一步功能

- [ ] 推送通知整合
- [ ] 生物識別認證
- [ ] 相機條碼掃描
- [ ] 原生檔案存取
- [ ] 藍牙印表機整合
- [ ] 位置服務整合