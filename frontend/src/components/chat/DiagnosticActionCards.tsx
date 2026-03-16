import { DIAGNOSTIC_PROMPTS } from '../../utils/prompts';

type DiagnosticActionCardsProps = {
  onPick: (prompt: string) => void;
};

export function DiagnosticActionCards({ onPick }: DiagnosticActionCardsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-5 pt-3">
      {DIAGNOSTIC_PROMPTS.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onPick(item.prompt)}
          className="rounded-full border border-line bg-slate-50 px-3 py-1.5 text-left transition hover:border-accent hover:bg-accentSoft/50"
        >
          <div className="text-xs font-medium leading-5 text-ink">{item.label}</div>
        </button>
      ))}
    </div>
  );
}
