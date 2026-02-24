import React, { useRef, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOrders, useTables, useMembers, useSetMembers, useOrderActions, useTableActions, useMenuActions } from '@/stores';
import { useMenuItems } from '@/stores/menuStore';
import { exportAllData, importAllData, type ExportData } from '@/services/storageService';
import { hydrateStoresFromBackup } from '@/services/backupRestoreService';
import { logger } from '@/services/loggerService';

import type { SupabaseConfig } from '@/types';
import SupabaseService from '../services/supabaseService';

interface TestResult {
  success: boolean;
  message: string;
}

const ACCENT_OPTIONS = [
  { key: 'blue', color: '#2563eb', name: '藍色' },
  { key: 'violet', color: '#7c3aed', name: '紫色' },
  { key: 'emerald', color: '#059669', name: '翠綠' },
  { key: 'amber', color: '#d97706', name: '琥珀' },
  { key: 'rose', color: '#e11d48', name: '玫瑰' },
  { key: 'cyan', color: '#0891b2', name: '青色' }
] as const;

const Settings: React.FC = () => {
  // ✅ 統一使用 useSettingsStore 選擇器，避免全量重新渲染
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);
  const supabaseConfig = useSettingsStore((s) => s.supabaseConfig);
  const businessDayCutoffHour = useSettingsStore((s) => s.businessDayCutoffHour ?? 3);
  
  // Actions
  const updateSupabaseConfig = useSettingsStore((s) => s.updateSupabaseConfig);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const setBusinessDayCutoff = useSettingsStore((s) => s.setBusinessDayCutoff);

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
  
  const [testing, setTesting] = useState<boolean>(() => false);
  const [testResult, setTestResult] = useState<TestResult | null>(() => null);
  const [syncing, setSyncing] = useState<boolean>(() => false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">設定中心</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                管理雲端同步、外觀與營運參數。所有操作即時生效並保留原有流程。
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              {syncing ? '雲端同步中...' : '系統就緒'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <section className="xl:col-span-7 space-y-6">
            {/* Supabase 資料庫設定 */}
            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Supabase 雲端資料庫</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                維持跨裝置資料一致性，並支援本地資料上傳與雲端回填。
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">即時多裝置同步</div>
                <div className="rounded-xl border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">關聯資料庫查詢</div>
                <div className="rounded-xl border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">離線優先資料流</div>
                <div className="rounded-xl border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">可追蹤同步狀態</div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseConfig.url || ''}
                    onChange={(e) => handleSupabaseConfigChange('url', e.target.value)}
                    placeholder="https://your-project-ref.supabase.co"
                    className="w-full rounded-xl border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    API Key (anon public)
                  </label>
                  <input
                    type="password"
                    value={supabaseConfig.key || ''}
                    onChange={(e) => handleSupabaseConfigChange('key', e.target.value)}
                    placeholder="輸入 anon public API key"
                    className="w-full rounded-xl border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                {testResult && (
                  <div className={`rounded-xl border px-4 py-3 ${
                    testResult.success
                      ? 'border-green-300/50 bg-green-500/10 text-green-700 dark:text-green-300'
                      : 'border-red-300/50 bg-red-500/10 text-red-700 dark:text-red-300'
                  }`}>
                    <p className="text-sm font-medium">{testResult.message}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={handleSupabaseTest}
                    disabled={testing}
                    className="btn btn-primary justify-center"
                  >
                    {testing ? '測試中...' : '測試連接'}
                  </button>

                  <button
                    onClick={handleSupabaseSave}
                    className="btn btn-secondary justify-center"
                  >
                    保存設定
                  </button>

                  <button
                    onClick={syncToSupabase}
                    disabled={syncing}
                    className="btn btn-success justify-center"
                  >
                    {syncing ? '同步中...' : '上傳到雲端'}
                  </button>

                  <button
                    onClick={syncFromSupabase}
                    disabled={syncing}
                    className="btn btn-info justify-center"
                  >
                    {syncing ? '同步中...' : '從雲端下載'}
                  </button>
                </div>
              </div>
            </div>

            {/* 資料備份 / 還原 */}
            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">資料備份 / 還原</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                匯出或匯入本地資料（訂單、桌位、菜單、佈局、設定），支援桌面檔案對話框與瀏覽器 JSON 檔案。
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
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
                        if (ok) {
                          hydrateStoresFromBackup(res.data as ExportData, {
                            setOrders: orderActions.setOrders,
                            setTables: tableActions.setTables,
                            setMenuItems: menuActions.setMenuItems,
                            setMembers,
                            setTheme,
                            setAccent,
                            setBusinessDayCutoff,
                            updateSupabaseConfig
                          });
                        }
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

                {backupMsg && (
                  <span className="inline-flex items-center rounded-lg border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                    {backupMsg}
                  </span>
                )}
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
                      if (ok) {
                        hydrateStoresFromBackup(data, {
                          setOrders: orderActions.setOrders,
                          setTables: tableActions.setTables,
                          setMenuItems: menuActions.setMenuItems,
                          setMembers,
                          setTheme,
                          setAccent,
                          setBusinessDayCutoff,
                          updateSupabaseConfig
                        });
                      }
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
          </section>

          <section className="xl:col-span-5 space-y-6">
            {/* 主題設定 */}
            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">外觀設定</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">切換主題與強調色，不影響功能流程。</p>

              <div className="mt-5 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    主題模式
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme?.('light')}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      淺色模式
                    </button>
                    <button
                      onClick={() => setTheme?.('dark')}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      深色模式
                    </button>
                    <button
                      onClick={() => setTheme?.('auto')}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        theme === 'auto'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      跟隨系統
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    強調色 (Accent)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACCENT_OPTIONS.map(({ key, color, name }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAccent?.(key)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                          accent === key
                            ? 'border-[var(--color-accent)] bg-black/5 dark:bg-white/10'
                            : 'border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)]'
                        }`}
                      >
                        <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm text-[var(--text-primary)]">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 營運設定 */}
            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">營運設定</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                設定跨日統計分界時間（business day cutoff）。
              </p>
              <div className="mt-5">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  營業結算截止時間（小時）
                </label>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  範圍 0–23，例如 3 代表凌晨 3:00 才切換到新的一天。
                </p>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={businessDayCutoffHour}
                  onChange={(e) => setBusinessDayCutoff?.(Number(e.target.value) || 0)}
                  className="w-full max-w-[160px] rounded-xl border border-[var(--glass-elevated-border)] bg-[var(--glass-elevated)] px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">barPOS - Cocktail Bar Management System</span>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/latteine1217/barPOS"
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
        </footer>
      </div>
    </div>
  );
};

export default Settings;
