import type { SelectHTMLAttributes } from 'react';

type Option = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
};

export function Select({ label, options, ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <select
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

