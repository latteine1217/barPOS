import { describe, expect, it, vi } from 'vitest';
import { hydrateStoresFromBackup } from '@/services/backupRestoreService';
import { PERSIST_STORE_KEYS, type ExportData } from '@/services/storageService';

describe('backupRestoreService', () => {
  it('應該從 persist 備份快照即時回填各 store', () => {
    const exportedData: ExportData = {
      platform: 'web',
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      data: {
        [PERSIST_STORE_KEYS.ORDERS]: {
          state: { orders: [{ id: 'o-1', tableNumber: 1, items: [], total: 0, status: 'pending', createdAt: '2026-02-23T00:00:00.000Z', updatedAt: '2026-02-23T00:00:00.000Z', customers: 1 }] },
          version: 0
        },
        [PERSIST_STORE_KEYS.TABLES]: {
          state: { tables: [{ id: 1, number: 1, name: '桌 1', status: 'available', customers: 0, maxCapacity: 4, position: { x: 10, y: 20 }, createdAt: '2026-02-23T00:00:00.000Z', updatedAt: '2026-02-23T00:00:00.000Z' }] },
          version: 0
        },
        [PERSIST_STORE_KEYS.MENU_ITEMS]: {
          state: { menuItems: [{ id: 'M01', name: 'Mocktail', price: 100, category: 'mocktail', available: true }] },
          version: 0
        },
        [PERSIST_STORE_KEYS.MEMBERS]: {
          state: { members: [{ id: 'm-1', name: 'Amy', cups: 3, createdAt: '2026-02-23T00:00:00.000Z', updatedAt: '2026-02-23T00:00:00.000Z' }] },
          version: 0
        },
        [PERSIST_STORE_KEYS.SETTINGS]: {
          state: {
            theme: 'dark',
            accent: 'amber',
            businessDayCutoffHour: 4,
            supabaseConfig: { url: 'https://demo.supabase.co', key: 'demo-key' }
          },
          version: 0
        }
      }
    };

    const setOrders = vi.fn();
    const setTables = vi.fn();
    const setMenuItems = vi.fn();
    const setMembers = vi.fn();
    const setTheme = vi.fn();
    const setAccent = vi.fn();
    const setBusinessDayCutoff = vi.fn();
    const updateSupabaseConfig = vi.fn();

    const result = hydrateStoresFromBackup(exportedData, {
      setOrders,
      setTables,
      setMenuItems,
      setMembers,
      setTheme,
      setAccent,
      setBusinessDayCutoff,
      updateSupabaseConfig
    });

    expect(setOrders).toHaveBeenCalledTimes(1);
    expect(setTables).toHaveBeenCalledTimes(1);
    expect(setMenuItems).toHaveBeenCalledTimes(1);
    expect(setMembers).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(setAccent).toHaveBeenCalledWith('amber');
    expect(setBusinessDayCutoff).toHaveBeenCalledWith(4);
    expect(updateSupabaseConfig).toHaveBeenCalledWith({
      url: 'https://demo.supabase.co',
      key: 'demo-key'
    });
    expect(result.applied).toContain('orders');
    expect(result.applied).toContain('tables');
    expect(result.applied).toContain('menuItems');
    expect(result.applied).toContain('members');
    expect(result.applied).toContain('theme');
  });
});
