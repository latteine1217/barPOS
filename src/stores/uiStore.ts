import { create } from 'zustand';

// ============================================================================
// Toast
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
  duration: number;     // ms; 0 = sticky (must be dismissed manually)
  createdAt: number;
}

export interface ShowToastOptions {
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// ============================================================================
// Confirm Dialog
// ============================================================================

export interface ConfirmRequest {
  id: string;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'danger';
  resolve: (confirmed: boolean) => void;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

// ============================================================================
// Store
// ============================================================================

interface UIState {
  toasts: ToastItem[];
  confirm: ConfirmRequest | null;
}

interface UIActions {
  // Toasts
  showToast: (options: ShowToastOptions) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Confirm
  requestConfirm: (options: ConfirmOptions) => Promise<boolean>;
  resolveConfirm: (confirmed: boolean) => void;
}

type UIStore = UIState & UIActions;

let __toastSeq = 0;
const nextToastId = () => `toast-${Date.now().toString(36)}-${(__toastSeq++).toString(36)}`;

let __confirmSeq = 0;
const nextConfirmId = () => `confirm-${Date.now().toString(36)}-${(__confirmSeq++).toString(36)}`;

export const useUIStore = create<UIStore>((set, get) => ({
  toasts: [],
  confirm: null,

  showToast: (options) => {
    const id = nextToastId();
    const item: ToastItem = {
      id,
      variant: options.variant ?? 'info',
      message: options.message,
      ...(options.description !== undefined ? { description: options.description } : {}),
      duration: options.duration ?? 3500,
      createdAt: Date.now(),
    };
    set((state) => ({ toasts: [...state.toasts, item] }));
    return id;
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  clearToasts: () => set({ toasts: [] }),

  requestConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      // 若已有 pending confirm，先 resolve 為 false（避免堆疊）
      const current = get().confirm;
      if (current) current.resolve(false);

      const req: ConfirmRequest = {
        id: nextConfirmId(),
        title: options.title,
        ...(options.description !== undefined ? { description: options.description } : {}),
        confirmText: options.confirmText ?? '確認',
        cancelText: options.cancelText ?? '取消',
        variant: options.variant ?? 'default',
        resolve,
      };
      set({ confirm: req });
    });
  },

  resolveConfirm: (confirmed) => {
    const current = get().confirm;
    if (!current) return;
    current.resolve(confirmed);
    set({ confirm: null });
  },
}));

// ============================================================================
// 模組層級的便利函式（供非 React 程式碼使用，例如 service modules）
// ============================================================================

export const toast = {
  success: (message: string, description?: string) =>
    useUIStore.getState().showToast({ variant: 'success', message, ...(description ? { description } : {}) }),
  error: (message: string, description?: string) =>
    useUIStore.getState().showToast({ variant: 'error', message, duration: 5000, ...(description ? { description } : {}) }),
  warning: (message: string, description?: string) =>
    useUIStore.getState().showToast({ variant: 'warning', message, ...(description ? { description } : {}) }),
  info: (message: string, description?: string) =>
    useUIStore.getState().showToast({ variant: 'info', message, ...(description ? { description } : {}) }),
};

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
  useUIStore.getState().requestConfirm(options);
