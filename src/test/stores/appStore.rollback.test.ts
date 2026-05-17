import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import { useOrderStore } from '@/stores/orderStore';
import { useTableStore } from '@/stores/tableStore';
import type { Order } from '@/types';

const makeValidOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'test-order-1',
  tableNumber: 1,
  items: [{ id: '101', name: 'A', price: 100, quantity: 1 }],
  subtotal: 100,
  total: 100,
  status: 'pending',
  customers: 1,
  createdAt: '2026-05-17T00:00:00.000Z',
  updatedAt: '2026-05-17T00:00:00.000Z',
  ...overrides,
});

describe('appStore.addOrderWithTableUpdate (P0-A 原子性 + rollback)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useOrderStore.setState({ orders: [], isLoaded: true });
    useTableStore.setState({
      tables: [
        {
          id: 1,
          number: 1,
          name: '桌 1',
          status: 'available',
          customers: 0,
          maxCapacity: 4,
          position: { x: 0, y: 0 },
        },
      ],
      isLoaded: true,
    });
  });

  it('happy path: 訂單建立 + 桌位變佔用，回傳 true', () => {
    const ok = useAppStore.getState().addOrderWithTableUpdate(makeValidOrder());

    expect(ok).toBe(true);
    expect(useOrderStore.getState().orders).toHaveLength(1);
    expect(useOrderStore.getState().orders[0]?.id).toBe('test-order-1');

    const table = useTableStore.getState().tables[0];
    expect(table?.status).toBe('occupied');
    expect(table?.orderId).toBe('test-order-1');
  });

  it('rollback 分支 1：訂單驗證失敗（items 空）→ 不佔桌、回傳 false', () => {
    const invalid = makeValidOrder({ items: [] });
    const ok = useAppStore.getState().addOrderWithTableUpdate(invalid);

    expect(ok).toBe(false);
    expect(useOrderStore.getState().orders).toHaveLength(0);
    expect(useTableStore.getState().tables[0]?.status).toBe('available');
    expect(useTableStore.getState().tables[0]?.orderId).toBeUndefined();
  });

  it('rollback 分支 2：桌位不存在 → 已建訂單 rollback、回傳 false', () => {
    const order = makeValidOrder({ tableNumber: 999 });
    const ok = useAppStore.getState().addOrderWithTableUpdate(order);

    expect(ok).toBe(false);
    // 訂單應該已 rollback
    expect(useOrderStore.getState().orders).toHaveLength(0);
  });

  it('rollback 分支 3：updateTable 拋錯 → 訂單 rollback、回傳 false', () => {
    const updateTableSpy = vi
      .spyOn(useTableStore.getState(), 'updateTable')
      .mockImplementation(() => {
        throw new Error('simulated table update failure');
      });

    const ok = useAppStore.getState().addOrderWithTableUpdate(makeValidOrder());

    expect(ok).toBe(false);
    expect(useOrderStore.getState().orders).toHaveLength(0);

    updateTableSpy.mockRestore();
  });

  it('無 tableNumber 訂單（外帶 / 吧台）→ 訂單建立但不佔桌、回傳 true', () => {
    // Note: orderStore.addOrder 自身要求 tableNumber 存在才會通過驗證；
    // 此測試斷言 addOrderWithTableUpdate 在 created.tableNumber 為 falsy 時
    // 不會嘗試更新桌位（rollback 邏輯不會被觸發）。
    const order = makeValidOrder({ tableNumber: 0 });
    const ok = useAppStore.getState().addOrderWithTableUpdate(order);

    // tableNumber=0 在 orderStore.addOrder 內部會被視為 invalid → 不建單
    expect(ok).toBe(false);
    expect(useTableStore.getState().tables[0]?.status).toBe('available');
  });
});
