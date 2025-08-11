import React from 'react';
import ReactDOM from 'react-dom';
import VisualOrderingInterface from './VisualOrderingInterface';
import { useVisualOrderingModalStore } from './visualOrderingModalStore';

const VisualOrderingModal: React.FC = () => {
  const isOpen = useVisualOrderingModalStore((s) => s.isOpen);
  const selectedTable = useVisualOrderingModalStore((s) => s.selectedTable);
  const initialCustomers = useVisualOrderingModalStore((s) => s.initialCustomers);
  const existingOrder = useVisualOrderingModalStore((s) => s.existingOrder);
  const isAddOnMode = useVisualOrderingModalStore((s) => s.isAddOnMode);
  const menuItems = useVisualOrderingModalStore((s) => s.menuItems);
  const updateOrderStatus = useVisualOrderingModalStore((s) => s.updateOrderStatus);
  const close = useVisualOrderingModalStore((s) => s.close);

  if (!isOpen || !selectedTable) return null;
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <VisualOrderingInterface
      onOrderComplete={(order) => close(order)}
      initialTableNumber={selectedTable.number}
      initialCustomers={initialCustomers}
      isAddOnMode={isAddOnMode}
      {...(existingOrder ? { existingOrder } : {})}
      selectedTable={selectedTable}
      menuItems={menuItems}
      updateOrderStatus={updateOrderStatus || ((() => {}) as any)}
    />,
    portalRoot
  );
};

export default VisualOrderingModal;
