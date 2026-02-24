import type { MenuItem, MemberRecord, Order, Table } from '@/types';
import { PERSIST_STORE_KEYS, STORAGE_KEYS, type ExportData } from './storageService';

type ThemeMode = 'light' | 'dark' | 'auto';
type Accent = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';

export interface BackupHydrationActions {
  setOrders: (orders: Order[]) => void;
  setTables: (tables: Table[]) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setMembers: (members: MemberRecord[]) => void;
  setTheme?: (theme: ThemeMode) => void;
  setAccent?: (accent: Accent) => void;
  setBusinessDayCutoff?: (hour: number) => void;
  updateSupabaseConfig?: (config: { url?: string; key?: string }) => void;
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const readPersistState = (
  data: Record<string, unknown>,
  persistKey: string
): Record<string, unknown> | null => {
  const raw = data[persistKey];
  if (!isObject(raw)) return null;
  const state = raw.state;
  if (!isObject(state)) return null;
  return state;
};

const readArrayPayload = <T>(
  data: Record<string, unknown>,
  directKey: string,
  persistKey: string,
  persistField: string
): T[] | null => {
  const direct = data[directKey];
  if (Array.isArray(direct)) {
    return direct as T[];
  }
  const persistState = readPersistState(data, persistKey);
  if (!persistState) return null;
  const persistedValue = persistState[persistField];
  if (!Array.isArray(persistedValue)) return null;
  return persistedValue as T[];
};

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'auto';

const isAccent = (value: unknown): value is Accent =>
  value === 'blue' ||
  value === 'violet' ||
  value === 'emerald' ||
  value === 'amber' ||
  value === 'rose' ||
  value === 'cyan';

/**
 * What: 將匯入備份資料直接套用到各 store actions。
 * Why: 匯入 localStorage 後若不立即寫回 store，畫面可能維持舊狀態直到重新載入。
 */
export const hydrateStoresFromBackup = (
  exportedData: ExportData,
  actions: BackupHydrationActions
): { applied: string[] } => {
  const applied: string[] = [];
  const data = isObject(exportedData?.data) ? exportedData.data : {};

  const orders = readArrayPayload<Order>(
    data,
    STORAGE_KEYS.ORDERS,
    PERSIST_STORE_KEYS.ORDERS,
    'orders'
  );
  if (orders) {
    actions.setOrders(orders);
    applied.push('orders');
  }

  const tables = readArrayPayload<Table>(
    data,
    STORAGE_KEYS.TABLES,
    PERSIST_STORE_KEYS.TABLES,
    'tables'
  );
  if (tables) {
    actions.setTables(tables);
    applied.push('tables');
  }

  const menuItems = readArrayPayload<MenuItem>(
    data,
    STORAGE_KEYS.MENU_ITEMS,
    PERSIST_STORE_KEYS.MENU_ITEMS,
    'menuItems'
  );
  if (menuItems) {
    actions.setMenuItems(menuItems);
    applied.push('menuItems');
  }

  const members = readArrayPayload<MemberRecord>(
    data,
    STORAGE_KEYS.MEMBERS,
    PERSIST_STORE_KEYS.MEMBERS,
    'members'
  );
  if (members) {
    actions.setMembers(members);
    applied.push('members');
  }

  const settingsState = readPersistState(data, PERSIST_STORE_KEYS.SETTINGS);
  if (settingsState) {
    const theme = settingsState.theme;
    if (actions.setTheme && isThemeMode(theme)) {
      actions.setTheme(theme);
      applied.push('theme');
    }

    const accent = settingsState.accent;
    if (actions.setAccent && isAccent(accent)) {
      actions.setAccent(accent);
      applied.push('accent');
    }

    const cutoff = settingsState.businessDayCutoffHour;
    if (actions.setBusinessDayCutoff && typeof cutoff === 'number' && Number.isFinite(cutoff)) {
      actions.setBusinessDayCutoff(cutoff);
      applied.push('businessDayCutoffHour');
    }

    if (actions.updateSupabaseConfig && isObject(settingsState.supabaseConfig)) {
      const supabaseConfig = settingsState.supabaseConfig;
      const nextConfig: { url?: string; key?: string } = {};
      if (typeof supabaseConfig.url === 'string') {
        nextConfig.url = supabaseConfig.url;
      }
      if (typeof supabaseConfig.key === 'string') {
        nextConfig.key = supabaseConfig.key;
      }
      if (Object.keys(nextConfig).length > 0) {
        actions.updateSupabaseConfig(nextConfig);
        applied.push('supabaseConfig');
      }
    }
  }

  return { applied };
};

export default hydrateStoresFromBackup;
