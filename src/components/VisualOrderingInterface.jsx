import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const VisualOrderingInterface = ({ onOrderComplete, initialTableNumber, initialCustomers, isAddOnMode, existingOrder, selectedTable }) => {
  const { state, actions } = useApp();
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderDetails, setOrderDetails] = useState({
    tableNumber: initialTableNumber || '',
    customers: initialCustomers || 1,
    notes: ''
  });
  const [viewMode, setViewMode] = useState(() => {
    if (isAddOnMode && existingOrder) {
      return 'add'; // 加點模式
    }
    return 'new'; // 新訂單模式
  }); // 'new', 'add', 'view'
  const [error, setError] = useState(null);

  // 安全的取得分類列表
  const categories = (() => {
    try {
      if (!state?.menuItems || !Array.isArray(state.menuItems)) {
        return ['all'];
      }
      return ['all', ...new Set(state.menuItems.map(item => item?.category).filter(Boolean))];
    } catch (err) {
      console.error('Error getting categories:', err);
      setError('無法載入菜單分類');
      return ['all'];
    }
  })();

  // 安全的過濾菜單項目
  const filteredMenuItems = (() => {
    try {
      if (!state?.menuItems || !Array.isArray(state.menuItems)) {
        return [];
      }
      return selectedCategory === 'all' 
        ? state.menuItems 
        : state.menuItems.filter(item => item?.category === selectedCategory);
    } catch (err) {
      console.error('Error filtering menu items:', err);
      setError('無法載入菜單項目');
      return [];
    }
  })();

  const addToOrder = (menuItem) => {
    try {
      if (!menuItem || typeof menuItem.id === 'undefined') {
        throw new Error('無效的菜單項目');
      }

      const existingItemIndex = orderItems.findIndex(item => item.menuItemId === menuItem.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...orderItems];
        updatedItems[existingItemIndex].quantity += 1;
        setOrderItems(updatedItems);
      } else {
        setOrderItems([...orderItems, {
          menuItemId: menuItem.id,
          name: menuItem.name || '未知餐點',
          price: Number(menuItem.price) || 0,
          quantity: 1
        }]);
      }
      setError(null); // 清除錯誤
    } catch (err) {
      console.error('Error adding to order:', err);
      setError('新增餐點時發生錯誤');
    }
  };

  const removeFromOrder = (itemIndex) => {
    try {
      if (itemIndex < 0 || itemIndex >= orderItems.length) {
        throw new Error('無效的項目索引');
      }
      const updatedItems = orderItems.filter((_, index) => index !== itemIndex);
      setOrderItems(updatedItems);
      setError(null);
    } catch (err) {
      console.error('Error removing from order:', err);
      setError('移除餐點時發生錯誤');
    }
  };

  const updateQuantity = (itemIndex, newQuantity) => {
    try {
      if (itemIndex < 0 || itemIndex >= orderItems.length) {
        throw new Error('無效的項目索引');
      }

      const quantity = Number(newQuantity);
      if (isNaN(quantity) || quantity < 0) {
        throw new Error('無效的數量');
      }

      if (quantity <= 0) {
        removeFromOrder(itemIndex);
        return;
      }
      
      const updatedItems = [...orderItems];
      updatedItems[itemIndex].quantity = quantity;
      setOrderItems(updatedItems);
      setError(null);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('更新數量時發生錯誤');
    }
  };

  const calculateTotal = () => {
    try {
      if (!Array.isArray(orderItems)) return 0;
      return orderItems.reduce((total, item) => {
        const price = Number(item?.price) || 0;
        const quantity = Number(item?.quantity) || 0;
        return total + (price * quantity);
      }, 0);
    } catch (err) {
      console.error('Error calculating total:', err);
      setError('計算總額時發生錯誤');
      return 0;
    }
  };

  const handleConfirmOrder = () => {
    try {
      // 當有預選桌號時，使用預選桌號；否則檢查是否已選擇桌號
      const tableNumber = initialTableNumber || orderDetails.tableNumber;
      
      if (!tableNumber || (viewMode !== 'view' && orderItems.length === 0)) {
        alert(viewMode === 'add' ? '請添加至少一個餐點' : '請選擇桌號並添加至少一個餐點');
        return;
      }

      if (viewMode === 'view') {
        // 只是查看模式，關閉介面
        onOrderComplete(null);
        return;
      }

      // 驗證桌號
      const parsedTableNumber = parseInt(tableNumber);
      if (isNaN(parsedTableNumber) || parsedTableNumber <= 0) {
        alert('請選擇有效的桌號');
        return;
      }

      // 驗證人數
      const customers = Number(orderDetails.customers);
      if (isNaN(customers) || customers <= 0) {
        alert('請輸入有效的人數');
        return;
      }

      // 構建訂單資料 (包括新訂單和加點)
      const order = {
        tableNumber: parsedTableNumber,
        customers: customers,
        items: orderItems,
        total: calculateTotal(),
        status: 'pending',
        notes: orderDetails.notes || ''
      };

      // 將訂單資料傳回給父組件處理
      onOrderComplete(order);
      setError(null);
    } catch (err) {
      console.error('Error confirming order:', err);
      setError('確認訂單時發生錯誤，請重試');
    }
  };

  const handleStatusChange = (newStatus) => {
    try {
      if (!existingOrder) {
        throw new Error('找不到現有訂單');
      }
      if (!newStatus) {
        throw new Error('無效的狀態');
      }
      actions.updateOrder(existingOrder.id, { status: newStatus });
      setError(null);
    } catch (err) {
      console.error('Error changing status:', err);
      setError('更新訂單狀態時發生錯誤');
    }
  };

  const handleReleaseTable = () => {
    try {
      if (!existingOrder) {
        throw new Error('找不到現有訂單');
      }
      if (window.confirm('確認要釋放此桌位嗎？訂單資料將保留以供統計使用。')) {
        actions.releaseTable(existingOrder.id);
        onOrderComplete(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error releasing table:', err);
      setError('釋放桌位時發生錯誤');
    }
  };

  const getCategoryDisplayName = (category) => {
    if (category === 'all') return '全部';
    return category || '其他';
  };

  // 顯示錯誤訊息
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <h2 className="text-xl font-bold text-red-600 mb-4">系統錯誤</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setError(null)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              重試
            </button>
            <button
              onClick={() => onOrderComplete(null)}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col lg:flex-row z-50">
      {/* 左側：菜單網格 */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-white">
              {isAddOnMode ? 
                `${selectedTable?.name || `桌 ${initialTableNumber}`} - 加點` : 
                selectedTable?.name ? `${selectedTable.name} - 新訂單` : '選擇餐點'
              }
            </h2>
            {/* 移動端關閉按鈕 */}
            <button
              onClick={() => onOrderComplete(null)}
              className="lg:hidden p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 分類標籤 */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 dark:bg-gray-600 text-gray-300 dark:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-500'
                }`}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>

          {/* 菜單網格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4">
            {filteredMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToOrder(item)}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left"
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-xs sm:text-sm">
                  {item.name}
                </div>
                <div className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-lg">
                  ${item.price}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {item.category}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右側：訂單詳情與控制 */}
      <div className="w-full lg:w-96 bg-white dark:bg-gray-800 flex flex-col max-h-[50vh] lg:max-h-full">
        <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
          {/* 模式切換按鈕 */}
          {isAddOnMode && existingOrder && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setViewMode('view')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'view'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                查看訂單
              </button>
              <button
                onClick={() => setViewMode('add')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'add'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                繼續加點
              </button>
            </div>
          )}

          <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
            {viewMode === 'view' ? '當前訂單詳情' :
             viewMode === 'add' ? '新增餐點' : '新增訂單'}
          </h3>
          
          {/* 顯示現有訂單資訊（查看模式或加點模式） */}
          {existingOrder && (viewMode === 'view' || viewMode === 'add') && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                {viewMode === 'view' ? '完整訂單' : '現有訂單'}
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                <p>訂單編號：#{existingOrder.id}</p>
                <p>桌號：{selectedTable?.name || `桌 ${existingOrder.tableNumber}`}</p>
                <p>人數：{existingOrder.customers || initialCustomers} 人</p>
                <p>狀態：
                  <span className={`px-2 py-1 rounded-full text-xs ml-1 ${
                    existingOrder.status === 'paid' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' :
                    existingOrder.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300' :
                    existingOrder.status === 'preparing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' :
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300'
                  }`}>
                    {existingOrder.status === 'paid' ? '已結帳' :
                     existingOrder.status === 'completed' ? '已完成' :
                     existingOrder.status === 'preparing' ? '製作中' : '待處理'}
                  </span>
                </p>
                <p className="font-semibold">訂單金額：${existingOrder.total}</p>
                {existingOrder.notes && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">備註：</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50 p-2 rounded border border-blue-100 dark:border-blue-700">
                        {existingOrder.notes}
                      </p>
                    </div>                )}
              </div>
              
              {viewMode === 'view' && (
                <div className="space-y-2">
                  <h5 className="font-medium text-blue-800 dark:text-blue-300">餐點明細：</h5>
                  {existingOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${item.price * item.quantity}</span>
                    </div>
                  )) || <p className="text-sm text-gray-500 dark:text-gray-400">無餐點資訊</p>}
                </div>
              )}
            </div>
          )}
          
          {/* 桌號和人數 */}
          {viewMode !== 'view' && (
            <>
              {!isAddOnMode && !initialTableNumber && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="form-label">桌號</label>
                    <select
                      value={orderDetails.tableNumber}
                      onChange={(e) => setOrderDetails({ ...orderDetails, tableNumber: e.target.value })}
                      className="form-input text-sm"
                      required
                    >
                      <option value="">選擇桌號</option>
                       {state.tables
                         .filter(table => table.status === 'available')
                         .map(table => (
                           <option key={table.id} value={table.number}>
                             {table.name || `桌 ${table.number}`}
                           </option>
                         ))}                    </select>
                  </div>
                  <div>
                    <label className="form-label">人數</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderDetails({ 
                          ...orderDetails, 
                          customers: Math.max(1, orderDetails.customers - 1) 
                        })}
                        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-sm font-medium text-gray-900 dark:text-white">
                        {orderDetails.customers} 人
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderDetails({ 
                          ...orderDetails, 
                          customers: Math.min(20, orderDetails.customers + 1) 
                        })}
                        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {(isAddOnMode || initialTableNumber) && (
                <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>桌號：</strong>{selectedTable?.name || `桌 ${initialTableNumber}`}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">人數</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOrderDetails({ 
                            ...orderDetails, 
                            customers: Math.max(1, orderDetails.customers - 1) 
                          })}
                          disabled={isAddOnMode}
                          className="w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm text-gray-900 dark:text-white">
                          {orderDetails.customers} 人
                        </span>
                        <button
                          type="button"
                          onClick={() => setOrderDetails({ 
                            ...orderDetails, 
                            customers: Math.min(20, orderDetails.customers + 1) 
                          })}
                          disabled={isAddOnMode}
                          className="w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 備註欄位 */}
              {!isAddOnMode && (
                <div className="mb-6">
                  <label className="form-label">備註 (可選)</label>
                  <textarea
                    value={orderDetails.notes}
                    onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })}
                    placeholder="客人的特殊需求、口味調整等..."
                    className="form-input text-sm resize-none"
                    rows="3"
                  />
                </div>
              )}
            </>
          )}

          {/* 訂單項目或狀態管理 */}
          {viewMode === 'view' && existingOrder ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">訂單管理</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  disabled={existingOrder.status === 'pending'}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    existingOrder.status === 'pending'
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  待處理
                </button>
                <button
                  onClick={() => handleStatusChange('preparing')}
                  disabled={existingOrder.status === 'preparing'}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    existingOrder.status === 'preparing'
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  製作中
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={existingOrder.status === 'completed'}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    existingOrder.status === 'completed'
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  已完成
                </button>
                <button
                  onClick={() => handleStatusChange('paid')}
                  disabled={existingOrder.status === 'paid'}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    existingOrder.status === 'paid'
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  已結帳
                </button>
              </div>
              <button
                onClick={handleReleaseTable}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                釋放桌位
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {viewMode === 'add' ? '尚未選擇要加點的餐點' : '尚未選擇任何餐點'}
                </p>
              ) : (
                orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">${item.price} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm text-gray-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromOrder(index)}
                        className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 底部：總計和按鈕 */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {viewMode !== 'view' && (
            <>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {viewMode === 'add' ? '新增金額' : '總計'}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">${calculateTotal()}</span>
              </div>
              
              {viewMode === 'add' && existingOrder && (
                <div className="flex justify-between items-center mb-3 sm:mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">最終總計</span>
                  <span className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300">
                    ${existingOrder.total + calculateTotal()}
                  </span>
                </div>
              )}
            </>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onOrderComplete(null)}
              className="flex-1 px-4 py-2 sm:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              {viewMode === 'view' ? '關閉' : '取消'}
            </button>
            {viewMode !== 'view' && (
              <button
                onClick={handleConfirmOrder}
                disabled={orderItems.length === 0 || (viewMode === 'new' && !initialTableNumber && !orderDetails.tableNumber)}
                className="flex-1 px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                {viewMode === 'add' ? '確認加點' : '確認訂單'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualOrderingInterface;