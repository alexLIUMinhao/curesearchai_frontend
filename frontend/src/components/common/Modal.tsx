import type { PropsWithChildren, ReactNode } from 'react';
import { Button } from './Button';

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
}>;

export function Modal({ open, title, description, onClose, footer, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4">
      <div className="panel w-full max-w-2xl p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div>{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
