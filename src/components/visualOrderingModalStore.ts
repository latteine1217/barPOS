import { create } from 'zustand';
import type { Order, Table, MenuItem, OrderStatus } from '@/types';

interface OpenPayload {
  selectedTable: Table;
  initialCustomers: number;
  existingOrder: Order | null;
  isAddOnMode: boolean;
  menuItems: MenuItem[];
  onComplete: ((order: Order | null) => void) | null;
  updateOrderStatus: ((orderId: string, status: OrderStatus) => void) | null;
}

interface ModalState {
  isOpen: boolean;
  selectedTable: Table | null;
  initialCustomers: number;
  existingOrder: Order | null;
  isAddOnMode: boolean;
  menuItems: MenuItem[];
  onComplete: ((order: Order | null) => void) | null;
  updateOrderStatus: ((orderId: string, status: OrderStatus) => void) | null;
  open: (p: OpenPayload) => void;
  close: (order: Order | null) => void;
}

export const useVisualOrderingModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  selectedTable: null,
  initialCustomers: 1,
  existingOrder: null,
  isAddOnMode: false,
  menuItems: [],
  onComplete: null,
  updateOrderStatus: null,
  open: (p) => set(() => ({
    isOpen: true,
    selectedTable: p.selectedTable,
    initialCustomers: p.initialCustomers,
    existingOrder: p.existingOrder,
    isAddOnMode: p.isAddOnMode,
    menuItems: p.menuItems,
    onComplete: p.onComplete,
    updateOrderStatus: p.updateOrderStatus,
  })),
  close: (order) => {
    const cb = get().onComplete;
    set(() => ({
      isOpen: false,
      selectedTable: null,
      initialCustomers: 1,
      existingOrder: null,
      isAddOnMode: false,
      menuItems: [],
      onComplete: null,
      updateOrderStatus: null,
    }));
    if (cb) cb(order);
  },
}));

// 緩存的選擇器以避免無限渲染
const openSelector = (state: ModalState) => state.open;
const closeSelector = (state: ModalState) => state.close;
const isOpenSelector = (state: ModalState) => state.isOpen;

// 導出穩定的選擇器hooks
export const useVisualOrderingModalOpen = () => useVisualOrderingModalStore(openSelector);
export const useVisualOrderingModalClose = () => useVisualOrderingModalStore(closeSelector);
export const useVisualOrderingModalIsOpen = () => useVisualOrderingModalStore(isOpenSelector);
