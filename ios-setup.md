# iOS 開發環境設置指南

> ✅ **狀態更新**: iOS 環境已成功設置完成！本指南記錄最終的工作解決方案。

## 前置要求確認

### 1. 設置 Xcode 開發者目錄
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### 2. 安裝更新的 Ruby 和 CocoaPods（解決兼容性問題）
```bash
# 安裝最新 Ruby（透過 Homebrew）
brew install ruby

# 設定環境變數（永久）
echo 'export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 使用新 Ruby 安裝 CocoaPods
gem install cocoapods
```

### 3. 驗證安裝
```bash
ruby --version  # 應該顯示 3.4.4 或更新版本
pod --version   # 應該顯示 1.16.2 或更新版本
xcodebuild -version
```

## iOS 專案設置

### 1. 安裝 iOS 依賴（已完成）
```bash
cd ios/App
pod install
```
✅ **狀態**: 已成功安裝所有 Capacitor 插件依賴

### 2. 同步 Capacitor（已完成）
```bash
cd ../..
npx cap sync ios
```
✅ **狀態**: 已成功同步，支援 5 個 Capacitor 插件

### 3. 開啟 Xcode 專案
```bash
npm run mobile:dev:ios
```
或直接開啟：
```bash
open ios/App/App.xcworkspace
```

## Xcode 配置

### 1. 設定開發團隊簽名
1. 在 Xcode 中選擇專案 "App"
2. 選擇 "Signing & Capabilities" 標籤
3. 設定 "Team"（需要 Apple Developer 帳號）
4. 確保 "Automatically manage signing" 已勾選

### 2. 設定 Bundle Identifier
- 修改為唯一的 Bundle ID，例如：`com.yourcompany.restaurant-pos`

### 3. 設定部署目標
- 確保 "Deployment Target" 設定為 iOS 13.0 或更新版本

## 測試執行

### 1. 模擬器測試
1. 在 Xcode 中選擇模擬器（例如：iPhone 15）
2. 點擊 "Run" 按鈕 (⌘+R)
3. 應用程式將在模擬器中啟動

### 2. 真機測試
1. 連接 iPhone/iPad 到 Mac
2. 在 Xcode 中選擇您的設備
3. 點擊 "Run" 按鈕
4. 首次執行需要在設備上信任開發者證書

## 常見問題解決

### ✅ 已解決：Ruby 2.6 兼容性問題
**問題**: CocoaPods 與系統 Ruby 2.6 不兼容，出現 `uninitialized constant ActiveSupport::LoggerThreadSafeLevel::Logger (NameError)`

**解決方案**: 使用 Homebrew 安裝更新的 Ruby 3.4.4
```bash
brew install ruby
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"
gem install cocoapods
```

### 問題 1: "Developer cannot be verified"
**解決方案：**
1. 在 iPhone 上：設定 → 一般 → VPN 與裝置管理
2. 找到您的開發者證書並點擊信任

### 問題 2: Pod install 失敗
**解決方案：**
```bash
cd ios/App
pod repo update
pod install --clean-install
```

### 問題 3: Signing 錯誤
**解決方案：**
1. 確保有有效的 Apple Developer 帳號
2. 在 Xcode 中重新設定 Team
3. 清理專案並重新建置

## 發布準備

### 1. 生產建置
1. 在 Xcode 中選擇 "Generic iOS Device"
2. Product → Archive
3. 等待建置完成

### 2. App Store 上傳
1. 在 Archive Organizer 中選擇 "Distribute App"
2. 選擇 "App Store Connect"
3. 按照指示完成上傳

---

完成這些步驟後，您的 iOS App 就可以正常運行了！