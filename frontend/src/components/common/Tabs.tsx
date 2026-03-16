import { cn } from '../../utils/cn';

type TabOption<T extends string> = {
  label: string;
  value: T;
};

type TabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
};

export function Tabs<T extends string>({ value, onChange, options }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-sm transition',
            value === option.value ? 'bg-ink text-white' : 'bg-white text-muted hover:bg-slate-100',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
