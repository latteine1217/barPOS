import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { loadFromStorage, STORAGE_KEYS } from '@/services/storageService';
import { logger } from '@/services/loggerService';
import type { Order, ID } from '@/types';

// 緩存今天的日期字串，避免每次重新計算
let cachedTodayString: string | null = null;
let cacheTimestamp = 0;

const getTodayString = (): string => {
  const now = Date.now();
  // 每小時更新一次緩存，確保跨天時能正確更新
  if (!cachedTodayString || now - cacheTimestamp > 3600000) {
    cachedTodayString = new Date().toDateString();
    cacheTimestamp = now;
  }
  return cachedTodayString;
};

// Order Store 狀態接口
interface OrderState {
  orders: Order[];
  isLoaded: boolean;
}

// Order Store 行為接口
interface OrderActions {
  // 基本 CRUD 操作
  addOrder: (order: Order) => void;
  updateOrder: (id: ID, updates: Partial<Order>) => void;
  deleteOrder: (id: ID) => void;
  setOrders: (orders: Order[]) => void;
  
  // 載入狀態管理
  setLoaded: (loaded: boolean) => void;
  
  // 初始化
  initialize: () => Promise<void>;
  
  // 清除所有訂單
  clearAllOrders: () => void;
  
  // 獲取特定訂單
  getOrderById: (id: ID) => Order | undefined;
  
  // 獲取桌位的訂單
  getOrdersByTable: (tableNumber: number) => Order[];
  
  // 獲取特定狀態的訂單
  getOrdersByStatus: (status: Order['status']) => Order[];
}

// 組合 Store 類型
export type OrderStore = OrderState & OrderActions;

// 創建 Order Store
export const useOrderStore = create<OrderStore>()(
  persist(
    immer((set, get) => ({
      // 初始狀態
      orders: [],
      isLoaded: false,

      // 基本 CRUD 操作
      addOrder: (order: Order) => {
        set((state) => {
          const now = new Date().toISOString();
          const id = order.id || Date.now().toString();
          if (!order.tableNumber || !Array.isArray(order.items) || order.items.length === 0) {
            logger.orderLog.error(id, new Error('Invalid order data'), { tableNumber: order.tableNumber, itemsLength: order.items?.length });
            return;
          }
          const itemsValid = order.items.every((item) => 
            item && 
            typeof item.id !== 'undefined' && 
            typeof item.price === 'number' && 
            item.price >= 0 && 
            typeof item.quantity === 'number' && 
            item.quantity > 0
          );
          if (!itemsValid) {
            logger.orderLog.error(id, new Error('Invalid order items'), { items: order.items });
            return;
          }
          const computedTotal = order.items.reduce((sum: number, item) => 
            sum + (item.price * item.quantity), 0
          );
          const newOrder: Order = {
            ...order,
            id,
            createdAt: order.createdAt || now,
            updatedAt: now,
            status: order.status || 'pending',
            total: order.total ?? computedTotal,
          } as Order;
          state.orders.push(newOrder);
        });
      },

      updateOrder: (id: ID, updates: Partial<Order>) => {
        set((state) => {
          const order = state.orders.find(o => o.id === id);
          if (!order) {
            logger.orderLog.error(String(id), new Error('Order not found for update'), { orderId: id });
            return;
          }
          if (updates.items) {
            const valid = updates.items.every((item) => 
              item && 
              typeof item.id !== 'undefined' && 
              typeof item.price === 'number' && 
              item.price >= 0 && 
              typeof item.quantity === 'number' && 
              item.quantity > 0
            );
            if (!valid) return;
            order.items = updates.items;
            order.total = updates.total ?? updates.items.reduce((sum: number, item) => 
              sum + item.price * item.quantity, 0
            );
          }
          if (updates.status !== undefined) order.status = updates.status;
          if (updates.customers !== undefined) order.customers = updates.customers;
          if (updates.tableNumber !== undefined) order.tableNumber = updates.tableNumber;
          if (updates.notes !== undefined) order.notes = updates.notes;
          if (updates.total !== undefined && !updates.items) order.total = updates.total;
          if (updates.createdAt !== undefined) order.createdAt = updates.createdAt;
          order.updatedAt = new Date().toISOString();
        });
      },

      deleteOrder: (id: ID) => {
        set((state) => {
          const initialLength = state.orders.length;
          state.orders = state.orders.filter(order => order.id !== id);
          
          if (state.orders.length === initialLength) {
            logger.orderLog.error(String(id), new Error('Order not found for deletion'), { orderId: id });
          }
        });
      },

      setOrders: (orders: Order[]) => {
        set((state) => {
          if (!Array.isArray(orders)) {
            logger.storeLog.error('orderStore', new Error('Invalid orders data - must be array'), { orders });
            return;
          }
          state.orders = orders;
        });
      },

      // 載入狀態管理
      setLoaded: (loaded: boolean) => {
        set((state) => {
          state.isLoaded = loaded;
        });
      },

      // 初始化 - 從儲存載入資料
      initialize: async () => {
        logger.storeLog.init('orderStore', { component: 'orderStore' });
        try {
          const orders = await loadFromStorage(STORAGE_KEYS.ORDERS, []);
          set((state) => {
            state.orders = Array.isArray(orders) ? orders : [];
            state.isLoaded = true;
          });
          logger.info('Orders loaded successfully', { component: 'orderStore', count: orders?.length || 0 });
        } catch (error) {
          logger.storeLog.error('orderStore', error as Error, { action: 'initialize' });
          set((state) => {
            state.isLoaded = true;
          });
        }
      },

      // 清除所有訂單
      clearAllOrders: () => {
        set((state) => {
          state.orders = [];
        });
      },

      // 獲取特定訂單
      getOrderById: (id: ID) => {
        return get().orders.find(order => order.id === id);
      },

      // 獲取桌位的訂單
      getOrdersByTable: (tableNumber: number) => {
        return get().orders.filter(order => order.tableNumber === tableNumber);
      },

      // 獲取特定狀態的訂單
      getOrdersByStatus: (status: Order['status']) => {
        return get().orders.filter(order => order.status === status);
      }
    })),
    {
      name: 'order-store', // 儲存鍵名
      partialize: (state) => ({ 
        orders: state.orders 
      }), // 只持久化訂單資料，不持久化 isLoaded
    }
  )
);



