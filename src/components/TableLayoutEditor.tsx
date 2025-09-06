import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTables } from '@/stores';
import { useTableStore } from '@/stores/tableStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Table, TableType, TableShape, TableSize } from '@/types';
import type { CSSProperties } from 'react';

interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
  hasMoved: boolean;
}

interface TableLayoutEditorProps { readOnly?: boolean; onTableClick?: (table: Table) => void }
const TableLayoutEditor = ({ readOnly = false, onTableClick }: TableLayoutEditorProps) => {
  const tables = useTables();
  
  // 使用單一選擇器避免循環渲染
  const updateTableLayout = useTableStore((state) => state.updateTableLayout);
  const addTable = useTableStore((state) => state.addTable);
  const deleteTable = useTableStore((state) => state.deleteTable);
  
  // 設定相關選擇器
  const layoutConfig = useSettingsStore((state) => state.layoutConfig);
  const updateLayoutConfig = useSettingsStore((state) => state.updateLayoutConfig);
  const [isEditing, setIsEditing] = useState<boolean>(() => false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(() => null);
  const [dragState, setDragState] = useState<DragState>(() => ({ 
    isDragging: false, 
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    hasMoved: false
  }));
  const [showAddTableModal, setShowAddTableModal] = useState<boolean>(() => false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // 桌位形狀和大小選項
  const tableShapes = useMemo(() => ({
    round: '圓桌',
    square: '方桌',
    rectangular: '長桌',
    bar: '吧台'
  }), []);

  const tableSizes = useMemo(() => ({
    small: { width: 60, height: 60, label: '2人桌' },
    medium: { width: 80, height: 80, label: '4人桌' },
    large: { width: 100, height: 100, label: '6人桌' },
    xlarge: { width: 120, height: 80, label: '8人桌' }
  }), []);

  const tableTypes = useMemo(() => ({
    regular: '一般桌',
    vip: 'VIP桌',
    booth: '包廂',
    bar: '吧台'
  }), []);

  // 獲取桌位樣式 - 全新 Glassmorphism 設計
  const getTableStyle = useCallback((table: Table): CSSProperties => {
    const size = tableSizes[table.size as keyof typeof tableSizes] || tableSizes.medium;
    const baseStyle: CSSProperties = {
      position: 'absolute',
      left: `${table.position.x}px`,
      top: `${table.position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isEditing ? 'move' : 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      userSelect: 'none',
      transition: selectedTable?.id === table.id ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', // Safari support
    };

    // 根據狀態設定 glassmorphism 顏色和效果
    if (table.status === 'occupied') {
      // 使用中：溫暖的琥珀色 glass 效果
      baseStyle.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)';
      baseStyle.border = '2px solid rgba(251, 191, 36, 0.4)';
      baseStyle.color = '#ffffff';
      baseStyle.boxShadow = '0 8px 32px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      baseStyle.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    } else if (table.status === 'reserved') {
      // 已預約：紫色 glass 效果
      baseStyle.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)';
      baseStyle.border = '2px solid rgba(139, 92, 246, 0.4)';
      baseStyle.color = '#ffffff';
      baseStyle.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      baseStyle.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    } else if (table.status === 'cleaning') {
      // 清潔中：藍色 glass 效果
      baseStyle.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)';
      baseStyle.border = '2px solid rgba(59, 130, 246, 0.4)';
      baseStyle.color = '#ffffff';
      baseStyle.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      baseStyle.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    } else {
      // 空位：深色文字在明亮背景上
      baseStyle.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)';
      baseStyle.border = '2px solid rgba(16, 185, 129, 0.5)';
      baseStyle.color = '#ffffff';
      baseStyle.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
      baseStyle.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
    }

    // 選中狀態：增強的發光效果
    if (selectedTable?.id === table.id) {
      baseStyle.border = '3px solid rgba(236, 72, 153, 0.6)';
      baseStyle.boxShadow = `
        0 0 0 4px rgba(236, 72, 153, 0.2), 
        0 8px 32px rgba(236, 72, 153, 0.3), 
        inset 0 1px 0 rgba(255, 255, 255, 0.3)
      `;
      baseStyle.transform = 'scale(1.05)';
    }

    // 桌位形狀
    if (table.shape === 'round') {
      baseStyle.borderRadius = '50%';
    } else if (table.shape === 'rectangular') {
      baseStyle.width = `${size.width * 1.5}px`;
      baseStyle.borderRadius = '16px';
    } else {
      baseStyle.borderRadius = '16px';
    }

    // VIP 桌位特殊效果：金色漸變
    if (table.type === 'vip') {
      baseStyle.background = 'linear-gradient(135deg, rgba(250, 204, 21, 0.4) 0%, rgba(245, 158, 11, 0.3) 100%)';
      baseStyle.border = '2px solid rgba(250, 204, 21, 0.5)';
      baseStyle.boxShadow = '0 8px 32px rgba(250, 204, 21, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
    }

    // Hover 效果（僅在非拖拽狀態）
    if (!dragState.isDragging) {
      baseStyle.filter = 'brightness(1)';
    }

    return baseStyle;
  }, [isEditing, selectedTable, tableSizes, dragState.isDragging]);

  // 處理桌位鼠標按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, table: Table) => {
    if (!isEditing || !canvasRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - table.position.x;
    const offsetY = e.clientY - rect.top - table.position.y;
    setDragState(() => ({ 
      isDragging: false,
      dragOffset: { x: offsetX, y: offsetY },
      startPosition: { x: e.clientX, y: e.clientY },
      hasMoved: false
    }));    setSelectedTable((prev) => (prev?.id === table.id ? null : table));
  }, [isEditing]);

  // 拖拽中
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selectedTable || !isEditing || !canvasRef.current) return;
    
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - dragState.startPosition.x, 2) + 
      Math.pow(e.clientY - dragState.startPosition.y, 2)
    );
    
    if (moveDistance > 5 && !dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: true, hasMoved: true }));
    }
    
    if (dragState.isDragging) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(
        layoutConfig.canvasWidth - 100,
        e.clientX - rect.left - dragState.dragOffset.x
      ));
      const newY = Math.max(0, Math.min(
        layoutConfig.canvasHeight - 100,
        e.clientY - rect.top - dragState.dragOffset.y
      ));
      
      setSelectedTable(prev => (prev ? { ...prev, position: { x: newX, y: newY } } : prev));
    }
  }, [dragState, selectedTable, layoutConfig, isEditing]);

  // 結束拖拽或點擊
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && selectedTable) {
      updateTableLayout(selectedTable.id, { position: { ...selectedTable.position } });
    }
    setDragState(() => ({ 
      isDragging: false, 
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      hasMoved: false
    }));
  }, [dragState.isDragging, selectedTable, updateTableLayout]);

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
    return undefined;
  }, [dragState.startPosition, handleMouseMove, handleMouseUp]);

  // ✅ 優化：只在真正需要時同步 selectedTable，避免循環依賴
  useEffect(() => {
    if (!selectedTable) return;
    if (isEditing || dragState.isDragging) return;
    const updatedTable = tables.find((table: Table) => table.id === selectedTable.id);
    if (!updatedTable) {
      setSelectedTable(null);
      return;
    }
    const currentData = JSON.stringify({
      name: selectedTable.name,
      number: selectedTable.number,
      type: selectedTable.type,
      shape: selectedTable.shape,
      size: selectedTable.size,
      capacity: selectedTable.capacity,
      position: selectedTable.position
    });
    const updatedData = JSON.stringify({
      name: updatedTable.name,
      number: updatedTable.number,
      type: updatedTable.type,
      shape: updatedTable.shape,
      size: updatedTable.size,
      capacity: updatedTable.capacity,
      position: updatedTable.position
    });
    if (currentData !== updatedData) {
      setSelectedTable(() => updatedTable);
    }
  }, [selectedTable, tables, isEditing, dragState.isDragging]);

  // 更新桌位資訊
  const updateSelectedTable = useCallback((updates: Partial<Table>) => {
    if (!selectedTable) return;
    updateTableLayout(selectedTable.id, updates);
    setSelectedTable(prev => (prev ? { ...prev, ...updates } : null));
  }, [selectedTable, updateTableLayout]);

  // ✅ 修復：優化按鈕事件處理，確保穩定的引用
  const handleEditToggle = useCallback(() => {
    setIsEditing(prev => !prev);
    // 退出編輯模式時清除選擇
    if (isEditing) {
      setSelectedTable(null);
    }
  }, [isEditing]);

  const handleAddTable = useCallback((tableData: NewTable) => {
    addTable({
      ...tableData,
      position: { x: 100, y: 100 }
    });
    setShowAddTableModal(false);
  }, [addTable, setShowAddTableModal]);

  const handleDeleteTable = useCallback(() => {
    if (!selectedTable) return;
    deleteTable(selectedTable.id);
    setSelectedTable(null);
  }, [selectedTable, deleteTable]);

  const handleShowAddModal = useCallback(() => {
    setShowAddTableModal(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setShowAddTableModal(false);
  }, []);

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      {/* 標題和工具列 - Glassmorphism 設計 */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
             <h1 className="text-2xl font-bold text-white drop-shadow-lg">{readOnly ? '桌位佈局' : '桌位佈局編輯器'}</h1>            <p className="text-white/80 mt-1 drop-shadow-md">
               {readOnly ? '點擊桌位即可開始點餐' : (isEditing ? '拖拽桌位調整位置，點選桌位編輯詳細資訊' : '預覽模式 - 點擊右上角編輯按鈕開始編輯')}            </p>
          </div>
        
        <div className="flex flex-wrap gap-2">
          {isEditing && selectedTable && (
            <div className="text-sm text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-lg">
              已選擇: {selectedTable.name}
            </div>
          )}
          
           {!readOnly && (
             <button
               onClick={handleEditToggle}
               className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border ${isEditing 
                 ? 'bg-red-500/80 hover:bg-red-500 text-white border-red-400/50 shadow-lg shadow-red-500/25' 
                 : 'bg-blue-500/80 hover:bg-blue-500 text-white border-blue-400/50 shadow-lg shadow-blue-500/25'
               } hover:scale-105`}
             >
               {isEditing ? '完成編輯' : '編輯佈局'}
             </button>
           )}          
           {!readOnly && isEditing && (
             <>
               <button
                 onClick={handleShowAddModal}
                 className="px-6 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border bg-emerald-500/80 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-lg shadow-emerald-500/25 hover:scale-105"
               >
                 新增桌位
               </button>
               {selectedTable && (
                 <button
                   onClick={handleDeleteTable}
                   className="px-6 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border bg-rose-500/80 hover:bg-rose-500 text-white border-rose-400/50 shadow-lg shadow-rose-500/25 hover:scale-105"
                 >
                   刪除桌位
                 </button>
               )}
             </>
           )}        </div>
      </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* 主要編輯區域 - Glassmorphism 容器 */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 h-full shadow-2xl shadow-black/10">
             <div
               ref={canvasRef}
               className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border-2 border-dashed border-white/30 overflow-hidden rounded-xl"
               style={{
                 width: `${layoutConfig.canvasWidth}px`,
                 height: `${layoutConfig.canvasHeight}px`,
                 maxWidth: '100%',
                 aspectRatio: `${layoutConfig.canvasWidth} / ${layoutConfig.canvasHeight}`
               }}
               onClick={(e) => {
                 if (readOnly) return;
                 if (isEditing && e.target === e.currentTarget) {
                   setSelectedTable(null);
                 }
               }}
             >              {/* 網格背景 - 微調透明度 */}
              {layoutConfig.showGrid && (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: `${layoutConfig.gridSize}px ${layoutConfig.gridSize}px`
                  }}
                />
              )}

              {/* 桌位 - 增強的 glassmorphism 效果 */}
              {tables.map(table => (
                <div
                  key={table.id}
                  style={getTableStyle(table)}
                    onMouseDown={(e) => { if (!readOnly) handleMouseDown(e, table); }} className="flex flex-col items-center justify-center text-center group hover:brightness-110 transition-all duration-200"
                   onClick={() => { if (readOnly && onTableClick) onTableClick(table); }}                >
                  <div className="font-bold text-xs truncate max-w-full drop-shadow-md">
                    {table.name}
                  </div>
                  {table.status === 'occupied' && (
                    <div className="text-xs opacity-90 drop-shadow-sm">
                      {table.customers}人
                    </div>
                  )}
                  {/* 添加微妙的狀態指示器 */}
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    table.status === 'available' ? 'bg-emerald-400 shadow-emerald-400/50' :
                    table.status === 'occupied' ? 'bg-amber-400 shadow-amber-400/50' :
                    table.status === 'reserved' ? 'bg-purple-400 shadow-purple-400/50' :
                    'bg-blue-400 shadow-blue-400/50'
                  } shadow-lg`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 側邊欄設定 - Glassmorphism 設計 */}
         {isEditing && !readOnly && (
           <div className="w-full lg:w-80 lg:flex-shrink-0">            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-h-screen lg:max-h-full overflow-y-auto shadow-2xl shadow-black/10">
              <h3 className="text-lg font-semibold mb-4 text-white drop-shadow-lg">編輯設定</h3>
              
              {selectedTable ? (
                /* 桌位編輯 - 美化表單樣式 */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white drop-shadow-md">桌位: {selectedTable.name}</h4>
                    <button
                      onClick={() => setSelectedTable(null)}
                      className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                      title="取消選擇"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* 桌位名稱 */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
                      桌位名稱
                    </label>
                    <input
                      type="text"
                      value={selectedTable.name}
                      onChange={(e) => updateSelectedTable({ name: e.target.value })}
                      className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-2"
                    />
                  </div>

                  {/* 桌位編號 */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
                      桌位編號
                    </label>
                    <input
                      type="number"
                      value={selectedTable.number}
                      onChange={(e) => updateSelectedTable({ number: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-2"
                    />
                  </div>

                  {/* 桌位類型 */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
                      桌位類型
                    </label>
                    <select
                      value={selectedTable.type}
                      onChange={(e) => updateSelectedTable({ type: e.target.value as TableType })}
                      className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-2"
                    >
                      {Object.entries(tableTypes).map(([value, label]) => (
                        <option key={value} value={value} className="bg-gray-800 text-white">{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 桌位形狀 */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
                      桌位形狀
                    </label>
                    <select
                      value={selectedTable.shape}
                      onChange={(e) => updateSelectedTable({ shape: e.target.value as TableShape })}
                      className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-2"
                    >
                      {Object.entries(tableShapes).map(([value, label]) => (
                        <option key={value} value={value} className="bg-gray-800 text-white">{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 桌位大小 */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
                      桌位大小
                    </label>
                    <select
                      value={selectedTable.size}
                      onChange={(e) => updateSelectedTable({ size: e.target.value as TableSize })}
                      className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-2"
                    >
                      {Object.entries(tableSizes).map(([value, data]) => (
                        <option key={value} value={value} className="bg-gray-800 text-white">{data.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 座位數 */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
                      座位數
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={selectedTable.capacity}
                      onChange={(e) => updateSelectedTable({ capacity: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-2"
                    />
                  </div>

                  {/* 位置資訊 */}
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm text-white/70 drop-shadow-sm">
                      位置: X: {Math.round(selectedTable.position.x)}, Y: {Math.round(selectedTable.position.y)}
                    </p>
                  </div>
                </div>
              ) : (
                /* 全域設定 - 美化設計 */
                <div className="space-y-4">
                  <p className="text-sm text-white/70 drop-shadow-sm">
                    點選桌位以編輯其設定，或拖拽桌位調整位置。
                  </p>
                  
                  {/* 顯示網格 */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showGrid"
                      checked={layoutConfig.showGrid}
                      onChange={(e) => updateLayoutConfig({ showGrid: e.target.checked })}
                      className="rounded border-white/30 bg-white/10 text-blue-400 shadow-sm focus:border-white/50 focus:ring-white/20 mr-3"
                    />
                    <label htmlFor="showGrid" className="text-sm text-white/80 drop-shadow-sm">
                      顯示網格
                    </label>
                  </div>

                  {/* 統計資訊 */}
                  <div className="pt-4 border-t border-white/20">
                    <h5 className="font-medium text-white mb-3 drop-shadow-md">統計資訊</h5>
                    <div className="text-sm text-white/70 space-y-2 drop-shadow-sm">
                      <div className="flex justify-between">
                        <span>總桌數:</span>
                        <span className="text-white font-medium">{tables.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>使用中:</span>
                        <span className="text-amber-300 font-medium">{tables.filter(t => t.status === 'occupied').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>空桌:</span>
                        <span className="text-emerald-300 font-medium">{tables.filter(t => t.status === 'available').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>總座位數:</span>
                        <span className="text-white font-medium">{tables.reduce((sum, t) => sum + (t.capacity || 4), 0)}</span>
                      </div>
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
          onClose={handleCloseAddModal}
          tableShapes={tableShapes}
          tableSizes={tableSizes}
          tableTypes={tableTypes}
          existingTables={tables}
        />
      )}
    </div>
  );
};

// 新增桌位模態框組件
type NewTable = {
  name: string;
  number: number;
  type: TableType;
  shape: TableShape;
  size: TableSize;
  capacity: number;
  maxCapacity?: number;
};
interface AddTableModalProps {
  onAdd: (tableData: NewTable) => void;
  onClose: () => void;
  tableShapes: Record<string, string>;
  tableSizes: Record<string, { width: number; height: number; label: string }>;
  tableTypes: Record<string, string>;
  existingTables: Table[];
}

const AddTableModal: React.FC<AddTableModalProps> = ({ 
  onAdd, 
  onClose, 
  tableShapes, 
  tableSizes, 
  tableTypes, 
  existingTables 
}) => {
  type NewTable = {
    name: string;
    number: number;
    type: TableType;
    shape: TableShape;
    size: TableSize;
    capacity: number;
    maxCapacity?: number;
  };
  const [formData, setFormData] = useState<NewTable>(() => ({
    name: '',
    number: Math.max(0, ...existingTables.map(t => t.number), 0) + 1,
    type: 'regular',
    shape: 'round',
    size: 'medium',
    capacity: 4
  }));

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  }, [onAdd, formData]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/20">
        <h3 className="text-lg font-semibold mb-6 text-white drop-shadow-lg">新增桌位</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
              桌位名稱
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`桌 ${formData.number}`}
              className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
              桌位編號
            </label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
              className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
              桌位類型
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TableType })}
              className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-3"
            >
              {Object.entries(tableTypes).map(([value, label]) => (
                <option key={value} value={value} className="bg-gray-800 text-white">{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
              桌位形狀
            </label>
            <select
              value={formData.shape}
              onChange={(e) => setFormData({ ...formData, shape: e.target.value as TableShape })}
              className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-3"
            >
              {Object.entries(tableShapes).map(([value, label]) => (
                <option key={value} value={value} className="bg-gray-800 text-white">{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
              桌位大小
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value as TableSize })}
              className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-3"
            >
              {Object.entries(tableSizes).map(([value, data]) => (
                <option key={value} value={value} className="bg-gray-800 text-white">{data.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">
              座位數
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 shadow-lg focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 px-4 py-3"
            />
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border bg-blue-500/80 hover:bg-blue-500 text-white border-blue-400/50 shadow-lg shadow-blue-500/25 hover:scale-105"
            >
              新增桌位
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border bg-white/10 hover:bg-white/20 text-white border-white/30 shadow-lg hover:scale-105"
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