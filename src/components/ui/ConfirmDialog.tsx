import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const ConfirmDialog = () => {
  const confirm = useUIStore((s) => s.confirm);
  const resolveConfirm = useUIStore((s) => s.resolveConfirm);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>({
    active: !!confirm,
    autoFocusFirst: false, // 我們自己 focus confirmBtn 以保 default action 顯眼
  });

  // Esc 關閉、Enter 確認、開啟時 focus 主要按鈕
  useEffect(() => {
    if (!confirm) return;

    confirmBtnRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        resolveConfirm(false);
      } else if (e.key === 'Enter') {
        // 避免在輸入框內按 Enter 觸發
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        e.stopPropagation();
        resolveConfirm(true);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [confirm, resolveConfirm]);

  if (!confirm) return null;

  const isDanger = confirm.variant === 'danger';
  const confirmBtnClass = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white'
    : 'bg-[var(--color-accent)] hover:brightness-95 focus:ring-[var(--color-accent)] text-white';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${confirm.id}-title`}
      aria-describedby={confirm.description ? `${confirm.id}-desc` : undefined}
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-in fade-in duration-150 ease-out"
        onClick={() => resolveConfirm(false)}
        aria-hidden="true"
      />
      <div
        ref={trapRef}
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 ease-out"
      >
        <div className="flex items-start gap-3">
          {isDanger && (
            <div className="flex-none w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center" aria-hidden="true">
              <svg className="w-5 h-5 text-rose-600 dark:text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 id={`${confirm.id}-title`} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {confirm.title}
            </h2>
            {confirm.description && (
              <p id={`${confirm.id}-desc`} className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {confirm.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => resolveConfirm(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
          >
            {confirm.cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => resolveConfirm(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${confirmBtnClass}`}
            data-autofocus
          >
            {confirm.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
