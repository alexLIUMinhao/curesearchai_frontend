import type { PropsWithChildren } from 'react';
import { TopNav } from './TopNav';

type AppShellProps = PropsWithChildren<{
  showBackLink?: boolean;
  className?: string;
}>;

export function AppShell({ showBackLink, className, children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav showBackLink={showBackLink} />
      <main className={`min-h-0 flex-1 overflow-auto ${className || ''}`}>{children}</main>
    </div>
  );
}
