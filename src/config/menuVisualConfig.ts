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
export const categoryColors: Record<string, string> = {
  cocktails: '#22d3ee', // cyan-400
  mocktails: '#f59e0b', // amber-500
  wine: '#ef4444',      // red-500
  beer: '#facc15',      // yellow-400
  spirits: '#a78bfa',   // violet-400
  snacks: '#fb7185',    // rose-400
  others: '#60a5fa',    // blue-400
};

export const pickEmojiForItem = (item: MenuItem): string => {
  const cat = (item.category || '').toLowerCase();
  const spirit = (item.baseSpirit || '').toLowerCase();
  if (spirit && baseSpiritEmoji[spirit]) return baseSpiritEmoji[spirit];
  if (cat && categoryEmoji[cat]) return categoryEmoji[cat];
  return '🍸';
};

export const pickColorForCategory = (category?: string): string => {
  const key = (category || '').toLowerCase();
  return categoryColors[key] || categoryColors.others;
};

