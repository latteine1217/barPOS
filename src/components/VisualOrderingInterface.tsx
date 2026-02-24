import { useCallback, useEffect, useState } from 'react';
import { useTableStore } from '@/stores';
import { useVisualOrdering } from '@/hooks/business/useVisualOrdering';
import type { Order, Table, MenuItem, OrderStatus } from '@/types';

import { OrderingHeader } from './Ordering/OrderingHeader';
import { OrderingFilterBar } from './Ordering/OrderingFilterBar';
import { OrderingMenuGrid } from './Ordering/OrderingMenuGrid';
import { OrderingSummary } from './Ordering/OrderingSummary';

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
  const { initialTableNumber, existingOrder, onOrderComplete, updateOrderStatus, selectedTable } = props;

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
    updateOrderStatus(existingOrder.id, status);
    // Toast 成功提示
    showToast(`狀態已更新為「${status === 'pending' ? '待處理' : status === 'completed' ? '已完成' : status === 'paid' ? '已結帳' : status}」`);
  }, [existingOrder, showToast, updateOrderStatus]);

  // 釋放桌位
  const releaseTable = useTableStore((s) => s.releaseTable);
  const handleReleaseTable = useCallback(() => {
    if (!selectedTable || !existingOrder) return;
    if (currentStatus !== 'paid') {
      showToast('尚未結帳');
      return;
    }

    releaseTable(existingOrder.id);
    showToast(`已釋放桌位 ${selectedTable.number}`);
    // 關閉視窗
    onOrderComplete(null);
  }, [selectedTable, existingOrder, currentStatus, releaseTable, onOrderComplete, showToast]);

  // Adjustment (surcharge/discount before tip)
  const [adjustment, setAdjustment] = useState<number>(0);

  // Tip state
  const [tipEnabled, setTipEnabled] = useState<boolean>(false);
  const [tipPercent, setTipPercent] = useState<number>(10);

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
        status: currentStatus,
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
    currentStatus,
    setError,
    adjustment,
    tipEnabled,
    tipPercent
  ]);

  const [query, setQuery] = useState('');
  const displayItems = filteredMenuItems.filter(mi =>
    !query.trim() || mi.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <OrderingHeader
        isAddOnMode={props.isAddOnMode}
        query={query}
        setQuery={setQuery}
        selectedTable={props.selectedTable}
        initialTableNumber={props.initialTableNumber}
        orderDetails={orderDetails}
        updateOrderDetails={updateOrderDetails}
      />

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
          <OrderingFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            availableBaseSpirits={availableBaseSpirits}
            selectedBaseSpirit={selectedBaseSpirit}
            setSelectedBaseSpirit={setSelectedBaseSpirit}
          />

          <OrderingMenuGrid
            displayItems={displayItems}
            addToOrder={addToOrder}
          />
        </div>

        {/* Order Summary */}
        <OrderingSummary
          orderItems={orderItems}
          updateQuantity={updateQuantity}
          removeFromOrder={removeFromOrder}
          orderDetails={orderDetails}
          updateOrderDetails={updateOrderDetails}
          existingOrder={existingOrder}
          currentStatus={currentStatus}
          handleStatusChange={handleStatusChange}
          handleReleaseTable={handleReleaseTable}
          adjustment={adjustment}
          setAdjustment={setAdjustment}
          tipEnabled={tipEnabled}
          setTipEnabled={setTipEnabled}
          tipPercent={tipPercent}
          setTipPercent={setTipPercent}
          totalAmount={totalAmount}
          validation={validation}
          handleConfirmOrder={handleConfirmOrder}
          clearOrder={clearOrder}
          onCancel={() => props.onOrderComplete(null)}
          isAddOnMode={props.isAddOnMode}
        />
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
