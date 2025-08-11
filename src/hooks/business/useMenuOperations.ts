import { useCallback, useMemo, useRef } from 'react';
import { useMenuStore } from '@/stores/menuStore';
import { useNetworkStatus } from '@/hooks/core/useNetworkStatus';
import { logger } from '@/services/loggerService';
import type { MenuItem, MenuCategory, BaseSpirit, ID } from '@/types';

// Hook 選項接口
export interface UseMenuOperationsOptions {
  // 是否啟用樂觀更新
  optimisticUpdates?: boolean;
  // 是否自動同步到遠端
  autoSync?: boolean;
  // 錯誤回調
  onError?: (error: Error, context: string) => void;
  // 成功回調
  onSuccess?: (action: string, data: any) => void;
}

// 創建菜單項目數據接口
export interface CreateMenuItemData {
  name: string;
  price: number;
  category: MenuCategory;
  baseSpirit: BaseSpirit;
  description?: string;
  available?: boolean;
}

// 菜單操作結果接口
export interface MenuOperationResult {
  success: boolean;
  data?: MenuItem;
  error?: string;
}

// 批量操作結果接口
export interface BatchMenuOperationResult {
  success: boolean;
  results: Array<{
    itemId: ID;
    success: boolean;
    error?: string;
  }>;
  totalProcessed: number;
  totalSuccessful: number;
}

// 菜單搜索選項接口
export interface MenuSearchOptions {
  category?: MenuCategory;
  baseSpirit?: BaseSpirit;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  query?: string;
}

// 菜單統計接口
export interface MenuStatistics {
  total: number;
  available: number;
  unavailable: number;
  byCategory: Record<MenuCategory, number>;
  byBaseSpirit: Record<BaseSpirit, number>;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
}

/**
 * 統一的菜單管理 Hook
 * 提供完整的菜單 CRUD 操作、搜索過濾和庫存管理
 */
