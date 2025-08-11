import { memo, useCallback } from 'react';
import type { Order, OrderStatus } from '@/types';

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

  const handleDeleteOrder = useCallback(() => {
    if (order && window.confirm('確認要釋放此訂單的桌位嗎？訂單資料將保留以供統計使用。')) {
      onReleaseTable(order.id);
      onClose();
    }
  }, [order, onReleaseTable, onClose]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">訂單詳情</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl"
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
              onClick={handleDeleteOrder}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              釋放桌位
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
});

export default OrderDetailsModal;