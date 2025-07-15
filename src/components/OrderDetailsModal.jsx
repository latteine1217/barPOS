const OrderDetailsModal = ({ order, onClose, onUpdateStatus, onReleaseTable, isHistoryMode = false }) => {
  if (!order) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'paid': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'preparing': return '製作中';
      case 'completed': return '已完成';
      case 'paid': return '已結帳';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
  };

  const handleDeleteOrder = () => {
    if (window.confirm('確認要釋放此訂單的桌位嗎？訂單資料將保留以供統計使用。')) {
      onReleaseTable(order.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                訂單編號
              </label>
              <div className="text-lg font-mono">#{order.id}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                桌號
              </label>
              <div className="text-lg">桌 {order.tableNumber}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                人數
              </label>
              <div className="text-lg">{order.customers || 'N/A'} 人</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                建立時間
              </label>
              <div className="text-lg">
                {new Date(order.createdAt).toLocaleString('zh-TW')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                訂單狀態
              </label>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                總金額
              </label>
              <div className="text-2xl font-bold text-green-600">
                ${order.total}
              </div>
            </div>
            
            {order.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <div className="text-sm bg-gray-50 p-3 rounded border">
                  {order.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 餐點明細 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">餐點明細</h3>
          {order.items && order.items.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        單價: ${item.price}
                      </div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="text-lg font-semibold">×{item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ${item.price * item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>總計</span>
                  <span className="text-green-600">${order.total}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              無餐點資訊
            </div>
          )}
        </div>

        {/* 狀態更新按鈕 */}
        {!isHistoryMode && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">更新狀態</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={order.status === 'pending'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  order.status === 'paid'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                已結帳
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={order.status === 'cancelled'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  order.status === 'cancelled'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                已取消
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
};

export default OrderDetailsModal;