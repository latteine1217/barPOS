# Console Log 回傳系統 📊

## 功能概述

本系統實現了一個完整的 **Console Log 回傳機制**，讓你可以即時查看和管理來自 React 應用的所有 console 訊息。

### 🎯 主要功能

- **📝 Console 攔截**: 自動攔截 `console.log`、`console.error`、`console.warn` 等訊息
- **🔄 即時傳輸**: 使用 WebSocket 實現即時日誌同步
- **📊 可視化查看**: 內建的日誌查看器組件，支持篩選、搜尋、匯出
- **💾 本地儲存**: 自動儲存日誌到 localStorage，支持離線瀏覽
- **🎨 美觀界面**: 現代化 UI，支持暗色模式和響應式設計

### 🏗️ 系統架構

```
┌─────────────────┐    HTTP/WebSocket    ┌──────────────────┐
│   React App     │ ─────────────────── │  Express Server  │
│                 │                      │                  │
│ • Console       │                      │ • Log Storage    │
│   Interceptor   │                      │ • WebSocket Hub  │
│ • WebSocket     │                      │ • REST API       │
│   Client        │                      │ • Health Check   │
│ • Log Viewer    │                      │                  │
└─────────────────┘                      └──────────────────┘
```

## 🚀 快速開始

### 1. 啟動日誌服務器

```bash
# 進入專案目錄
cd /Users/latteine/Documents/coding/restaurant-pos

# 安裝服務器依賴
npm install express cors socket.io nodemon

# 啟動日誌服務器
node log-server.js

# 或使用開發模式 (推薦)
npx nodemon log-server.js
```

**服務器啟動後會顯示:**
```
🚀 Console Log 服務器已啟動: http://localhost:4000
📊 日誌 API: http://localhost:4000/logs
🔗 WebSocket 連接: ws://localhost:4000
❤️  健康檢查: http://localhost:4000/health
```

### 2. 啟動 React 應用

```bash
# 開啟新的終端視窗
# 啟動 Vite 開發服務器
npm run dev
```

### 3. 查看即時日誌

1. **開啟應用**: 訪問 `http://localhost:5173`
2. **日誌查看器**: 右下角會出現浮動的日誌查看器
3. **測試日誌**: 在瀏覽器 DevTools Console 中輸入:
   ```javascript
   console.log('測試日誌訊息 🍸');
   console.error('這是一個錯誤', { data: 'test' });
   console.warn('警告訊息');
   ```

## 📱 使用說明

### 日誌查看器操作

#### 🎛️ 控制面板
- **⏸️/▶️ 暫停/恢復**: 暫停日誌接收，避免訊息過多時的干擾
- **🗑️ 清除**: 清除所有日誌記錄
- **💾 匯出**: 下載 JSON 格式的日誌檔案
- **➖ 收合**: 最小化查看器為小按鈕

#### 🔍 篩選功能
- **類型篩選**: Log、Info、Warn、Error、Debug
- **級別篩選**: Debug、Info、Warn、Error
- **文字搜尋**: 支持訊息內容和組件名稱搜尋
- **高亮顯示**: 搜尋結果會被黃色標記

#### ⚙️ 進階設定
- **自動滾動**: 新訊息時自動滾動到底部
- **即時連接**: 顯示 WebSocket 連接狀態
- **批量處理**: 支持暫停時累積多條訊息

### API 端點

#### 📡 WebSocket API
```javascript
// 連接到 WebSocket
const ws = new WebSocket('ws://localhost:4000');

// 監聽新日誌
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'new-log') {
    console.log('收到新日誌:', data.payload);
  }
};

// 請求特定類型日誌
ws.send(JSON.stringify({
  type: 'request-logs',
  payload: { type: 'error', level: 'error' }
}));
```

#### 🌐 REST API

**發送日誌:**
```bash
curl -X POST http://localhost:4000/log \
  -H "Content-Type: application/json" \
  -d '{
    "type": "info",
    "message": ["Hello from API"],
    "level": "info",
    "component": "External-System"
  }'
```

