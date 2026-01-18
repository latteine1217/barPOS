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
  if (category === 'all') return 'All';
  const map: Record<string, string> = {
    cocktails: 'Cocktails',
    classic: 'Classic',
    signature: 'Signature',
    mocktails: 'Mocktails',
    spirits: 'Spirits',
    wine: 'Wine',
    beer: 'Beer',
    snacks: 'Snacks',
    others: 'Others'
  };
  return map[category] || category || 'Others';
};

const getBaseSpiritDisplayName = (spirit: string) => {
  const spiritNames: Record<string, string> = {
    all: 'All',
    gin: 'Gin',
    vodka: 'Vodka',
    rum: 'Rum',
    whiskey: 'Whiskey',
    tequila: 'Tequila',
    brandy: 'Brandy',
    liqueur: 'Liqueur',
    none: 'Non-alcoholic'
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
          <button
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
            <button
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
