import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const Menu = () => {
  const { state, actions } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    baseSpirit: ''
  });

  const categories = [...new Set(state.menuItems.map(item => item.category))];
  
  // 基酒選項
  const baseSpiritOptions = [
    { value: '', label: '無基酒' },
    { value: 'gin', label: 'Gin 琴酒' },
    { value: 'whisky', label: 'Whisky 威士忌' },
    { value: 'rum', label: 'Rum 蘭姆酒' },
    { value: 'tequila', label: 'Tequila 龍舌蘭' },
    { value: 'vodka', label: 'Vodka 伏特加' },
    { value: 'brandy', label: 'Brandy 白蘭地' },
     { value: 'others', label: '其他' }  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemData = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      baseSpirit: formData.baseSpirit || null
    };

    if (editingItem) {
      actions.updateMenuItem(editingItem.id, itemData);
    } else {
      actions.addMenuItem(itemData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', baseSpirit: '' });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      baseSpirit: item.baseSpirit || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = (itemId) => {
    if (window.confirm('確定要刪除這個餐點嗎？')) {
      actions.deleteMenuItem(itemId);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">菜單管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary w-full sm:w-auto"
        >
          ➕ 新增餐點
        </button>
      </div>

      {/* 分類統計 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {categories.map(category => (
          <div key={category} className="card text-center p-6 sm:p-8">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {state.menuItems.filter(item => item.category === category).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{category}</div>
          </div>
        ))}
      </div>

      {/* 菜單列表 */}
      {categories.map(category => (
        <div key={category} className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.menuItems
              .filter(item => item.category === category)
              .map(item => (
                <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      {item.baseSpirit && (
                        <span className="inline-block mt-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-xs">
                          {baseSpiritOptions.find(opt => opt.value === item.baseSpirit)?.label || item.baseSpirit}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm p-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${item.price}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* 新增/編輯餐點模態框 */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingItem ? '編輯餐點' : '新增餐點'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">
                  餐點名稱
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  價格
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  分類
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">選擇分類</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="new">新增分類...</option>
                </select>
                {formData.category === 'new' && (
                  <input
                    type="text"
                    placeholder="輸入新分類名稱"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input mt-3"
                    required
                  />
                )}
              </div>

              {/* 基酒選擇器（只對經典調酒顯示） */}
              {formData.category === '經典調酒' && (
                <div>
                  <label className="form-label">
                    基酒分類
                  </label>
                  <select
                    value={formData.baseSpirit}
                    onChange={(e) => setFormData({ ...formData, baseSpirit: e.target.value })}
                    className="form-input"
                  >
                    {baseSpiritOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  {editingItem ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;