**獲取歷史日誌:**
```bash
# 獲取最近 50 條日誌
curl "http://localhost:4000/logs?limit=50"

# 篩選特定類型
curl "http://localhost:4000/logs?type=error&level=error"
```

**清除日誌:**
```bash
curl -X DELETE http://localhost:4000/logs
```

**健康檢查:**
```bash
curl http://localhost:4000/health
```

## 🔧 客製化配置

### 前端攔截器配置

編輯 `src/main.tsx` 中的配置:

```typescript
initializeConsoleInterceptor({
  serverUrl: 'http://localhost:4000',           // 服務器地址
  componentName: 'Cocktail-Bar-POS',            // 組件名稱
  enabledTypes: ['log', 'info', 'warn', 'error'], // 攔截的類型
  enableWebSocket: true,                        // 啟用 WebSocket
  enableLocalStorage: true,                     // 啟用本地儲存
  maxRetries: 3,                               // 重試次數
  retryDelay: 1000,                            // 重試延遲 (ms)
  batchSize: 10,                               // 批量大小
  flushInterval: 2000,                         // 發送間隔 (ms)
});
```

### 服務器配置

編輯 `log-server.js` 中的配置:

```javascript
const PORT = process.env.LOG_SERVER_PORT || 4000;  // 服務器端口
const MAX_LOGS = 1000;                              // 最大日誌數量

// CORS 設定
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"]
};
```

## 🛠️ 開發指南

### 添加自定義日誌類型

```typescript
// 在 consoleInterceptorService.ts 中添加新類型
export type LogType = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'custom';

// 在 LogViewer.tsx 中添加對應圖標
const LOG_TYPE_ICONS = {
  // ... 現有圖標
  custom: '🛠️',
} as const;
```

### 整合其他日誌系統

```typescript
// 手動發送日誌到系統
import { consoleInterceptor } from './services/consoleInterceptorService';

// 發送自定義日誌
await consoleInterceptor.sendManualLog(
  'info', 
  ['來自外部系統的訊息'], 
  'External-API'
);
```

### 添加日誌分析

```typescript
// 在服務器端添加分析端點
app.get('/analytics', (req, res) => {
  const analytics = {
    totalLogs: logs.length,
    errorCount: logs.filter(log => log.level === 'error').length,
    warningCount: logs.filter(log => log.level === 'warn').length,
    components: [...new Set(logs.map(log => log.component))],
  };
  
  res.json(analytics);
});
```

## 🔍 故障排除

### 常見問題

**1. WebSocket 連接失敗**
```bash
# 檢查服務器是否運行
curl http://localhost:4000/health

# 檢查防火牆設定
# 確保端口 4000 沒有被封鎖
```

**2. 日誌不顯示**
```javascript
// 檢查攔截器是否啟動
console.log('測試訊息'); // 應該出現在查看器中

// 檢查篩選設定
// 確保篩選條件不會隱藏所有日誌
```

**3. 效能問題**
```typescript
// 調整批量設定
initializeConsoleInterceptor({
  batchSize: 5,        // 減少批量大小
  flushInterval: 500,  // 減少發送間隔
});
```

### 除錯模式

```bash
# 啟動服務器的詳細日誌模式
DEBUG=* node log-server.js

# 檢查網路請求
# 在瀏覽器 DevTools Network 標籤中查看 WebSocket 和 HTTP 請求
```

## 📚 相關檔案

- **`log-server.js`**: Express 日誌服務器
- **`src/services/consoleInterceptorService.ts`**: Console 攔截器服務
- **`src/services/logWebSocketService.ts`**: WebSocket 客戶端服務
- **`src/components/LogViewer.tsx`**: 日誌查看器組件
- **`src/main.tsx`**: 攔截器初始化

## 🎉 結語

這個 Console Log 回傳系統為你的 React 應用提供了強大的即時日誌監控能力。無論是開發偵錯、生產監控，還是用戶行為分析，都能為你提供寶貴的洞察。

**開發愉快！** 🍸✨