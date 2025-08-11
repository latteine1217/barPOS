import { useCallback, useMemo, useRef } from 'react';
import { useOrderStore, useOrderActions, useOrderSelectors } from '@/stores/orderStore';
import { useTableStore } from '@/stores/tableStore';
import { useNetworkStatus } from '@/hooks/core/useNetworkStatus';
import { logger } from '@/services/loggerService';
import type { Order, OrderItem, ID, OrderStatus } from '@/types';

// Hook 選項接口
export interface UseOrderManagementOptions {
  // 是否啟用樂觀更新
  optimisticUpdates?: boolean;
  // 是否自動同步到遠端
  autoSync?: boolean;
  // 錯誤回調
  onError?: (error: Error, context: string) => void;
  // 成功回調
  onSuccess?: (action: string, data: any) => void;
}

// 創建訂單數據接口
export interface CreateOrderData {
  tableNumber: number;
  customers: number;
  items: OrderItem[];
  notes?: string;
  status?: OrderStatus;
}

// 訂單操作結果接口
export interface OrderOperationResult {
  success: boolean;
  data?: Order;
  error?: string;
}

// 複合操作結果接口
export interface CompositeOperationResult {
  success: boolean;
  order?: Order;
  error?: string;
  rollbackFn?: () => Promise<void>;
}

/**
 * 統一的訂單管理 Hook
 * 提供完整的訂單 CRUD 操作和複合業務邏輯
 */
