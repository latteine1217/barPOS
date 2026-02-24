import { beforeEach, describe, expect, it } from 'vitest';
import type { ExportData } from '@/services/storageService';
import { importAllData, PERSIST_STORE_KEYS, STORAGE_KEYS } from '@/services/storageService';
import { hydrateStoresFromBackup } from '@/services/backupRestoreService';
import { useOrderStore } from '@/stores/orderStore';
import { useTableStore } from '@/stores/tableStore';
import { useMenuStore } from '@/stores/menuStore';
import { useMembersStore } from '@/stores/membersStore';
import { useSettingsStore } from '@/stores/settingsStore';

describe('backup/restore integration', () => {
  beforeEach(() => {
    window.localStorage.clear();

    useOrderStore.setState({ orders: [], isLoaded: true });
    useMembersStore.setState({ members: [], isLoaded: true });
    useMenuStore.setState({ menuItems: [], isLoaded: true });
    useTableStore.setState({ tables: [], isLoaded: true });
    useSettingsStore.setState({
      theme: 'light',
      accent: 'blue',
      businessDayCutoffHour: 3,
      supabaseConfig: { url: '', key: '' }
    });
  });

  it('importAllData + hydrateStoresFromBackup 應即時更新各 store', async () => {
    const backup: ExportData = {
      platform: 'web',
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      data: {
        [PERSIST_STORE_KEYS.ORDERS]: {
          state: {
            orders: [{
              id: 'restore-order',
              tableNumber: 8,
              items: [],
              subtotal: 180,
              total: 180,
              status: 'pending',
              customers: 2,
              createdAt: '2026-02-23T10:00:00.000Z',
              updatedAt: '2026-02-23T10:00:00.000Z'
            }]
          },
          version: 0
        },
        [PERSIST_STORE_KEYS.TABLES]: {
          state: {
            tables: [{
              id: 8,
              number: 8,
              name: '桌 8',
              status: 'occupied',
              customers: 2,
              maxCapacity: 4,
              position: { x: 10, y: 10 }
            }]
          },
          version: 0
        },
        [PERSIST_STORE_KEYS.MENU_ITEMS]: {
          state: { menuItems: [{ id: 'M08', name: 'Restore Drink', price: 180, category: 'classic', available: true }] },
          version: 0
        },
        [PERSIST_STORE_KEYS.MEMBERS]: {
          state: { members: [{ id: 'member-restore', name: 'Restored', cups: 5, createdAt: '2026-02-23T10:00:00.000Z', updatedAt: '2026-02-23T10:00:00.000Z' }] },
          version: 0
        },
        [PERSIST_STORE_KEYS.SETTINGS]: {
          state: {
            theme: 'dark',
            accent: 'emerald',
            businessDayCutoffHour: 5,
            supabaseConfig: {
              url: 'https://restore.supabase.co',
              key: 'restore-key'
            }
          },
          version: 0
        }
      }
    };

    await importAllData(backup);
    hydrateStoresFromBackup(backup, {
      setOrders: useOrderStore.getState().setOrders,
      setTables: useTableStore.getState().setTables,
      setMenuItems: useMenuStore.getState().setMenuItems,
      setMembers: useMembersStore.getState().setMembers,
      setTheme: useSettingsStore.getState().setTheme,
      setAccent: useSettingsStore.getState().setAccent,
      setBusinessDayCutoff: useSettingsStore.getState().setBusinessDayCutoff,
      updateSupabaseConfig: useSettingsStore.getState().updateSupabaseConfig
    });

    expect(useOrderStore.getState().orders[0]?.id).toBe('restore-order');
    expect(useTableStore.getState().tables[0]?.number).toBe(8);
    expect(useMenuStore.getState().menuItems[0]?.id).toBe('M08');
    expect(useMembersStore.getState().members[0]?.id).toBe('member-restore');
    expect(useSettingsStore.getState().theme).toBe('dark');
    expect(useSettingsStore.getState().businessDayCutoffHour).toBe(5);
    expect(window.localStorage.getItem(PERSIST_STORE_KEYS.ORDERS)).toContain('restore-order');
  });

  it('hydrateStoresFromBackup 在無 persist 時應支援 legacy keys', () => {
    const legacyBackup: ExportData = {
      platform: 'web',
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      data: {
        [STORAGE_KEYS.ORDERS]: [{
          id: 'legacy-order',
          tableNumber: 3,
          items: [],
          subtotal: 120,
          total: 120,
          status: 'completed',
          customers: 1,
          createdAt: '2026-02-23T11:00:00.000Z',
          updatedAt: '2026-02-23T11:00:00.000Z'
        }],
        [STORAGE_KEYS.TABLES]: [{
          id: 3,
          number: 3,
          name: '桌 3',
          status: 'available',
          customers: 0,
          maxCapacity: 4,
          position: { x: 30, y: 40 }
        }],
        [STORAGE_KEYS.MENU_ITEMS]: [{ id: 'legacy-menu', name: 'Legacy', category: 'classic', price: 120, available: true }],
        [STORAGE_KEYS.MEMBERS]: [{ id: 'legacy-member', name: 'Legacy User', cups: 2, createdAt: '2026-02-23T11:00:00.000Z', updatedAt: '2026-02-23T11:00:00.000Z' }]
      }
    };

    hydrateStoresFromBackup(legacyBackup, {
      setOrders: useOrderStore.getState().setOrders,
      setTables: useTableStore.getState().setTables,
      setMenuItems: useMenuStore.getState().setMenuItems,
      setMembers: useMembersStore.getState().setMembers
    });

    expect(useOrderStore.getState().orders[0]?.id).toBe('legacy-order');
    expect(useTableStore.getState().tables[0]?.id).toBe(3);
    expect(useMenuStore.getState().menuItems[0]?.id).toBe('legacy-menu');
    expect(useMembersStore.getState().members[0]?.id).toBe('legacy-member');
  });
});
