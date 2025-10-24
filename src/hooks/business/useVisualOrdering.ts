import { useState, useMemo } from 'react';
import { logger } from '@/services/loggerService';
import type { Order, OrderItem, MenuItem, BaseSpirit } from '@/types';

interface OrderDetails {
  tableNumber: number | string;
  customers: number;
  notes: string;
}

interface UseVisualOrderingProps {
  menuItems: MenuItem[];
  initialTableNumber?: number | undefined;
  initialCustomers?: number | undefined;
  isAddOnMode?: boolean | undefined;
  existingOrder?: Order | undefined;
}

interface ValidationResult {
  isValid: boolean;
  errors: {
    noItems: boolean;
    noTable: boolean;
    invalidCustomers: boolean;
  };
}

export const useVisualOrdering = (props: UseVisualOrderingProps) => {
  const {
    menuItems = [],
    initialTableNumber,
    initialCustomers = 1,
    isAddOnMode = false,
    existingOrder
  } = props;

  // ✅ 基礎狀態管理
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => 
    isAddOnMode && existingOrder?.items ? [...existingOrder.items] : []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBaseSpirit, setSelectedBaseSpirit] = useState<string>('all');
  const [orderDetails, setOrderDetails] = useState<OrderDetails>(() => ({
    tableNumber: initialTableNumber || '',
    customers: initialCustomers,
    notes: isAddOnMode && existingOrder?.notes ? existingOrder.notes : ''
  }));
  const [error, setError] = useState<string | null>(null);

  // ✅ 優化的分類計算 - 穩定依賴
  const categories = useMemo(() => {
    try {
      if (!Array.isArray(menuItems) || menuItems.length === 0) {
        return ['all'];
      }
      
      const uniqueCategories = new Set(
        menuItems
          .filter(item => item && item.category)
          .map(item => item.category)
      );
      
      return ['all', ...Array.from(uniqueCategories)];
    } catch (err) {
      logger.error('Error calculating categories', {
        component: 'useVisualOrdering',
        action: 'getCategories'
      }, err instanceof Error ? err : new Error(String(err)));
      return ['all'];
    }
  }, [menuItems]);

  // ✅ 簡化的基酒計算 - 移除複雜依賴鏈
  const availableBaseSpirits = useMemo(() => {
    const categoriesForSpirits = new Set(['cocktails','classic','signature']);
    if (!categoriesForSpirits.has(selectedCategory)) return ['all'];
    
    try {
      const spiritItems = menuItems.filter(item => 
        item && categoriesForSpirits.has(item.category) && item.baseSpirit
      );
      
      const uniqueSpirits = new Set(
        spiritItems.map(item => item.baseSpirit as BaseSpirit)
      );
      
      return ['all', ...Array.from(uniqueSpirits)];
    } catch (err) {
      logger.error('Error calculating base spirits', {
        component: 'useVisualOrdering',
        action: 'getBaseSpirits'
      }, err instanceof Error ? err : new Error(String(err)));
      return ['all'];
    }
  }, [menuItems, selectedCategory]);

  // ✅ 優化的菜單過濾 - 清晰的依賴關係
  const filteredMenuItems = useMemo(() => {
    try {
      if (!Array.isArray(menuItems)) return [];
      
      let filtered = menuItems.filter(item => item && item.name);
      
      // 分類過濾
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }
      
      // 基酒過濾
      {
        const categoriesForSpirits = new Set(['cocktails','classic','signature']);
        if (selectedBaseSpirit !== 'all' && categoriesForSpirits.has(selectedCategory)) {
          filtered = filtered.filter(item => item.baseSpirit === selectedBaseSpirit);
        }
      }
      
      return filtered;
    } catch (err) {
      logger.error('Error filtering menu items', {
        component: 'useVisualOrdering',
        action: 'filterMenuItems'
      }, err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [menuItems, selectedCategory, selectedBaseSpirit]);

  // ✅ 穩定的操作方法
  const operations = useMemo(() => ({
    addToOrder: (menuItem: MenuItem) => {
      try {
        if (!menuItem?.id || !menuItem?.name) {
          throw new Error('無效的菜單項目');
        }

        setOrderItems(prev => {
          const existingIndex = prev.findIndex(item => 
            item.name === menuItem.name && item.price === menuItem.price
          );
          
          if (existingIndex >= 0) {
            return prev.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          
          const newItem: OrderItem = {
            id: `${menuItem.id}-${Date.now()}`,
            name: menuItem.name,
            price: Number(menuItem.price) || 0,
            quantity: 1,
          };
          
          return [...prev, newItem];
        });
        
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '新增餐點時發生錯誤';
        setError(errorMsg);
        logger.error('Failed to add item to order', {
          component: 'useVisualOrdering',
          action: 'addToOrder',
          menuItemId: menuItem?.id
        }, err instanceof Error ? err : new Error(String(err)));
      }
    },

    removeFromOrder: (itemIndex: number) => {
      try {
        setOrderItems(prev => {
          if (itemIndex < 0 || itemIndex >= prev.length) {
            throw new Error('無效的項目索引');
          }
          return prev.filter((_, index) => index !== itemIndex);
        });
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '移除餐點時發生錯誤';
        setError(errorMsg);
        logger.error('Failed to remove item from order', {
          component: 'useVisualOrdering',
          action: 'removeFromOrder',
          itemIndex
        }, err instanceof Error ? err : new Error(String(err)));
      }
    },

    updateQuantity: (itemIndex: number, newQuantity: number) => {
      try {
        const quantity = Number(newQuantity);
        if (isNaN(quantity) || quantity < 0) {
          throw new Error('無效的數量');
        }

        if (quantity === 0) {
          operations.removeFromOrder(itemIndex);
          return;
        }

        setOrderItems(prev => {
          if (itemIndex < 0 || itemIndex >= prev.length) {
            throw new Error('無效的項目索引');
          }
          
          return prev.map((item, index) =>
            index === itemIndex ? { ...item, quantity } : item
          );
        });
        
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '更新數量時發生錯誤';
        setError(errorMsg);
        logger.error('Failed to update item quantity', {
          component: 'useVisualOrdering',
          action: 'updateQuantity',
          itemIndex,
          newQuantity
        }, err instanceof Error ? err : new Error(String(err)));
      }
    },

    clearOrder: () => {
      setOrderItems([]);
      setError(null);
    },

    updateOrderDetails: (details: Partial<OrderDetails>) => {
      setOrderDetails(prev => ({ ...prev, ...details }));
    }
  }), []); // 空依賴數組，因為所有方法都使用函數式更新

  // ✅ 計算總額
  const totalAmount = useMemo(() => {
    try {
      return orderItems.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + (price * quantity);
      }, 0);
    } catch (err) {
      logger.error('Error calculating total amount', {
        component: 'useVisualOrdering',
        action: 'calculateTotal'
      }, err instanceof Error ? err : new Error(String(err)));
      return 0;
    }
  }, [orderItems]);

  // ✅ 表單驗證
  const validation = useMemo<ValidationResult>(() => ({
    isValid: orderItems.length > 0 && (Boolean(orderDetails.tableNumber) || Boolean(initialTableNumber)),
    errors: {
      noItems: orderItems.length === 0,
      noTable: !orderDetails.tableNumber && !initialTableNumber,
      invalidCustomers: orderDetails.customers <= 0
    }
  }), [orderItems.length, orderDetails.tableNumber, orderDetails.customers, initialTableNumber]);

  return {
    // 狀態
    orderItems,
    selectedCategory,
    selectedBaseSpirit,
    orderDetails,
    error,

    // 計算值
    categories,
    availableBaseSpirits,
    filteredMenuItems,
    totalAmount,
    validation,

    // 操作
    ...operations,
    setSelectedCategory,
    setSelectedBaseSpirit,
    setError,
  };
};