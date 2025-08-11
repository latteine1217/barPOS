import { useCallback, useMemo, useRef } from 'react';
import { useTableStore, useTableSelectors } from '@/stores/tableStore';
import { useNetworkStatus } from '@/hooks/core/useNetworkStatus';
import { logger } from '@/services/loggerService';
import type { Table, TableStatus, ID, Position } from '@/types';

// Hook 選項接口
export interface UseTableOperationsOptions {
  // 是否啟用樂觀更新
  optimisticUpdates?: boolean;
  // 是否自動同步到遠端
  autoSync?: boolean;
  // 錯誤回調
  onError?: (error: Error, context: string) => void;
  // 成功回調
  onSuccess?: (action: string, data: any) => void;
}

// 桌位操作結果接口
export interface TableOperationResult {
  success: boolean;
  data?: Table;
  error?: string;
}

// 批量操作結果接口
export interface BatchTableOperationResult {
  success: boolean;
  results: Array<{
    tableId: number;
    success: boolean;
    error?: string;
  }>;
  totalProcessed: number;
  totalSuccessful: number;
}

// 複合操作結果接口
export interface TableCompositeOperationResult {
  success: boolean;
  table?: Table;
  error?: string;
  rollbackFn?: () => Promise<void>;
}

// 創建新桌位數據接口
export interface CreateTableData {
  number: number;
  name: string;
  maxCapacity: number;
  position: Position;
  type?: string;
  shape?: string;
  size?: string;
}

/**
 * 統一的桌位管理 Hook
 * 提供完整的桌位 CRUD 操作和複合業務邏輯
 */
