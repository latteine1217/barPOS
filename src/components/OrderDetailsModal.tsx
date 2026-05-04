import { memo, useCallback, useEffect } from 'react';
import type { Order, OrderStatus } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onReleaseTable: (orderId: string) => void;
  isHistoryMode?: boolean;
}

const OrderDetailsModal = memo<OrderDetailsModalProps>(({ 
  order, 
  onClose, 
  onUpdateStatus, 
  onReleaseTable, 
  isHistoryMode = false 
}) => {
  const getStatusColor = useCallback((status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'paid': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  const getStatusText = useCallback((status: OrderStatus): string => {
    switch (status) {
      case 'pending': return '待處理';
      case 'preparing': return '製作中';
      case 'completed': return '已完成';
      case 'paid': return '已結帳';
      default: return status;
    }
  }, []);

  const handleStatusChange = useCallback((newStatus: OrderStatus) => {
    if (order) {
      onUpdateStatus(order.id, newStatus);
    }
  }, [order, onUpdateStatus]);

  const confirm = useConfirm();
  const toast = useToast();

  const handleDeleteOrder = useCallback(async () => {
    if (!order) return;
    const ok = await confirm({
      title: '釋放此訂單的桌位？',
      description: '訂單資料將保留以供統計使用，但桌位會立即標記為可用。',
      confirmText: '釋放桌位',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!ok) return;
    onReleaseTable(order.id);
    toast.success('已釋放桌位');
    onClose();
  }, [order, confirm, onReleaseTable, onClose, toast]);

  // Esc 關閉 + body scroll lock + focus trap
  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [order, onClose]);

  const trapRef = useFocusTrap<HTMLDivElement>({ active: !!order });

  if (!order) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={trapRef}
        className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="order-details-title" className="text-2xl font-bold">訂單詳情</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 rounded"
            aria-label="關閉訂單詳情"
          >
            ✕
          </button>
        </div>

        {/* 訂單基本資訊 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">訂單編號</p>
            <p className="font-semibold">{order.id}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">桌號</p>
            <p className="font-semibold">桌 {order.tableNumber}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">客人數</p>
            <p className="font-semibold">{order.customers} 人</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">狀態</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
          <div>
            <p className="text-gray-600 text-sm">建立時間</p>
            <p className="font-semibold">{new Date(order.createdAt).toLocaleString('zh-TW')}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">總金額</p>
            <p className="font-semibold text-green-600">NT$ {order.total.toLocaleString()}</p>
          </div>
        </div>

        {/* 訂單項目 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">訂單項目</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">單價: NT$ {item.price}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">x {item.quantity}</p>
                  <p className="text-green-600">NT$ {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 備註 */}
        {order.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">備註</h3>
            <p className="p-3 bg-gray-50 rounded-lg">{order.notes}</p>
          </div>
        )}

        {/* 狀態更新按鈕 - 只在非歷史模式下顯示 */}
        {!isHistoryMode && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">更新狀態</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('pending')}
                disabled={order.status === 'pending'}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  order.status === 'pending'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                待處理
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('preparing')}
                disabled={order.status === 'preparing'}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  order.status === 'preparing'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                製作中
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                disabled={order.status === 'completed'}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  order.status === 'completed'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                已完成
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('paid')}
                disabled={order.status === 'paid'}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  order.status === 'paid'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                已結帳
              </button>
            </div>
          </div>
        )}

        {/* 關閉和釋放桌位按鈕 */}
        <div className={`flex ${isHistoryMode ? 'justify-end' : 'justify-between'}`}>
          {!isHistoryMode && (
            <button
              type="button"
              onClick={handleDeleteOrder}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              釋放桌位
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
});

export default OrderDetailsModal;