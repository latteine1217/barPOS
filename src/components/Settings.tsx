import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../stores/settingsStore';
import { useOrders, useTables, useMenuItems, useOrderActions, useTableActions, useMenuActions } from '@/stores';
import { useError } from '../contexts/ErrorContext';
import type { SupabaseConfig, ErrorContextType } from '@/types';
import SupabaseService from '../services/supabaseService';

interface TestResult {
  success: boolean;
  message: string;
}

const Settings: React.FC = () => {
  const { state: settingsState, actions: settingsActions } = useSettings();
  const orders = useOrders();
  const tables = useTables();
  const menuItems = useMenuItems();
  const orderActions = useOrderActions();
  const tableActions = useTableActions();
  const menuActions = useMenuActions();
  
  // 使用 useMemo 來穩定 errorContext 引用
  const errorContext = useMemo(() => useError() as ErrorContextType, []);
  const { showError, showSuccess } = errorContext;
  
  // Supabase 設定 - 使用 useEffect 來避免循環依賴
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    key: ''
  });
  
  // 僅在 settingsState 變更時更新本地狀態
  useEffect(() => {
    if (settingsState.supabaseConfig) {
      setSupabaseConfig(prev => ({
        url: settingsState.supabaseConfig?.url || prev.url,
        key: settingsState.supabaseConfig?.key || prev.key
      }));
    }
  }, [settingsState.supabaseConfig]);
  
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // === Supabase 相關函數 ===
  
  const handleSupabaseSave = async (): Promise<void> => {
    try {
      // 更新應用狀態
      settingsActions.updateSupabaseConfig(supabaseConfig);
      showSuccess('Supabase 設定已保存！');
    } catch (error) {
      showError(error, '保存 Supabase 設定');
    }
  };

  const handleSupabaseTest = async (): Promise<void> => {
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
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setTestResult({ 
        success: false, 
        message: '連接錯誤: ' + errorMessage 
      });
    } finally {
      setTesting(false);
    }
  };

  const syncToSupabase = async (): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      showError('請先設定並測試 Supabase 連接', 'Supabase 同步');
      return;
    }

    setSyncing(true);
    try {
      console.log('開始同步到 Supabase...');
      const supabaseService = new SupabaseService(supabaseConfig.url, supabaseConfig.key);
      
      // 準備本地資料
      const localData = {
        orders: orders,
        tables: tables,
        menuItems: menuItems
      };

      console.log('本地資料:', localData);
      
      // 執行同步
      const result = await supabaseService.syncLocalData(localData);
      
      if (result.success) {
        const { results } = result.data!;
        const totalSuccess = results.orders.success + results.tables.success + results.menuItems.success;
        const totalFailed = results.orders.failed + results.tables.failed + results.menuItems.failed;
        
        let message = `同步完成！\n成功: ${totalSuccess} 項`;
        
        if (totalFailed > 0) {
          message += `\n失敗: ${totalFailed} 項`;
        }
        
        showSuccess(message);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('同步錯誤:', error);
      showError(error, '同步到 Supabase');
    } finally {
      setSyncing(false);
    }
  };

  const syncFromSupabase = async (): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      showError('請先設定並測試 Supabase 連接', 'Supabase 同步');
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
      const errorMessages: string[] = [];

      if (ordersResult.success) {
        orderActions.setOrders(ordersResult.data);
        successCount++;
      } else {
        errorMessages.push('訂單同步失敗: ' + ordersResult.error);
      }

      if (tablesResult.success) {
        tableActions.setTables(tablesResult.data);
        successCount++;
      } else {
        errorMessages.push('桌位同步失敗: ' + tablesResult.error);
      }

      if (menuResult.success) {
        menuActions.setMenuItems(menuResult.data);
        successCount++;
      } else {
        errorMessages.push('菜單同步失敗: ' + menuResult.error);
      }

      if (successCount > 0) {
        showSuccess(`成功同步 ${successCount} 項資料類型`);
      }
      
      if (errorMessages.length > 0) {
        showError('部分同步失敗:\n' + errorMessages.join('\n'), 'Supabase 同步');
      }
    } catch (error) {
      showError(error, '從 Supabase 同步');
    } finally {
      setSyncing(false);
    }
  };

  const handleSupabaseConfigChange = (field: keyof SupabaseConfig, value: string): void => {
    setSupabaseConfig(prev => ({
      ...prev,
      [field]: value
    }));
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project URL
            </label>
            <input
              type="url"
              value={supabaseConfig.url}
              onChange={(e) => handleSupabaseConfigChange('url', e.target.value)}
              placeholder="https://your-project-ref.supabase.co"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key (anon public)
            </label>
            <input
              type="password"
              value={supabaseConfig.key}
              onChange={(e) => handleSupabaseConfigChange('key', e.target.value)}
              placeholder="您的 anon public API key"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 連接測試結果 */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
            }`}>
              <p className={`text-sm ${
                testResult.success 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {testResult.message}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSupabaseTest}
              disabled={testing}
              className="btn-primary"
            >
              {testing ? '測試中...' : '測試連接'}
            </button>

            <button
              onClick={handleSupabaseSave}
              className="btn-secondary"
            >
              保存設定
            </button>

            <button
              onClick={syncToSupabase}
              disabled={syncing}
              className="btn-success"
            >
              {syncing ? '同步中...' : '上傳到雲端'}
            </button>

            <button
              onClick={syncFromSupabase}
              disabled={syncing}
              className="btn-info"
            >
              {syncing ? '同步中...' : '從雲端下載'}
            </button>
          </div>
        </div>
      </div>

      {/* 主題設定 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">🎨 外觀設定</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              主題模式
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => settingsActions.toggleTheme()}
                className={`px-4 py-2 rounded-lg border ${
                  settingsState.theme === 'light'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                淺色模式
              </button>
              <button
                onClick={() => settingsActions.toggleTheme()}
                className={`px-4 py-2 rounded-lg border ${
                  settingsState.theme === 'dark'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                深色模式
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;