import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import VisualOrderingInterface from './VisualOrderingInterface';

const Tables = () => {
  const { state, actions } = useApp();
  const [showVisualOrdering, setShowVisualOrdering] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableClick = (table) => {
    try {
      if (!table || !table.id) {
        alert('無效的桌位');
        return;
      }

      const currentOrder = table.currentOrder 
        ? state.orders.find(order => order.id === table.currentOrder)
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
          // 用餐中，可以查看/加點
          setSelectedTable(table);
          setShowVisualOrdering(true);
        }
      } else if (table.status === 'occupied' && !currentOrder) {
        // 桌位標記為佔用但沒有訂單 - 資料不一致
        console.warn('Table marked as occupied but no order found:', table);
        if (window.confirm('此桌位狀態異常，是否重設為空桌？')) {
          actions.updateTable(table.id, {
            status: 'available',
            customers: 0,
            currentOrder: null
          });
        }
      }
    } catch (error) {
      console.error('Error handling table click:', error);
      alert('處理桌位點擊時發生錯誤');
    }
  };

  const handleCheckout = (table) => {
    if (table.currentOrder) {
      // 結帳邏輯：將訂單狀態改為已結帳
      actions.updateOrder(table.currentOrder, { status: 'paid' });
      // 注意：這裡不立即釋放桌位，等客人離開後再釋放
    }
  };

  const handleReleaseTable = (table) => {
    if (window.confirm('確認客人已離開，釋放桌位？')) {
      // 簡單釋放桌位，保持訂單資料完整
      if (table.currentOrder) {
        actions.releaseTable(table.currentOrder);
      }
    }
  };

  const handleOrderComplete = (orderData) => {
    try {
      if (!orderData) {
        // 使用者取消了訂單
        setShowVisualOrdering(false);
        setSelectedTable(null);
        return;
      }

      // 驗證訂單資料
      if (!orderData.tableNumber || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        alert('訂單資料不完整，請重試');
        return;
      }

      // 檢查是否為加點模式
      const isAddOnMode = selectedTable && selectedTable.status === 'occupied' && selectedTable.currentOrder;
      const existingOrder = isAddOnMode 
        ? state.orders.find(order => order.id === selectedTable.currentOrder)
        : null;

      if (isAddOnMode && existingOrder && existingOrder.status !== 'paid') {
        // 加點模式：更新現有訂單
        const updatedItems = [...(existingOrder.items || []), ...orderData.items];
        const updatedTotal = (existingOrder.total || 0) + (orderData.total || 0);
        
        actions.updateOrder(existingOrder.id, {
          items: updatedItems,
          total: updatedTotal
        });
      } else {
        // 新訂單模式或已結帳後的新訂單
        if (isAddOnMode && existingOrder && existingOrder.status === 'paid') {
          // 已結帳的桌位創建新訂單，先釋放舊訂單關聯
          actions.updateTable(selectedTable.id, {
            currentOrder: null
          });
        }
        
        // 創建新訂單
        const newOrderId = Date.now().toString();
        const newOrder = {
          ...orderData,
          id: newOrderId,
          createdAt: new Date().toISOString()
        };
        
        actions.addOrder(newOrder);
        
        // 驗證桌號
        const tableId = parseInt(orderData.tableNumber);
        if (isNaN(tableId) || tableId <= 0) {
          alert('無效的桌號');
          return;
        }
        
        actions.updateTable(tableId, {
          status: 'occupied',
          customers: Math.max(1, Number(orderData.customers) || 1),
          currentOrder: newOrderId
        });
      }

      // 關閉所有模態框
      setShowVisualOrdering(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Error completing order:', error);
      alert('處理訂單時發生錯誤，請重試');
    }
  };

  const getTableStatusText = (status) => {
    switch (status) {
      case 'available': return '空桌';
      case 'occupied': return '用餐中';
      case 'cleaning': return '清潔中';
      default: return status;
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available': return 'border-green-500 bg-green-50 hover:bg-green-100';
      case 'occupied': return 'border-red-500 bg-red-50';
      case 'cleaning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">桌位管理</h1>
        <button
          onClick={() => {
            setSelectedTable(null);
            setShowVisualOrdering(true);
          }}
          className="btn btn-primary w-full sm:w-auto"
        >
          ➕ 新增訂單
        </button>
      </div>

      {/* 桌位狀態統計 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card text-center p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {state.tables.filter(t => t.status === 'available').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">空桌</div>
        </div>
        <div className="card text-center p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {state.tables.filter(t => t.status === 'occupied').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">用餐中</div>
        </div>
        <div className="card text-center p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">
            {state.tables.filter(t => t.status === 'cleaning').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">清潔中</div>
        </div>
      </div>

      {/* 桌位網格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {state.tables.map((table) => {
          const currentOrder = table.currentOrder 
            ? state.orders.find(order => order.id === table.currentOrder)
            : null;

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`table-card ${getTableStatusColor(table.status)} ${
                table.status === 'available' || table.status === 'occupied' ? 'cursor-pointer' : ''
              } min-h-[120px] sm:min-h-[140px]`}
            >
              <div className="text-center h-full flex flex-col justify-between">
                <div>
                  <div className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">桌 {table.number}</div>
                  <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                    table.status === 'available' ? 'text-green-600' :
                    table.status === 'occupied' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {getTableStatusText(table.status)}
                  </div>
                </div>
                
                {table.status === 'occupied' && (
                  <div className="space-y-1 sm:space-y-2 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-gray-600">
                      {table.customers} 人
                    </div>
                    {currentOrder && (
                      <>
                        <div className="text-xs text-gray-600">
                          訂單: #{currentOrder.id}
                        </div>
                        <div className="text-xs font-semibold">
                          ${currentOrder.total}
                        </div>
                        <div className={`text-xs px-1 sm:px-2 py-1 rounded-full ${
                          currentOrder.status === 'paid' 
                            ? 'bg-purple-100 text-purple-600' 
                            : currentOrder.status === 'completed' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {currentOrder.status === 'paid' ? '已結帳' : 
                           currentOrder.status === 'completed' ? '已完成' : '製作中'}
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-1 sm:mt-2">
                          {currentOrder.status !== 'completed' && currentOrder.status !== 'paid' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckout(table);
                              }}
                              className="btn btn-success text-xs py-1 w-full"
                            >
                              結帳
                            </button>
                          )}
                          
                          {currentOrder.status !== 'paid' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTable(table);
                                setShowVisualOrdering(true);
                              }}
                              className="btn btn-info text-xs py-1 w-full"
                            >
                              加點
                            </button>
                          )}
                          
                          {(currentOrder.status === 'completed' || currentOrder.status === 'paid') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReleaseTable(table);
                              }}
                              className="btn btn-warning text-xs py-1 w-full"
                            >
                              客人離開
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {table.status === 'available' && (
                  <div className="text-xs text-gray-500 mt-auto">
                    點擊新增訂單
                  </div>
                )}
                
                {table.status === 'occupied' && currentOrder && currentOrder.status !== 'paid' && (
                  <div className="text-xs text-gray-500 mt-1">
                    點擊可加點
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 視覺化點餐介面 */}
      {showVisualOrdering && (
        <VisualOrderingInterface
          onOrderComplete={handleOrderComplete}
          initialTableNumber={selectedTable?.number}
          initialCustomers={selectedTable?.customers || 1}
          isAddOnMode={selectedTable && selectedTable.status === 'occupied' && selectedTable.currentOrder}
          existingOrder={selectedTable && selectedTable.currentOrder 
            ? state.orders.find(order => order.id === selectedTable.currentOrder)
            : null
          }
        />
      )}
    </div>
  );
};

export default Tables;