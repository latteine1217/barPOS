import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Order } from '@/types';
import { useDashboard } from '@/hooks/business/useDashboardFixed';

let mockOrders: Order[] = [];
let mockCutoffHour = 3;

vi.mock('@/stores', () => ({
  useOrderStore: (selector: (state: { orders: Order[] }) => unknown) =>
    selector({ orders: mockOrders })
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (selector: (state: { businessDayCutoffHour: number }) => unknown) =>
    selector({ businessDayCutoffHour: mockCutoffHour })
}));

describe('useDashboardFixed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23, 2, 30, 0));
    mockCutoffHour = 3;
    mockOrders = [
      {
        id: 'order-before-cutoff-range',
        tableNumber: 1,
        items: [],
        subtotal: 100,
        total: 100,
        status: 'completed',
        customers: 1,
        createdAt: new Date(2026, 1, 22, 4, 0, 0).toISOString(),
        updatedAt: new Date(2026, 1, 22, 4, 0, 0).toISOString()
      },
      {
        id: 'order-after-midnight',
        tableNumber: 2,
        items: [],
        subtotal: 200,
        total: 200,
        status: 'pending',
        customers: 2,
        createdAt: new Date(2026, 1, 23, 2, 0, 0).toISOString(),
        updatedAt: new Date(2026, 1, 23, 2, 0, 0).toISOString()
      }
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('應該在 cutoff 變更時重算營業日統計（不依賴訂單引用變化）', () => {
    const { result, rerender } = renderHook(() => useDashboard());

    expect(result.current.todayOrderCount).toBe(2);

    mockCutoffHour = 0;
    rerender();

    expect(result.current.todayOrderCount).toBe(1);
    expect(result.current.todayRevenue).toBe(200);
  });

  it('應該在跨日後更新 currentDate', () => {
    const { result } = renderHook(() => useDashboard());
    const before = result.current.currentDate;

    act(() => {
      vi.setSystemTime(new Date(2026, 1, 24, 0, 0, 1));
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentDate).not.toBe(before);
  });
});
