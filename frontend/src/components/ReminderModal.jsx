import { Send } from 'lucide-react';
import Modal from './Modal';
import ReminderComposer from './ReminderComposer';
import { useData } from '../hooks/useData';

export default function ReminderModal({ invoiceId, onClose }) {
  const { invoicesById } = useData();
  const invoice = invoicesById[invoiceId];
  if (!invoice) return null;
  return (
    <Modal title="Send Payment Reminder" subtitle="PayTrack picked the tone based on how late this invoice is." icon={Send} iconTone="amber" size="lg" onClose={onClose}>
      <ReminderComposer invoice={invoice} onSent={onClose} />
    </Modal>
  );
}
