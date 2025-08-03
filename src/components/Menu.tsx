import React, { useState, useCallback, useMemo, memo } from 'react';
import { useMenuStore } from '@/stores';
import { MenuItem, MenuCategory, BaseSpirit } from '../types';
// import { useRenderTracker, useStoreTracker } from '../utils/renderTracker';

interface FormData {
  name: string;
  price: string;
  category: string;
  baseSpirit: string;
}

const Menu: React.FC = memo(() => {
  // 🔍 渲染追蹤
  // useRenderTracker('Menu');
  
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useMenuStore((state) => ({
    menuItems: state.menuItems,
    addMenuItem: state.addMenuItem,
    updateMenuItem: state.updateMenuItem,
    deleteMenuItem: state.deleteMenuItem
  }));
  /* availability snapshot removed to avoid extra subscriptions */
  
  // 🔍 Store 變化追蹤
  // useStoreTracker('MenuItems', menuItems);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    category: '',
    baseSpirit: ''
  });
  
  // 使用 useMemo 緩存基酒選項
  const baseSpiritOptions = useMemo(() => [
    { value: '', label: '無基酒' },
    { value: 'gin', label: 'Gin 琴酒' },
    { value: 'whiskey', label: 'Whiskey 威士忌' },
    { value: 'rum', label: 'Rum 蘭姆酒' },
    { value: 'tequila', label: 'Tequila 龍舌蘭' },
    { value: 'vodka', label: 'Vodka 伏特加' },
    { value: 'brandy', label: 'Brandy 白蘭地' },
    { value: 'liqueur', label: 'Liqueur 利口酒' }
  ], []);

  // 使用 useMemo 緩存分類選項
  const categoryOptions = useMemo(() => [
    { value: 'cocktails', label: '調酒' },
    { value: 'mocktails', label: '無酒精調酒' },
    { value: 'spirits', label: '烈酒' },
    { value: 'wine', label: '葡萄酒' },
    { value: 'beer', label: '啤酒' },
    { value: 'snacks', label: '小食' },
    { value: 'others', label: '其他' }
  ], []);

  // 使用 useCallback 優化函數
  const getSpiritStyle = useCallback((baseSpirit?: BaseSpirit): string => {
    switch (baseSpirit) {
      case 'gin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'whiskey': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'rum': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'tequila': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'vodka': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'brandy': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'liqueur': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      alert('請填寫必要欄位');
      return;
    }

    try {
      const itemData: Partial<MenuItem> = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category as MenuCategory,
        baseSpirit: formData.baseSpirit as BaseSpirit || 'none',
        available: true,
        description: ''
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, itemData);
      } else {
        await addMenuItem(itemData as MenuItem);
      }

      // 重置表單
      setFormData({ name: '', price: '', category: '', baseSpirit: '' });
      setShowAddModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('操作失敗:', error);
      alert('操作失敗，請重試');
    }
   }, [formData, editingItem, addMenuItem, updateMenuItem]);
  const handleEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      baseSpirit: item.baseSpirit || ''
    });
    setShowAddModal(true);
  }, []);

  const handleDelete = useCallback(async (itemId: string) => {
    if (window.confirm('確定要刪除這個品項嗎？')) {
      try {
        await deleteMenuItem(itemId);
      } catch (error) {
        console.error('刪除失敗:', error);
        alert('刪除失敗，請重試');
      }
    }
  }, [deleteMenuItem]);

  const handleToggleAvailability = useCallback(async (itemId: string) => {
    try {
      const item = menuItems.find((item: MenuItem) => item.id === itemId);
      if (item) {
        await updateMenuItem(itemId, { available: !item.available });
      }
    } catch (error) {
      console.error('更新失敗:', error);
      alert('更新失敗，請重試');
    }
  }, [menuItems, updateMenuItem]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            調酒管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理調酒品項和價格
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({ name: '', price: '', category: '', baseSpirit: '' });
            setShowAddModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <span>➕</span>
          <span>新增調酒</span>
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.map((item) => (
            <div key={item.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {item.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  刪除
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">價格</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">
                  ${item.price}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">分類</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.category}
                </span>
              </div>
              
              {item.baseSpirit && item.baseSpirit !== 'none' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">基酒</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSpiritStyle(item.baseSpirit)}`}>
                    {baseSpiritOptions.find(opt => opt.value === item.baseSpirit)?.label || item.baseSpirit}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">狀態</span>
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    item.available
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {item.available ? '可供應' : '暫停供應'}
                </button>
              </div>
            </div>
           </div>
          ))}
      </div>
      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingItem ? '編輯調酒' : '新增調酒'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  調酒名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  價格 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分類 *
                </label>
                 <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">選擇分類</option>
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  基酒
                </label>
                <select
                  value={formData.baseSpirit}
                  onChange={(e) => setFormData({ ...formData, baseSpirit: e.target.value })}
                  className="input w-full"
                >
                  {baseSpiritOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                    setFormData({ name: '', price: '', category: '', baseSpirit: '' });
                  }}
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

      {/* Empty State */}
      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍸</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            尚未新增任何調酒
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            開始建立您的調酒菜單吧！
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            新增第一個調酒
          </button>
        </div>
      )}
    </div>
  );
});

export default Menu;