import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 同步流程現在會先彈出 confirm dialog，測試環境自動 resolve(true) 跳過互動。
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => () => Promise.resolve(true),
}));

import Settings from '@/components/Settings';
import SupabaseService from '@/services/supabaseService';
import { useOrderStore } from '@/stores/orderStore';
import { useTableStore } from '@/stores/tableStore';
import { useMenuStore } from '@/stores/menuStore';
import { useMembersStore } from '@/stores/membersStore';
import { useSettingsStore } from '@/stores/settingsStore';

describe('Settings syncFromSupabase integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSettingsStore.setState({
      supabaseConfig: {
        url: 'https://demo.supabase.co',
        key: 'demo-anon-key'
      }
    });
    useOrderStore.setState({
      orders: [{
        id: 'local-order',
        tableNumber: 1,
        items: [],
        subtotal: 100,
        total: 100,
        status: 'pending',
        customers: 1,
        createdAt: '2026-02-23T00:00:00.000Z',
        updatedAt: '2026-02-23T00:00:00.000Z'
      }]
    });
    useTableStore.setState({
      tables: [{
        id: 1,
        number: 1,
        name: '桌 1',
        status: 'available',
        customers: 0,
        maxCapacity: 4,
        position: { x: 0, y: 0 }
      }]
    });
    useMenuStore.setState({ menuItems: [] });
    useMembersStore.setState({ members: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('從雲端下載成功時應更新四個核心 store', async () => {
    vi.spyOn(SupabaseService.prototype, 'fetchOrders').mockResolvedValue({
      success: true,
      data: [{
        id: 'cloud-order',
        tableNumber: 9,
        items: [],
        subtotal: 220,
        total: 220,
        status: 'completed',
        customers: 2,
        createdAt: '2026-02-23T12:00:00.000Z',
        updatedAt: '2026-02-23T12:00:00.000Z'
      }],
      message: 'ok'
    });
    vi.spyOn(SupabaseService.prototype, 'fetchTables').mockResolvedValue({
      success: true,
      data: [{
        id: 9,
        number: 9,
        name: '桌 9',
        status: 'occupied',
        customers: 2,
        maxCapacity: 6,
        position: { x: 90, y: 90 }
      }],
      message: 'ok'
    });
    vi.spyOn(SupabaseService.prototype, 'fetchMenuItems').mockResolvedValue({
      success: true,
      data: [{ id: 'cloud-menu', name: 'Cloud Drink', category: 'classic', price: 220, available: true }],
      message: 'ok'
    });
    vi.spyOn(SupabaseService.prototype, 'fetchMembers').mockResolvedValue({
      success: true,
      data: [{ id: 'cloud-member', name: 'Cloud User', cups: 6, createdAt: '2026-02-23T12:00:00.000Z', updatedAt: '2026-02-23T12:00:00.000Z' }],
      message: 'ok'
    });

    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '從雲端下載' }));

    // 同步策略改為 merge by updatedAt：不同 id 兩邊都保留，避免吞掉本地離線單。
    await waitFor(() => {
      const orderIds = useOrderStore.getState().orders.map(o => o.id);
      expect(orderIds).toContain('cloud-order');
      expect(orderIds).toContain('local-order');

      const tableIds = useTableStore.getState().tables.map(t => t.id);
      expect(tableIds).toContain(9);
      expect(tableIds).toContain(1);

      expect(useMenuStore.getState().menuItems.some(m => m.id === 'cloud-menu')).toBe(true);
      expect(useMembersStore.getState().members.some(m => m.id === 'cloud-member')).toBe(true);
    });
  });

  it('部分同步失敗時應只更新成功的資料類型', async () => {
    vi.spyOn(SupabaseService.prototype, 'fetchOrders').mockResolvedValue({
      success: false,
      error: 'orders failed'
    });
    vi.spyOn(SupabaseService.prototype, 'fetchTables').mockResolvedValue({
      success: true,
      data: [{
        id: 2,
        number: 2,
        name: '桌 2',
        status: 'occupied',
        customers: 3,
        maxCapacity: 4,
        position: { x: 20, y: 20 }
      }],
      message: 'ok'
    });
    vi.spyOn(SupabaseService.prototype, 'fetchMenuItems').mockResolvedValue({
      success: true,
      data: [{ id: 'menu-2', name: 'Menu 2', category: 'signature', price: 300, available: true }],
      message: 'ok'
    });
    vi.spyOn(SupabaseService.prototype, 'fetchMembers').mockResolvedValue({
      success: true,
      data: [{ id: 'member-2', name: 'Member 2', cups: 1, createdAt: '2026-02-23T13:00:00.000Z', updatedAt: '2026-02-23T13:00:00.000Z' }],
      message: 'ok'
    });

    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '從雲端下載' }));

    await waitFor(() => {
      // orders fetch 失敗，local-order 維持
      expect(useOrderStore.getState().orders.map(o => o.id)).toEqual(['local-order']);
      // tables / menu / members 成功 → 被 merge 進現有 store
      expect(useTableStore.getState().tables.some(t => t.id === 2)).toBe(true);
      expect(useMenuStore.getState().menuItems.some(m => m.id === 'menu-2')).toBe(true);
      expect(useMembersStore.getState().members.some(m => m.id === 'member-2')).toBe(true);
    });
  });
});
