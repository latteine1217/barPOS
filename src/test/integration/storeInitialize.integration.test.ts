import { beforeEach, describe, expect, it } from 'vitest';
import type { MemberRecord, Order } from '@/types';
import { STORAGE_KEYS } from '@/services/storageService';
import { useOrderStore } from '@/stores/orderStore';
import { useMembersStore } from '@/stores/membersStore';
import { useTableStore } from '@/stores/tableStore';

const createOrder = (id: string): Order => ({
  id,
  tableNumber: 1,
  items: [],
  subtotal: 100,
  total: 100,
  status: 'pending',
  customers: 1,
  createdAt: new Date('2026-02-23T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-02-23T00:00:00.000Z').toISOString()
});

const createMember = (id: string): MemberRecord => ({
  id,
  name: `Member-${id}`,
  cups: 3,
  createdAt: new Date('2026-02-23T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-02-23T00:00:00.000Z').toISOString()
});

describe('store initialize integration', () => {
  beforeEach(() => {
    window.localStorage.clear();

    useOrderStore.setState({ orders: [], isLoaded: false });
    useMembersStore.setState({ members: [], isLoaded: false });
    useTableStore.setState({ isLoaded: false });
  });

  it('orderStore.initialize 應優先使用 persist 快照', async () => {
    const persistedOrder = createOrder('persist-order');
    window.localStorage.setItem('order-store', JSON.stringify({ state: { orders: [persistedOrder] }, version: 0 }));

    await useOrderStore.getState().initialize();

    expect(useOrderStore.getState().orders).toEqual([persistedOrder]);
    expect(useOrderStore.getState().isLoaded).toBe(true);
  });

  it('orderStore.initialize 無 persist 時應回退到 storageService key', async () => {
    const fallbackOrder = createOrder('fallback-order');
    window.localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([fallbackOrder]));

    await useOrderStore.getState().initialize();

    expect(useOrderStore.getState().orders).toEqual([fallbackOrder]);
    expect(useOrderStore.getState().isLoaded).toBe(true);
  });

  it('membersStore.initialize 應優先使用 persist 快照', async () => {
    const persistedMember = createMember('persist-member');
    window.localStorage.setItem('members-store', JSON.stringify({ state: { members: [persistedMember] }, version: 0 }));

    await useMembersStore.getState().initialize();

    expect(useMembersStore.getState().members).toEqual([persistedMember]);
    expect(useMembersStore.getState().isLoaded).toBe(true);
  });

  it('membersStore.initialize 無 persist 時應回退到 storageService key', async () => {
    const fallbackMember = createMember('fallback-member');
    window.localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([fallbackMember]));

    await useMembersStore.getState().initialize();

    expect(useMembersStore.getState().members).toEqual([fallbackMember]);
    expect(useMembersStore.getState().isLoaded).toBe(true);
  });

  it('tableStore.initialize 在已有資料時應快速完成且不覆蓋現況', async () => {
    const beforeTables = useTableStore.getState().tables.map((table) => ({ ...table }));
    window.localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify([{ id: 999, number: 999 }]));

    await useTableStore.getState().initialize();

    expect(useTableStore.getState().isLoaded).toBe(true);
    expect(useTableStore.getState().tables).toEqual(beforeTables);
  });
});
