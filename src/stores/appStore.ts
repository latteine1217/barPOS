import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useOrderStore, type OrderStore } from './orderStore';
import { useTableStore, type TableStore } from './tableStore';
import { useMenuStore, type MenuStore } from './menuStore';
import type { Order, ID } from '@/types';

// App Store 狀態接口 - 主要用於跨 store 的協調邏輯
interface AppState {
  isInitialized: boolean;
  isOffline: boolean;
  lastSyncTime?: string;
}

// App Store 行為接口 - 組合不同 store 的操作
interface AppActions {
  // 初始化
  initialize: () => Promise<void>;
  setInitialized: (initialized: boolean) => void;
  
  // 離線狀態
  setOffline: (offline: boolean) => void;
  
  // 跨 store 操作
  addOrderWithTableUpdate: (order: Order) => void;
  deleteOrderWithTableRelease: (orderId: ID) => void;
  clearAllData: () => Promise<void>;
  
  // 同步相關
  updateLastSyncTime: () => void;
}

// 組合 Store 類型
export type AppStore = AppState & AppActions;

// 創建 App Store
export const useAppStore = create<AppStore>()(
  immer((set) => ({
    // 初始狀態
    isInitialized: false,
    isOffline: false,
    lastSyncTime: undefined,

    // 初始化
    initialize: async () => {
      try {
        // 初始化所有子 stores
        await Promise.all([
          useOrderStore.getState().initialize(),
          useTableStore.getState().initialize(),
          useMenuStore.getState().initialize(),
        ]);
        
        set((state) => {
          state.isInitialized = true;
          state.lastSyncTime = new Date().toISOString();
        });
      } catch (error) {
        console.error('Failed to initialize app:', error);
        set((state) => {
          state.isInitialized = true; // 即使失敗也設為已初始化，避免無限載入
        });
      }
    },

    setInitialized: (initialized: boolean) => {
      set((state) => {
        state.isInitialized = initialized;
      });
    },

    // 離線狀態
    setOffline: (offline: boolean) => {
      set((state) => {
        state.isOffline = offline;
      });
    },

    // 跨 store 操作 - 添加訂單並更新桌位
    addOrderWithTableUpdate: (order: Order) => {
      // 添加訂單
      useOrderStore.getState().addOrder(order);
      
      // 更新相關桌位
      if (order.tableNumber) {
        const table = useTableStore.getState().getTableByNumber(order.tableNumber);
        if (table) {
          useTableStore.getState().updateTable(table.id, {
            status: 'occupied',
            orderId: order.id,
            customers: order.customers || 0
          });
        }
      }
    },

    // 跨 store 操作 - 刪除訂單並釋放桌位
    deleteOrderWithTableRelease: (orderId: ID) => {
      // 刪除訂單
      useOrderStore.getState().deleteOrder(orderId);
      
      // 釋放桌位
      useTableStore.getState().releaseTable(orderId);
    },

    // 清除所有資料
    clearAllData: async () => {
      try {
        // 清除訂單
        useOrderStore.getState().clearAllOrders();
        
        // 保留預設菜單項目，清除自定義項目
        const defaultItemIds = new Set([
          '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
          '111', '112', '113', '114', '201', '202', '203', '301', '302', '303'
        ]);
        
        const menuItems = useMenuStore.getState().menuItems;
        const defaultItems = menuItems.filter(item => defaultItemIds.has(item.id));
        useMenuStore.getState().setMenuItems(defaultItems);
        
        // 重置所有桌位狀態但保留桌位結構
        useTableStore.getState().resetAllTables();
        
        console.log('All data cleared successfully');
      } catch (error) {
        console.error('Failed to clear data:', error);
        throw error;
      }
    },

    // 同步相關
    updateLastSyncTime: () => {
      set((state) => {
        state.lastSyncTime = new Date().toISOString();
      });
    },
  }))
);

// 組合選擇器 - 優化版本，避免不必要的重新渲染
export const useAppState = () => {
  // 分離關鍵狀態獲取，減少重新渲染
  const { isInitialized, isOffline, lastSyncTime } = useAppStore((state) => ({
    isInitialized: state.isInitialized,
    isOffline: state.isOffline,
    lastSyncTime: state.lastSyncTime,
  }));
  
  // 分別獲取載入狀態，避免組合依賴
  const orderLoaded = useOrderStore((state) => state.isLoaded);
  const tableLoaded = useTableStore((state) => state.isLoaded);
  const menuLoaded = useMenuStore((state) => state.isLoaded);
  
  // 計算總載入狀態
  const isLoaded = orderLoaded && tableLoaded && menuLoaded;

  return {
    isInitialized,
    isOffline,
    lastSyncTime,
    isLoaded,
  };
};

// 優化的選擇器：避免重新渲染問題
const appActionsSelector = (state: AppStore) => ({
  initialize: state.initialize,
  setOffline: state.setOffline,
  addOrderWithTableUpdate: state.addOrderWithTableUpdate,
  deleteOrderWithTableRelease: state.deleteOrderWithTableRelease,
  clearAllData: state.clearAllData,
});

const orderActionsForAppSelector = (state: OrderStore) => ({
  addOrder: state.addOrder,
  updateOrder: state.updateOrder,
  deleteOrder: state.deleteOrder,
  setOrders: state.setOrders,
});

const tableActionsForAppSelector = (state: TableStore) => ({
  updateTable: state.updateTable,
  addTable: state.addTable,
  deleteTable: state.deleteTable,
  updateTableLayout: state.updateTableLayout,
  setTables: state.setTables,
});

const menuActionsForAppSelector = (state: MenuStore) => ({
  addMenuItem: state.addMenuItem,
  updateMenuItem: state.updateMenuItem,
  deleteMenuItem: state.deleteMenuItem,
  setMenuItems: state.setMenuItems,
});

// 組合操作 - 提供統一的操作接口
export const useAppActions = () => {
  const appActions = useAppStore(appActionsSelector);
  const orderActions = useOrderStore(orderActionsForAppSelector);
  const tableActions = useTableStore(tableActionsForAppSelector);
  const menuActions = useMenuStore(menuActionsForAppSelector);

  return {
    // 組合操作
    ...appActions,
    
    // 個別 store 操作
    ...orderActions,
    ...tableActions,
    ...menuActions,
  };
};