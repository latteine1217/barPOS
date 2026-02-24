import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VisualOrderingInterface from '@/components/VisualOrderingInterface';
import { useTableStore } from '@/stores/tableStore';
import type { MenuItem, Order, Table } from '@/types';

const now = '2026-02-23T12:00:00.000Z';

const createOrder = (status: Order['status']): Order => ({
  id: 'order-release-1',
  tableNumber: 1,
  items: [
    {
      id: 'item-1',
      name: 'Mojito',
      price: 220,
      quantity: 1
    }
  ],
  subtotal: 220,
  total: 220,
  status,
  customers: 2,
  createdAt: now,
  updatedAt: now
});

const createSelectedTable = (): Table => ({
  id: 1,
  number: 1,
  name: '桌 1',
  status: 'occupied',
  customers: 2,
  maxCapacity: 4,
  position: { x: 100, y: 100 },
  orderId: 'order-release-1'
});

const menuItems: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'Mojito',
    category: 'classic',
    price: 220,
    available: true
  }
];

const renderVisualOrdering = (order: Order, selectedTable: Table, onOrderComplete: ReturnType<typeof vi.fn>, updateOrderStatus: ReturnType<typeof vi.fn>) => {
  return render(
    <VisualOrderingInterface
      onOrderComplete={onOrderComplete}
      initialTableNumber={1}
      initialCustomers={2}
      existingOrder={order}
      selectedTable={selectedTable}
      menuItems={menuItems}
      updateOrderStatus={updateOrderStatus}
    />
  );
};

describe('VisualOrderingInterface release guard integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useTableStore.setState({
      tables: [createSelectedTable()],
      isLoaded: true
    });
  });

  it('completed 狀態應顯示釋放桌位按鈕，pending 不顯示', () => {
    const onOrderComplete = vi.fn();
    const updateOrderStatus = vi.fn();
    const selectedTable = createSelectedTable();

    const { rerender } = render(
      <VisualOrderingInterface
        onOrderComplete={onOrderComplete}
        initialTableNumber={1}
        initialCustomers={2}
        existingOrder={createOrder('pending')}
        selectedTable={selectedTable}
        menuItems={menuItems}
        updateOrderStatus={updateOrderStatus}
      />
    );

    expect(screen.queryByRole('button', { name: '釋放桌位' })).not.toBeInTheDocument();

    rerender(
      <VisualOrderingInterface
        onOrderComplete={onOrderComplete}
        initialTableNumber={1}
        initialCustomers={2}
        existingOrder={createOrder('completed')}
        selectedTable={selectedTable}
        menuItems={menuItems}
        updateOrderStatus={updateOrderStatus}
      />
    );

    expect(screen.getByRole('button', { name: '釋放桌位' })).toBeInTheDocument();
  });

  it('未勾選已結帳時，釋放桌位應被阻擋並提示尚未結帳', async () => {
    const onOrderComplete = vi.fn();
    const updateOrderStatus = vi.fn();
    const selectedTable = createSelectedTable();
    const order = createOrder('completed');

    renderVisualOrdering(order, selectedTable, onOrderComplete, updateOrderStatus);

    fireEvent.click(screen.getByRole('button', { name: '釋放桌位' }));

    expect(await screen.findByText('尚未結帳')).toBeInTheDocument();
    expect(onOrderComplete).not.toHaveBeenCalled();
    expect(useTableStore.getState().tables[0]?.status).toBe('occupied');
    expect(useTableStore.getState().tables[0]?.customers).toBe(2);
  });

  it('勾選已結帳後可釋放桌位，且桌位狀態應更新為 available', async () => {
    const onOrderComplete = vi.fn();
    const updateOrderStatus = vi.fn();
    const selectedTable = createSelectedTable();
    const order = createOrder('completed');

    renderVisualOrdering(order, selectedTable, onOrderComplete, updateOrderStatus);

    fireEvent.click(screen.getByLabelText('已結帳'));
    expect(updateOrderStatus).toHaveBeenCalledWith('order-release-1', 'paid');

    fireEvent.click(screen.getByRole('button', { name: '釋放桌位' }));

    expect(await screen.findByText('已釋放桌位 1')).toBeInTheDocument();
    expect(onOrderComplete).toHaveBeenCalledWith(null);

    await waitFor(() => {
      const releasedTable = useTableStore.getState().tables[0];
      expect(releasedTable?.status).toBe('available');
      expect(releasedTable?.customers).toBe(0);
      expect(releasedTable?.orderId).toBeUndefined();
    });
  });
});
