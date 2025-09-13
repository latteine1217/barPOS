import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { loadFromStorage, STORAGE_KEYS } from '../services/storageService';
import { logger } from '@/services/loggerService';
import type { Table, TableStatus, ID } from '@/types';

// Table Store 狀態接口
interface TableState {
  tables: Table[];
  isLoaded: boolean;
}

// Table Store 行為接口
interface TableActions {
  // 基本 CRUD 操作
  updateTable: (id: number, updates: Partial<Table>) => void;
  setTables: (tables: Table[]) => void;
  addTable: (tableData: Partial<Table> & { id?: number }) => void;
  deleteTable: (id: number) => void;
  
  // 特殊操作
  releaseTable: (orderId: ID) => void;
  updateTableLayout: (id: number, layoutData: Partial<Table>) => void;
  
  // 狀態管理
  setLoaded: (loaded: boolean) => void;
  initialize: () => Promise<void>;
  
  // 便利方法
  getTableById: (id: number) => Table | undefined;
  getTableByNumber: (number: number) => Table | undefined;
  getTablesByStatus: (status: TableStatus) => Table[];
  getAvailableTables: () => Table[];
  getOccupiedTables: () => Table[];
  resetAllTables: () => void;
}

// 組合 Store 類型
export type TableStore = TableState & TableActions;

