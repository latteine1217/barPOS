#!/usr/bin/env node

/**
 * 簡單的狀態檢查腳本
 * 檢查應用程式和日誌系統狀態
 */

const http = require('http');

// 檢查 Vite 開發服務器是否運行
function checkViteServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', (res) => {
      console.log('✅ Vite 開發服務器正在運行 (localhost:5173)');
      console.log(`📊 HTTP 狀態: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log('❌ Vite 開發服務器未運行');
      console.log(`錯誤: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('⏰ 連接超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 檢查檔案系統
function checkFileSystem() {
  const fs = require('fs');
  const path = require('path');

  console.log('\n📁 檔案系統檢查:');
  
  const filesToCheck = [
    'src/main.tsx',
    'src/services/consoleInterceptorService.ts',
    'src/services/agentLoggerService.ts',
    'logs/README.md',
    'read-agent-logs.cjs'
  ];

  filesToCheck.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} (不存在)`);
    }
  });
}

// 主執行函數
async function main() {
  console.log('🍸 調酒酒吧 POS 系統狀態檢查\n');
  
  await checkViteServer();
  checkFileSystem();
  
  console.log('\n📝 建議操作:');
  console.log('1. 在瀏覽器中打開 http://localhost:5173');
  console.log('2. 開啟開發者工具 (F12)');
  console.log('3. 在控制台中執行: __console_interceptor__.agentLogs()');
  console.log('4. 或使用: node read-agent-logs.cjs recent 10');
  
  console.log('\n🔧 如果沒有日誌出現:');
  console.log('- 確認應用程式已完全載入');
  console.log('- 在頁面中執行一些操作 (點擊按鈕、切換頁面等)');
  console.log('- 檢查瀏覽器控制台是否有錯誤訊息');
}

if (require.main === module) {
  main().catch(console.error);
}