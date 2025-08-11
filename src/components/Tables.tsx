import React, { useState, useCallback, useMemo, memo } from 'react';
import { useTables, useOrders, useOrderStore, useTableStore } from '@/stores';
import { useMenuItems } from '@/stores/menuStore';
import type { Table, Order } from '@/types';
import TableLayoutEditor from './TableLayoutEditor';
import { useVisualOrderingModalOpen } from './visualOrderingModalStore';

type ViewMode = 'custom' | 'grid';

interface TableWithOrder extends Table {
  currentOrder: Order | null;
}

const StatusColor: Record<Table['status'], string> = {
  available: 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-600 dark:text-emerald-300',
  occupied: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-300',
  reserved: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-600 dark:text-amber-300',
  cleaning: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300',
};

const StatusText: Record<Table['status'], string> = {
  available: '空位',
  occupied: '使用中',
  reserved: '已預約',
  cleaning: '清潔中',
};

const TableCard: React.FC<{ table: TableWithOrder; selected: boolean; onClick: (t: Table) => void; }>= memo(({ table, selected, onClick }) => {
  return (
    <div
      onClick={() => onClick(table)}
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${StatusColor[table.status]} ${selected ? 'ring-4 ring-blue-400' : ''}`}
    >
      <div className="text-center">
        <div className="text-xl font-bold mb-2">位 {table.number}</div>
        <div className="text-sm opacity-75 mb-2">{StatusText[table.status]}</div>
        {table.status === 'occupied' && (
          <div className="text-xs">
            {table.customers} 人
            {table.currentOrder && (
              <div className="mt-1">${table.currentOrder.total}</div>
            )}
          </div>
        )}
      </div>
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
        table.status === 'available' ? 'bg-emerald-500' :
        table.status === 'occupied' ? 'bg-red-500' :
        table.status === 'reserved' ? 'bg-amber-500' :
        'bg-blue-500'
      }`} />
    </div>
  );
});

const Tables: React.FC = memo(() => {
  const tables = useTables();
  const orders = useOrders();
  const menuItems = useMenuItems();
  // ✅ 分別訂閱，避免 getSnapshot 緩存問題
  const addOrder = useOrderStore((state) => state.addOrder);
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const updateTable = useTableStore((state) => state.updateTable);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('custom');

  const ordersById = useMemo(() => {
    const m = new Map<string | number, Order>();
    for (const o of orders) m.set(o.id, o);
    return m;
  }, [orders]);

  const tableStats = useMemo(() => {
    const totalTables = tables.length;
    let availableTables = 0;
    let occupiedTables = 0;
    for (const t of tables) {
      if (t.status === 'available') availableTables++;
      else if (t.status === 'occupied') occupiedTables++;
    }
    const utilizationRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;
    return { total: totalTables, available: availableTables, occupied: occupiedTables, utilizationRate };
  }, [tables]);

  const tablesWithOrders = useMemo(() => {
    return tables.map((table: Table): TableWithOrder => ({
      ...table,
      currentOrder: table.orderId ? ordersById.get(table.orderId as any) || null : null,
    }));
  }, [tables, ordersById]);

  const open = useVisualOrderingModalOpen();

  const onComplete = useCallback((table: Table, currentOrder: Order | null) => (order: Order | null) => {
    if (!order) return;
    
    try {
      if (currentOrder) {
        // ✅ 修復無限循環：只更新必要的字段，時間戳由 store 內部處理
        const updates: Partial<Order> = {
          items: order.items,
          subtotal: order.subtotal,
          total: order.total,
          notes: order.notes ?? ''
          // ❌ 移除 updatedAt - 由 store 內部自動更新
        };
        updateOrder(order.id, updates);
      } else {
        addOrder(order);
        updateTable(table.id, { 
          status: 'occupied', 
          orderId: order.id, 
          customers: order.customers 
        });
      }
    } catch (error) {
      console.error('Error in onComplete callback:', error);
    }
  }, [addOrder, updateOrder, updateTable]);

  const updateOrderStatusCb = useCallback((orderId: string, status: Order['status']) => {
    updateOrder(orderId, { status });
  }, [updateOrder]);

  const handleTableClick = useCallback((table: Table) => {
    if (!table || !table.id) return;
    const currentOrder = table.orderId ? ordersById.get(table.orderId as any) || null : null;
    const isAddOnMode = !!currentOrder && table.status === 'occupied' && currentOrder.status !== 'paid';
    const initialCustomers = table.customers || currentOrder?.customers || 1;
    open({
      selectedTable: table,
      initialCustomers,
      existingOrder: currentOrder,
      isAddOnMode,
      menuItems,
      onComplete: onComplete(table, currentOrder),
      updateOrderStatus: updateOrderStatusCb,
    });
  }, [ordersById, open, menuItems, onComplete, updateOrderStatusCb]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">座位管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理餐廳座位狀態和客人需求</p>
        </div>
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => { setSelectedTable(null); setViewMode('grid'); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            格狀檢視
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tablesWithOrders.map((table: TableWithOrder) => (
            <TableCard key={table.id} table={table} selected={selectedTable?.id === table.id} onClick={handleTableClick} />
          ))}
        </div>
      ) : (
        <div style={{ minHeight: '600px' }}>
          <TableLayoutEditor readOnly onTableClick={handleTableClick} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">總座位數</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{tableStats.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">空位</div>
          <div className="text-2xl font-bold text-emerald-600">{tableStats.available}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">使用中</div>
          <div className="text-2xl font-bold text-red-600">{tableStats.occupied}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">使用率</div>
          <div className="text-2xl font-bold text-blue-600">{tableStats.utilizationRate}%</div>
        </div>
      </div>
    </div>
  );
});

export default Tables;
