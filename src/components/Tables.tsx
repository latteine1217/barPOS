import React, { useState, useCallback, useMemo, memo } from 'react';
import { useTables, useOrders, useOrderStore, useAppStore } from '@/stores';
import { useMenuItems } from '@/stores/menuStore';
import type { Table, Order, OrderStatus } from '@/types';
import TableLayoutEditor from './TableLayoutEditor';
import { useVisualOrderingModalOpen } from './visualOrderingModalStore';

type ViewMode = 'custom' | 'grid';

interface TableWithOrder extends Table {
  currentOrder: Order | null;
}

const StatusColor: Record<Table['status'], string> = {
  available:
    'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-600 dark:text-emerald-300',
  occupied:
    'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-300',
  reserved:
    'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-600 dark:text-amber-300',
  cleaning:
    'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300',
};

const StatusText: Record<Table['status'], string> = {
  available: '空位',
  occupied: '使用中',
  reserved: '已預約',
  cleaning: '清潔中',
};

const OrderStatusText: Record<OrderStatus, string> = {
  pending: '待處理',
  preparing: '調製中',
  completed: '已完成',
  paid: '已結帳',
  cancelled: '已取消',
};

const getOccupiedColorByOrderStatus = (s?: OrderStatus): string => {
  switch (s) {
    case 'pending':
    case 'preparing':
      return 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-600 dark:text-amber-300';
    case 'completed':
      return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-300';
    case 'paid':
      return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300';
    case 'cancelled':
      return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200';
    default:
      return StatusColor.occupied;
  }
};

const getDotColor = (table: TableWithOrder): string => {
  if (table.status !== 'occupied') {
    return table.status === 'available'
      ? 'bg-emerald-500'
      : table.status === 'reserved'
      ? 'bg-amber-500'
      : table.status === 'cleaning'
      ? 'bg-blue-500'
      : 'bg-gray-400';
  }
  switch (table.currentOrder?.status) {
    case 'pending':
    case 'preparing':
      return 'bg-amber-500';
    case 'completed':
      return 'bg-emerald-500';
    case 'paid':
      return 'bg-blue-500';
    case 'cancelled':
      return 'bg-gray-500';
    default:
      return 'bg-red-500';
  }
};

const TableCard: React.FC<{ table: TableWithOrder; selected: boolean; onClick: (t: Table) => void; }> = memo(({ table, selected, onClick }) => {
  return (
    <div
      onClick={() => onClick(table)}
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
        table.status === 'occupied' ? getOccupiedColorByOrderStatus(table.currentOrder?.status) : StatusColor[table.status]
      } ${selected ? 'ring-4 ring-blue-400' : ''}`}
    >
      <div className="text-center">
        <div className="text-xl font-bold mb-1">位 {table.number}</div>
        {table.status === 'occupied' && (
          <div className="text-[11px] text-black/70 dark:text-white/80 mb-1">
            {table.customers} 人
          </div>
        )}
        <div className="text-sm opacity-75 mb-2">
          {table.status === 'occupied' && table.currentOrder
            ? OrderStatusText[table.currentOrder.status]
            : StatusText[table.status]}
        </div>
        {table.status === 'occupied' && table.currentOrder && (
          <div className="text-xs">${table.currentOrder.total}</div>
        )}
      </div>
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getDotColor(table)}`} />
    </div>
  );
});

const Tables: React.FC = memo(() => {
  const tables = useTables();
  const orders = useOrders();
  const menuItems = useMenuItems();
  // ✅ 分別訂閱，避免 getSnapshot 緩存問題
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const addOrderWithTableUpdate = useAppStore((s) => s.addOrderWithTableUpdate);

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

  const onComplete = useCallback((_table: Table, currentOrder: Order | null) => (order: Order | null) => {
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
        // 使用組合動作，確保新增訂單與桌位狀態一體化更新
        addOrderWithTableUpdate(order);
      }
    } catch (error) {
      console.error('Error in onComplete callback:', error);
    }
  }, [addOrderWithTableUpdate, updateOrder]);

  const updateOrderStatusCb = useCallback((orderId: string, status: Order['status']) => {
    updateOrder(orderId, { status });
  }, [updateOrder]);

  const handleTableClick = useCallback((table: Table) => {
    if (!table || !table.id) return;
    const currentOrder = table.orderId ? ordersById.get(table.orderId as any) || null : null;
    // 若已結帳：不再自動建立新訂單，依賴手動釋放桌位
    if (currentOrder && currentOrder.status === 'paid') {
      return; // 保持桌位為佔用狀態，直到使用者在其他流程中手動釋放
    }
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
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">座位管理</h1>
            <p className="text-white/80 drop-shadow-md">管理餐廳座位狀態和客人需求</p>
          </div>
          <div className="flex rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-1">
            <button
              type="button"
              aria-pressed={viewMode === 'custom'}
              onClick={() => { setSelectedTable(null); setViewMode('custom'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'custom'
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              佈局模式
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'grid'}
              onClick={() => { setSelectedTable(null); setViewMode('grid'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              格狀檢視
            </button>
          </div>
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
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="text-sm text-white/70 drop-shadow-sm">總座位數</div>
          <div className="text-2xl font-bold text-white drop-shadow-md">{tableStats.total}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="text-sm text-white/70 drop-shadow-sm">空位</div>
          <div className="text-2xl font-bold text-emerald-400 drop-shadow-md">{tableStats.available}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="text-sm text-white/70 drop-shadow-sm">使用中</div>
          <div className="text-2xl font-bold text-amber-400 drop-shadow-md">{tableStats.occupied}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="text-sm text-white/70 drop-shadow-sm">使用率</div>
          <div className="text-2xl font-bold text-blue-400 drop-shadow-md">{tableStats.utilizationRate}%</div>
        </div>
      </div>
    </div>
  );
});

export default Tables;
