import React, { useRef, useState } from 'react';
import { useSettings } from '../stores/settingsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOrders, useTables, useMembers, useSetMembers, useOrderActions, useTableActions, useMenuActions } from '@/stores';
import { useMenuItems } from '@/stores/menuStore';
import { exportAllData, importAllData, type ExportData } from '@/services/storageService';
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
  // 從各 store 讀取最新資料
  const orders = useOrders();
  const tables = useTables();
  const menuItems = useMenuItems();
  const members = useMembers();
  const setMembers = useSetMembers();
  // 獲取 store actions 用於資料同步
  const orderActions = useOrderActions();
  const tableActions = useTableActions();
  const menuActions = useMenuActions();
  
  // ✅ 先取出可能為未定義的屬性，避免條件內呼叫 hooks
  const { theme, accent, supabaseConfig, updateSupabaseConfig, setTheme, setAccent } = settingsData || ({} as any);
  const businessDayCutoffHour = useSettingsStore((s) => s.businessDayCutoffHour ?? 3);
  const setBusinessDayCutoff = useSettingsStore((s) => s.setBusinessDayCutoff);

  const [testing, setTesting] = useState<boolean>(() => false);
  const [testResult, setTestResult] = useState<TestResult | null>(() => null);
  const [syncing, setSyncing] = useState<boolean>(() => false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        menuItems: menuItems || [],
        members: members || []
      };

      logger.debug('Local data prepared for sync', { component: 'Settings', action: 'syncToSupabase', dataCount: { orders: localData.orders.length, tables: localData.tables.length, menuItems: localData.menuItems.length } });
      
      // 執行同步
      const result = await supabaseService.syncLocalData(localData);
      
      if (result.success) {
        const { results } = result.data!;
        const totalSuccess = results.orders.success + results.tables.success + results.menuItems.success + results.members.success;
        const totalFailed = results.orders.failed + results.tables.failed + results.menuItems.failed + results.members.failed;
        
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
      const [ordersResult, tablesResult, menuResult, membersResult] = await Promise.all([
        supabaseService.fetchOrders(),
        supabaseService.fetchTables(),
        supabaseService.fetchMenuItems(),
        supabaseService.fetchMembers()
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

      // 會員資料直接寫入 members store
      if (membersResult.success && membersResult.data) {
        setMembers(membersResult.data);
        successCount++;
      } else if (!membersResult.success) {
        errorMessages.push('會員同步失敗: ' + membersResult.error);
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
            <div className="flex flex-wrap gap-3">
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
              <button
                onClick={() => setTheme && setTheme('auto')}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'auto'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                跟隨系統
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              強調色 (Accent)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {([
                { key: 'blue', color: '#2563eb', name: '藍色' },
                { key: 'violet', color: '#7c3aed', name: '紫色' },
                { key: 'emerald', color: '#059669', name: '翠綠' },
                { key: 'amber', color: '#d97706', name: '琥珀' },
                { key: 'rose', color: '#e11d48', name: '玫瑰' },
                { key: 'cyan', color: '#0891b2', name: '青色' },
              ] as const).map(({ key, color, name }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccent && setAccent(key as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    accent === key ? 'border-[var(--color-accent)] bg-black/5 dark:bg-white/10' : 'border-[var(--glass-elevated-border)]'
                  }`}
                >
                  <span className="inline-block w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm text-[var(--text-primary)]">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 營運設定 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">🏪 營運設定</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              營業結算截止時間（小時）
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">跨日統計用，0–23，例如 3 表示以凌晨 3:00 作為分界。</p>
            <input
              type="number"
              min={0}
              max={23}
              value={businessDayCutoffHour}
              onChange={(e) => setBusinessDayCutoff?.(Number(e.target.value) || 0)}
              className="w-40 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
        </div>
      </div>

      {/* 資料備份 / 還原 */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">💾 資料備份 / 還原</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">匯出/匯入本地資料（訂單、桌位、菜單、佈局、設定）。桌面版將使用系統檔案對話框；瀏覽器將下載/讀取 JSON 檔。</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              try {
                setBackupMsg(null);
                const data = await exportAllData();
                // Electron：用 native dialog 儲存
                if (window.electronAPI?.exportToFile) {
                  const res = await window.electronAPI.exportToFile(data, `pos-backup-${new Date().toISOString().slice(0,10)}.json`);
                  setBackupMsg(res.success ? '備份已匯出' : (res.canceled ? '已取消' : `匯出失敗: ${res.error}`));
                  return;
                }
                // Web：下載 JSON 檔
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pos-backup-${new Date().toISOString().slice(0,10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                setBackupMsg('備份已下載');
              } catch (e) {
                setBackupMsg(`匯出失敗: ${(e as Error).message}`);
              }
            }}
          >
            匯出備份
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              setBackupMsg(null);
              // Electron：用 native dialog 開啟
              if (window.electronAPI?.importFromFile) {
                const res = await window.electronAPI.importFromFile();
                if (res.success && res.data) {
                  const ok = await importAllData(res.data as ExportData);
                  setBackupMsg(ok ? '備份已還原' : '還原失敗');
                } else {
                  setBackupMsg(res.canceled ? '已取消' : `開啟失敗: ${res.error}`);
                }
                return;
              }
              // Web：觸發隱藏 input
              fileInputRef.current?.click();
            }}
          >
            匯入備份
          </button>
          {backupMsg && <span className="text-sm text-[var(--text-secondary)]">{backupMsg}</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text) as ExportData;
                const ok = await importAllData(data);
                setBackupMsg(ok ? '備份已還原' : '還原失敗');
              } catch (err) {
                setBackupMsg(`讀取失敗: ${(err as Error).message}`);
              } finally {
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>
      {/* Footer */}
      <div className="pt-2">
        <div className="border-t border-[var(--glass-elevated-border)] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-secondary)]">調酒酒吧管理系統 - Cocktail Bar POS</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/latteine1217/cocktail-bar-pos-system"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text-primary)] underline-offset-2 hover:underline"
            >
              GitHub 專案連結
            </a>
            <a
              href="mailto:felix.tc.tw@gmail.com"
              className="hover:text-[var(--text-primary)] underline-offset-2 hover:underline"
            >
              作者聯絡：felix.tc.tw@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
