import React from 'react';
import { OrderProvider, useOrder } from './OrderContext';
import { TableProvider, useTable } from './TableContext';
import { MenuProvider, useMenu } from './MenuContext';
import { SettingsProvider, useSettings } from './SettingsContext';
import { StatsProvider, useStats } from './StatsContext';
import type { Order, ID, Table, MenuItem } from '@/types';

interface AppProviderProps {
  children: React.ReactNode;
}

interface StatsConsumerProps {
  children: React.ReactNode;
}

// 組合 Provider - 按照依賴關係排列
export function AppProvider({ children }: AppProviderProps) {
  return (
    <SettingsProvider>
      <MenuProvider>
        <OrderProvider>
          <TableProvider>
            <StatsConsumer>
              {children}
            </StatsConsumer>
          </TableProvider>
        </OrderProvider>
      </MenuProvider>
    </SettingsProvider>
  );
}

// StatsConsumer 用來獲取其他 Context 的資料並傳遞給 StatsProvider
function StatsConsumer({ children }: StatsConsumerProps) {
  const { state: orderState } = useOrder();
  const { state: tableState } = useTable();

  return (
    <StatsProvider orders={orderState.orders} tables={tableState.tables}>
      {children}
    </StatsProvider>
  );
}

// 組合 Hook - 提供統一的 API 介面，保持向後相容
export function useApp() {
  const orderContext = useOrder();
  const tableContext = useTable();
  const menuContext = useMenu();
  const settingsContext = useSettings();
  const statsContext = useStats();

  // 組合所有狀態
  const state = {
    orders: orderContext.state.orders,
    tables: tableContext.state.tables,
    menuItems: menuContext.state.menuItems,
    theme: settingsContext.state.theme,
    notionConfig: settingsContext.state.notionConfig,
    supabaseConfig: settingsContext.state.supabaseConfig,
    layoutConfig: settingsContext.state.layoutConfig,
    stats: statsContext.state
  };

  // 組合所有 actions
  const actions = {
    // 訂單相關
    addOrder: (order: Order) => {
      // 添加訂單並更新相關桌位
      orderContext.actions.addOrder(order);
      if (order.tableNumber) {
        const table = tableContext.state.tables.find((t: Table) => t.number === order.tableNumber);
        if (table) {
          tableContext.actions.updateTable(table.id, {
            status: 'occupied',
            currentOrder: order.id || Date.now().toString(),
            customers: order.customers || 0
          });
        }
      }
    },
    updateOrder: orderContext.actions.updateOrder,
    deleteOrder: (orderId: ID) => {
      // 刪除訂單並釋放桌位
      orderContext.actions.deleteOrder(orderId);
      tableContext.actions.releaseTable(orderId);
    },
    setOrders: orderContext.actions.setOrders,

    // 桌位相關
    updateTable: tableContext.actions.updateTable,
    releaseTable: tableContext.actions.releaseTable,
    setTables: tableContext.actions.setTables,
    addTable: tableContext.actions.addTable,
    deleteTable: tableContext.actions.deleteTable,
    updateTableLayout: tableContext.actions.updateTableLayout,

    // 菜單相關
    addMenuItem: menuContext.actions.addMenuItem,
    updateMenuItem: menuContext.actions.updateMenuItem,
    deleteMenuItem: menuContext.actions.deleteMenuItem,
    setMenuItems: menuContext.actions.setMenuItems,

    // 設定相關
    updateNotionConfig: settingsContext.actions.updateNotionConfig,
    updateSupabaseConfig: settingsContext.actions.updateSupabaseConfig,
    saveLayoutConfig: settingsContext.actions.saveLayoutConfig,
    toggleTheme: settingsContext.actions.toggleTheme,

    // 統計相關
    updateStats: statsContext.actions.updateStats,

    // 資料管理 - 清除所有資料的功能
    clearAllData: async (): Promise<void> => {
      try {
        // 重置各個 Context 的資料
        orderContext.actions.setOrders([]);
        menuContext.actions.setMenuItems(menuContext.state.menuItems.filter((item: MenuItem) => parseInt(item.id) < 1000)); // 保留預設菜單
        
        // 重置桌位狀態但保留桌位結構
        const resetTables = tableContext.state.tables.map((table: Table) => ({
          ...table,
          status: 'available' as const,
          customers: 0,
          currentOrder: null
        }));
        tableContext.actions.setTables(resetTables);
        
        // 清除統計
        statsContext.actions.updateStats({
          todayRevenue: 0,
          todayOrders: 0,
          activeCustomers: 0
        });

        console.log('All data cleared successfully');
      } catch (error) {
        console.error('Failed to clear data:', error);
        throw error;
      }
    }
  };

  // 檢查所有 Context 是否都已載入
  const isLoaded = orderContext.isLoaded && 
                  tableContext.isLoaded && 
                  menuContext.isLoaded && 
                  settingsContext.isLoaded && 
                  statsContext.isLoaded;

  return { state, actions, isLoaded };
}

// 導出個別的 hooks 供需要特定功能的組件使用
export { useOrder, useTable, useMenu, useSettings, useStats };