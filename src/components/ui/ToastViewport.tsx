import { useEffect } from 'react';
import { useUIStore, type ToastItem, type ToastVariant } from '@/stores/uiStore';

const variantStyles: Record<ToastVariant, { container: string; iconBg: string; icon: string; ariaRole: 'status' | 'alert' }> = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-100',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    icon: 'M5 13l4 4L19 7',
    ariaRole: 'status',
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-100',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
    icon: 'M6 18L18 6M6 6l12 12',
    ariaRole: 'alert',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-100',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
    ariaRole: 'status',
  },
  info: {
    container: 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-100',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    ariaRole: 'status',
  },
};

interface ToastCardProps {
  toast: ToastItem;
}

const ToastCard = ({ toast }: ToastCardProps) => {
  const style = variantStyles[toast.variant];
  const dismiss = useUIStore((s) => s.dismissToast);

  // 自動消失（duration > 0 才啟用）
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <div
      role={style.ariaRole}
      aria-live={style.ariaRole === 'alert' ? 'assertive' : 'polite'}
      className={`pointer-events-auto w-full max-w-sm rounded-xl border shadow-lg backdrop-blur-md ${style.container} animate-in fade-in slide-in-from-right-2`}
    >
      <div className="flex items-start gap-3 p-3">
        <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${style.iconBg}`} aria-hidden="true">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-medium leading-5 break-words">{toast.message}</p>
          {toast.description && (
            <p className="mt-1 text-xs leading-5 opacity-80 break-words">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          className="flex-none -mt-0.5 -mr-0.5 p-1.5 rounded-lg text-current/60 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current/40"
          aria-label="關閉通知"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const ToastViewport = () => {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 sm:top-4 z-[60] flex flex-col items-center gap-2 px-3 sm:items-end sm:right-4 sm:left-auto sm:max-w-sm"
      aria-label="通知區"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
};

export default ToastViewport;
