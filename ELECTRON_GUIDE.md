# Electron 開發指南

本專案現已支援 Electron 桌面應用程式！

## 快速開始

### 🚀 開發模式
```bash
# 啟動 Electron 開發環境（包含熱重載）
npm run electron-dev
```
這會同時啟動 Vite 開發服務器和 Electron 應用程式。

### 🔨 建置測試
```bash
# 建置 React 應用並啟動 Electron
npm run electron-build
```

### 📦 打包應用程式
```bash
# 打包當前平台的應用程式
npm run dist

# 特定平台打包
npm run dist-mac    # macOS (.dmg)
npm run dist-win    # Windows (.exe)
npm run dist-linux  # Linux (.AppImage, .deb)
```

## 功能特色

### 🖥️ 原生桌面體驗
- **原生菜單**: 完整的應用程式菜單，包含快捷鍵
- **窗口管理**: 記住窗口大小和位置
- **系統整合**: 支援 macOS、Windows、Linux

### ⌨️ 鍵盤快捷鍵
- `Cmd/Ctrl + N`: 新增訂單
- `Cmd/Ctrl + 1-4`: 切換功能頁面
- `Cmd/Ctrl + ,`: 開啟設定
- `Cmd/Ctrl + R`: 重新載入
- `F11`: 全螢幕切換

### 🛡️ 安全性
- **Context Isolation**: 啟用上下文隔離
- **No Node Integration**: 停用 Node.js 整合
- **CSP**: 內容安全政策

## 技術架構

### 檔案結構
```
electron/
└── main.cjs         # Electron 主進程
src/                 # React 應用程式源碼
dist/                # 建置後的網頁檔案
dist-electron/       # Electron 打包輸出
```

### 開發流程
1. **開發**: `npm run electron-dev` - 啟動熱重載開發環境
2. **測試**: `npm run electron-build` - 建置並測試桌面版
3. **打包**: `npm run dist` - 產生可分發的安裝檔

### 配置檔案
- `package.json` - Electron Builder 配置
- `electron/main.cjs` - 主進程邏輯
- `vite.config.js` - Vite 配置（含 Electron 最佳化）

## 部署

### 輸出檔案
- **macOS**: `.dmg` 安裝映像檔
- **Windows**: `.exe` NSIS 安裝程式
- **Linux**: `.AppImage` 可攜式應用程式 + `.deb` 套件

### 系統需求
- **macOS**: 10.13 High Sierra 或更新版本
- **Windows**: Windows 10 或更新版本
- **Linux**: Ubuntu 18.04 或同等發行版

## 疑難排解

### 常見問題

1. **Electron 無法啟動**
   ```bash
   # 清除 node_modules 重新安裝
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **建置失敗**
   ```bash
   # 確保先建置 React 應用
   npm run build
   npm run electron-build
   ```

3. **打包錯誤**
   - 確認平台相容性（某些打包需在目標平台執行）
   - 檢查 electron-builder 版本相容性

### 開發技巧
- 使用 `npm run electron-dev` 進行開發，支援熱重載
- DevTools 在開發模式下自動開啟
- 生產模式不會顯示 DevTools

## 下一步規劃

- [ ] 自動更新功能
- [ ] 應用程式圖示設計
- [ ] 系統通知整合
- [ ] 檔案關聯設定
- [ ] 印表機整合

---

開發工具: 本專案使用 [opencode](https://opencode.ai) + GitHub Copilot 進行 AI 輔助開發