import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const Menu = () => {
  const { state, actions } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: ''
  });

  const categories = [...new Set(state.menuItems.map(item => item.category))];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemData = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category
    };

    if (editingItem) {
      actions.updateMenuItem(editingItem.id, itemData);
    } else {
      actions.addMenuItem(itemData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '' });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">菜單管理</h1>
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
          <div key={category} className="card text-center p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {state.menuItems.filter(item => item.category === category).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">{category}</div>
          </div>
        ))}
      </div>

      {/* 菜單列表 */}
      {categories.map(category => (
        <div key={category} className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.menuItems
              .filter(item => item.category === category)
              .map(item => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ${item.price}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* 新增/編輯餐點模態框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingItem ? '編輯餐點' : '新增餐點'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  餐點名稱
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  價格
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分類
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                    required
                  />
                )}
              </div>

              <div className="flex gap-3">
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