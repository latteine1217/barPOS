import React from 'react';

interface OrderingFilterBarProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  availableBaseSpirits: string[];
  selectedBaseSpirit: string;
  setSelectedBaseSpirit: (spirit: string) => void;
}

const getCategoryDisplayName = (category: string) => {
  if (category === 'all') return '全部';
  const map: Record<string, string> = {
    cocktails: '調酒',
    classic: '經典',
    signature: '招牌',
    mocktails: '無酒精',
    spirits: '烈酒',
    wine: '葡萄酒',
    beer: '啤酒',
    snacks: '小食',
    others: '其他'
  };
  return map[category] || category || '其他';
};

const getBaseSpiritDisplayName = (spirit: string) => {
  const spiritNames: Record<string, string> = {
    all: '全部',
    gin: '琴酒',
    vodka: '伏特加',
    rum: '蘭姆酒',
    whiskey: '威士忌',
    tequila: '龍舌蘭',
    brandy: '白蘭地',
    liqueur: '利口酒',
    none: '無酒精'
  };
  return spiritNames[spirit] || spirit;
};

export const OrderingFilterBar: React.FC<OrderingFilterBarProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  availableBaseSpirits,
  selectedBaseSpirit,
  setSelectedBaseSpirit,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map((category) => (
          <button type="button"
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium border ${
              selectedCategory === category
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            {getCategoryDisplayName(category)}
          </button>
        ))}
      </div>

      {availableBaseSpirits.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {availableBaseSpirits.map((spirit) => (
            <button type="button"
              key={spirit}
              onClick={() => setSelectedBaseSpirit(spirit)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                selectedBaseSpirit === spirit
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              {getBaseSpiritDisplayName(spirit)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
