import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

const TableLayoutEditor = () => {
  const { state, actions } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [dragState, setDragState] = useState({ 
    isDragging: false, 
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    hasMoved: false
  });
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const canvasRef = useRef(null);

  // 桌位形狀和大小選項
  const tableShapes = {
    round: '圓桌',
    square: '方桌',
    rectangular: '長桌',
    bar: '吧台'
  };

  const tableSizes = {
    small: { width: 60, height: 60, label: '2人桌' },
    medium: { width: 80, height: 80, label: '4人桌' },
    large: { width: 100, height: 100, label: '6人桌' },
    xlarge: { width: 120, height: 80, label: '8人桌' }
  };

  const tableTypes = {
    regular: '一般桌',
    vip: 'VIP桌',
    booth: '包廂',
    bar: '吧台'
  };

  // 獲取桌位樣式
  const getTableStyle = useCallback((table) => {
    const size = tableSizes[table.size] || tableSizes.medium;
    const baseStyle = {
      position: 'absolute',
      left: `${table.position.x}px`,
      top: `${table.position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isEditing ? 'move' : 'pointer',
      border: '2px solid',
      fontSize: '12px',
      fontWeight: 'bold',
      userSelect: 'none',
      transition: selectedTable?.id === table.id ? 'none' : 'all 0.2s ease'
    };

    // 根據狀態設定顏色
    if (table.status === 'occupied') {
      baseStyle.backgroundColor = '#fef3c7';
      baseStyle.borderColor = '#f59e0b';
      baseStyle.color = '#92400e';
    } else {
      baseStyle.backgroundColor = '#f0f9ff';
      baseStyle.borderColor = '#0ea5e9';
      baseStyle.color = '#0c4a6e';
    }

    // 選中狀態
    if (selectedTable?.id === table.id) {
      baseStyle.borderColor = '#dc2626';
      baseStyle.borderWidth = '3px';
      baseStyle.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.2)';
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
  }, [isEditing, selectedTable]);

  // 處理桌位鼠標按下事件
  const handleMouseDown = (e, table) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - table.position.x;
    const offsetY = e.clientY - rect.top - table.position.y;
    
    // 記錄起始位置，用於判斷是否為點擊或拖拽
    setDragState({
      isDragging: false, // 先不設為拖拽狀態
      dragOffset: { x: offsetX, y: offsetY },
      startPosition: { x: e.clientX, y: e.clientY },
      hasMoved: false
    });
    
    // 切換選擇狀態：如果點擊的是已選中的桌位，則取消選擇；否則選擇該桌位
    setSelectedTable(selectedTable?.id === table.id ? null : table);
  };

  // 拖拽中
  const handleMouseMove = useCallback((e) => {
    if (!selectedTable || !isEditing) return;
    
    // 計算移動距離，判斷是否開始拖拽
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - dragState.startPosition.x, 2) + 
      Math.pow(e.clientY - dragState.startPosition.y, 2)
    );
    
    // 如果移動距離超過閾值（5px），開始拖拽
    if (moveDistance > 5 && !dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: true, hasMoved: true }));
    }
    
    // 只有在拖拽模式下才更新位置
    if (dragState.isDragging) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(
        state.layoutConfig.canvasWidth - 100,
        e.clientX - rect.left - dragState.dragOffset.x
      ));
      const newY = Math.max(0, Math.min(
        state.layoutConfig.canvasHeight - 100,
        e.clientY - rect.top - dragState.dragOffset.y
      ));
      
      actions.updateTableLayout(selectedTable.id, {
        position: { x: newX, y: newY }
      });
    }
  }, [dragState, selectedTable, actions, state.layoutConfig, isEditing]);

  // 結束拖拽或點擊
  const handleMouseUp = useCallback(() => {
    // 重置拖拽狀態
    setDragState({ 
      isDragging: false, 
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      hasMoved: false
    });
  }, []);

  // 綁定全域事件
  useEffect(() => {
    if (dragState.startPosition.x !== 0 || dragState.startPosition.y !== 0) { // 有記錄起始位置時綁定事件
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.startPosition, handleMouseMove, handleMouseUp]);

  // 同步 selectedTable 與 context 中的桌位資料
  useEffect(() => {
    if (selectedTable) {
      const updatedTable = state.tables.find(table => table.id === selectedTable.id);
      if (updatedTable && JSON.stringify(updatedTable) !== JSON.stringify(selectedTable)) {
        setSelectedTable(updatedTable);
      }
    }
  }, [state.tables]); // 移除 selectedTable 依賴項避免無限循環

  // 更新桌位資訊
  const updateSelectedTable = (updates) => {
    if (!selectedTable) return;
    
    // 更新 context 中的桌位資料
    actions.updateTableLayout(selectedTable.id, updates);
    
    // 直接更新本地 selectedTable 狀態，避免等待 useEffect 同步
    setSelectedTable(prev => prev ? { ...prev, ...updates } : null);
  };

  // 新增桌位
  const handleAddTable = (tableData) => {
    actions.addTable({
      ...tableData,
      position: { x: 100, y: 100 }
    });
    setShowAddTableModal(false);
  };

  // 刪除桌位
  const handleDeleteTable = () => {
    if (!selectedTable) return;
    actions.deleteTable(selectedTable.id);
    setSelectedTable(null);
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      {/* 標題和工具列 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">桌位佈局編輯器</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {isEditing ? '拖拽桌位調整位置，點選桌位編輯詳細資訊' : '預覽模式 - 點擊右上角編輯按鈕開始編輯'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isEditing && selectedTable && (
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              已選擇: {selectedTable.name}
            </div>
          )}
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn ${isEditing ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            {isEditing ? '完成編輯' : '編輯佈局'}
          </button>
          
          {isEditing && (
            <>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="btn bg-green-500 hover:bg-green-600 text-white"
              >
                新增桌位
              </button>
              
              {selectedTable && (
                <button
                  onClick={handleDeleteTable}
                  className="btn bg-red-500 hover:bg-red-600 text-white"
                >
                  刪除桌位
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* 主要編輯區域 */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-full">
            <div
              ref={canvasRef}
              className="relative bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden"
              style={{
                width: `${state.layoutConfig.canvasWidth}px`,
                height: `${state.layoutConfig.canvasHeight}px`,
                maxWidth: '100%',
                aspectRatio: `${state.layoutConfig.canvasWidth} / ${state.layoutConfig.canvasHeight}`
              }}
              onClick={(e) => {
                // 只有在點擊畫布背景（不是桌位）且不在拖拽狀態時才清除選擇
                if (isEditing && e.target === e.currentTarget) {
                  setSelectedTable(null);
                }
              }}
            >
              {/* 網格背景 */}
              {state.layoutConfig.showGrid && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, ${state.theme === 'dark' ? '#9ca3af' : '#d1d5db'} 1px, transparent 1px),
                      linear-gradient(to bottom, ${state.theme === 'dark' ? '#9ca3af' : '#d1d5db'} 1px, transparent 1px)
                    `,
                    backgroundSize: `${state.layoutConfig.gridSize}px ${state.layoutConfig.gridSize}px`
                  }}
                />
              )}

              {/* 桌位 */}
              {state.tables.map(table => (
                <div
                  key={table.id}
                  style={getTableStyle(table)}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <div className="font-bold text-xs truncate max-w-full">
                    {table.name}
                  </div>
                  {table.status === 'occupied' && (
                    <div className="text-xs opacity-75">
                      {table.customers}人
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 側邊欄設定 */}
        {isEditing && (
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 max-h-screen lg:max-h-full overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">編輯設定</h3>
              
              {selectedTable ? (
                /* 桌位編輯 */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">桌位: {selectedTable.name}</h4>
                    <button
                      onClick={() => setSelectedTable(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                      title="取消選擇"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* 桌位名稱 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      桌位名稱
                    </label>
                    <input
                      type="text"
                      value={selectedTable.name}
                      onChange={(e) => updateSelectedTable({ name: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* 桌位編號 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      桌位編號
                    </label>
                    <input
                      type="number"
                      value={selectedTable.number}
                      onChange={(e) => updateSelectedTable({ number: parseInt(e.target.value) })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* 桌位類型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      桌位類型
                    </label>
                    <select
                      value={selectedTable.type}
                      onChange={(e) => updateSelectedTable({ type: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {Object.entries(tableTypes).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 桌位形狀 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      桌位形狀
                    </label>
                    <select
                      value={selectedTable.shape}
                      onChange={(e) => updateSelectedTable({ shape: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {Object.entries(tableShapes).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 桌位大小 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      桌位大小
                    </label>
                    <select
                      value={selectedTable.size}
                      onChange={(e) => updateSelectedTable({ size: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {Object.entries(tableSizes).map(([value, data]) => (
                        <option key={value} value={value}>{data.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 座位數 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      座位數
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={selectedTable.capacity}
                      onChange={(e) => updateSelectedTable({ capacity: parseInt(e.target.value) })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* 位置資訊 */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      位置: X: {Math.round(selectedTable.position.x)}, Y: {Math.round(selectedTable.position.y)}
                    </p>
                  </div>
                </div>
              ) : (
                /* 全域設定 */
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    點選桌位以編輯其設定，或拖拽桌位調整位置。
                  </p>
                  
                  {/* 顯示網格 */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showGrid"
                      checked={state.layoutConfig.showGrid}
                      onChange={(e) => actions.saveLayoutConfig({ showGrid: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="showGrid" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      顯示網格
                    </label>
                  </div>

                  {/* 統計資訊 */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">統計資訊</h5>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>總桌數: {state.tables.length}</p>
                      <p>使用中: {state.tables.filter(t => t.status === 'occupied').length}</p>
                      <p>空桌: {state.tables.filter(t => t.status === 'available').length}</p>
                      <p>總座位數: {state.tables.reduce((sum, t) => sum + (t.capacity || 4), 0)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 新增桌位模態框 */}
      {showAddTableModal && (
        <AddTableModal
          onAdd={handleAddTable}
          onClose={() => setShowAddTableModal(false)}
          tableShapes={tableShapes}
          tableSizes={tableSizes}
          tableTypes={tableTypes}
          existingTables={state.tables}
        />
      )}
    </div>
  );
};

// 新增桌位模態框組件
const AddTableModal = ({ onAdd, onClose, tableShapes, tableSizes, tableTypes, existingTables }) => {
  const [formData, setFormData] = useState({
    name: '',
    number: Math.max(...existingTables.map(t => t.number), 0) + 1,
    type: 'regular',
    shape: 'round',
    size: 'medium',
    capacity: 4
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">新增桌位</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              桌位名稱
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`桌 ${formData.number}`}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              桌位編號
            </label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              桌位類型
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.entries(tableTypes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              桌位形狀
            </label>
            <select
              value={formData.shape}
              onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.entries(tableShapes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              桌位大小
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.entries(tableSizes).map(([value, data]) => (
                <option key={value} value={value}>{data.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              座位數
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 btn bg-blue-500 hover:bg-blue-600 text-white"
            >
              新增桌位
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableLayoutEditor;