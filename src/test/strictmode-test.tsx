/**
 * StrictMode 雙呼叫測試組件
 * 用於檢驗在 React 18 StrictMode 下是否存在副作用問題
 */

import React, { useEffect, useState, useRef } from 'react';

// 測試組件：模擬可能有問題的副作用
const StrictModeTestComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const renderCount = useRef(0);
  const effectCount = useRef(0);
  
  // 記錄渲染次數
  renderCount.current += 1;
  
  // 這個 effect 應該是冪等的，即使被調用兩次也不會有問題
  useEffect(() => {
    effectCount.current += 1;
    
    const logMessage = `Effect 執行 #${effectCount.current} at ${new Date().toLocaleTimeString()}`;
    console.log('📊 StrictMode Test:', logMessage);
    
    setLogs(prev => [...prev, logMessage]);
    
    // ✅ 冪等性範例：設置相同的值不會造成問題
    document.title = 'Restaurant POS - Test';
    
    // ✅ 冪等性範例：清理函數確保資源正確釋放
    const timer = setTimeout(() => {
      console.log('⏰ Timer executed', effectCount.current);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      console.log('🧹 Effect cleanup #', effectCount.current);
    };
  }, []); // 空依賴陣列，應該只執行一次（但 StrictMode 會執行兩次）
  
  // 測試狀態更新的副作用
  useEffect(() => {
    if (count > 0) {
      console.log('📈 Count changed to:', count);
    }
  }, [count]);
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🧪 StrictMode 雙呼叫測試</h2>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h3 className="font-semibold mb-2">測試統計：</h3>
        <p>組件渲染次數: <span className="font-mono">{renderCount.current}</span></p>
        <p>Effect 執行次數: <span className="font-mono">{effectCount.current}</span></p>
        <p>當前計數: <span className="font-mono">{count}</span></p>
      </div>
      
      <div className="mb-4">
        <button 
          onClick={() => setCount(prev => prev + 1)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          增加計數
        </button>
        <button 
          onClick={() => setLogs([])}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2"
        >
          清除日誌
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Effect 執行日誌：</h3>
        <div className="max-h-32 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 italic">無日誌記錄</p>
          ) : (
            logs.map((log, index) => (
              <p key={index} className="text-sm font-mono text-gray-700">
                {log}
              </p>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
        <p className="text-sm text-yellow-700">
          <strong>預期行為：</strong> 在開發模式 (StrictMode) 下，Effect 會執行兩次。
          在生產模式下，只會執行一次。這是 React 18 的正常行為。
        </p>
      </div>
    </div>
  );
};

export default StrictModeTestComponent;