import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

const isVisible = (el: HTMLElement): boolean => {
  if (el.hasAttribute('hidden')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  // offsetParent === null also catches display:none subtrees
  return el.offsetParent !== null || el === document.body;
};

const queryFocusable = (root: HTMLElement): HTMLElement[] => {
  const list = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return list.filter(isVisible);
};

interface UseFocusTrapOptions {
  /** 是否啟用，通常綁定 modal isOpen 狀態 */
  active: boolean;
  /** 關閉時要還原焦點的元素，預設為觸發 modal 的當前 activeElement */
  restoreFocus?: HTMLElement | null;
  /** 開啟時自動 focus 容器內第一個可聚焦元素（預設 true） */
  autoFocusFirst?: boolean;
}

/**
 * 將鍵盤焦點鎖在容器內：
 * - Tab 至最後一個元素時跳回第一個
 * - Shift+Tab 至第一個時跳到最後一個
 * - 開啟時 focus 第一個可聚焦元素
 * - 關閉時還原前一個 activeElement 的 focus
 *
 * 用法：
 *   const ref = useFocusTrap<HTMLDivElement>({ active: isOpen });
 *   return <div ref={ref}>...</div>;
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: UseFocusTrapOptions,
) {
  const containerRef = useRef<T | null>(null);
  const { active, restoreFocus, autoFocusFirst = true } = options;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = (restoreFocus ?? document.activeElement) as HTMLElement | null;

    if (autoFocusFirst) {
      // 延後一個 tick 讓 modal 動畫上完成 layout
      const focusables = queryFocusable(container);
      const target = focusables[0] ?? container;
      // container 本身須能接收 focus
      if (target === container && !container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = queryFocusable(container);
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !container.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // 還原焦點，僅當之前的元素還在 DOM 內
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, restoreFocus, autoFocusFirst]);

  return containerRef;
}
