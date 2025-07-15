import { useState, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import VisualOrderingInterface from './VisualOrderingInterface';

const Tables = () => {
  const { state, actions } = useApp();
  const [showVisualOrdering, setShowVisualOrdering] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [viewMode, setViewMode] = useState('layout'); // 'layout' 或 'grid'

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
          total: updatedTotal,
          customers: orderData.customers || existingOrder.customers
        });

        // 如果人數有變化，同時更新桌位資訊
        if (orderData.customers !== existingOrder.customers) {
          actions.updateTable(selectedTable.id, {
            customers: orderData.customers
          });
        }

        alert(`成功加點！新增 ${orderData.items.length} 項餐點，金額 $${orderData.total}`);
      } else {
        // 新訂單模式
        const finalOrderData = {
          ...orderData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          status: 'pending'
        };

        // 新增訂單
        actions.addOrder(finalOrderData);
        alert(`訂單建立成功！桌位 ${finalOrderData.tableNumber}，金額 $${finalOrderData.total}`);
      }

      // 關閉界面
      setShowVisualOrdering(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Error completing order:', error);
      alert('建立訂單時發生錯誤，請重試');
    }
  };

  const getTableStatusText = (status) => {
    switch (status) {
      case 'available': return '空桌';
      case 'occupied': return '用餐中';
      case 'cleaning': return '清潔中';
      default: return '未知狀態';
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

  // 獲取自定義佈局桌位樣式
  const getLayoutTableStyle = useCallback((table) => {
    const tableSizes = {
      small: { width: 60, height: 60 },
      medium: { width: 80, height: 80 },
      large: { width: 100, height: 100 },
      xlarge: { width: 120, height: 80 }
    };

    const size = tableSizes[table.size] || tableSizes.medium;
    const baseStyle = {
      position: 'absolute',
      left: `${table.position.x}px`,
      top: `${table.position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: '2px solid',
      fontSize: '12px',
      fontWeight: 'bold',
      userSelect: 'none',
      transition: 'all 0.2s ease',
      padding: '4px'
    };

    // 根據狀態設定顏色
    if (table.status === 'occupied') {
      baseStyle.backgroundColor = '#fef3c7';
      baseStyle.borderColor = '#f59e0b';
      baseStyle.color = '#92400e';
    } else if (table.status === 'available') {
      baseStyle.backgroundColor = '#f0f9ff';
      baseStyle.borderColor = '#0ea5e9';
      baseStyle.color = '#0c4a6e';
    } else {
      baseStyle.backgroundColor = '#fef3c7';
      baseStyle.borderColor = '#eab308';
      baseStyle.color = '#a16207';
    }

    // 桌位形狀
    if (table.shape === 'round') {
      baseStyle.borderRadius = '50%';
    } else if (table.shape === 'rectangular') {
      baseStyle.width = `${size.width * 1.5}px`;
      baseStyle.borderRadius = '8px';
    } else {
      baseStyle.borderRadius = '8px';
    }

    // VIP 桌位特殊樣式
    if (table.type === 'vip') {
      baseStyle.background = 'linear-gradient(45deg, #fef3c7, #fde68a)';
      baseStyle.borderColor = '#d97706';
    }

    return baseStyle;
  }, []);

  // 渲染自定義佈局模式
  const renderLayoutMode = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div
          className="relative bg-gray-50 border-2 border-dashed border-gray-300 overflow-auto"
          style={{
            width: `${state.layoutConfig.canvasWidth}px`,
            height: `${state.layoutConfig.canvasHeight}px`,
            maxWidth: '100%',
            minHeight: '400px'
          }}
        >
          {/* 網格背景 */}
          {state.layoutConfig.showGrid && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #d1d5db 1px, transparent 1px),
                  linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
                `,
                backgroundSize: `${state.layoutConfig.gridSize}px ${state.layoutConfig.gridSize}px`
              }}
            />
          )}

          {/* 桌位 */}
          {state.tables.map(table => {
            const currentOrder = table.currentOrder 
              ? state.orders.find(order => order.id === table.currentOrder)
              : null;

            return (
              <div
                key={table.id}
                style={getLayoutTableStyle(table)}
                onClick={() => handleTableClick(table)}
                className="text-center hover:shadow-lg"
              >
                <div className="font-bold text-xs truncate max-w-full mb-1">
                  {table.name || `桌 ${table.number}`}
                </div>
                {table.status === 'occupied' && (
                  <div className="text-xs opacity-75">
                    {currentOrder?.customers || table.customers || 0}人
                  </div>
                )}
                {table.status === 'occupied' && currentOrder && (
                  <div className="text-xs mt-1">
                    ${currentOrder.total}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染網格模式
  const renderGridMode = () => {
    // 桌位大小選項 (用於顯示)
    const tableSizes = {
      small: { label: '2人桌' },
      medium: { label: '4人桌' },
      large: { label: '6人桌' },
      xlarge: { label: '8人桌' }
    };

    return (
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
                  <div className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
                    {table.name || `桌 ${table.number}`}
                  </div>
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
                      {currentOrder?.customers || table.customers || 0} 人 | {tableSizes[table.size]?.label || '4人桌'}
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
                              釋放桌位
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">桌位管理</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'layout' ? 'grid' : 'layout')}
            className="btn bg-gray-500 hover:bg-gray-600 text-white"
          >
            {viewMode === 'layout' ? '🔲 網格檢視' : '🎨 佈局檢視'}
          </button>
          <button
            onClick={() => {
              setSelectedTable(null);
              setShowVisualOrdering(true);
            }}
            className="btn btn-primary"
          >
            ➕ 新增訂單
          </button>
        </div>
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

      {/* 提示文字 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          {viewMode === 'layout' 
            ? '🎨 佈局檢視模式：顯示真實店內桌位排列。點擊「佈局編輯」可自定義桌位位置和屬性。'
            : '🔲 網格檢視模式：以網格方式顯示所有桌位資訊，適合快速操作。'
          }
        </p>
      </div>

      {/* 桌位顯示區域 */}
      {viewMode === 'layout' ? renderLayoutMode() : renderGridMode()}

      {/* 視覺化點餐界面 */}
      {showVisualOrdering && (
        <VisualOrderingInterface
          selectedTable={selectedTable}
          initialTableNumber={selectedTable?.number}
          initialCustomers={selectedTable?.customers || 1}
          isAddOnMode={selectedTable && selectedTable.status === 'occupied' && selectedTable.currentOrder}
          existingOrder={selectedTable && selectedTable.currentOrder 
            ? state.orders.find(order => order.id === selectedTable.currentOrder) 
            : null}
          onClose={() => {
            setShowVisualOrdering(false);
            setSelectedTable(null);
          }}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </div>
  );
};

export default Tables;