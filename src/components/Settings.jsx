import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import NotionService from '../services/notionService';

const Settings = () => {
  const { state, actions } = useApp();
  const [config, setConfig] = useState({
    token: state.notionConfig.token,
    databaseId: state.notionConfig.databaseId
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = () => {
    // 保存到localStorage
    localStorage.setItem('notionToken', config.token);
    localStorage.setItem('databaseId', config.databaseId);
    
    // 更新應用狀態
    actions.updateNotionConfig(config);
    
    alert('設定已保存！');
  };

  const handleTest = async () => {
    if (!config.token || !config.databaseId) {
      setTestResult({ success: false, message: '請填寫Token和Database ID' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const notionService = new NotionService(config.token, config.databaseId);
      const result = await notionService.testConnection();
      
      if (result.success) {
        setTestResult({ 
          success: true, 
          message: '連接成功！資料庫名稱: ' + result.data.title[0]?.plain_text || '未命名'
        });
      } else {
        setTestResult({ 
          success: false, 
          message: '連接失敗: ' + result.error 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: '連接錯誤: ' + error.message 
      });
    } finally {
      setTesting(false);
    }
  };

  const syncFromNotion = async () => {
    if (!config.token || !config.databaseId) {
      alert('請先設定並測試Notion連接');
      return;
    }

    try {
      const notionService = new NotionService(config.token, config.databaseId);
      const result = await notionService.fetchOrders();
      
      if (result.success) {
        actions.setOrders(result.data);
        alert(`成功同步 ${result.data.length} 筆訂單`);
      } else {
        alert('同步失敗: ' + result.error);
      }
    } catch (error) {
      alert('同步錯誤: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">設定</h1>
      </div>

      {/* Notion 設定 */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notion 整合設定</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notion Integration Token
            </label>
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              placeholder="secret_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              請到 Notion 的 Integrations 頁面創建一個新的 integration 並複製 token
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Database ID 或 URL
            </label>
            <input
              type="text"
              value={config.databaseId}
              onChange={(e) => setConfig({ ...config, databaseId: e.target.value })}
              placeholder="32位字符的ID或完整的資料庫URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              複製 Notion 資料庫的 URL 或從 URL 中提取 32 位字符的 ID
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing}
              className="btn btn-secondary"
            >
              {testing ? '測試中...' : '測試連接'}
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              保存設定
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-md ${
              testResult.success 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* 資料同步 */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">資料管理</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">從 Notion 同步訂單</h3>
              <p className="text-sm text-gray-600">將 Notion 資料庫中的訂單同步到本地</p>
            </div>
            <button
              onClick={syncFromNotion}
              className="btn btn-primary"
            >
              同步訂單
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <h3 className="font-medium text-red-800">重置系統資料</h3>
              <p className="text-sm text-red-600">清除所有本地儲存資料（訂單、菜單、桌位佈局等），但保留 Notion 設定</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('⚠️ 確定要重置系統嗎？\n\n這將清除以下資料：\n• 所有訂單記錄\n• 自訂菜單項目\n• 桌位佈局設定\n• 統計數據\n\n此操作無法復原！')) {
                  actions.clearAllData();
                  alert('✅ 系統已重置到初始狀態');
                }
              }}
              className="btn bg-red-500 hover:bg-red-600 text-white"
            >
              重置系統
            </button>
          </div>
        </div>
      </div>

      {/* 系統資訊 */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">系統資訊</h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">訂單總數:</span>
            <span className="ml-2 font-medium">{state.orders.length}</span>
          </div>
          <div>
            <span className="text-gray-600">菜單項目:</span>
            <span className="ml-2 font-medium">{state.menuItems.length}</span>
          </div>
          <div>
            <span className="text-gray-600">桌位數量:</span>
            <span className="ml-2 font-medium">{state.tables.length}</span>
          </div>
          <div>
            <span className="text-gray-600">今日營收:</span>
            <span className="ml-2 font-medium">${state.stats.todayRevenue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;