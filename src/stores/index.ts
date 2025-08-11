// Zustand Stores 統一導出
// 這個檔案提供所有 stores 的統一入口點

// 個別 stores
export { 
  useOrderStore,
  useOrders,
  useOrdersLoaded,
  useOrderActions,
  useOrderById,
  useOrdersByTable,
  useOrdersByStatus,
  useOrderStats
} from './orderStore';

export { 
  useTableStore,
  useTables,
  useTablesLoaded,
  useTableActions,
  useTableById,
  useTableByNumber,
  useTablesByStatus,
  useAvailableTables,
  useOccupiedTables,
  useTableStats
} from './tableStore';

export { 
  useMenuStore,
  useMenuItems,
  useMenuLoaded,
  useMenuActions,
  useMenuItemById,
  useMenuItemsByCategory,
  useMenuItemsBySpirit,
  useAvailableMenuItems,
  useMenuSearch,
  useMenuStats
} from './menuStore';

export { 
  useSettingsStore,
  useSettings,
  useStatsStore,
  useStats
} from './settingsStore';

// 組合 store
export { 
  useAppStore,
  useAppState,
  useAppActions
} from './appStore';

// 類型導出
export type { OrderStore } from './orderStore';
export type { TableStore } from './tableStore';
export type { MenuStore } from './menuStore';
export type { AppStore } from './appStore';
export type { SettingsStore } from './settingsStore';
export type { StatsStore } from './settingsStore';

// 導入 stores 用於便利函數
import { useAppStore } from './appStore';

// 初始化所有 stores 的便利函數
export const initializeAllStores = async () => {
  const { initialize } = useAppStore.getState();
  await initialize();
};

// 重置所有資料的便利函數
export const clearAllStoreData = async () => {
  const { clearAllData } = useAppStore.getState();
  await clearAllData();
};