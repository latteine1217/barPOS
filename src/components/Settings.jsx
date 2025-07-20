import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import SupabaseService from '../services/supabaseService';

const Settings = () => {
  const { state, actions } = useApp();
  
  // Supabase 設定
  const [supabaseConfig, setSupabaseConfig] = useState({
    url: state.supabaseConfig?.url || '',
    key: state.supabaseConfig?.key || ''
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // === Supabase 相關函數 ===
  
  const handleSupabaseSave = async () => {
    try {
      // 更新應用狀態
      await actions.updateSupabaseConfig(supabaseConfig);
      alert('Supabase 設定已保存！');
    } catch (error) {
      alert('保存失敗: ' + error.message);
    }
  };

  const handleSupabaseTest = async () => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      setTestResult({ success: false, message: '請填寫 Project URL 和 API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const supabaseService = new SupabaseService(supabaseConfig.url, supabaseConfig.key);
      const result = await supabaseService.testConnection();
      
      if (result.success) {
        setTestResult({ 
          success: true, 
          message: '連接成功！' + result.message
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

  const syncToSupabase = async () => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      alert('請先設定並測試 Supabase 連接');
      return;
    }

    setSyncing(true);
    try {
      console.log('開始同步到 Supabase...');
      const supabaseService = new SupabaseService(supabaseConfig.url, supabaseConfig.key);
      
      // 準備本地資料
      const localData = {
        orders: state.orders,
        tables: state.tables,
        menuItems: state.menuItems
      };

      console.log('本地資料:', localData);
      
      // 執行同步
      const result = await supabaseService.syncLocalData(localData);
      
      if (result.success) {
        const { results } = result;
        const totalSuccess = results.orders.success + results.tables.success + results.menuItems.success;
        const totalFailed = results.orders.failed + results.tables.failed + results.menuItems.failed;
        
        let message = `同步完成！\n成功: ${totalSuccess} 項`;
        
        if (totalFailed > 0) {
          message += `\n失敗: ${totalFailed} 項`;
          
          // 顯示詳細錯誤
          const allErrors = [
            ...results.orders.errors,
            ...results.tables.errors,
            ...results.menuItems.errors
          ];
          
          if (allErrors.length > 0) {
            console.error('同步錯誤詳情:', allErrors);
            message += '\n\n錯誤詳情:\n' + allErrors.slice(0, 5).join('\n');
            if (allErrors.length > 5) {
              message += `\n...還有 ${allErrors.length - 5} 個錯誤，請查看控制台`;
            }
          }
        }
        
        alert(message);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('同步錯誤:', error);
      alert('同步錯誤: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const syncFromSupabase = async () => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      alert('請先設定並測試 Supabase 連接');
      return;
    }

    setSyncing(true);
    try {
      const supabaseService = new SupabaseService(supabaseConfig.url, supabaseConfig.key);
      
      // 從 Supabase 獲取資料
      const [ordersResult, tablesResult, menuResult] = await Promise.all([
        supabaseService.fetchOrders(),
        supabaseService.fetchTables(),
        supabaseService.fetchMenuItems()
      ]);

      let successCount = 0;
      let errorMessages = [];

      if (ordersResult.success) {
        actions.setOrders(ordersResult.data);
        successCount++;
      } else {
        errorMessages.push('訂單同步失敗: ' + ordersResult.error);
      }

      if (tablesResult.success) {
        actions.setTables(tablesResult.data);
        successCount++;
      } else {
        errorMessages.push('桌位同步失敗: ' + tablesResult.error);
      }

      if (menuResult.success) {
        actions.setMenuItems(menuResult.data);
        successCount++;
      } else {
        errorMessages.push('菜單同步失敗: ' + menuResult.error);
      }

      if (successCount > 0) {
        alert(`成功同步 ${successCount} 項資料類型`);
      }
      
      if (errorMessages.length > 0) {
        alert('部分同步失敗:\n' + errorMessages.join('\n'));
      }
    } catch (error) {
      alert('同步錯誤: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">設定</h1>
      </div>

      {/* Supabase 資料庫設定 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">🚀 Supabase 雲端資料庫</h2>
        
        <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">✨ 功能特色</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>• 即時多裝置同步</li>
            <li>• 完整的關聯資料庫功能</li>
            <li>• 更快的查詢速度</li>
            <li>• 離線優先設計</li>
            <li>• 專業級資料管理</li>
          </ul>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="form-label">
              Project URL
            </label>
            <input
              type="text"
              value={supabaseConfig.url}
              onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
              placeholder="https://your-project.supabase.co"
              className="form-input"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              從 Supabase Dashboard 的 Settings &gt; API 頁面複製
            </p>
          </div>

          <div>
            <label className="form-label">
              API Key (anon, public)
            </label>
            <input
              type="password"
              value={supabaseConfig.key}
              onChange={(e) => setSupabaseConfig({ ...supabaseConfig, key: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="form-input"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              使用 anon public key，不是 service_role key。確保已啟用 Row Level Security (RLS)
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSupabaseTest}
              disabled={testing}
              className="btn btn-secondary"
            >
              {testing ? '測試中...' : '測試連接'}
            </button>
            <button
              onClick={handleSupabaseSave}
              className="btn btn-primary"
            >
              保存設定
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-xl ${
              testResult.success 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* 資料同步 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">📊 資料管理</h2>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">上傳到 Supabase</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">將本地資料上傳到雲端資料庫</p>
            </div>
            <button
              onClick={syncToSupabase}
              disabled={syncing}
              className="btn btn-primary"
            >
              {syncing ? '同步中...' : '上傳資料'}
            </button>
          </div>

          <div className="flex justify-between items-center p-6 bg-green-50 dark:bg-green-900/30 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">從 Supabase 下載</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">從雲端資料庫同步最新資料到本地</p>
            </div>
            <button
              onClick={syncFromSupabase}
              disabled={syncing}
              className="btn btn-primary"
            >
              {syncing ? '同步中...' : '下載資料'}
            </button>
          </div>

           <div className="flex justify-between items-center p-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl">
             <div>
               <h3 className="font-medium text-yellow-800 dark:text-yellow-300">重新載入菜單</h3>
               <p className="text-sm text-yellow-600 dark:text-yellow-400">清除菜單快取並重新載入預設菜單（包含基酒分類）</p>
             </div>
             <button
               onClick={() => {
                 if (window.confirm('確定要重新載入菜單嗎？\n\n這將清除自訂的菜單項目，恢復為預設菜單。')) {
                   // 清除菜單快取
                   localStorage.removeItem('restaurant_pos_menu');
                   // 重新載入頁面以使用預設菜單
                   window.location.reload();
                 }
               }}
               className="btn bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white"
             >
               重新載入菜單
             </button>
           </div>

           <div className="flex justify-between items-center p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">重置系統資料</h3>
              <p className="text-sm text-red-600 dark:text-red-400">清除所有本地儲存資料，但保留雲端資料庫設定</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('⚠️ 確定要重置系統嗎？\n\n這將清除以下本地資料：\n• 所有訂單記錄\n• 自訂菜單項目\n• 桌位佈局設定\n• 統計數據\n\n雲端資料庫不受影響！')) {
                  actions.clearAllData();
                  alert('✅ 系統已重置到初始狀態');
                }
              }}
              className="btn bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
            >
              重置系統
            </button>
          </div>
        </div>
      </div>

      {/* 系統資訊 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">ℹ️ 系統資訊</h2>
        
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">資料庫:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">🚀 Supabase</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">訂單總數:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{state.orders.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">菜單項目:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{state.menuItems.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">桌位數量:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{state.tables.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">今日營收:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">${state.stats.todayRevenue}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">版本:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">v2.2 Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;