// 緩存選擇器結果以避免無限循環
const ordersCacheSelector = (state: OrderStore) => state.orders;
const ordersLoadedSelector = (state: OrderStore) => state.isLoaded;

// 便利的選擇器 hooks - 使用緩存的選擇器
export const useOrders = () => useOrderStore(ordersCacheSelector);
export const useOrdersLoaded = () => useOrderStore(ordersLoadedSelector);
// 優化的選擇器：避免重新渲染問題
const orderActionsSelector = (state: OrderStore) => ({
  addOrder: state.addOrder,
  updateOrder: state.updateOrder,
  deleteOrder: state.deleteOrder,
  setOrders: state.setOrders,
  clearAllOrders: state.clearAllOrders,
});

export const useOrderActions = () => useOrderStore(orderActionsSelector);

// 特定功能的選擇器
export const useOrderById = (id: ID) => 
  useOrderStore((state) => state.getOrderById(id));

export const useOrdersByTable = (tableNumber: number) => 
  useOrderStore((state) => state.getOrdersByTable(tableNumber));

export const useOrdersByStatus = (status: Order['status']) => 
  useOrderStore((state) => state.getOrdersByStatus(status));

let lastOrders: Order[] | null = null;
let lastStatsResult: {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  todayOrders: number;
} | null = null;

const statsSelector = (state: OrderStore) => {
  const orders = state.orders;

  // 只有當 orders 陣列引用改變時才重新計算
  if (orders === lastOrders && lastStatsResult !== null) {
    return lastStatsResult;
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  
  // 使用緩存的今天日期字串
  const todayString = getTodayString();
  const todayOrders = orders.filter(o => 
    new Date(o.createdAt).toDateString() === todayString
  ).length;
  
  lastOrders = orders;
  lastStatsResult = {
    totalOrders,
    pendingOrders,
    completedOrders,
    todayOrders,
  };

  return lastStatsResult;
};

export const useOrderStats = () => useOrderStore(statsSelector);

// ✅ 精細化選擇器 - Phase 1 新增
export const useOrderSelectors = {
  // 僅訂閱訂單數量
  useOrderCount: () => useOrderStore(state => state.orders.length),
  
  // 僅訂閱待處理訂單
  usePendingOrders: () => useOrderStore(state => 
    state.orders.filter(order => order.status === 'pending')
  ),
  
  // 僅訂閱今日統計
  useTodayStats: () => useOrderStore(state => {
    const today = new Date().toDateString();
    const todayOrders = state.orders.filter(order => 
      new Date(order.createdAt).toDateString() === today
    );
    
    return {
      count: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      pending: todayOrders.filter(o => o.status === 'pending').length,
      completed: todayOrders.filter(o => o.status === 'completed').length,
    };
  }),
  
  // 僅訂閱特定桌位的訂單
  useOrdersByTable: (tableNumber: number) => useOrderStore(state =>
    state.orders.filter(order => order.tableNumber === tableNumber)
  ),
};
