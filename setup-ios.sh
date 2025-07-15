#!/bin/bash

# iOS 開發環境設置腳本
# 請確保已安裝 Xcode 並設置開發者目錄

echo "🍎 開始設置 iOS 開發環境..."

# 檢查 Xcode 是否正確設置
echo "📱 檢查 Xcode 設置..."
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ 錯誤: 請先設置 Xcode 開發者目錄"
    echo "請執行: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
    exit 1
fi

# 檢查 CocoaPods
echo "🍫 檢查 CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo "⚠️  CocoaPods 未安裝，正在安裝..."
    sudo gem install cocoapods
    if [ $? -ne 0 ]; then
        echo "❌ CocoaPods 安裝失敗，請手動執行: sudo gem install cocoapods"
        exit 1
    fi
fi

# 建置 React 應用
echo "⚛️  建置 React 應用..."
npm run build

# 同步 Capacitor
echo "🔄 同步 Capacitor..."
npx cap sync ios

# 安裝 iOS 依賴
echo "📦 安裝 iOS 依賴..."
cd ios/App
pod install

if [ $? -eq 0 ]; then
    echo "✅ iOS 設置完成！"
    echo ""
    echo "下一步："
    echo "1. 開啟 Xcode: npm run cap:open:ios"
    echo "2. 設定開發團隊簽名"
    echo "3. 修改 Bundle Identifier"
    echo "4. 運行應用程式"
    echo ""
    echo "是否現在開啟 Xcode? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cd ../..
        npm run cap:open:ios
    fi
else
    echo "❌ iOS 設置失敗，請檢查錯誤訊息"
    exit 1
fi