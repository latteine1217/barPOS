import React, { useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import VisualOrderingInterface from './VisualOrderingInterface';
import { useVisualOrderingModalStore } from './visualOrderingModalStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { Order, OrderStatus } from '@/types';

const VisualOrderingModal: React.FC = () => {
  const isOpen = useVisualOrderingModalStore((s) => s.isOpen);
  const selectedTable = useVisualOrderingModalStore((s) => s.selectedTable);
  const initialCustomers = useVisualOrderingModalStore((s) => s.initialCustomers);
  const existingOrder = useVisualOrderingModalStore((s) => s.existingOrder);
  const isAddOnMode = useVisualOrderingModalStore((s) => s.isAddOnMode);
  const menuItems = useVisualOrderingModalStore((s) => s.menuItems);
  const updateOrderStatus = useVisualOrderingModalStore((s) => s.updateOrderStatus);
  const close = useVisualOrderingModalStore((s) => s.close);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) close(null);
    },
    [close]
  );

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return; // only when modal open
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(null);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [isOpen, close]);

  // 開啟時鎖定 body 捲動
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  const trapRef = useFocusTrap<HTMLDivElement>({ active: isOpen });

  if (!isOpen || !selectedTable) return null;
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="點餐視窗"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={trapRef}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[95vw] max-w-6xl h-[90vh] overflow-hidden"
      >
        <VisualOrderingInterface
          onOrderComplete={(order: Order | null) => close(order)}
          initialTableNumber={selectedTable.number}
          initialCustomers={initialCustomers}
          isAddOnMode={isAddOnMode}
          {...(existingOrder ? { existingOrder } : {})}
          selectedTable={selectedTable}
          menuItems={menuItems}
          updateOrderStatus={updateOrderStatus ?? ((_id: string, _s: OrderStatus) => undefined)}
        />
      </div>
    </div>,
    portalRoot
  );
};

export default VisualOrderingModal;