export const useMenuOperations = (options: UseMenuOperationsOptions = {}) => {
  const {
    optimisticUpdates = true,
    autoSync = true,
    onError,
    onSuccess
  } = options;

  // Store 狀態訂閱
  const menuItems = useMenuStore(state => state.menuItems);
  const isLoaded = useMenuStore(state => state.isLoaded);
  
  // ✅ Store 操作方法 - 使用單獨選擇器避免每次創建新物件
  const addMenuItem = useMenuStore(state => state.addMenuItem);
  const updateMenuItem = useMenuStore(state => state.updateMenuItem);
  const deleteMenuItem = useMenuStore(state => state.deleteMenuItem);
  const toggleMenuItemAvailability = useMenuStore(state => state.toggleMenuItemAvailability);
  const resetToDefaultMenu = useMenuStore(state => state.resetToDefaultMenu);
  
  // 網路狀態
  const { isOnline, addToOfflineQueue } = useNetworkStatus();
  
  // 操作歷史引用
  const operationHistory = useRef<Array<{
    id: string;
    action: string;
    timestamp: Date;
    data: any;
  }>>([]);

  // 錯誤處理輔助函數
  const handleError = useCallback((error: Error, context: string) => {
    logger.error(`MenuOperations: ${context}`, { context }, error);
    onError?.(error, context);
  }, [onError]);

  // 成功處理輔助函數
  const handleSuccess = useCallback((action: string, data: any) => {
    logger.info(`MenuOperations: ${action} successful`, { action, itemId: data?.id });
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
   * 創建新菜單項目
   */
  const createMenuItem = useCallback(async (
    itemData: CreateMenuItemData
  ): Promise<MenuOperationResult> => {
    try {
      const itemId = `item-${Date.now()}`;
      const now = new Date().toISOString();
      
      const newItem: MenuItem = {
        id: itemId,
        name: itemData.name,
        price: itemData.price,
        category: itemData.category,
        baseSpirit: itemData.baseSpirit,
        description: itemData.description || '',
        available: itemData.available ?? true,
        createdAt: now,
        updatedAt: now
      };

      // 檢查名稱是否已存在
      const existingItem = menuItems.find(item => 
        item.name.toLowerCase() === itemData.name.toLowerCase()
      );
      if (existingItem) {
        throw new Error(`Menu item "${itemData.name}" already exists`);
      }

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            addToOfflineQueue('menu', 'create', newItem as any);
          }
          return { success: true, data: newItem };
        },
        () => addMenuItem(newItem),
        () => deleteMenuItem(itemId),
        'createMenuItem'
      );

      recordOperation('create', newItem);
      handleSuccess('createMenuItem', newItem);

      return { success: true, data: newItem };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create menu item'
      };
    }
  }, [menuItems, addMenuItem, deleteMenuItem, isOnline, autoSync, addToOfflineQueue, withOptimisticUpdate, recordOperation, handleSuccess]);

  /**
   * 更新菜單項目
   */
  const updateMenuItemInfo = useCallback(async (
    itemId: ID,
    updates: Partial<MenuItem>
  ): Promise<MenuOperationResult> => {
    try {
      const existingItem = menuItems.find(item => item.id === itemId);
      if (!existingItem) {
        throw new Error('Menu item not found');
      }

      // 如果更新名稱，檢查是否與其他項目重複
      if (updates.name && updates.name !== existingItem.name) {
        const duplicateItem = menuItems.find(item => 
          item.id !== itemId && 
          item.name.toLowerCase() === updates.name!.toLowerCase()
        );
        if (duplicateItem) {
          throw new Error(`Menu item "${updates.name}" already exists`);
        }
      }

      const updatedItem = {
        ...existingItem,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            addToOfflineQueue('menu', 'update', { id: itemId, updates });
          }
          return { success: true, data: updatedItem };
        },
        () => updateMenuItem(itemId, updates),
        () => updateMenuItem(itemId, existingItem),
        'updateMenuItem'
      );

      recordOperation('update', { itemId, updates });
      handleSuccess('updateMenuItem', updatedItem);

      return { success: true, data: updatedItem };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update menu item'
      };
    }
  }, [menuItems, updateMenuItem, isOnline, autoSync, addToOfflineQueue, withOptimisticUpdate, recordOperation, handleSuccess]);

  /**
   * 刪除菜單項目
   */
  const removeMenuItem = useCallback(async (
    itemId: ID
  ): Promise<MenuOperationResult> => {
    try {
      const existingItem = menuItems.find(item => item.id === itemId);
      if (!existingItem) {
        throw new Error('Menu item not found');
      }

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            addToOfflineQueue('menu', 'delete', { id: itemId });
          }
          return { success: true };
        },
        () => deleteMenuItem(itemId),
        () => addMenuItem(existingItem),
        'deleteMenuItem'
      );

      recordOperation('delete', { itemId });
      handleSuccess('deleteMenuItem', { itemId });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete menu item'
      };
    }
  }, [menuItems, deleteMenuItem, addMenuItem, isOnline, autoSync, addToOfflineQueue, withOptimisticUpdate, recordOperation, handleSuccess]);

  // ============ 庫存管理 ============

  /**
   * 切換菜單項目可用性
   */
  const toggleAvailability = useCallback(async (
    itemId: ID
  ): Promise<MenuOperationResult> => {
    try {
      const existingItem = menuItems.find(item => item.id === itemId);
      if (!existingItem) {
        throw new Error('Menu item not found');
      }

      const newAvailable = !existingItem.available;

      // 樂觀更新
      await withOptimisticUpdate(
        async () => {
          if (isOnline && autoSync) {
            addToOfflineQueue('menu', 'toggleAvailability', { id: itemId, available: newAvailable });
          }
          return { success: true };
        },
        () => toggleMenuItemAvailability(itemId),
        () => toggleMenuItemAvailability(itemId), // 再次切換回來
        'toggleAvailability'
      );

      recordOperation('toggleAvailability', { itemId, available: newAvailable });
      handleSuccess('toggleAvailability', { itemId, available: newAvailable });

      return { 
        success: true, 
        data: { ...existingItem, available: newAvailable } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to toggle menu item availability'
      };
    }
  }, [menuItems, toggleMenuItemAvailability, isOnline, autoSync, addToOfflineQueue, withOptimisticUpdate, recordOperation, handleSuccess]);

  /**
   * 批量更新菜單項目可用性
   */
  const batchUpdateAvailability = useCallback(async (
    itemIds: ID[],
    available: boolean
  ): Promise<BatchMenuOperationResult> => {
    const results: Array<{
      itemId: ID;
      success: boolean;
      error?: string;
    }> = [];

    let totalSuccessful = 0;

    for (const itemId of itemIds) {
      try {
        const item = menuItems.find(i => i.id === itemId);
        if (!item) {
          results.push({
            itemId,
            success: false,
            error: 'Menu item not found'
          });
          continue;
        }

        if (item.available === available) {
          results.push({
            itemId,
            success: true // 沒有變化也算成功
          });
          totalSuccessful++;
          continue;
        }

        const result = await toggleAvailability(itemId);
        results.push({
          itemId,
          success: result.success,
          ...(result.error && { error: result.error })
        });

        if (result.success) {
          totalSuccessful++;
        }
      } catch (error) {
        results.push({
          itemId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    recordOperation('batchUpdateAvailability', { itemIds, available, results });
    handleSuccess('batchUpdateAvailability', { totalSuccessful, totalProcessed: itemIds.length });

    return {
      success: totalSuccessful > 0,
      results,
      totalProcessed: itemIds.length,
      totalSuccessful
    };
  }, [menuItems, toggleAvailability, recordOperation, handleSuccess]);

  // ============ 搜索和過濾 ============

  /**
   * 高級菜單搜索
   */
  const searchMenu = useCallback((
    options: MenuSearchOptions = {}
  ): MenuItem[] => {
    let filteredItems = [...menuItems];

    // 按分類過濾
    if (options.category) {
      filteredItems = filteredItems.filter(item => item.category === options.category);
    }

    // 按基酒過濾
    if (options.baseSpirit) {
      filteredItems = filteredItems.filter(item => item.baseSpirit === options.baseSpirit);
    }

    // 按價格範圍過濾
    if (options.minPrice !== undefined) {
      filteredItems = filteredItems.filter(item => item.price >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      filteredItems = filteredItems.filter(item => item.price <= options.maxPrice!);
    }

    // 按可用性過濾
    if (options.available !== undefined) {
      filteredItems = filteredItems.filter(item => item.available === options.available);
    }

    // 按查詢字串過濾
    if (options.query) {
      const lowerQuery = options.query.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
      );
    }

    return filteredItems;
  }, [menuItems]);

  // ============ 統計和分析 ============

  /**
   * 獲取菜單統計
   */
  const getMenuStatistics = useMemo((): MenuStatistics => {
    const available = menuItems.filter(item => item.available).length;
    const unavailable = menuItems.length - available;
    
    // 按分類統計
    const byCategory: Record<MenuCategory, number> = {} as Record<MenuCategory, number>;
    // 按基酒統計
    const byBaseSpirit: Record<BaseSpirit, number> = {} as Record<BaseSpirit, number>;
    
    let totalPrice = 0;
    let minPrice = Number.MAX_SAFE_INTEGER;
    let maxPrice = Number.MIN_SAFE_INTEGER;

    for (const item of menuItems) {
      // 分類統計
      if (item.category) {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      }
      
      // 基酒統計
      if (item.baseSpirit) {
        byBaseSpirit[item.baseSpirit] = (byBaseSpirit[item.baseSpirit] || 0) + 1;
      }
      
      // 價格統計
      totalPrice += item.price;
      minPrice = Math.min(minPrice, item.price);
      maxPrice = Math.max(maxPrice, item.price);
    }

    return {
      total: menuItems.length,
      available,
      unavailable,
      byCategory,
      byBaseSpirit,
      averagePrice: menuItems.length > 0 ? Math.round(totalPrice / menuItems.length) : 0,
      priceRange: {
        min: minPrice === Number.MAX_SAFE_INTEGER ? 0 : minPrice,
        max: maxPrice === Number.MIN_SAFE_INTEGER ? 0 : maxPrice
      }
    };
  }, [menuItems]);

  // ============ 查詢方法 ============

  // 查詢方法（使用 useMemo 避免重新創建）
  const queries = useMemo(() => ({
    // 根據分類獲取菜單項目
    getItemsByCategory: (category: MenuCategory) => 
      menuItems.filter(item => item.category === category),
    
    // 根據基酒獲取菜單項目
    getItemsByBaseSpirit: (baseSpirit: BaseSpirit) => 
      menuItems.filter(item => item.baseSpirit === baseSpirit),
    
    // 獲取可用菜單項目
    getAvailableItems: () => 
      menuItems.filter(item => item.available),
    
    // 獲取不可用菜單項目
    getUnavailableItems: () => 
      menuItems.filter(item => !item.available),
    
    // 根據價格範圍獲取菜單項目
    getItemsByPriceRange: (minPrice: number, maxPrice: number) =>
      menuItems.filter(item => item.price >= minPrice && item.price <= maxPrice),
    
    // 獲取熱門項目（這裡用價格代替，實際應用中可以用訂單數據）
    getPopularItems: (limit = 10) =>
      [...menuItems]
        .sort((a, b) => b.price - a.price) // 暫時用價格排序
        .slice(0, limit),
    
    // 獲取所有分類
    getAllCategories: () => 
      Array.from(new Set(menuItems.map(item => item.category))),
    
    // 獲取所有基酒類型
    getAllBaseSpirits: () => 
      Array.from(new Set(menuItems.map(item => item.baseSpirit))),
    
    // 獲取操作歷史
    getOperationHistory: () => [...operationHistory.current]
  }), [menuItems]);

  // ============ 返回值 ============

  return {
    // 狀態
    menuItems,
    isLoaded,
    isOnline,
    statistics: getMenuStatistics,
    
    // 基本操作
    createMenuItem,
    updateMenuItem: updateMenuItemInfo,
    removeMenuItem,
    
    // 庫存管理
    toggleAvailability,
    batchUpdateAvailability,
    
    // 搜索和過濾
    searchMenu,
    
    // 查詢方法
    queries,
    
    // 便利方法
    resetToDefault: resetToDefaultMenu,
    
    // 工具方法
    recordOperation,
    clearOperationHistory: () => {
      operationHistory.current = [];
    }
  };
};

export default useMenuOperations;