export const useTableOperations = (options: UseTableOperationsOptions = {}) => {
  const {
    optimisticUpdates = true,
    autoSync = true,
    onError,
    onSuccess
  } = options;

  // Store 狀態訂閱
  const tables = useTableStore(state => state.tables);
  const isLoaded = useTableStore(state => state.isLoaded);
  
  // Store 操作方法（使用單獨選擇器，避免每次創建新物件）
  const updateTable = useTableStore(state => state.updateTable);
  const addTable = useTableStore(state => state.addTable);
  const deleteTable = useTableStore(state => state.deleteTable);
  const updateTableLayout = useTableStore(state => state.updateTableLayout);
  const resetAllTables = useTableStore(state => state.resetAllTables);
  
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
    logger.error(`TableOperations: ${context}`, { context }, error);
    onError?.(error, context);
  }, [onError]);

  // 成功處理輔助函數
  const handleSuccess = useCallback((action: string, data: any) => {
    logger.info(`TableOperations: ${action} successful`, { action, tableId: data?.id });
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
   * 創建新桌位
   */
  const createTable = useCallback(async (
    tableData: CreateTableData
  ): Promise<TableOperationResult> => {
    try {
      const newTable: Table = {
        id: Date.now(),
        number: tableData.number,
        name: tableData.name,
        status: 'available',
        customers: 0,
        maxCapacity: tableData.maxCapacity,
        position: tableData.position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 檢查桌號是否已存在
      const existingTable = tables.find(t => t.number === tableData.number);
      if (existingTable) {
        throw new Error(`Table number ${tableData.number} already exists`);
      }

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            // TODO: 實際 API 調用
            return { success: true, data: newTable };
          }
          return { success: true, data: newTable };
        },
        () => addTable(newTable),
        () => deleteTable(newTable.id),
        'createTable'
      );

      recordOperation('create', newTable);
      handleSuccess('createTable', newTable);

      return { success: true, data: newTable };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create table'
      };
    }
  }, [tables, addTable, deleteTable, isOnline, autoSync, withOptimisticUpdate, recordOperation, handleSuccess]);

  /**
   * 更新桌位資訊
   */
  const updateTableInfo = useCallback(async (
    tableId: number,
    updates: Partial<Table>
  ): Promise<TableOperationResult> => {
    try {
      const existingTable = tables.find(t => t.id === tableId);
      if (!existingTable) {
        throw new Error('Table not found');
      }

      const updatedTable = {
        ...existingTable,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            // TODO: 實際 API 調用
            return { success: true, data: updatedTable };
          }
          return { success: true, data: updatedTable };
        },
        () => updateTable(tableId, updates),
        () => updateTable(tableId, existingTable),
        'updateTable'
      );

      recordOperation('update', { tableId, updates });
      handleSuccess('updateTable', updatedTable);

      return { success: true, data: updatedTable };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update table'
      };
    }
  }, [tables, updateTable, isOnline, autoSync, withOptimisticUpdate, recordOperation, handleSuccess]);

  /**
   * 刪除桌位
   */
  const removeTable = useCallback(async (
    tableId: number
  ): Promise<TableOperationResult> => {
    try {
      const existingTable = tables.find(t => t.id === tableId);
      if (!existingTable) {
        throw new Error('Table not found');
      }

      // 檢查桌位是否正在使用中
      if (existingTable.status === 'occupied') {
        throw new Error('Cannot delete table that is currently occupied');
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
        () => deleteTable(tableId),
        () => addTable(existingTable),
        'deleteTable'
      );

      recordOperation('delete', { tableId });
      handleSuccess('deleteTable', { tableId });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete table'
      };
    }
  }, [tables, deleteTable, addTable, isOnline, autoSync, withOptimisticUpdate, recordOperation, handleSuccess]);

  // ============ 桌位狀態管理 ============

  /**
   * 佔用桌位
   */
  const occupyTable = useCallback(async (
    tableId: number,
    customers: number,
    orderId?: ID
  ): Promise<TableOperationResult> => {
    try {
      const table = tables.find(t => t.id === tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      if (table.status !== 'available') {
        throw new Error(`Table ${table.number} is not available`);
      }

      if (customers > table.maxCapacity) {
        throw new Error(`Number of customers (${customers}) exceeds table capacity (${table.maxCapacity})`);
      }

      const updates: Partial<Table> = {
        status: 'occupied',
        customers,
        ...(orderId && { orderId })
      };

      return await updateTableInfo(tableId, updates);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to occupy table'
      };
    }
  }, [tables, updateTableInfo]);

  /**
   * 釋放桌位
   */
  const releaseTableById = useCallback(async (
    tableId: number
  ): Promise<TableOperationResult> => {
    try {
      const table = tables.find(t => t.id === tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      const updates: Partial<Table> = {
        status: 'available',
        customers: 0
      };

      // 移除 orderId（如果存在）
      const updateResult = await updateTableInfo(tableId, updates);
      
      if (updateResult.success && table.orderId) {
        // 手動移除 orderId
        const tableState = useTableStore.getState();
        const currentTable = tableState.tables.find(t => t.id === tableId);
        if (currentTable && 'orderId' in currentTable) {
          delete (currentTable as any).orderId;
        }
      }

      return updateResult;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to release table'
      };
    }
  }, [tables, updateTableInfo]);

  /**
   * 設置桌位為清潔中
   */
  const setTableCleaning = useCallback(async (
    tableId: number
  ): Promise<TableOperationResult> => {
    return await updateTableInfo(tableId, { status: 'cleaning' });
  }, [updateTableInfo]);

  /**
   * 預訂桌位
   */
  const reserveTable = useCallback(async (
    tableId: number,
    customers: number
  ): Promise<TableOperationResult> => {
    try {
      const table = tables.find(t => t.id === tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      if (table.status !== 'available') {
        throw new Error(`Table ${table.number} is not available for reservation`);
      }

      return await updateTableInfo(tableId, {
        status: 'reserved',
        customers
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reserve table'
      };
    }
  }, [tables, updateTableInfo]);

  // ============ 複合業務操作 ============

  /**
   * 釋放桌位並完成相關訂單 - 複合操作
   */
  const releaseTableWithOrder = useCallback(async (
    orderId: ID
  ): Promise<TableCompositeOperationResult> => {
    let rollbackActions: Array<() => Promise<void>> = [];
    
    try {
      // 1. 找到相關的桌位
      const table = tables.find(t => t.orderId === orderId);
      if (!table) {
        throw new Error(`No table found with orderId: ${orderId}`);
      }

      const originalStatus = table.status;
      const originalCustomers = table.customers;

      // 2. 釋放桌位
      const releaseResult = await releaseTableById(table.id);
      if (!releaseResult.success) {
        throw new Error(releaseResult.error || 'Failed to release table');
      }

      rollbackActions.push(async () => {
        await updateTableInfo(table.id, {
          status: originalStatus,
          customers: originalCustomers,
          orderId: orderId
        });
      });

      recordOperation('releaseTableWithOrder', { orderId, tableId: table.id });
      handleSuccess('releaseTableWithOrder', { orderId, table });

      return { 
        success: true, 
        table: releaseResult.data!,
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
          logger.error('Rollback failed', { context: 'releaseTableWithOrder' }, rollbackError as Error);
        }
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to release table with order'
      };
    }
  }, [tables, releaseTableById, updateTableInfo, recordOperation, handleSuccess]);

  /**
   * 批量更新桌位狀態
   */
  const batchUpdateTableStatus = useCallback(async (
    tableIds: number[],
    status: TableStatus
  ): Promise<BatchTableOperationResult> => {
    const results: Array<{
      tableId: number;
      success: boolean;
      error?: string;
    }> = [];

    let totalSuccessful = 0;

    for (const tableId of tableIds) {
      try {
        const result = await updateTableInfo(tableId, { status });
        results.push({
          tableId,
          success: result.success,
          ...(result.error && { error: result.error })
        });

        if (result.success) {
          totalSuccessful++;
        }
      } catch (error) {
        results.push({
          tableId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    recordOperation('batchUpdateStatus', { tableIds, status, results });
    handleSuccess('batchUpdateTableStatus', { totalSuccessful, totalProcessed: tableIds.length });

    return {
      success: totalSuccessful > 0,
      results,
      totalProcessed: tableIds.length,
      totalSuccessful
    };
  }, [updateTableInfo, recordOperation, handleSuccess]);

  // ============ 查詢方法 ============

  // 精細化狀態訂閱
  const tableStats = useTableSelectors.useTableStats();
  const availableTables = useTableSelectors.useAvailableTables();

  // 查詢方法（使用 useMemo 避免重新創建）
  const queries = useMemo(() => ({
    // 根據狀態獲取桌位
    getTablesByStatus: (status: TableStatus) => 
      tables.filter(table => table.status === status),
    
    // 根據容量範圍獲取桌位
    getTablesByCapacity: (minCapacity: number, maxCapacity?: number) =>
      tables.filter(table => 
        table.maxCapacity >= minCapacity && 
        (!maxCapacity || table.maxCapacity <= maxCapacity)
      ),
    
    // 搜索桌位
    searchTables: (query: string) => {
      const lowerQuery = query.toLowerCase();
      return tables.filter(table => 
        table.name.toLowerCase().includes(lowerQuery) ||
        table.number.toString().includes(lowerQuery)
      );
    },

    // 獲取可用桌位（按容量排序）
    getAvailableTablesByCapacity: () =>
      tables
        .filter(table => table.status === 'available')
        .sort((a, b) => a.maxCapacity - b.maxCapacity),
    
    // 獲取最適合的桌位
    getBestTableForCustomers: (customers: number) => {
      const suitable = tables.filter(table => 
        table.status === 'available' && 
        table.maxCapacity >= customers
      );
      
      if (suitable.length === 0) return null;
      
      // 找到最接近但大於等於客人數的桌位
      return suitable.reduce((best, current) => 
        current.maxCapacity < best.maxCapacity ? current : best
      );
    },

    // 獲取桌位使用情況
    getTableUtilization: () => {
      const occupied = tables.filter(t => t.status === 'occupied').length;
      const total = tables.length;
      return {
        occupied,
        available: total - occupied,
        total,
        utilizationRate: total > 0 ? Math.round((occupied / total) * 100) : 0
      };
    },
    
    // 獲取操作歷史
    getOperationHistory: () => [...operationHistory.current]
  }), [tables]);

  // ============ 返回值 ============

  return {
    // 狀態
    tables,
    tableStats,
    availableTables,
    isLoaded,
    isOnline,
    
    // 基本操作
    createTable,
    updateTableInfo,
    removeTable,
    
    // 狀態管理
    occupyTable,
    releaseTableById,
    setTableCleaning,
    reserveTable,
    
    // 複合操作
    releaseTableWithOrder,
    batchUpdateTableStatus,
    
    // 佈局操作
    updateLayout: updateTableLayout,
    resetAll: resetAllTables,
    
    // 查詢方法
    queries,
    
    // 工具方法
    recordOperation,
    clearOperationHistory: () => {
      operationHistory.current = [];
    }
  };
};

export default useTableOperations;