import { cn } from '../../utils/cn';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  }
>;

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-ink text-white hover:bg-slate-800',
        variant === 'secondary' && 'border border-line bg-white text-ink hover:bg-slate-50',
        variant === 'ghost' && 'text-muted hover:bg-slate-100',
        variant === 'danger' && 'bg-danger text-white hover:bg-red-800',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
