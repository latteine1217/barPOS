import type { MenuItem } from '@/types';

// 可在此擴充映射規則：類別 / 基酒 / 標籤
export const categoryEmoji: Record<string, string> = {
  cocktails: '🍸',
  mocktails: '🧃',
  wine: '🍷',
  beer: '🍺',
  spirits: '🥃',
  snacks: '🍟',
};

export const baseSpiritEmoji: Record<string, string> = {
  whiskey: '🥃',
  gin: '🍸',
  rum: '🍹',
  tequila: '🌵',
  vodka: '❄️',
  brandy: '🟤',
  liqueur: '✨',
  none: '🧃',
};

// 類別顏色（用於卡片頂部色條）
const FALLBACK_COLOR = '#60a5fa';

export const categoryColors: Record<string, string> = {
  cocktails: '#22d3ee', // cyan-400
  mocktails: '#f59e0b', // amber-500
  wine: '#ef4444',      // red-500
  beer: '#facc15',      // yellow-400
  spirits: '#a78bfa',   // violet-400
  snacks: '#fb7185',    // rose-400
  others: FALLBACK_COLOR,    // blue-400
};

const resolveColor = (key?: string): string => {
  if (!key) return FALLBACK_COLOR;
  const normalized = key.toLowerCase().trim();
  const color = (categoryColors as Record<string, string | undefined>)[normalized];
  return typeof color === 'string' ? color : FALLBACK_COLOR;
};

export const pickEmojiForItem = (item: MenuItem): string => {
  const cat = (item.category || '').toLowerCase();
  const spirit = (item.baseSpirit || '').toLowerCase();
  if (spirit && baseSpiritEmoji[spirit]) return baseSpiritEmoji[spirit];
  if (cat && categoryEmoji[cat]) return categoryEmoji[cat];
  return '🍸';
};

export const pickColorForCategory = (category?: string): string => {
  return resolveColor(category);
};

// 更智能的色條挑選：優先依類別，若沒有類別則依基酒
export const pickStripeColor = (item: MenuItem): string => {
  const cat = (item.category || '').toLowerCase().trim();
  if (cat) {
    const catColor = resolveColor(cat);
    if (catColor !== categoryColors.others || cat === 'others') {
      return catColor;
    }
  }

  const spirit = (item.baseSpirit || '').toLowerCase().trim();
  if (spirit) {
    // 將常見基酒對應至接近的類別色
    const strongSpirit = ['gin', 'vodka', 'rum', 'tequila', 'brandy', 'whiskey', 'liqueur'];
    if (strongSpirit.includes(spirit)) {
      return resolveColor('spirits');
    }
    if (spirit === 'none') {
      return resolveColor('mocktails');
    }
  }
  return FALLBACK_COLOR;
};
