import { useCallback } from 'react';
import { useVisualOrdering } from '@/hooks/business/useVisualOrdering';
import type { Order, Table, MenuItem, OrderStatus } from '@/types';

interface VisualOrderingInterfaceProps {
  onOrderComplete: (orderData: Order | null) => void;
  initialTableNumber?: number;
  initialCustomers?: number;
  isAddOnMode?: boolean;
  existingOrder?: Order;
  selectedTable?: Table;
  menuItems: MenuItem[];
  availableTables?: Table[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const VisualOrderingInterface = (props: VisualOrderingInterfaceProps) => {
  // ✅ 使用新的自定義 hook
  const {
    orderItems,
    selectedCategory,
    selectedBaseSpirit,
    orderDetails,
    error,
    categories,
    availableBaseSpirits,
    filteredMenuItems,
    totalAmount,
    validation,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    updateOrderDetails,
    setSelectedCategory,
    setSelectedBaseSpirit,
    setError
  } = useVisualOrdering({
    menuItems: props.menuItems,
    initialTableNumber: props.initialTableNumber,
    initialCustomers: props.initialCustomers,
    isAddOnMode: props.isAddOnMode,
    existingOrder: props.existingOrder
  });

  // ✅ 修復：解構 props 以避免依賴問題
  const { initialTableNumber, existingOrder, onOrderComplete } = props;

  // ✅ 簡化的確認訂單邏輯
  const handleConfirmOrder = useCallback(() => {
    try {
      if (!validation.isValid) {
        if (validation.errors.noItems) {
          setError('請添加至少一個餐點');
          return;
        }
        if (validation.errors.noTable) {
          setError('請選擇桌號');
          return;
        }
      }

      const tableNumber = initialTableNumber || orderDetails.tableNumber;
      const orderData: Order = {
        id: existingOrder?.id || `order-${Date.now()}`,
        tableNumber: Number(tableNumber),
        customers: orderDetails.customers,
        items: orderItems,
        subtotal: totalAmount,
        total: totalAmount,
        status: existingOrder?.status || 'pending',
        notes: orderDetails.notes,
        createdAt: existingOrder?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onOrderComplete(orderData);
      setError(null);
    } catch {
      setError('確認訂單時發生錯誤，請重試');
    }
  }, [
    validation,
    initialTableNumber,
    existingOrder,
    onOrderComplete,
    orderDetails,
    orderItems,
    totalAmount,
    setError
  ]);

  const getCategoryDisplayName = (category: string) => {
    if (category === 'all') return '全部';
    return category || '其他';
  };

  const getBaseSpiritDisplayName = (spirit: string) => {
    const spiritNames: Record<string, string> = {
      all: '全部',
      gin: 'Gin 琴酒',
      vodka: 'Vodka 伏特加',
      rum: 'Rum 蘭姆酒',
      whiskey: 'Whiskey 威士忌',
      tequila: 'Tequila 龍舌蘭',
      brandy: 'Brandy 白蘭地',
      liqueur: 'Liqueur 利口酒',
      none: '無酒精'
    };
    return spiritNames[spirit] || spirit;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {props.isAddOnMode ? '加點餐點' : '新增訂單'}
          </h2>
          {props.selectedTable && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              桌位 {props.selectedTable.number}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            總計: ${totalAmount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {orderItems.length} 項餐點
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col">
          {/* Category Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>

            {/* Base Spirit Filter */}
            {availableBaseSpirits.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {availableBaseSpirits.map((spirit) => (
                  <button
                    key={spirit}
                    onClick={() => setSelectedBaseSpirit(spirit)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedBaseSpirit === spirit
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {getBaseSpiritDisplayName(spirit)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMenuItems.map((menuItem) => (
                <div
                  key={menuItem.id}
                  onClick={() => addToOrder(menuItem)}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {menuItem.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {menuItem.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-600">
                      ${menuItem.price}
                    </span>
                    {menuItem.available !== false && (
                      <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        加入
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              訂單明細
            </h3>
            
            {/* Order Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {orderItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-500">${item.price}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromOrder(index)}
                      className="w-6 h-6 flex items-center justify-center bg-red-200 text-red-600 rounded"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {orderItems.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                尚未選擇餐點
              </p>
            )}
          </div>

          {/* Order Details Form */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {!props.initialTableNumber && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  桌號
                </label>
                <input
                  type="number"
                  value={orderDetails.tableNumber}
                  onChange={(e) => updateOrderDetails({ tableNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="請輸入桌號"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                人數
              </label>
              <input
                type="number"
                value={orderDetails.customers}
                onChange={(e) => updateOrderDetails({ customers: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                備註
              </label>
              <textarea
                value={orderDetails.notes}
                onChange={(e) => updateOrderDetails({ notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="特殊需求或備註"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 mt-auto">
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleConfirmOrder}
                disabled={!validation.isValid}
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  validation.isValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {props.isAddOnMode ? '確認加點' : '確認訂單'}
              </button>
              
              {orderItems.length > 0 && (
                <button
                  onClick={clearOrder}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  清空訂單
                </button>
              )}
              
              <button
                onClick={() => props.onOrderComplete(null)}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualOrderingInterface;