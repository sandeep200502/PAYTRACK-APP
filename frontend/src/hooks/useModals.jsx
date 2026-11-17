// Global modals that can be opened from any page:
//   openPayment(invoiceId?)   -> Record Payment modal
//   openReminder(invoiceId)   -> Smart reminder composer

import { createContext, useCallback, useContext, useState } from 'react';
import PaymentModal from '../components/PaymentModal';
import ReminderModal from '../components/ReminderModal';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [payment, setPayment] = useState(null);
  const [reminder, setReminder] = useState(null);

  const openPayment = useCallback((invoiceId = '') => setPayment({ invoiceId }), []);
  const openReminder = useCallback((invoiceId) => setReminder({ invoiceId }), []);

  return (
    <ModalContext.Provider value={{ openPayment, openReminder }}>
      {children}
      {payment && <PaymentModal initialInvoiceId={payment.invoiceId} onClose={() => setPayment(null)} />}
      {reminder && <ReminderModal invoiceId={reminder.invoiceId} onClose={() => setReminder(null)} />}
    </ModalContext.Provider>
  );
}

export const useModals = () => useContext(ModalContext);
