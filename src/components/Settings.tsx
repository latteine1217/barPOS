import React, { useState } from 'react';
import { useSettings } from '../stores/settingsStore';
import { logger } from '@/services/loggerService';

import type { SupabaseConfig } from '@/types';
import SupabaseService from '../services/supabaseService';
// ❌ 暫時註釋掉渲染追蹤工具，這可能是導致無限循環的原因
// import { useRenderTracker, useStoreTracker } from '../utils/renderTracker';

interface TestResult {
  success: boolean;
  message: string;
}

const Settings: React.FC = () => {
  // ❌ 暫時移除渲染追蹤
  // useRenderTracker('Settings');
  
  // ✅ 必須在所有條件判斷之前調用所有 hooks
  const settingsData = useSettings();
  const orders = undefined as unknown as any;
  const tables = undefined as unknown as any;
  const menuItems = undefined as unknown as any;
  const orderActions = undefined as unknown as any;
  const tableActions = undefined as unknown as any;
  const menuActions = undefined as unknown as any;
  
  // ✅ 先取出可能為未定義的屬性，避免條件內呼叫 hooks
  const { theme, supabaseConfig, updateSupabaseConfig, setTheme } = settingsData || ({} as any);

  const [testing, setTesting] = useState<boolean>(() => false);
  const [testResult, setTestResult] = useState<TestResult | null>(() => null);
  const [syncing, setSyncing] = useState<boolean>(() => false);

  if (!settingsData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-semibold">設定載入中...</h2>
          <p className="text-yellow-600 mt-2">正在初始化設定數據...</p>
        </div>
      </div>
    );
  }


  // === Supabase 相關函數 ===
  
  const handleSupabaseSave = async (): Promise<void> => {
    try {
      if (!updateSupabaseConfig || !supabaseConfig) {
        logger.error('Missing required functions or config for Supabase save', { component: 'Settings', action: 'handleSupabaseSave' });
        return;
      }
      
      // 更新應用狀態
      updateSupabaseConfig(supabaseConfig);
      logger.info('Supabase configuration saved successfully', { component: 'Settings', action: 'handleSupabaseSave' });
    } catch (error) {
      logger.error('Failed to save Supabase configuration', { component: 'Settings', action: 'handleSupabaseSave' }, error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleSupabaseTest = async (): Promise<void> => {
    if (!supabaseConfig || !supabaseConfig.url || !supabaseConfig.key) {
      setTestResult(() => ({ success: false, message: '請填寫 Project URL 和 API Key' }));
      return;
    }

    setTesting(() => true);
    setTestResult(() => null);

    try {
      const supabaseService = new SupabaseService(supabaseConfig.url, supabaseConfig.key);
      const result = await supabaseService.testConnection();
      
      if (result.success) {
        setTestResult(() => ({ 
          success: true, 
          message: '連接成功！' + result.message
        }));
      } else {
        setTestResult(() => ({ 
          success: false, 
          message: '連接失敗: ' + result.error 
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setTestResult(() => ({ 
        success: false, 
        message: '連接錯誤: ' + errorMessage 
      }));
    } finally {
      setTesting(() => false);
    }
  };

  const syncToSupabase = async (): Promise<void> => {
    if (!supabaseConfig?.url || !supabaseConfig?.key) {
      logger.error('Please configure and test Supabase connection first', { component: 'Settings', action: 'syncToSupabase' });
      return;
    }

    setSyncing(true);
    try {
      logger.info('Starting sync to Supabase', { component: 'Settings', action: 'syncToSupabase' });
      const supabaseService = new SupabaseService(supabaseConfig.url, supabaseConfig.key);
      
      // 準備本地資料
      const localData = {
        orders: orders || [],
        tables: tables || [],
        menuItems: menuItems || []
      };

      logger.debug('Local data prepared for sync', { component: 'Settings', action: 'syncToSupabase', dataCount: { orders: localData.orders.length, tables: localData.tables.length, menuItems: localData.menuItems.length } });
      
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
        
        logger.info(message, { component: 'Settings', action: 'syncToSupabase', successCount: totalSuccess, failedCount: totalFailed });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Sync to Supabase failed', { component: 'Settings', action: 'syncToSupabase' }, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setSyncing(() => false);
    }
  };

  const syncFromSupabase = async (): Promise<void> => {
    if (!supabaseConfig?.url || !supabaseConfig?.key) {
      logger.error('Please configure and test Supabase connection first', { component: 'Settings', action: 'syncFromSupabase' });
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

      if (ordersResult.success && orderActions) {
        orderActions.setOrders(ordersResult.data ?? []);
        successCount++;
      } else if (!ordersResult.success) {
        errorMessages.push('訂單同步失敗: ' + ordersResult.error);
      }

      if (tablesResult.success && tableActions) {
        tableActions.setTables(tablesResult.data ?? []);
        successCount++;
      } else if (!tablesResult.success) {
        errorMessages.push('桌位同步失敗: ' + tablesResult.error);
      }

      if (menuResult.success && menuActions) {
        menuActions.setMenuItems(menuResult.data ?? []);
        successCount++;
      } else if (!menuResult.success) {
        errorMessages.push('菜單同步失敗: ' + menuResult.error);
      }

      if (successCount > 0) {
        logger.info('Successfully synced data types from Supabase', { component: 'Settings', action: 'syncFromSupabase', successCount });
      }
      
      if (errorMessages.length > 0) {
        logger.error('Partial sync failed from Supabase', { component: 'Settings', action: 'syncFromSupabase', errors: errorMessages });
      }
    } catch (error) {
      logger.error('Failed to sync from Supabase', { component: 'Settings', action: 'syncFromSupabase' }, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setSyncing(() => false);
    }
  };

  const handleSupabaseConfigChange = (field: keyof SupabaseConfig, value: string): void => {
    if (!updateSupabaseConfig || !supabaseConfig) {
      logger.error('Missing required functions or config for Supabase config change', { component: 'Settings', action: 'handleSupabaseConfigChange', field });
      return;
    }
    
    updateSupabaseConfig({
      ...supabaseConfig,
      [field]: value
    });
  };

  // ✅ 如果 supabaseConfig 未初始化，顯示載入狀態
  if (!supabaseConfig) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-blue-800 font-semibold">設定載入中...</h2>
          <p className="text-blue-600 mt-2">正在載入 Supabase 配置...</p>
        </div>
      </div>
    );
  }

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
              value={supabaseConfig.url || ''}
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
              value={supabaseConfig.key || ''}
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
                onClick={() => setTheme && setTheme('light')}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'light'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                淺色模式
              </button>
              <button
                onClick={() => setTheme && setTheme('dark')}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark'
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
