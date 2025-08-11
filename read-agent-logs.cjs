#!/usr/bin/env node

/**
 * Agent 日誌讀取腳本
 * 讓 opencode agent 可以直接讀取應用程式日誌
 */

const fs = require('fs');
const path = require('path');

// 日誌檔案路徑
const LOG_FILE = path.join(__dirname, '../logs/agent-readable.log');
const JSON_LOG_FILE = path.join(__dirname, '../logs/agent-logs.json');

/**
 * 讀取文字格式日誌
 */
function readTextLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return fs.readFileSync(LOG_FILE, 'utf8');
    }
    return '日誌檔案不存在或尚未創建';
  } catch (error) {
    return `讀取日誌失敗: ${error.message}`;
  }
}

/**
 * 讀取 JSON 格式日誌
 */
function readJsonLogs() {
  try {
    if (fs.existsSync(JSON_LOG_FILE)) {
      const content = fs.readFileSync(JSON_LOG_FILE, 'utf8');
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    return { error: `讀取 JSON 日誌失敗: ${error.message}` };
  }
}

/**
 * 獲取最近的日誌 (最後 N 條)
 */
function getRecentLogs(count = 50) {
  const logs = readJsonLogs();
  if (Array.isArray(logs)) {
    return logs.slice(-count);
  }
  return logs;
}

/**
 * 根據級別篩選日誌
 */
function filterLogsByLevel(level) {
  const logs = readJsonLogs();
  if (Array.isArray(logs)) {
    return logs.filter(log => log.level === level);
  }
  return logs;
}

/**
 * 主執行函數
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'recent';

  switch (command) {
    case 'text':
      console.log(readTextLogs());
      break;
      
    case 'json':
      console.log(JSON.stringify(readJsonLogs(), null, 2));
      break;
      
    case 'recent':
      const count = parseInt(args[1]) || 50;
      console.log(JSON.stringify(getRecentLogs(count), null, 2));
      break;
      
    case 'errors':
      console.log(JSON.stringify(filterLogsByLevel('error'), null, 2));
      break;
      
    case 'warnings':
      console.log(JSON.stringify(filterLogsByLevel('warn'), null, 2));
      break;
      
    case 'help':
      console.log(`
Agent 日誌讀取器使用說明:

node read-agent-logs.js [command] [options]

命令:
  text               讀取文字格式日誌
  json               讀取 JSON 格式日誌
  recent [count]     讀取最近的日誌 (預設 50 條)
  errors             只顯示錯誤日誌
  warnings           只顯示警告日誌
  help               顯示此幫助訊息

範例:
  node read-agent-logs.js recent 20
  node read-agent-logs.js errors
  node read-agent-logs.js text
      `);
      break;
      
    default:
      console.log('未知命令，使用 "help" 查看使用說明');
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

module.exports = {
  readTextLogs,
  readJsonLogs,
  getRecentLogs,
  filterLogsByLevel,
};