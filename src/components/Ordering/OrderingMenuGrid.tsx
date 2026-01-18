import React from 'react';
import type { MenuItem } from '@/types';
import { pickEmojiForItem, pickStripeColor } from '@/config/menuVisualConfig';

interface OrderingMenuGridProps {
  displayItems: MenuItem[];
  addToOrder: (item: MenuItem) => void;
}

export const OrderingMenuGrid: React.FC<OrderingMenuGridProps> = ({
  displayItems,
  addToOrder,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayItems.map((menuItem) => (
          <div
            key={menuItem.id}
            onClick={() => addToOrder(menuItem)}
            className="relative rounded-2xl border p-4 cursor-pointer hover:shadow-lg transition-all bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: pickStripeColor(menuItem) }} />
            <div className="text-4xl mb-2 select-none">{pickEmojiForItem(menuItem)}</div>
            <h3 className="font-medium text-gray-900 dark:text-white whitespace-normal break-words leading-snug">
              {menuItem.name}
            </h3>
            <div className="text-sm font-semibold text-[var(--color-accent)] mt-1">${menuItem.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
