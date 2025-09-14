import { useCallback, useEffect, useState } from 'react';
import { pickEmojiForItem, pickStripeColor } from '@/config/menuVisualConfig';
import { useTableStore } from '@/stores';
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

  // 訂單狀態控制（僅針對既有訂單顯示與更新）
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(existingOrder?.status ?? 'pending');
  useEffect(() => {
    setCurrentStatus(existingOrder?.status ?? 'pending');
  }, [existingOrder?.status]);

  // 簡易 Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  }, []);

  const handleStatusChange = useCallback((status: OrderStatus) => {
    if (!existingOrder) return;
    setCurrentStatus(status);
    props.updateOrderStatus(existingOrder.id, status);
    // Toast 成功提示
    showToast(`狀態已更新為「${status === 'pending' ? '待處理' : status === 'completed' ? '已完成' : status === 'paid' ? '已結帳' : status}」`);
  }, [existingOrder, props, showToast]);

  // 釋放桌位
  const updateTable = useTableStore((s) => s.updateTable);
  const handleReleaseTable = useCallback(() => {
    if (!props.selectedTable) return;
    updateTable(props.selectedTable.id, { status: 'available', orderId: null as any, customers: 0 });
    showToast(`已釋放桌位 ${props.selectedTable.number}`);
    // 關閉視窗
    onOrderComplete(null);
  }, [props.selectedTable, updateTable, onOrderComplete, showToast]);

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
      const subtotal = totalAmount;
      const base = subtotal + (Number.isFinite(adjustment) ? adjustment : 0);
      const tip = tipEnabled ? Math.round(base * (tipPercent / 100)) : 0;
      const payable = base + tip;

      const orderData: Order = {
        id: existingOrder?.id || `order-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        tableNumber: Number(tableNumber),
        customers: orderDetails.customers,
        items: orderItems,
        subtotal,
        total: payable,
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

  const [query, setQuery] = useState('');
  const displayItems = filteredMenuItems.filter(mi =>
    !query.trim() || mi.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  // Adjustment (surcharge/discount before tip)
  const [adjustment, setAdjustment] = useState<number>(0);

  // Tip state
  const [tipEnabled, setTipEnabled] = useState<boolean>(false);
  const [tipPercent, setTipPercent] = useState<number>(10);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header / Search */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0">
          {props.isAddOnMode ? '加點餐點' : '新增訂單'}
        </h2>
        {/* People count (left of table badge) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateOrderDetails({ customers: Math.max(1, (orderDetails.customers || 1) - 1) })}
            className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            value={orderDetails.customers}
            onChange={(e) => updateOrderDetails({ customers: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-16 text-center px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={() => updateOrderDetails({ customers: (orderDetails.customers || 1) + 1 })}
            className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            +
          </button>
        </div>
        {props.selectedTable && (
          <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            桌位 {props.selectedTable.number}
          </div>
        )}
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋品項..."
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">${totalAmount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{orderItems.length} 項</div>
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
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    selectedCategory === category
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
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
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedBaseSpirit === spirit
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
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
              {displayItems.map((menuItem) => (
                <div
                  key={menuItem.id}
                  onClick={() => addToOrder(menuItem)}
                  className="relative rounded-2xl border p-4 cursor-pointer hover:shadow-lg transition-all bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] text-center"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: pickStripeColor(menuItem) }} />
                  <div className="text-4xl mb-2 select-none">{pickEmojiForItem(menuItem)}</div>
                  <h3 className="font-medium text-gray-900 dark:text-white whitespace-normal break-words leading-snug">
                    {menuItem.name}
                  </h3>
                  <div className="text-sm font-semibold text-[var(--color-accent)] mt-1">${menuItem.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-[360px] border-l border-gray-200 dark:border-gray-700 flex flex-col">
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

            {/* 人數已移至頂部工具列 */}
            
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

          {/* Order Status Controls (existing orders) */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">訂單狀態</h3>
            {existingOrder ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    currentStatus === 'pending'
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  待處理
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    currentStatus === 'completed'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  已完成
                </button>
                <button
                  onClick={() => handleStatusChange('paid')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    currentStatus === 'paid'
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  已結帳
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">建立訂單後可變更狀態</p>
            )}
            {existingOrder && currentStatus === 'paid' && (
              <div className="mt-4">
                <button
                  onClick={handleReleaseTable}
                  className="w-full py-2 px-4 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  釋放桌位
                </button>
              </div>
            )}
          </div>

          {/* Adjustment then Service Fee toggle */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">加價 / 折價</h4>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setAdjustment(v => (Number.isFinite(v) ? v : 0) - 10)} className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">-</button>
              <input
                type="number"
                step={10}
                value={adjustment}
                onChange={(e) => setAdjustment(Number(e.target.value) || 0)}
                className="w-24 text-center px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />
              <button type="button" onClick={() => setAdjustment(v => (Number.isFinite(v) ? v : 0) + 10)} className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">+</button>
              <span className="text-xs text-gray-500 dark:text-gray-400">先於服務費計算</span>
            </div>
          </div>

          {/* Service fee toggle */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">服務費</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">開啟後可加入百分比服務費</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={tipEnabled}
                onClick={() => setTipEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tipEnabled ? 'bg-[var(--color-accent)]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${tipEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            {tipEnabled && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">比例</label>
                <select
                  value={tipPercent}
                  onChange={(e) => setTipPercent(parseInt(e.target.value) || 0)}
                  className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  {[5,10,12,15,18,20].map((p) => (
                    <option key={p} value={p}>{p}%</option>
                  ))}
                </select>
                <span className="text-xs text-gray-600 dark:text-gray-400">服務費：${Math.round((totalAmount + (Number.isFinite(adjustment) ? adjustment : 0)) * (tipPercent/100))}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto sticky bottom-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200 dark:border-gray-700">
            {/* Compact service fee toggle (fixed at bottom) */}
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">服務費</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={tipEnabled}
                  onClick={() => setTipEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tipEnabled ? 'bg-[var(--color-accent)]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${tipEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                {tipEnabled && (
                  <select
                    value={tipPercent}
                    onChange={(e) => setTipPercent(parseInt(e.target.value) || 0)}
                    className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    {[5,10,12,15,18,20].map((p) => (<option key={p} value={p}>{p}%</option>))}
                  </select>
                )}
              </div>
            </div>
            {/* Totals */}
            <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between"><span>小計</span><span>${totalAmount}</span></div>
              <div className="flex justify-between"><span>加價/折價</span><span>${Number.isFinite(adjustment) ? adjustment : 0}</span></div>
              <div className="flex justify-between"><span>服務費{tipEnabled ? ` (${tipPercent}%)` : ''}</span><span>${tipEnabled ? Math.round((totalAmount + (Number.isFinite(adjustment) ? adjustment : 0)) * (tipPercent/100)) : 0}</span></div>
              <div className="flex justify-between font-semibold text-gray-900 dark:text-white mt-1"><span>應付金額</span><span>${(totalAmount + (Number.isFinite(adjustment) ? adjustment : 0)) + (tipEnabled ? Math.round((totalAmount + (Number.isFinite(adjustment) ? adjustment : 0)) * (tipPercent/100)) : 0)}</span></div>
            </div>
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
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[110]">
          <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualOrderingInterface;
