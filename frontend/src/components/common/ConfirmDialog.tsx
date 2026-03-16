import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Working...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rounded-3xl border border-line bg-slate-50 p-4 text-sm text-muted">
        This action cannot be undone in the current MVP.
      </div>
    </Modal>
  );
}
