/**
 * 檢查 Agent 日誌的測試腳本
 * 模擬在瀏覽器中檢查 localStorage 的狀態
 */

// 這個腳本可以在瀏覽器控制台中執行，用於檢查日誌狀態

console.log('🔍 檢查 Agent 日誌系統狀態...');

// 檢查 localStorage 中的日誌
const agentLogsText = localStorage.getItem('opencode-agent-logs');
const agentLogsJsonText = localStorage.getItem('opencode-agent-logs-json');
const viteConsoleLogsText = localStorage.getItem('vite-console-logs');

console.log('📊 日誌統計:');
console.log('- Agent 文字日誌:', agentLogsText ? agentLogsText.split('\n').length + ' 條' : '無');
console.log('- Agent JSON 日誌:', agentLogsJsonText ? JSON.parse(agentLogsJsonText).length + ' 條' : '無');
console.log('- Vite 控制台日誌:', viteConsoleLogsText ? JSON.parse(viteConsoleLogsText).length + ' 條' : '無');

// 檢查全域調試工具
interface WindowWithInterceptor extends Window {
  __console_interceptor__?: Record<string, unknown>;
}

if ((window as WindowWithInterceptor).__console_interceptor__) {
  console.log('✅ 控制台攔截器已載入');
  console.log('📋 可用方法:', Object.keys((window as WindowWithInterceptor).__console_interceptor__!));
} else {
  console.log('❌ 控制台攔截器未載入');
}

// 測試日誌功能
console.log('🧪 測試日誌功能...');
console.log('這是一條測試 log 訊息');
console.info('這是一條測試 info 訊息');
console.warn('這是一條測試 warn 訊息');
console.error('這是一條測試 error 訊息');

// 等待一會兒後檢查結果
setTimeout(() => {
  const newAgentLogsText = localStorage.getItem('opencode-agent-logs-json');
  if (newAgentLogsText) {
    const logs = JSON.parse(newAgentLogsText);
    console.log('🎉 日誌測試成功！新增了', logs.length, '條日誌');
    console.log('📝 最新日誌:', logs.slice(-3));
  } else {
    console.log('⚠️ 日誌測試失敗，沒有檢測到新日誌');
  }
}, 2000);