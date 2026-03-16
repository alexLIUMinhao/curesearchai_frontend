type PlaceholderPanelProps = {
  title: string;
  description: string;
  blocks: string[];
};

export function PlaceholderPanel({ title, description, blocks }: PlaceholderPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="panel-title">{title}</p>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
      <div className="mt-5 grid gap-3">
        {blocks.map((block) => (
          <div key={block} className="rounded-3xl border border-dashed border-line bg-slate-50 p-5">
            <div className="text-xs uppercase tracking-[0.12em] text-muted">{block}</div>
            <div className="mt-3 h-16 rounded-2xl bg-white/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
