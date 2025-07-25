import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { loadFromStorage, STORAGE_KEYS } from '../services/storageService';
import type { Order, ID } from '@/types';

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
          // 生成唯一 ID
          const newOrder: Order = {
            ...order,
            id: order.id || Date.now().toString(),
            createdAt: order.createdAt || new Date().toISOString(),
            status: order.status || 'pending'
          };
          
          // 驗證必要欄位
          if (!newOrder.tableNumber || !newOrder.items || !Array.isArray(newOrder.items)) {
            console.error('Invalid order data:', newOrder);
            return;
          }
          
          state.orders.push(newOrder);
        });
      },

      updateOrder: (id: ID, updates: Partial<Order>) => {
        set((state) => {
          const orderIndex = state.orders.findIndex(order => order.id === id);
          if (orderIndex !== -1) {
            Object.assign(state.orders[orderIndex], updates);
          } else {
            console.error('Order not found for update:', id);
          }
        });
      },

      deleteOrder: (id: ID) => {
        set((state) => {
          const initialLength = state.orders.length;
          state.orders = state.orders.filter(order => order.id !== id);
          
          if (state.orders.length === initialLength) {
            console.error('Order not found for deletion:', id);
          }
        });
      },

      setOrders: (orders: Order[]) => {
        set((state) => {
          if (!Array.isArray(orders)) {
            console.error('Invalid orders data - must be array:', orders);
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
        try {
          const orders = await loadFromStorage(STORAGE_KEYS.ORDERS, []);
          set((state) => {
            state.orders = orders;
            state.isLoaded = true;
          });
        } catch (error) {
          console.error('Failed to load orders:', error);
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

// 暫時禁用自動儲存避免循環更新問題
// TODO: 在 v3.2 重新實作更安全的自動儲存機制
/*
// 自動儲存到儲存服務 - 使用深度比較避免無限循環
let previousOrdersLength = 0;
let previousOrdersString = '';

useOrderStore.subscribe((state) => {
  const currentOrders = state.orders;
  const isLoaded = state.isLoaded;
  
  // 只有在載入完成且訂單真的有變化時才儲存（使用深度比較）
  if (isLoaded && currentOrders.length > 0) {
    const currentOrdersString = JSON.stringify(currentOrders);
    
    // 使用長度和字串內容雙重檢查避免不必要的儲存
    if (currentOrders.length !== previousOrdersLength || 
        currentOrdersString !== previousOrdersString) {
      
      try {
        saveToStorage(STORAGE_KEYS.ORDERS, currentOrders);
        previousOrdersLength = currentOrders.length;
        previousOrdersString = currentOrdersString;
      } catch (error) {
        console.error('Failed to save orders to storage:', error);
      }
    }
  }
});
*/

// 便利的選擇器 hooks
export const useOrders = () => useOrderStore((state) => state.orders);
export const useOrdersLoaded = () => useOrderStore((state) => state.isLoaded);
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

// 統計選擇器
export const useOrderStats = () => 
  useOrderStore((state) => ({
    totalOrders: state.orders.length,
    pendingOrders: state.orders.filter(o => o.status === 'pending').length,
    completedOrders: state.orders.filter(o => o.status === 'completed').length,
    todayOrders: state.orders.filter(o => 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length,
  }));