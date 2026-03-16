import type { TextareaHTMLAttributes } from 'react';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextArea({ label, error, hint, ...props }: TextAreaProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-3xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

