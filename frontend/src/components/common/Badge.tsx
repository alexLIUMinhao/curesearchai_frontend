import { cn } from '../../utils/cn';
import { toSentenceCase } from '../../utils/format';

type BadgeProps = {
  children: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
};

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'neutral' && 'bg-slate-100 text-slate-700',
        tone === 'accent' && 'bg-accentSoft text-accent',
        tone === 'success' && 'bg-emerald-50 text-success',
        tone === 'warning' && 'bg-amber-50 text-warning',
        tone === 'danger' && 'bg-red-50 text-danger',
        className,
      )}
    >
      {toSentenceCase(children)}
    </span>
  );
}
