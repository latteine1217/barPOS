import React from 'react';
import type { Table } from '@/types';

interface OrderDetails {
  tableNumber: number | string;
  customers: number;
  notes: string;
}

interface OrderingHeaderProps {
  isAddOnMode?: boolean | undefined;
  query: string;
  setQuery: (query: string) => void;
  selectedTable?: Table | undefined;
  initialTableNumber?: number | undefined;
  orderDetails: OrderDetails;
  updateOrderDetails: (details: Partial<OrderDetails>) => void;
}

export const OrderingHeader: React.FC<OrderingHeaderProps> = ({
  isAddOnMode,
  query,
  setQuery,
  selectedTable,
  initialTableNumber,
  orderDetails,
  updateOrderDetails,
}) => {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0">
        {isAddOnMode ? 'Add Items' : 'New Order'}
      </h2>
      {/* Search input takes available width */}
      <div className="flex-1 relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋品項..."
          className="w-full pl-10 pr-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
      </div>
      {/* Table and People to the right of search */}
      <div className="flex items-center gap-3">
        {/* Table: show selected or input when not preset */}
        {selectedTable ? (
          <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            桌位 {selectedTable.number}
          </div>
        ) : !initialTableNumber ? (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">桌號</label>
            <input
              type="number"
              value={orderDetails.tableNumber}
              onChange={(e) => updateOrderDetails({ tableNumber: e.target.value })}
              className="w-20 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="桌號"
            />
          </div>
        ) : (
          <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            桌位 {initialTableNumber}
          </div>
        )}

        {/* People count */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateOrderDetails({ customers: Math.max(1, (orderDetails.customers || 1) - 1) })}
            className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            value={orderDetails.customers}
            onChange={(e) => updateOrderDetails({ customers: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-16 text-center px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={() => updateOrderDetails({ customers: (orderDetails.customers || 1) + 1 })}
            className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
