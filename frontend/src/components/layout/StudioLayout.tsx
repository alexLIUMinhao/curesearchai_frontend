import type { PropsWithChildren, ReactNode } from 'react';

type StudioLayoutProps = PropsWithChildren<{
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}>;

export function StudioLayout({ left, center, right }: StudioLayoutProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_340px] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
      <aside className="min-h-0 overflow-hidden">{left}</aside>
      <section className="min-h-0 overflow-hidden">{center}</section>
      <aside className="min-h-0 overflow-hidden">{right}</aside>
    </div>
  );
}
