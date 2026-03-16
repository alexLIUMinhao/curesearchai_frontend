import type { InputHTMLAttributes, ReactNode } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
};

export function Field({ label, hint, error, suffix, ...props }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <input
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          {...props}
        />
        {suffix}
      </div>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

