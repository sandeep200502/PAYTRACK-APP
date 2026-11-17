import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', tone = 'danger', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      icon={TriangleAlert}
      iconTone={tone === 'danger' ? 'red' : 'amber'}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
            onClick={() => {
              setBusy(true);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
    </Modal>
  );
}
