import React, { useState, useCallback, useMemo, memo } from 'react';
import { useTables, useOrders } from '@/stores';
import { Table, Order } from '../types';
import VisualOrderingInterface from './VisualOrderingInterface';
import TableLayoutEditor from './TableLayoutEditor';

type ViewMode = 'layout' | 'grid';

interface TableWithOrder extends Table {
  currentOrder: Order | null;
}

const Tables: React.FC = memo(() => {
  const tables = useTables();
  const orders = useOrders();
  const [showVisualOrdering, setShowVisualOrdering] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('layout');

  // 使用 useMemo 緩存計算結果
  const tableStats = useMemo(() => {
    const totalTables = tables.length;
    const availableTables = tables.filter((t: Table) => t.status === 'available').length;
    const occupiedTables = tables.filter((t: Table) => t.status === 'occupied').length;
    const utilizationRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;
    
    return {
      total: totalTables,
      available: availableTables,
      occupied: occupiedTables,
      utilizationRate
    };
  }, [tables]);

  // 使用 useMemo 緩存 tables 與 orders 的對應關係
  const tablesWithOrders = useMemo(() => {
    return tables.map((table: Table): TableWithOrder => ({
      ...table,
      currentOrder: table.orderId 
        ? orders.find((order: Order) => order.id === table.orderId) || null
        : null
    }));
  }, [tables, orders]);

  // 使用 useCallback 優化事件處理函數
  const handleTableClick = useCallback((table: Table) => {
    try {
      if (!table || !table.id) {
        alert('無效的桌位');
        return;
      }

      const currentOrder = table.orderId 
        ? orders.find((order: Order) => order.id === table.orderId)
        : null;
        
      if (table.status === 'available') {
        // 空桌，直接進入點餐
        setSelectedTable(table);
        setShowVisualOrdering(true);
      } else if (table.status === 'occupied' && currentOrder) {
        if (currentOrder.status === 'paid') {
          // 已結帳的訂單不能加點，需要新建訂單
          if (window.confirm('此桌已結帳，是否建立新訂單？')) {
            setSelectedTable(table);
            setShowVisualOrdering(true);
          }
        } else {
          // 有進行中的訂單，進入加點模式
          setSelectedTable(table);
          setShowVisualOrdering(true);
        }
      } else {
        alert(`桌位 ${table.number} 無法操作`);
      }
    } catch (error) {
      console.error('處理桌位點擊時發生錯誤:', error);
      alert('操作失敗，請重試');
    }
  }, [orders]);

  const handleCloseVisualOrdering = useCallback(() => {
    setShowVisualOrdering(false);
    setSelectedTable(null);
  }, []);

  const getTableStatusColor = useCallback((status: Table['status']): string => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-600 dark:text-emerald-300';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-300';
      case 'reserved':
        return 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-600 dark:text-amber-300';
      case 'cleaning':
        return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300';
    }
  }, []);

  const getStatusText = useCallback((status: Table['status']): string => {
    switch (status) {
      case 'available': return '空位';
      case 'occupied': return '使用中';
      case 'reserved': return '已預約';
      case 'cleaning': return '清潔中';
      default: return status;
    }
  }, []);

  if (showVisualOrdering && selectedTable) {
    const existingOrder = selectedTable.orderId ? orders.find((order: Order) => order.id === selectedTable.orderId) : null;
    const isAddOnMode = selectedTable.status === 'occupied' && existingOrder && existingOrder.status !== 'paid';
    
    return (
      <VisualOrderingInterface
        onOrderComplete={handleCloseVisualOrdering}
        initialTableNumber={selectedTable.number}
        initialCustomers={selectedTable.customers || 1}
        isAddOnMode={isAddOnMode}
        existingOrder={existingOrder}
        selectedTable={selectedTable}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            座位管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理餐廳座位狀態和客人需求
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setViewMode('layout')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'layout'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            佈局檢視
          </button>
          <button
            onClick={() => setViewMode('grid')}
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

      {/* Tables Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tablesWithOrders.map((table: TableWithOrder) => (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${getTableStatusColor(table.status)}`}
            >
              <div className="text-center">
                <div className="text-xl font-bold mb-2">位 {table.number}</div>
                <div className="text-sm opacity-75 mb-2">
                  {getStatusText(table.status)}
                </div>
                {table.status === 'occupied' && (
                  <div className="text-xs">
                    {table.customers} 人
                    {table.currentOrder && (
                      <div className="mt-1">
                        ${table.currentOrder.total}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Status Indicator */}
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                table.status === 'available' ? 'bg-emerald-500' :
                table.status === 'occupied' ? 'bg-red-500' :
                table.status === 'reserved' ? 'bg-amber-500' :
                'bg-blue-500'
              }`} />
            </div>
          ))}
        </div>
      ) : (
        // Layout View - 實際的桌位佈局編輯器
        <div style={{ minHeight: '600px' }}>
          <TableLayoutEditor />
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">總座位數</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {tableStats.total}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">空位</div>
          <div className="text-2xl font-bold text-emerald-600">
            {tableStats.available}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">使用中</div>
          <div className="text-2xl font-bold text-red-600">
            {tableStats.occupied}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">使用率</div>
          <div className="text-2xl font-bold text-blue-600">
            {tableStats.utilizationRate}%
          </div>
        </div>
      </div>
    </div>
  );
});

export default Tables;