export const useOrderManagement = (options: UseOrderManagementOptions = {}) => {
  const {
    optimisticUpdates = true,
    autoSync = true,
    onError,
    onSuccess
  } = options;

  // Store 狀態訂閱
  const orders = useOrderStore(state => state.orders);
  const isLoaded = useOrderStore(state => state.isLoaded);
  
  // Store 操作方法（穩定引用）
  const orderActions = useOrderActions();
  const updateTable = useTableStore(state => state.updateTable);
  
  // 網路狀態
  const { isOnline } = useNetworkStatus();
  
  // 操作歷史引用
  const operationHistory = useRef<Array<{
    id: string;
    action: string;
    timestamp: Date;
    data: any;
  }>>([]);

  // 錯誤處理輔助函數
  const handleError = useCallback((error: Error, context: string) => {
    logger.error(`OrderManagement: ${context}`, { context }, error);
    onError?.(error, context);
  }, [onError]);

  // 成功處理輔助函數
  const handleSuccess = useCallback((action: string, data: any) => {
    logger.info(`OrderManagement: ${action} successful`, { action, orderId: data?.id });
    onSuccess?.(action, data);
  }, [onSuccess]);

  // 記錄操作歷史
  const recordOperation = useCallback((action: string, data: any) => {
    operationHistory.current.push({
      id: `op-${Date.now()}`,
      action,
      timestamp: new Date(),
      data
    });
    
    // 保持最近 100 條記錄
    if (operationHistory.current.length > 100) {
      operationHistory.current = operationHistory.current.slice(-100);
    }
  }, []);

  // 樂觀更新輔助函數
  const withOptimisticUpdate = useCallback(async <T>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    rollback: () => void,
    context: string
  ): Promise<T> => {
    try {
      if (optimisticUpdates) {
        optimisticUpdate();
      }
      
      const result = await operation();
      
      if (!optimisticUpdates) {
        optimisticUpdate();
      }
      
      return result;
    } catch (error) {
      if (optimisticUpdates) {
        rollback();
      }
      handleError(error as Error, context);
      throw error;
    }
  }, [optimisticUpdates, handleError]);

  // ============ 基本 CRUD 操作 ============

  /**
   * 創建新訂單
   */
  const createOrder = useCallback(async (
    orderData: CreateOrderData
  ): Promise<OrderOperationResult> => {
    try {
      const orderId = `order-${Date.now()}`;
      const now = new Date().toISOString();
      
      const newOrder: Order = {
        id: orderId,
        tableNumber: orderData.tableNumber,
        customers: orderData.customers,
        items: orderData.items,
        subtotal: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        total: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: orderData.status || 'pending',
        notes: orderData.notes || '',
        createdAt: now,
        updatedAt: now
      };

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            // TODO: 實際 API 調用
            return { success: true, data: newOrder };
          }
          return { success: true, data: newOrder };
        },
        () => orderActions.addOrder(newOrder),
        () => orderActions.deleteOrder(orderId),
        'createOrder'
      );

      recordOperation('create', newOrder);
      handleSuccess('createOrder', newOrder);

      return { success: true, data: newOrder };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }, [orderActions, isOnline, autoSync, withOptimisticUpdate, recordOperation, handleSuccess]);

  /**
   * 更新訂單
   */
  const updateOrder = useCallback(async (
    orderId: ID,
    updates: Partial<Order>
  ): Promise<OrderOperationResult> => {
    try {
      const existingOrder = orders.find(o => o.id === orderId);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const updatedOrder = {
        ...existingOrder,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            // TODO: 實際 API 調用
            return { success: true, data: updatedOrder };
          }
          return { success: true, data: updatedOrder };
        },
        () => orderActions.updateOrder(orderId, updates),
        () => orderActions.updateOrder(orderId, existingOrder),
        'updateOrder'
      );

      recordOperation('update', { orderId, updates });
      handleSuccess('updateOrder', updatedOrder);

      return { success: true, data: updatedOrder };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update order'
      };
    }
  }, [orders, orderActions, isOnline, autoSync, withOptimisticUpdate, recordOperation, handleSuccess]);

  /**
   * 刪除訂單
   */
  const deleteOrder = useCallback(async (
    orderId: ID
  ): Promise<OrderOperationResult> => {
    try {
      const existingOrder = orders.find(o => o.id === orderId);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            // TODO: 實際 API 調用
            return { success: true };
          }
          return { success: true };
        },
        () => orderActions.deleteOrder(orderId),
        () => orderActions.addOrder(existingOrder),
        'deleteOrder'
      );

      recordOperation('delete', { orderId });
      handleSuccess('deleteOrder', { orderId });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete order'
      };
    }
  }, [orders, orderActions, isOnline, autoSync, withOptimisticUpdate, recordOperation, handleSuccess]);

  // ============ 複合業務操作 ============

  /**
   * 創建訂單並佔用桌位 - 複合操作
   */
  const createOrderWithTable = useCallback(async (
    orderData: CreateOrderData
  ): Promise<CompositeOperationResult> => {
    let rollbackActions: Array<() => Promise<void>> = [];
    
    try {
      // 1. 檢查桌位是否可用
      const table = useTableStore.getState().getTableByNumber(orderData.tableNumber);
      if (!table) {
        throw new Error(`Table ${orderData.tableNumber} not found`);
      }
      if (table.status !== 'available') {
        throw new Error(`Table ${orderData.tableNumber} is not available`);
      }

      // 2. 創建訂單
      const orderResult = await createOrder(orderData);
      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const order = orderResult.data;
      rollbackActions.push(async () => {
        await deleteOrder(order.id);
      });

      // 3. 佔用桌位
      updateTable(table.id, {
        status: 'occupied',
        customers: orderData.customers,
        orderId: order.id
      });

      rollbackActions.push(async () => {
        updateTable(table.id, {
          status: 'available',
          customers: 0
        });
        // 手動刪除 orderId
        const tableState = useTableStore.getState();
        const currentTable = tableState.tables.find(t => t.id === table.id);
        if (currentTable && 'orderId' in currentTable) {
          delete (currentTable as any).orderId;
        }
      });

      recordOperation('createOrderWithTable', { order, table });
      handleSuccess('createOrderWithTable', { order, table });

      return { 
        success: true, 
        order,
        rollbackFn: async () => {
          for (const action of rollbackActions.reverse()) {
            await action();
          }
        }
      };
    } catch (error) {
      // 執行已完成操作的回滾
      for (const action of rollbackActions.reverse()) {
        try {
          await action();
        } catch (rollbackError) {
          logger.error('Rollback failed', { context: 'createOrderWithTable' }, rollbackError as Error);
        }
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create order with table'
      };
    }
  }, [createOrder, deleteOrder, updateTable, recordOperation, handleSuccess]);

  /**
   * 完成訂單並釋放桌位 - 複合操作
   */
  const completeOrderWithTable = useCallback(async (
    orderId: ID
  ): Promise<CompositeOperationResult> => {
    let rollbackActions: Array<() => Promise<void>> = [];
    
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const originalStatus = order.status;
      
      // 1. 更新訂單狀態為已完成
      const updateData: Partial<Order> = { 
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      const updateResult = await updateOrder(orderId, updateData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update order status');
      }

      rollbackActions.push(async () => {
        await updateOrder(orderId, { status: originalStatus });
      });

      // 2. 釋放桌位
      const table = useTableStore.getState().getTableByNumber(order.tableNumber);
      if (table && table.orderId === orderId) {
        const originalTableStatus = table.status;
        const originalCustomers = table.customers;
        
        updateTable(table.id, {
          status: 'available',
          customers: 0
        });
        // 手動刪除 orderId
        const tableState = useTableStore.getState();
        const currentTable = tableState.tables.find(t => t.id === table.id);
        if (currentTable && 'orderId' in currentTable) {
          delete (currentTable as any).orderId;
        }

        rollbackActions.push(async () => {
          updateTable(table.id, {
            status: originalTableStatus,
            customers: originalCustomers,
            orderId: orderId as string
          });
        });
      }

      recordOperation('completeOrderWithTable', { orderId });
      handleSuccess('completeOrderWithTable', { orderId });

      return { 
        success: true, 
        order: updateResult.data!,
        rollbackFn: async () => {
          for (const action of rollbackActions.reverse()) {
            await action();
          }
        }
      };
    } catch (error) {
      // 執行回滾
      for (const action of rollbackActions.reverse()) {
        try {
          await action();
        } catch (rollbackError) {
          logger.error('Rollback failed', { context: 'completeOrderWithTable' }, rollbackError as Error);
        }
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete order with table'
      };
    }
  }, [orders, updateOrder, updateTable, recordOperation, handleSuccess]);

  // ============ 查詢方法 ============

  // 精細化狀態訂閱
  const orderCount = useOrderSelectors.useOrderCount();
  const pendingOrders = useOrderSelectors.usePendingOrders();
  const todayStats = useOrderSelectors.useTodayStats();

  // 查詢方法（使用 useMemo 避免重新創建）
  const queries = useMemo(() => ({
    // 根據狀態獲取訂單
    getOrdersByStatus: (status: OrderStatus) => 
      orders.filter(order => order.status === status),
    
    // 根據桌位獲取訂單
    getOrdersByTable: (tableNumber: number) => 
      orders.filter(order => order.tableNumber === tableNumber),
    
    // 根據時間範圍獲取訂單
    getOrdersByDateRange: (startDate: Date, endDate: Date) =>
      orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      }),
    
    // 搜索訂單
    searchOrders: (query: string) => {
      const lowerQuery = query.toLowerCase();
      return orders.filter(order => 
        order.id.toLowerCase().includes(lowerQuery) ||
        order.notes?.toLowerCase().includes(lowerQuery) ||
        order.items.some(item => 
          item.name?.toLowerCase().includes(lowerQuery)
        )
      );
    },

    // 獲取活躍訂單（非完成狀態）
    getActiveOrders: () =>
      orders.filter(order => !['completed', 'cancelled', 'paid'].includes(order.status)),
    
    // 獲取操作歷史
    getOperationHistory: () => [...operationHistory.current]
  }), [orders]);

  // ============ 返回值 ============

  return {
    // 狀態
    orders,
    orderCount,
    pendingOrders,
    todayStats,
    isLoaded,
    isOnline,
    
    // 基本操作
    createOrder,
    updateOrder,
    deleteOrder,
    
    // 複合操作
    createOrderWithTable,
    completeOrderWithTable,
    
    // 查詢方法
    queries,
    
    // 工具方法
    recordOperation,
    clearOperationHistory: () => {
      operationHistory.current = [];
    }
  };
};

export default useOrderManagement;