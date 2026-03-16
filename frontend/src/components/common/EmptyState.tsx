import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="panel flex min-h-56 flex-col items-start justify-center p-8">
      <p className="panel-title">Empty state</p>
      <h3 className="mt-3 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

