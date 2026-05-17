import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useOrderStore } from './orderStore';
import { useTableStore } from './tableStore';
import { useMenuStore } from './menuStore';
import { useSettingsStore } from './settingsStore';
import { useMembersStore } from './membersStore';
import { logger } from '@/services/loggerService';
import type { Order, ID } from '@/types';

// App Store 狀態接口 - 主要用於跨 store 的協調邏輯
interface AppState {
  isInitialized: boolean;
  isInitializing: boolean; // ✅ 新增：防止重複初始化
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
  
  // 跨 store 操作（回傳布林表示整個複合操作是否成功）
  addOrderWithTableUpdate: (order: Order) => boolean;
  deleteOrderWithTableRelease: (orderId: ID) => void;
  clearAllData: () => Promise<void>;
  
  // 同步相關
  updateLastSyncTime: () => void;
}

// 組合 Store 類型
export type AppStore = AppState & AppActions;

// 創建 App Store
export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    // 初始狀態
    isInitialized: false,
    isInitializing: false, // ✅ 新增初始值
    isOffline: false,

    // 初始化 - 防止重複執行
    initialize: async () => {
      const { isInitialized, isInitializing } = get();
      
      // ✅ 防止重複初始化
      if (isInitialized || isInitializing) {
        logger.info('Already initialized or initializing, skipping', { component: 'appStore' });
        return;
      }
      
      logger.storeLog.init('appStore', { component: 'appStore' });
      set((state) => {
        state.isInitializing = true;
      });
      
      try {
        const results = await Promise.allSettled([
          useOrderStore.getState().initialize(),
          useTableStore.getState().initialize(),
          useMenuStore.getState().initialize(),
          useSettingsStore.getState().initialize(),
          // 先前漏掉：首屏 useMembers() 會拿空陣列直到使用者切換到 Members
          // 分頁才觸發 hydrate；杯數短時間顯示為 0 → 誤判可加杯。
          useMembersStore.getState().initialize(),
        ]);
        const hasFailure = results.some(r => r.status === 'rejected');
        set((state) => {
          state.isInitialized = !hasFailure;
          state.isInitializing = false;
          if (!hasFailure) {
            state.lastSyncTime = new Date().toISOString();
          }
        });
        if (hasFailure) {
          logger.warn('Some child stores failed to initialize', { component: 'appStore', results });
        } else {
          logger.info('All child stores initialized successfully', { component: 'appStore' });
        }
      } catch (error) {
        logger.storeLog.error('appStore', error as Error, { action: 'initialize' });
        set((state) => {
          state.isInitialized = false;
          state.isInitializing = false;
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

    // 跨 store 操作 - 添加訂單並更新桌位（原子化：失敗時 rollback）
    addOrderWithTableUpdate: (order: Order): boolean => {
      const created = useOrderStore.getState().addOrder(order);
      if (!created) {
        // 訂單驗證失敗，整個複合操作中止；不佔桌
        logger.warn('addOrderWithTableUpdate aborted: order validation failed', {
          component: 'appStore',
          tableNumber: order.tableNumber,
        });
        return false;
      }

      // 訂單沒指定桌號 — 訂單建立成功但不需佔桌（外帶/吧台等情境）
      if (!created.tableNumber) return true;

      const tableNumber = Number(created.tableNumber);
      const table = useTableStore.getState().getTableByNumber(tableNumber);
      if (!table) {
        // 桌位不存在：rollback 已建立的訂單，避免孤兒訂單
        useOrderStore.getState().deleteOrder(created.id);
        logger.error('addOrderWithTableUpdate rollback: table not found', {
          component: 'appStore',
          orderId: created.id,
          tableNumber,
        });
        return false;
      }

      try {
        useTableStore.getState().updateTable(table.id, {
          status: 'occupied',
          orderId: created.id,
          customers: created.customers || 0,
        });
        return true;
      } catch (err) {
        // 桌位更新失敗：rollback 訂單以維持兩 store 一致
        useOrderStore.getState().deleteOrder(created.id);
        logger.error(
          'addOrderWithTableUpdate rollback: table update threw',
          { component: 'appStore', orderId: created.id, tableId: table.id },
          err instanceof Error ? err : new Error(String(err))
        );
        return false;
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
        // 先清掉 localStorage 中的 persist snapshot，避免後續 setX([])
        // 觸發的 persist 寫入又把空集合落地（race 結果一樣，但順序乾淨）。
        // 涵蓋四個 Zustand persist key + 早期 storageService 直接寫的 settings。
        const persistKeys = [
          'order-store',
          'table-store',
          'menu-store',              // ← 先前寫成 'menu-items'，與 menuStore persist name 不符，重置後菜單復活
          'members-store',           // ← 先前漏掉，會造成「重置全部」後會員復活
          'restaurant-pos-settings',
        ];
        for (const key of persistKeys) {
          try { localStorage.removeItem(key); } catch (e) {
            logger.warn(`clear localStorage ${key} failed`, { component: 'appStore', error: e });
          }
        }

        // 接著重置記憶體 state（persist 仍會寫一次，但寫的是預設值）
        useOrderStore.getState().clearAllOrders();
        const defaultItemIds = new Set([
          '101','102','103','104','105','106','107','108','109','110',
          '111','112','113','114','201','202','203','301','302','303'
        ]);
        const menuItems = useMenuStore.getState().menuItems;
        const defaultItems = menuItems.filter(item => defaultItemIds.has(item.id));
        useMenuStore.getState().setMenuItems(defaultItems);
        useTableStore.getState().resetAllTables();
        useMembersStore.getState().setMembers([]);

        logger.info('All data cleared successfully', { component: 'appStore' });
      } catch (error) {
        logger.error('Failed to clear data', { component: 'appStore' }, error as Error);
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
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);
  const isLoaded = orderLoaded && tableLoaded && menuLoaded && settingsLoaded;

  return {
    isInitialized,
    isOffline,
    lastSyncTime,
    isLoaded,
  };
};

// 組合操作 - 提供統一的操作接口
// Actions 恆定不變，不需要訂閱 Store 更新
export const useAppActions = () => {
  const appState = useAppStore.getState();
  const orderState = useOrderStore.getState();
  const tableState = useTableStore.getState();
  const menuState = useMenuStore.getState();

  return {
    // App Actions
    initialize: appState.initialize,
    setOffline: appState.setOffline,
    addOrderWithTableUpdate: appState.addOrderWithTableUpdate,
    deleteOrderWithTableRelease: appState.deleteOrderWithTableRelease,
    clearAllData: appState.clearAllData,
    
    // Order Actions
    addOrder: orderState.addOrder,
    updateOrder: orderState.updateOrder,
    deleteOrder: orderState.deleteOrder,
    setOrders: orderState.setOrders,
    
    // Table Actions
    updateTable: tableState.updateTable,
    addTable: tableState.addTable,
    deleteTable: tableState.deleteTable,
    updateTableLayout: tableState.updateTableLayout,
    setTables: tableState.setTables,
    
    // Menu Actions
    addMenuItem: menuState.addMenuItem,
    updateMenuItem: menuState.updateMenuItem,
    deleteMenuItem: menuState.deleteMenuItem,
    setMenuItems: menuState.setMenuItems,
  };
};
