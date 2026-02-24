import React from 'react';
import type { Order, OrderItem, OrderStatus } from '@/types';

interface OrderDetails {
  tableNumber: number | string;
  customers: number;
  notes: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: {
    noItems: boolean;
    noTable: boolean;
    invalidCustomers: boolean;
  };
}

interface OrderingSummaryProps {
  orderItems: OrderItem[];
  updateQuantity: (index: number, quantity: number) => void;
  removeFromOrder: (index: number) => void;
  orderDetails: OrderDetails;
  updateOrderDetails: (details: Partial<OrderDetails>) => void;
  existingOrder?: Order | undefined;
  currentStatus: OrderStatus;
  handleStatusChange: (status: OrderStatus) => void;
  handleReleaseTable: () => void;
  adjustment: number;
  setAdjustment: (value: number) => void; // React state setter
  tipEnabled: boolean;
  setTipEnabled: (value: React.SetStateAction<boolean>) => void; // React state setter
  tipPercent: number;
  setTipPercent: (value: number) => void; // React state setter
  totalAmount: number;
  validation: ValidationResult;
  handleConfirmOrder: () => void;
  clearOrder: () => void;
  onCancel: () => void;
  isAddOnMode?: boolean | undefined;
}

export const OrderingSummary: React.FC<OrderingSummaryProps> = ({
  orderItems,
  updateQuantity,
  removeFromOrder,
  orderDetails,
  updateOrderDetails,
  existingOrder,
  currentStatus,
  handleStatusChange,
  handleReleaseTable,
  adjustment,
  setAdjustment,
  tipEnabled,
  setTipEnabled,
  tipPercent,
  setTipPercent,
  totalAmount,
  validation,
  handleConfirmOrder,
  clearOrder,
  onCancel,
  isAddOnMode,
}) => {
  return (
    <div className="w-[360px] border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Scrollable content: order items + details + status + adjustments */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            訂單明細
          </h3>
          {/* Order Items */}
          <div className="space-y-3">
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
          {orderItems.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              尚未選擇餐點
            </p>
          )}
        </div>
        </div>

        {/* Order Details Form (notes only; table/people moved to header) */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
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
              </div>
              <label className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${
                currentStatus === 'paid'
                  ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
              }`}>
                <span className="text-sm font-medium">已結帳</span>
                <input
                  type="checkbox"
                  aria-label="已結帳"
                  checked={currentStatus === 'paid'}
                  disabled={currentStatus !== 'completed' && currentStatus !== 'paid'}
                  onChange={(e) => handleStatusChange(e.target.checked ? 'paid' : 'completed')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              {currentStatus !== 'completed' && currentStatus !== 'paid' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  請先將狀態設為「已完成」後再勾選結帳。
                </p>
              )}
            </div>
        ) : (
          <p className="text-xs text-gray-500">建立訂單後可變更狀態</p>
        )}
        {existingOrder && (currentStatus === 'completed' || currentStatus === 'paid') && (
          <div className="mt-4">
            <button
              onClick={handleReleaseTable}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white ${
                currentStatus === 'paid'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
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
            <button type="button" onClick={() => setAdjustment((Number.isFinite(adjustment) ? adjustment : 0) - 10)} className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">-</button>
            <input
              type="number"
            step={10}
            value={adjustment}
            onChange={(e) => setAdjustment(Number(e.target.value) || 0)}
            className="w-24 text-center px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
          <button type="button" onClick={() => setAdjustment((Number.isFinite(adjustment) ? adjustment : 0) + 10)} className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">+</button>
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
      </div>

      {/* Action Buttons */}
      <div className="mt-auto sticky bottom-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200 dark:border-gray-700">
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
            {isAddOnMode ? '確認加點' : '確認訂單'}
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
            onClick={onCancel}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