// 初始桌位資料
const createInitialTables = (): Table[] => 
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    name: `桌 ${i + 1}`,
    status: 'available' as TableStatus,
    customers: 0,
    maxCapacity: 4,
    position: {
      x: ((i % 4) * 200) + 50,
      y: (Math.floor(i / 4) * 150) + 50
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

// 創建 Table Store
export const useTableStore = create<TableStore>()(
  persist(
    immer((set, get) => ({
      // 初始狀態
      tables: createInitialTables(),
      isLoaded: false,

      // 基本 CRUD 操作
      updateTable: (id: number, updates: Partial<Table>) => {
        set((state) => {
          const table = state.tables.find(t => t.id === id);
          if (!table) {
            logger.tableLog.error(id, new Error('Table not found for update'), { tableId: id });
            return;
          }
          if (updates.number !== undefined) table.number = updates.number;
          if (updates.name !== undefined) table.name = updates.name;
          if (updates.status !== undefined) table.status = updates.status;
          if (updates.customers !== undefined) table.customers = updates.customers;
          if (updates.maxCapacity !== undefined) table.maxCapacity = updates.maxCapacity;
          if (updates.position !== undefined) table.position = { 
            x: updates.position.x ?? table.position.x, 
            y: updates.position.y ?? table.position.y 
          };
          if (updates.orderId !== undefined) {
            if (updates.orderId === null) {
              delete (table as { orderId?: ID }).orderId;
            } else {
              table.orderId = updates.orderId;
            }
          }
          table.updatedAt = new Date().toISOString();
        });
      },

      setTables: (tables: Table[]) => {
        set((state) => {
          if (!Array.isArray(tables)) {
            logger.storeLog.error('tableStore', new Error('Invalid tables data - must be array'), { tables });
            return;
          }
          state.tables = tables.map(t => ({ ...t }));
        });
      },

      addTable: (tableData: Partial<Table> & { id?: number }) => {
        set((state) => {
          const newTable: Table = {
            id: tableData.id || Date.now(),
            number: tableData.number || state.tables.length + 1,
            name: tableData.name || `桌 ${state.tables.length + 1}`,
            status: tableData.status || 'available',
            customers: tableData.customers || 0,
            maxCapacity: tableData.maxCapacity || 4,
            position: tableData.position || { x: 100, y: 100 },
            ...(tableData.orderId && { orderId: tableData.orderId }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          state.tables.push(newTable);
        });
      },

      deleteTable: (id: number) => {
        set((state) => {
          const initialLength = state.tables.length;
          state.tables = state.tables.filter(table => table.id !== id);
          
          if (state.tables.length === initialLength) {
            logger.tableLog.error(id, new Error('Table not found for deletion'), { tableId: id });
          }
        });
      },

      // 特殊操作
      releaseTable: (orderId: ID) => {
        set((state) => {
          let changed = false;
          state.tables.forEach(t => {
            if (t.orderId === orderId) {
              t.status = 'available';
              delete (t as any).orderId;
              t.customers = 0;
              t.updatedAt = new Date().toISOString();
              changed = true;
            }
          });
          if (!changed) {
            logger.warn('No table found for orderId', { component: 'tableStore', orderId });
          }
        });
      },

      updateTableLayout: (id: number, layoutData: Partial<Table>) => {
        set((state) => {
          const table = state.tables.find(t => t.id === id);
          if (!table) {
            logger.tableLog.error(id, new Error('Table not found for layout update'), { tableId: id });
            return;
          }
          if (layoutData.position) {
            table.position = { ...table.position, ...layoutData.position } as any;
          }
          table.updatedAt = new Date().toISOString();
        });
      },

      // 狀態管理
      setLoaded: (loaded: boolean) => {
        set((state) => {
          state.isLoaded = loaded;
        });
      },

      initialize: async () => {
        try {
          const savedTables = await loadFromStorage(STORAGE_KEYS.TABLES, []) as Table[];
          set((state) => {
            if (Array.isArray(savedTables) && savedTables.length > 0) {
              const byId = new Map<number, Table>();
              for (const t of state.tables) byId.set(t.id, t);
              for (const s of savedTables) byId.set(s.id, { ...byId.get(s.id), ...s } as Table);
              state.tables = Array.from(byId.values());
            }
            state.isLoaded = true;
          });
        } catch (error) {
          logger.storeLog.error('tableStore', error as Error, { action: 'initialize' });
          set((state) => {
            state.isLoaded = true;
          });
        }
      },

      // 便利方法
      getTableById: (id: number) => {
        return get().tables.find(table => table.id === id);
      },

      getTableByNumber: (number: number) => {
        const n = Number(number);
        // 寬鬆處理持久化資料中的型別偏差（可能為字串）
        return get().tables.find(table => Number((table as any).number) === n);
      },

      getTablesByStatus: (status: TableStatus) => {
        return get().tables.filter(table => table.status === status);
      },

      getAvailableTables: () => {
        return get().tables.filter(table => table.status === 'available');
      },

      getOccupiedTables: () => {
        return get().tables.filter(table => table.status === 'occupied');
      },

      resetAllTables: () => {
        set((state) => {
          state.tables.forEach(table => {
            table.status = 'available';
            table.customers = 0;
            delete table.orderId;
            table.updatedAt = new Date().toISOString();
          });
        });
      },
    })),
    {
      name: 'table-store',
      partialize: (state) => ({ 
        tables: state.tables 
      }),
    }
  )
);



// 緩存選擇器結果以避免無限循環
const tablesCacheSelector = (state: TableStore) => state.tables;
const tablesLoadedSelector = (state: TableStore) => state.isLoaded;

// 便利的選擇器 hooks - 使用緩存的選擇器
export const useTables = () => useTableStore(tablesCacheSelector);
export const useTablesLoaded = () => useTableStore(tablesLoadedSelector);

// 穩定的 actions 選擇器，避免重新渲染 - 使用緩存的選擇器函數
const tableActionsSelector = (state: TableStore) => ({
  updateTable: state.updateTable,
  addTable: state.addTable,
  deleteTable: state.deleteTable,
  releaseTable: state.releaseTable,
  updateTableLayout: state.updateTableLayout,
  setTables: state.setTables,
  resetAllTables: state.resetAllTables,
});

export const useTableActions = () => useTableStore(tableActionsSelector);

// 特定功能的選擇器
export const useTableById = (id: number) => 
  useTableStore((state) => state.getTableById(id));

export const useTableByNumber = (number: number) => 
  useTableStore((state) => state.getTableByNumber(number));

export const useTablesByStatus = (status: TableStatus) => 
  useTableStore((state) => state.getTablesByStatus(status));

export const useAvailableTables = () => 
  useTableStore((state) => state.getAvailableTables());

export const useOccupiedTables = () => 
  useTableStore((state) => state.getOccupiedTables());

// 統計選擇器
export const useTableStats = () => 
  useTableStore((state) => ({
    totalTables: state.tables.length,
    availableTables: state.tables.filter(t => t.status === 'available').length,
    occupiedTables: state.tables.filter(t => t.status === 'occupied').length,
    reservedTables: state.tables.filter(t => t.status === 'reserved').length,
    cleaningTables: state.tables.filter(t => t.status === 'cleaning').length,
    utilizationRate: state.tables.length > 0 
      ? (state.tables.filter(t => t.status === 'occupied').length / state.tables.length) * 100 
      : 0
  }));

// ✅ 精細化選擇器 - Phase 1 新增
export const useTableSelectors = {
  // 僅訂閱桌位統計
  useTableStats: () => useTableStore(state => {
    const tables = state.tables;
    return {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      utilizationRate: tables.length > 0 
        ? Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100)
        : 0
    };
  }),
  
  // 僅訂閱可用桌位
  useAvailableTables: () => useTableStore(state =>
    state.tables.filter(table => table.status === 'available')
  ),
  
  // 僅訂閱特定桌位
  useTableById: (id: number) => useTableStore(state =>
    state.tables.find(table => table.id === id)
  ),
};
